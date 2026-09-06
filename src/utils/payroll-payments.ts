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
import { formatDate } from '@/utils/payroll-workspace'

/* -------------------------------------------------------------------------------------------- */
/* Vocabularies                                                                                 */
/* -------------------------------------------------------------------------------------------- */

export const BATCH_STATUS_LABELS: Record<SettlementBatchStatus, string> = {
  draft: 'Not released',
  released: 'Released',
  settled: 'Settled',
  partially_returned: 'Settled · returns'
}

export const BATCH_STATUS_STYLES: Record<SettlementBatchStatus, string> = {
  draft: 'bg-muted text-foreground',
  released: 'bg-info/10 text-info',
  settled: 'bg-success/15 text-success',
  partially_returned: 'bg-warning/15 text-warning'
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
  funding: FundingSummary
): { percent: number; checks: ReadinessCheck[] } => {
  const missingBank = runSettlements.filter(s => s.status === 'action_required').length
  const approved = run.status === 'approved' || run.status === 'paid' || run.status === 'closed'
  const paid = run.status === 'paid' || run.status === 'closed'

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
      done: paid,
      detail: paid ? `Released for payday ${formatDate(run.payDate)}` : `Scheduled for ${formatDate(run.payDate)}`
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
