/**
 * Pure builders for `/payroll/payments`. Deterministic, no clock, no Intl — see
 * `payroll-workspace.ts` for why.
 */

// Type Imports
import type { Money } from '@/types/common/primitive-types'
import type { Department, Employee } from '@/types/hrm/employee-types'
import type { PayRun } from '@/types/payroll/pay-run-types'
import type { AuditEvent, EmployeePaymentStatus } from '@/types/payroll/run-workspace-types'
import type {
  FundingAccount,
  Settlement,
  SettlementBatch,
  SettlementBatchStatus
} from '@/types/payroll/settlement-types'

// Util Imports
import { formatMoney } from '@/utils/money'
import { formatDate, formatInstant } from '@/utils/payroll-workspace'

/* -------------------------------------------------------------------------------------------- */
/* Vocabularies                                                                                 */
/* -------------------------------------------------------------------------------------------- */

export const BATCH_STATUS_LABELS: Record<SettlementBatchStatus, string> = {
  draft: 'Not prepared',
  prepared: 'Prepared',
  released: 'Released',
  accepted: 'Accepted by bank',
  processing: 'Processing',
  settled: 'Settled',
  partially_returned: 'Settled · returns'
}

export const BATCH_STATUS_STYLES: Record<SettlementBatchStatus, string> = {
  draft: 'bg-muted text-foreground',
  prepared: 'bg-primary/10 text-primary',
  released: 'bg-info/10 text-info-strong',
  accepted: 'bg-info/10 text-info-strong',
  processing: 'bg-info/10 text-info-strong',
  settled: 'bg-success/15 text-success-strong',
  partially_returned: 'bg-warning/15 text-warning-strong'
}

/** The batch lifecycle as stages, for the rail. 'draft' is before the first stage. */
export const BATCH_STAGES = ['prepared', 'released', 'accepted', 'processing', 'settled'] as const

export type BatchStage = (typeof BATCH_STAGES)[number]

export const BATCH_STAGE_LABELS: Record<BatchStage, string> = {
  prepared: 'Prepared',
  released: 'Released',
  accepted: 'Accepted by bank',
  processing: 'Processing',
  settled: 'Settled'
}

/** How many stages are done. Everything before the index is done; the index is current. */
export const batchStageIndex = (status: SettlementBatchStatus): number => {
  switch (status) {
    case 'draft':
      return 0
    case 'prepared':
      return 1
    case 'released':
      return 2
    case 'accepted':
      return 3
    case 'processing':
      return 4
    case 'settled':
    case 'partially_returned':
      return BATCH_STAGES.length
  }
}

/** When each stage was reached, from the batch's recorded events. */
export const batchStageTimestamps = (batch: SettlementBatch): Partial<Record<BatchStage, string>> => ({
  prepared: batch.preparedAt,
  released: batch.releasedAt,
  accepted: batch.acceptedAt,
  processing: batch.acceptedAt,
  settled: batch.settledAt
})

export type BatchAction = 'prepare' | 'release' | 'acknowledge' | 'settle'

export const BATCH_ACTION_LABELS: Record<BatchAction, string> = {
  prepare: 'Prepare payment file',
  release: 'Release to bank',
  acknowledge: 'Record bank acknowledgement',
  settle: 'Record settlement'
}

export interface BatchEvaluation {

  /** The one action that moves the batch on, or null when it is settled. */
  next: BatchAction | null

  /** Why `next` cannot run yet, in the interface's voice. Empty means it can. */
  blockingReasons: string[]

  /** True but not blocking: what the file will leave out, and why. */
  notes: string[]

  /** Where to clear the first reason, when a screen does. */
  href?: string
}

/**
 * What happens next to a batch and what stands in the way. `prepareBatch()` and friends on the
 * server apply the same rules; the release card shows them.
 */
export const evaluateBatch = (
  batch: SettlementBatch,
  run: PayRun,
  runSettlements: Settlement[],
  funding: FundingSummary
): BatchEvaluation => {
  const approved = run.status === 'approved' || run.status === 'paid' || run.status === 'closed'
  const missingBank = runSettlements.filter(s => s.status === 'action_required' && !s.retryOfId)

  // A person with no bank account is left out of the file, not a reason to hold everyone else's
  // pay: their payment stays Action required and is issued once the account is on file.
  const excludedNote =
    missingBank.length > 0
      ? `${missingBank.length} ${missingBank.length === 1 ? 'payment is' : 'payments are'} left out of the file: no bank account on file. ${missingBank.length === 1 ? 'It stays' : 'They stay'} Action required until one is added.`
      : null

  switch (batch.status) {
    case 'draft': {
      const reasons: string[] = []

      if (!approved)
        reasons.push(`${run.reference} is not approved. The file is built from an approved calculation only.`)

      return {
        next: 'prepare',
        blockingReasons: reasons,
        notes: excludedNote ? [excludedNote] : [],
        href: !approved ? `/payroll/runs/${run.id}` : undefined
      }
    }

    case 'prepared': {
      const reasons: string[] = []

      if (batch.validation && batch.validation.issues.length > 0) reasons.push(...batch.validation.issues)

      if (funding.headroom.amount < 0) {
        reasons.push(
          `Funding is ${formatMoney({ ...funding.headroom, amount: -funding.headroom.amount })} short of ${formatMoney(funding.required)}. Top up the account or change the funding account.`
        )
      }

      return {
        next: 'release',
        blockingReasons: reasons,
        notes: excludedNote ? [excludedNote] : [],
        href: reasons.length > 0 ? '/payroll/settings?section=banking' : undefined
      }
    }

    case 'released':
      return { next: 'acknowledge', blockingReasons: [], notes: [] }
    case 'accepted':
    case 'processing':
      return { next: 'settle', blockingReasons: [], notes: [] }
    case 'settled':
    case 'partially_returned':
      return { next: null, blockingReasons: [], notes: excludedNote ? [excludedNote] : [] }
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Rows                                                                                         */
/* -------------------------------------------------------------------------------------------- */

/** A settlement joined to the person and run it belongs to, for the table and inspector. */
export type SettlementRow = Settlement & {
  employeeName: string
  employeeNumber: string
  avatar?: string
  departmentName: string
  runReference: string
  payDate: string

  /** True when a later settlement re-issued this one, so the failure is already handled. */
  superseded: boolean
}

export const buildSettlementRows = (
  settlements: Settlement[],
  employees: Employee[],
  departments: Department[],
  runs: PayRun[]
): SettlementRow[] => {
  const employeeById = new Map(employees.map(e => [e.id, e]))
  const departmentById = new Map(departments.map(d => [d.id, d.name]))
  const runById = new Map(runs.map(r => [r.id, r]))
  const retried = new Set(settlements.map(s => s.retryOfId).filter(Boolean))

  const rows: SettlementRow[] = []

  for (const settlement of settlements) {
    const employee = employeeById.get(settlement.employeeId)
    const run = runById.get(settlement.payRunId)

    if (!employee || !run) continue

    rows.push({
      ...settlement,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeNumber: employee.employeeNumber,
      avatar: employee.avatar,
      departmentName: departmentById.get(employee.departmentId) ?? employee.departmentId,
      runReference: run.reference,
      payDate: run.payDate,
      superseded: retried.has(settlement.id)
    })
  }

  // Newest run first, and within a run the ones needing attention on top.
  const attention: Record<EmployeePaymentStatus, number> = {
    action_required: 0,
    failed: 1,
    returned: 2,
    processing: 3,
    released: 4,
    ready: 5,
    paid: 6
  }

  return rows.sort(
    (a, b) =>
      b.payDate.localeCompare(a.payDate) ||
      attention[a.status] - attention[b.status] ||
      a.employeeName.localeCompare(b.employeeName)
  )
}

/* -------------------------------------------------------------------------------------------- */
/* Summaries                                                                                    */
/* -------------------------------------------------------------------------------------------- */

export const settlementCounts = (rows: Pick<Settlement, 'status'>[]): Record<EmployeePaymentStatus, number> => {
  const counts: Record<EmployeePaymentStatus, number> = {
    ready: 0,
    released: 0,
    processing: 0,
    paid: 0,
    returned: 0,
    failed: 0,
    action_required: 0
  }

  for (const row of rows) counts[row.status] += 1

  return counts
}

/** Returns and failures nobody has re-issued yet — the payments to-do list. */
export const openFailures = (rows: SettlementRow[]) =>
  rows.filter(row => (row.status === 'returned' || row.status === 'failed') && !row.superseded)

export type FundingSummary = {
  available: Money

  /** Net pay still to leave the account for this run: everything not yet paid. */
  required: Money

  /** available − required. Negative is a shortfall. */
  headroom: Money

  /** 0–100, capped. */
  coverage: number
}

export const fundingSummary = (
  runSettlements: Settlement[],
  account: FundingAccount | undefined,
  currency: Money['currency']
): FundingSummary => {
  const required: Money = {
    amount: runSettlements
      .filter(s => s.status !== 'paid' && !s.retryOfId)
      .reduce((total, s) => total + s.amount.amount, 0),
    currency
  }

  const available = account?.balance ?? { amount: 0, currency }
  const headroom: Money = { amount: available.amount - required.amount, currency }

  return {
    required,
    available,
    headroom,
    coverage: required.amount === 0 ? 100 : Math.min(100, (available.amount / required.amount) * 100)
  }
}

export type ReadinessCheck = {
  key: string
  label: string
  done: boolean

  /** What is left, or what was confirmed. */
  detail: string

  /** Where to go to fix it. */
  href?: string
}

/**
 * Can this run be paid? Four gates, in the order they are usually cleared. Each names what is
 * left rather than a bare tick, so the number underneath is explainable.
 */
export const paymentReadiness = (
  run: PayRun,
  runSettlements: Settlement[],
  funding: FundingSummary,
  batch?: SettlementBatch
): { percent: number; checks: ReadinessCheck[] } => {
  const missingBank = runSettlements.filter(s => s.status === 'action_required').length
  const approved = run.status === 'approved' || run.status === 'paid' || run.status === 'closed'

  // "Released" is the batch's recorded event, not an inference from the run being paid.
  const released = batch ? batchStageIndex(batch.status) >= 2 : run.status === 'paid' || run.status === 'closed'

  const checks: ReadinessCheck[] = [
    {
      key: 'bank',
      label: 'Bank details complete',
      done: missingBank === 0,
      detail:
        missingBank === 0
          ? `All ${runSettlements.length} employees have an account on file`
          : `${missingBank} ${missingBank === 1 ? 'employee has' : 'employees have'} no bank account on file`,
      href: `/payroll/runs/${run.id}?view=exceptions`
    },
    {
      key: 'approval',
      label: 'Run approved',
      done: approved,
      detail: approved
        ? `Calculation #${run.calculationVersion} approved`
        : `Awaiting approval of calculation #${run.calculationVersion}`,
      href: `/payroll/runs/${run.id}`
    },
    {
      key: 'funding',
      label: 'Funding in place',
      done: funding.headroom.amount >= 0,
      detail:
        funding.headroom.amount >= 0
          ? `${formatMoney(funding.headroom)} headroom after ${formatMoney(funding.required)}`
          : `${formatMoney({ ...funding.headroom, amount: -funding.headroom.amount })} short of ${formatMoney(funding.required)}`
    },
    {
      key: 'file',
      label: 'Payment file released',
      done: released,
      detail: released
        ? `Released ${batch?.releasedAt ? formatInstant(batch.releasedAt) : `for payday ${formatDate(run.payDate)}`}`
        : batch?.status === 'prepared'
          ? `Prepared, awaiting release for ${formatDate(run.payDate)}`
          : `Scheduled for ${formatDate(run.payDate)}`,
      href: released ? undefined : '/payroll/payments'
    }
  ]

  return {
    percent: Math.round((checks.filter(c => c.done).length / checks.length) * 100),
    checks
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Inspector                                                                                    */
/* -------------------------------------------------------------------------------------------- */

/** One settlement's life as a timeline, newest first. */
export const settlementEvents = (row: SettlementRow, batch: SettlementBatch | undefined): AuditEvent[] => {
  const events: AuditEvent[] = []

  if (batch?.preparedAt) {
    events.push({
      id: `${row.id}-prepared`,
      at: batch.preparedAt,
      actor: 'Payments',
      action: 'Included in payment file',
      detail: `${batch.reference} · ${batch.count} payments`,
      kind: 'system'
    })
  }

  if (batch?.acceptedAt) {
    events.push({
      id: `${row.id}-accepted`,
      at: batch.acceptedAt,
      actor: 'Bank',
      action: 'File accepted',
      detail: batch.bankReference ? `Bank reference ${batch.bankReference}` : undefined,
      kind: 'system'
    })
  }

  if (batch?.releasedAt || row.releasedAt) {
    events.push({
      id: `${row.id}-released`,
      at: row.releasedAt ?? batch!.releasedAt!,
      actor: 'Payments',
      action: 'Released to bank',
      detail: row.reference ? `Reference ${row.reference}` : undefined,
      kind: 'system'
    })
  }

  if (row.settledAt) {
    events.push({
      id: `${row.id}-settled`,
      at: row.settledAt,
      actor: 'Bank',
      action: 'Settled',
      detail: `${formatMoney(row.amount)} credited to ···· ${row.accountLast4 ?? '—'}`,
      kind: 'approval'
    })
  }

  if (row.returnedAt) {
    events.push({
      id: `${row.id}-returned`,
      at: row.returnedAt,
      actor: 'Bank',
      action: 'Returned',
      detail: row.reason,
      kind: 'exception'
    })
  }

  if (row.failedAt) {
    events.push({
      id: `${row.id}-failed`,
      at: row.failedAt,
      actor: 'Bank',
      action: 'Rejected',
      detail: row.reason,
      kind: 'exception'
    })
  }

  return events.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
}
