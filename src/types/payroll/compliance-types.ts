// Type Imports
import type { IsoDate, IsoDateTime, Money } from '@/types/common/primitive-types'

/**
 * The compliance domain: what payroll owes an authority, by when, and whether it has been filed.
 *
 * A filing is a record derived from a run's payslips and then carried through a small state
 * machine by people. The amounts are never typed in; they are the sum of the statutory components
 * on the payslips, so a filing can always be traced back to the pay it reports.
 */

export type FilingKind = 'cpf_contribution' | 'tax_withholding' | 'annual_return'

/**
 * Ordered as a filing progresses. 'rejected' is the authority's answer, not a terminal exit: a
 * rejected filing is prepared again and resubmitted.
 */
export type FilingStatus = 'not_started' | 'prepared' | 'submitted' | 'accepted' | 'rejected'

/** The three stages a filing moves through once someone starts on it. */
export const FILING_STAGES = ['prepared', 'submitted', 'accepted'] as const

export type FilingStage = (typeof FILING_STAGES)[number]

/** One statutory component's contribution to the filing, e.g. the employee share of CPF. */
export interface FilingLine {
  code: string
  label: string
  amount: Money
  employeeCount: number
}

export interface StatutoryFiling {
  id: string
  kind: FilingKind

  /** Set for per-run filings; the annual return spans every run of the year. */
  payRunId?: string
  runReference?: string
  periodStart: IsoDate
  periodEnd: IsoDate
  dueDate: IsoDate
  status: FilingStatus
  amount: Money
  employeeCount: number
  lines: FilingLine[]

  /** Which calculation the figures came from, so a recalculated run invalidates the filing. */
  calculationVersion?: number

  preparedAt?: IsoDateTime
  preparedBy?: string
  submittedAt?: IsoDateTime
  submittedBy?: string

  /** The authority's acknowledgement reference, entered when the filing is marked submitted. */
  reference?: string
  respondedAt?: IsoDateTime
  rejectionReason?: string
}

/** What the page shows per filing: the record plus what the reader needs beside it. */
export interface FilingRow extends StatutoryFiling {

  /** Whole days from today to the due date. Null once accepted, where a countdown says nothing. */
  daysToDue: number | null
  preparer?: { name: string; avatar?: string }
  submitter?: { name: string; avatar?: string }
}

export interface ComplianceSummary {

  /** The filing that needs working: overdue first, then the soonest due; the latest accepted if none. */
  focus: FilingRow
  year: string
  total: number
  accepted: number

  /** Everything due this year, accepted or not. */
  owed: Money

  /** The accepted part of `owed`. */
  filed: Money
  onTime: number
  overdue: number
  rejected: number
}
