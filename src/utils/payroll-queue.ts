// Third-party Imports
import Papa from 'papaparse'

// Type Imports
import type { Employee, PayFrequency } from '@/types/hrm/employee-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { PayRun, PayRunStatus } from '@/types/payroll/pay-run-types'
import type { PayRunQueueRow, RunLifecycle, RunQueueSummary } from '@/types/payroll/run-queue-types'

// Util Imports
import { formatMoney } from '@/utils/money'
import { previousRunOf } from '@/utils/payroll-group'
import { PAY_RUN_STATUS_LABELS, changeVsPrevious, countExceptions, daysBetween } from '@/utils/payroll-metrics'
import { formatDate, formatPeriod } from '@/utils/payroll-workspace'

/* -------------------------------------------------------------------------------------------- */
/* Vocabulary                                                                                   */
/* -------------------------------------------------------------------------------------------- */

/**
 * Status -> lifecycle. Decided here once; the focal card, the filter chips and the table all ask
 * this function rather than each keeping their own list of "finished" statuses.
 */
export const lifecycleOf = (status: PayRunStatus): RunLifecycle => {
  if (status === 'paid' || status === 'closed') return 'done'
  if (status === 'cancelled' || status === 'failed') return 'exited'

  return 'open'
}

export const RUN_LIFECYCLE_LABELS: Record<RunLifecycle, string> = {
  open: 'In progress',
  done: 'Paid',
  exited: 'Cancelled or failed'
}

/** Runs per year for each frequency, so "5 of 12" can be said for any pay group. */
const RUNS_PER_YEAR: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  semi_monthly: 24,
  monthly: 12
}

/* -------------------------------------------------------------------------------------------- */
/* Rows                                                                                         */
/* -------------------------------------------------------------------------------------------- */

type QueueSources = {

  /** Oldest first, as the store returns them. */
  runs: PayRun[]
  employees: Employee[]
  entities: LegalEntity[]

  /** Today's date, read once by the page. Never read from the clock here. */
  today: string
}

/** The queue, newest first. Deltas compare each run with the one before it in time. */
export const buildRunQueue = ({ runs, employees, entities, today }: QueueSources): PayRunQueueRow[] => {
  const employeeById = new Map(employees.map(employee => [employee.id, employee]))
  const entityById = new Map(entities.map(entity => [entity.id, entity]))

  return runs
    .map(run => {
      // The previous run of the SAME company. `runs[index - 1]` was correct while every run
      // belonged to one employer; with several interleaved it compares a Singapore run against
      // a Malaysian one and every delta built on it is meaningless.
      const previous = previousRunOf(runs, run)
      const entity = entityById.get(run.entityId)
      const lifecycle = lifecycleOf(run.status)
      const approval = run.approvals[run.approvals.length - 1]
      const approver = approval ? employeeById.get(approval.approvedBy) : undefined

      return {
        id: run.id,
        reference: run.reference,
        entityId: run.entityId,
        entityName: entity?.name ?? run.entityId,
        countryCode: entity?.countryCode ?? 'SG',
        payGroup: run.payGroup,
        frequency: run.frequency,
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
        payDate: run.payDate,
        cutoffAt: run.cutoffAt,
        status: run.status,
        lifecycle,
        employeeCount: run.employeeCount,
        gross: run.totals.grossPay,
        net: run.totals.netPay,
        employerCost: run.totals.employerCost,
        netChangePercent: changeVsPrevious(run.totals.netPay, previous?.totals.netPay),
        daysToPayday: lifecycle === 'open' ? daysBetween(today, run.payDate) : null,
        counts: countExceptions(run.exceptions),
        resolvedExceptions: run.exceptions.filter(exception => exception.resolvedAt).length,
        approver: approver && {
          name: `${approver.firstName} ${approver.lastName}`,
          avatar: approver.avatar
        }
      }
    })
    .reverse()
}

/* -------------------------------------------------------------------------------------------- */
/* Summary                                                                                      */
/* -------------------------------------------------------------------------------------------- */

/**
 * The year as the queue sees it. "This year" is the focal run's payday year: someone looking at
 * the queue in January is still closing December, and the summary should follow the work.
 */
export const queueSummary = (rows: PayRunQueueRow[]): RunQueueSummary => {
  const focus = rows.find(row => row.lifecycle === 'open') ?? rows[0]
  const year = focus.payDate.slice(0, 4)

  const paid = rows.filter(row => row.lifecycle === 'done' && row.payDate.startsWith(year))

  // Grouped by currency rather than summed into one. Consolidating across currencies is the
  // group surface's job, where a reporting currency and an exchange rate basis are stated; a
  // queue that quietly did it here would be inventing a total nobody chose the basis for.
  const currencies = [...new Set(paid.map(row => row.gross.currency))]

  const paidByCurrency = currencies.map(currency => {
    const own = paid.filter(row => row.gross.currency === currency)

    return {
      currency,
      employerCost: {
        amount: own.reduce((total, row) => total + row.employerCost.amount, 0),
        currency
      },
      netPay: { amount: own.reduce((total, row) => total + row.net.amount, 0), currency },
      runs: own.length
    }
  })

  // `paid` is newest first, so the span runs from the last element to the first.
  const paidSpan = paid.length > 0 ? { from: paid[paid.length - 1].periodStart, to: paid[0].periodEnd } : null

  return {
    focus,
    year,
    paidRuns: paid.length,

    // Twelve monthly runs per company, not twelve for the whole group. With five companies in
    // the queue the old figure read "25 of 12", which is not a progress track, it is a bug on
    // screen.
    expectedRuns: RUNS_PER_YEAR[focus.frequency] * new Set(rows.map(row => row.entityId)).size,
    paidByCurrency,
    paidSpan,
    exceptionsResolved: rows
      .filter(row => row.payDate.startsWith(year))
      .reduce((total, row) => total + row.resolvedExceptions, 0)
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Export                                                                                       */
/* -------------------------------------------------------------------------------------------- */

const toExportRows = (rows: PayRunQueueRow[]) =>
  rows.map(row => ({
    Run: row.reference,
    Company: row.entityName,
    Country: row.countryCode,
    'Pay group': row.payGroup,
    Period: formatPeriod(row.periodStart, row.periodEnd),
    Payday: formatDate(row.payDate),
    Employees: row.employeeCount,
    Currency: row.gross.currency,
    Gross: formatMoney(row.gross),
    Net: formatMoney(row.net),
    'Employer cost': formatMoney(row.employerCost),
    'Open exceptions': row.counts.open,
    'Approved by': row.approver?.name ?? '',
    Status: PAY_RUN_STATUS_LABELS[row.status]
  }))

/** The run list as CSV, with the same download mechanics as the payroll register export. */
export const exportRunQueueToCsv = (rows: PayRunQueueRow[]): void => {
  const csv = Papa.unparse(toExportRows(rows), { header: true })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', 'payroll-runs.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
