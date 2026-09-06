/**
 * ! Seed data for payroll payments. Swap these exports for real queries when the database
 * ! lands — src/app/server/actions.ts is the only place that reads them.
 *
 * Settlements are COMPUTED from the payslips, one per payslip per run, so the payments view
 * always reconciles to the run it pays. Closed runs settled; the open run is waiting on
 * approval. Two returns and one failure are planted in past runs so the failure path has
 * something real to show. Deterministic throughout — no clock, no random.
 */

// Type Imports
import type { CurrencyCode, Money } from '@/types/common/primitive-types'
import type { FundingAccount, Settlement, SettlementBatch } from '@/types/payroll/settlement-types'

// Data Imports
import { employees } from '@/fake-db/hrm/employees'
import { entityFor } from '@/fake-db/hrm/entities'
import { payRuns, payslips } from '@/fake-db/payroll/pay-runs'

const at = (amount: number, currency: CurrencyCode): Money => ({ amount, currency })

/**
 * One operating account per entity, plus a Singapore reserve.
 *
 * An account belongs to a company and holds that company's currency: Malaysia cannot pay its
 * people out of a Singapore dollar account, and the funding check has to be able to say so
 * rather than compare two unrelated numbers.
 */
export const fundingAccounts: FundingAccount[] = [
  {
    id: 'fund-sg-ops',
    entityId: 'ent-sg',
    name: 'Payroll operating account',
    bankName: 'DBS Bank',
    accountLast4: '4471',
    currency: 'SGD',
    balance: at(24_186_400, 'SGD'),
    isDefault: true
  },
  {
    id: 'fund-sg-reserve',
    entityId: 'ent-sg',
    name: 'Payroll reserve',
    bankName: 'OCBC Bank',
    accountLast4: '9012',
    currency: 'SGD',
    balance: at(15_000_000, 'SGD'),
    isDefault: false
  },
  {
    id: 'fund-my-ops',
    entityId: 'ent-my',
    name: 'Payroll operating account',
    bankName: 'Maybank',
    accountLast4: '2208',
    currency: 'MYR',
    balance: at(185_000_000, 'MYR'),
    isDefault: true
  },
  {
    id: 'fund-mfg-ops',
    entityId: 'ent-mfg',
    name: 'Plant payroll account',
    bankName: 'CIMB Bank',
    accountLast4: '7734',
    currency: 'MYR',
    balance: at(210_000_000, 'MYR'),
    isDefault: true
  },
  {
    id: 'fund-vn-ops',
    entityId: 'ent-vn',
    name: 'Payroll operating account',
    bankName: 'Vietcombank',
    accountLast4: '5190',
    currency: 'VND',
    balance: at(12_400_000_000, 'VND'),
    isDefault: true
  },
  {
    id: 'fund-feed-ops',
    entityId: 'ent-feed',
    name: 'Payroll operating account',
    bankName: 'BIDV',
    accountLast4: '3066',
    currency: 'VND',
    balance: at(9_800_000_000, 'VND'),
    isDefault: true
  }
]

const defaultAccountFor = (entityId: string) =>
  fundingAccounts.find(account => account.entityId === entityId && account.isDefault) ??
  fundingAccounts.find(account => account.entityId === entityId)

/** '2026-09-01' -> 'SEP26', for the bank reference. Read from the period, never from the run id. */
const shortPeriod = (periodStart: string) => {
  const [year, month] = periodStart.split('-')
  const name = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][Number(month) - 1]

  return `${name}${year.slice(2)}`
}

/** The bank each entity's file goes to, for a reference that looks like the real thing. */
const BANK_PREFIX: Record<string, string> = {
  'ent-sg': 'DBS-GIRO',
  'ent-my': 'MBB-IBG',
  'ent-mfg': 'CIMB-IBG',
  'ent-vn': 'VCB-ACH',
  'ent-feed': 'BIDV-ACH'
}

/** Payments that came back or never went, keyed by run then employee. */
const incidents: Record<string, Record<string, { kind: 'returned' | 'failed'; reason: string; daysLater: number }>> = {
  'run-sg-2026-08': {
    'emp-012': { kind: 'returned', reason: 'Account closed at receiving bank', daysLater: 2 }
  },
  'run-sg-2026-07': {
    'emp-019': { kind: 'failed', reason: 'Beneficiary name does not match account', daysLater: 0 }
  }
}

const employeeById = new Map(employees.map(e => [e.id, e]))

const addDays = (isoDate: string, days: number) => {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))

  return date.toISOString().slice(0, 10)
}

const batches: SettlementBatch[] = []
const allSettlements: Settlement[] = []

for (const run of payRuns) {
  const slips = payslips.filter(s => s.payRunId === run.id)
  const isOpen = run.status !== 'paid' && run.status !== 'closed'
  const batchId = `batch-${run.id}`
  const releasedAt = `${addDays(run.payDate, -2)}T03:00:00.000Z`
  const settledAt = `${run.payDate}T01:00:00.000Z`
  const runIncidents = incidents[run.id] ?? {}
  const entity = entityFor(run.entityId)
  const account = defaultAccountFor(run.entityId)
  const stamp = shortPeriod(run.periodStart)

  for (const slip of slips) {
    const employee = employeeById.get(slip.employeeId)

    if (!employee) continue

    const base: Settlement = {
      id: `stl-${run.id}-${employee.id}`,
      batchId,
      payRunId: run.id,
      employeeId: employee.id,
      amount: slip.netPay,
      method: employee.payroll.paymentMethod,
      accountLast4: employee.payroll.bankAccountLast4,
      status: 'ready'
    }

    if (isOpen) {
      allSettlements.push({
        ...base,
        status:
          employee.payroll.paymentMethod === 'bank_transfer' && !employee.payroll.bankAccountLast4
            ? 'action_required'
            : 'ready'
      })
      continue
    }

    const incident = runIncidents[employee.id]
    const reference = `${BANK_PREFIX[run.entityId] ?? 'GIRO'}-${stamp}-${employee.employeeNumber.replace('EMP-', '')}`

    if (!incident) {
      allSettlements.push({ ...base, status: 'paid', reference, releasedAt, settledAt })
      continue
    }

    if (incident.kind === 'returned') {
      const returnedAt = `${addDays(run.payDate, incident.daysLater)}T06:30:00.000Z`

      allSettlements.push({
        ...base,
        status: 'returned',
        reference,
        releasedAt,
        settledAt,
        returnedAt,
        reason: incident.reason
      })

      // Re-issued to the corrected account four days on, and paid.
      allSettlements.push({
        ...base,
        id: `${base.id}-retry`,
        status: 'paid',
        reference: `${reference}R`,
        releasedAt: `${addDays(run.payDate, incident.daysLater + 4)}T03:00:00.000Z`,
        settledAt: `${addDays(run.payDate, incident.daysLater + 5)}T01:00:00.000Z`,
        retryOfId: base.id
      })
    } else {
      allSettlements.push({
        ...base,
        status: 'failed',
        reference,
        releasedAt,
        failedAt: releasedAt,
        reason: incident.reason
      })

      allSettlements.push({
        ...base,
        id: `${base.id}-retry`,
        status: 'paid',
        reference: `${reference}R`,
        releasedAt: `${addDays(run.payDate, 1)}T03:00:00.000Z`,
        settledAt: `${addDays(run.payDate, 2)}T01:00:00.000Z`,
        retryOfId: base.id
      })
    }
  }

  const runSettlements = allSettlements.filter(s => s.batchId === batchId)
  const hasReturn = runSettlements.some(s => s.status === 'returned')

  const total = at(
    runSettlements.filter(s => !s.retryOfId).reduce((sum, s) => sum + s.amount.amount, 0),
    run.currency
  )

  const count = runSettlements.filter(s => !s.retryOfId).length
  const preparedAt = `${addDays(run.payDate, -3)}T08:00:00.000Z`

  // Closed runs carry the whole lifecycle as recorded events: the specialist prepared and
  // validated the file, the Finance head released it, the bank acknowledged it within the hour.
  batches.push({
    id: batchId,
    payRunId: run.id,
    fundingAccountId: account?.id ?? 'fund-sg-ops',
    reference: `AFENDA ${entity.code} PAYROLL ${stamp}`,
    total,
    count,
    status: isOpen ? 'draft' : hasReturn ? 'partially_returned' : 'settled',
    scheduledFor: run.payDate,
    ...(isOpen
      ? {}
      : {
          preparedAt,
          preparedBy: 'emp-022',
          validation: { checkedAt: preparedAt, payments: count, total, issues: [], excludedEmployeeIds: [] },
          releasedAt,
          releasedBy: 'emp-020',
          bankReference: `${BANK_PREFIX[run.entityId] ?? 'GIRO'}-${stamp}-${run.periodStart.slice(5, 7)}7`,
          acceptedAt: `${addDays(run.payDate, -2)}T04:05:00.000Z`,
          settledAt
        })
  })
}

export const settlements = allSettlements

export const settlementBatches = batches
