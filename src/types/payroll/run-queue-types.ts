// Type Imports
import type { IsoDate, IsoDateTime, Money } from '@/types/common/primitive-types'
import type { PayFrequency } from '@/types/hrm/employee-types'
import type { PayRunStatus } from '@/types/payroll/pay-run-types'
import type { ExceptionCounts } from '@/utils/payroll-metrics'

/**
 * View models for the run queue (`/payroll/runs`).
 *
 * The page assembles these once on the server from the runs and the employees, so the focal
 * card, the year summary and the table all read the same pre-computed row — none of them
 * re-derive a countdown, a delta or an approver mid-render.
 */

/**
 * Where a run sits from the queue's point of view. Coarser than `PayRunStatus` on purpose: the
 * person picking a run to work wants "still being worked" against "finished", and the nine
 * statuses only matter once the run is open.
 */
export type RunLifecycle = 'open' | 'done' | 'exited'

export interface PayRunQueueRow {
  id: string
  reference: string
  payGroup: string
  frequency: PayFrequency
  periodStart: IsoDate
  periodEnd: IsoDate
  payDate: IsoDate
  cutoffAt: IsoDateTime
  status: PayRunStatus
  lifecycle: RunLifecycle
  employeeCount: number
  gross: Money
  net: Money
  employerCost: Money

  /** Net pay against the run before this one, in percent. Null for the first run. */
  netChangePercent: number | null

  /** Whole days from today to payday. Null once the run is done or has left the lifecycle. */
  daysToPayday: number | null
  counts: ExceptionCounts

  /** Exceptions someone has cleared on this run — the work already done, not the work left. */
  resolvedExceptions: number

  /** Whoever signed the run off. Absent until it is approved. */
  approver?: { name: string; avatar?: string }
}

/** What the queue says about the year so far, computed over the rows once. */
export interface RunQueueSummary {

  /** The run that needs working: the newest one still in progress, else the newest run. */
  focus: PayRunQueueRow
  year: string
  paidRuns: number

  /** How many runs this pay frequency produces in a year, for the progress track. */
  expectedRuns: number
  employerCostPaid: Money
  netPaid: Money

  /** First and last period paid this year, for the caption. Null until a run is paid. */
  paidSpan: { from: IsoDate; to: IsoDate } | null
  exceptionsResolved: number
}
