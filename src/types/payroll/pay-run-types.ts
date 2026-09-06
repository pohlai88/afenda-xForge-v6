// Type Imports
import type { CurrencyCode, IsoDate, IsoDateTime, Money } from '@/types/common/primitive-types'
import type { PayFrequency } from '@/types/hrm/employee-types'

/**
 * The payroll domain model.
 *
 * Payroll depends on HRM and not the other way round: a run is computed over employees. Keep
 * imports pointing in that one direction.
 *
 * A PayRun is a state machine, not a report. The dashboard around it exists so someone can see
 * what is blocking this period's run while there is still time to fix it, so the exceptions on
 * a run matter as much as its totals.
 */

/**
 * Lifecycle of a run. Ordered as it progresses; 'cancelled' and 'failed' are terminal exits.
 *
 * Money moves at 'paid'. Everything before it is reversible, nothing after it is — which is
 * why approval is its own state rather than a boolean on the run.
 */
export type PayRunStatus =
  | 'draft'
  | 'calculating'
  | 'calculated'
  | 'pending_approval'
  | 'approved'
  | 'paid'
  | 'closed'
  | 'cancelled'
  | 'failed'

export type PayComponentKind = 'earning' | 'deduction' | 'employer_contribution' | 'tax'

/**
 * One line on a payslip. The kinds are separated because they behave differently: earnings and
 * deductions move the employee's net pay, employer contributions do not — they are company
 * cost on top of gross. Summing them together overstates take-home and understates cost.
 */
export interface PayComponent {
  /** Stable code for reporting and GL mapping, e.g. 'BASE', 'OT15', 'PENSION_EE'. */
  code: string
  label: string
  kind: PayComponentKind
  amount: Money

  /** Whether this earning is subject to tax. Meaningless for other kinds. */
  taxable?: boolean

  /** Hours or units, for components billed at a rate. */
  quantity?: number
  rate?: Money
}

/**
 * Things a human must look at before the run closes. This is the reason the payroll dashboard
 * earns its place — totals can be read from a report the next day, exceptions cannot.
 */
export type PayRunExceptionKind =
  | 'missing_approval'
  | 'missing_bank_details'
  | 'missing_tax_details'
  | 'manual_adjustment'
  | 'off_cycle_payment'
  | 'negative_net_pay'
  | 'failed_payment'
  | 'overtime_spike'
  | 'budget_variance'

/**
 * 'blocking' must be cleared before the run may be approved. 'error' is a calculation the engine
 * could not trust but did not stop on — it needs a decision, not necessarily a fix. The other two
 * are advisory.
 */
export type PayRunExceptionSeverity = 'blocking' | 'error' | 'warning' | 'info'

/**
 * Where an exception sits in its life. Derived from the timestamps on the record rather than
 * stored, so the two can never disagree: resolved if `resolvedAt` is set, acknowledged if only
 * `acknowledgedAt` is, open otherwise.
 */
export type PayRunExceptionStatus = 'open' | 'acknowledged' | 'resolved'

export interface PayRunException {
  id: string
  kind: PayRunExceptionKind
  severity: PayRunExceptionSeverity

  /** Set when the exception is about one person. */
  employeeId?: string

  /** Set when it is about a whole department, as budget variance is. */
  departmentId?: string

  /** Short noun phrase for lists and badges, e.g. 'Missing bank account'. */
  title: string
  message: string

  /** The rule that raised it, so the person clearing it can read what was checked. */
  rule?: string

  /** Which record or feed the offending value came from, e.g. 'Employment profile'. */
  source?: string

  /** Money at stake, when the exception has a financial size. */
  impact?: Money

  /** Before/after, for exceptions raised by a change rather than by an absence. */
  previousValue?: string
  currentValue?: string

  /** Employee id of whoever owns clearing it. */
  ownerId?: string
  detectedAt: IsoDateTime

  /** Someone has seen it and accepted the risk. Warnings may be approved over once acknowledged. */
  acknowledgedAt?: IsoDateTime
  acknowledgedBy?: string
  resolvedAt?: IsoDateTime

  /** Employee id of whoever cleared it. */
  resolvedBy?: string
}

/**
 * Run totals, in the currency on the run.
 *
 * Two identities hold, and both are worth asserting when seeding or computing:
 *   netPay        = grossPay - employeeTaxes - employeeDeductions
 *   employerCost  = grossPay + employerContributions
 *
 * They are the gross-to-net bridge the dashboard draws. Employer cost is the number finance
 * budgets against and is always larger than gross — showing gross as "what payroll costs" is
 * the most common way these dashboards mislead.
 */
export interface PayRunTotals {
  grossPay: Money
  employeeTaxes: Money
  employeeDeductions: Money
  netPay: Money
  employerContributions: Money
  employerCost: Money
}

export interface PayRunApproval {
  /** Employee id of the approver. */
  approvedBy: string
  approvedAt: IsoDateTime
  note?: string
}

/**
 * "This calculation has been reviewed" as a record, not an inference. Someone acknowledging one
 * exception is not a review of the run; this is. It names the calculation it reviewed, so a
 * later recalculation leaves it standing as history while making the run unreviewed again.
 */
export interface PayrollReview {
  calculationVersion: number

  /** Employee id of the reviewer. */
  reviewedBy: string
  reviewedAt: IsoDateTime

  /** What was open when the reviewer signed: the approver reads this against the current state. */
  findingsAtReview: { blocking: number; error: number; warning: number }
  acknowledgedWarnings: number
  note?: string
}

/**
 * Inputs accepted after the last calculation. While this is set the run's figures are out of
 * date, and approval is refused until a new calculation exists. Cleared by the calculation
 * that consumes them.
 */
export interface PendingInputs {
  count: number
  employees: number
  importedAt: IsoDateTime

  /** Employee id of whoever imported. */
  importedBy: string
}

/** One component that changed for one employee between two calculations. */
export interface ComponentChange {
  employeeId: string
  code: string
  label: string
  previous: Money
  current: Money
}

/**
 * What the latest calculation changed against the one before it. Persisted on the run so the
 * approval dialog can say "12 employees affected, net +S$3,170" after a browser refresh, and
 * so the audit trail has the figures the approver saw.
 */
export interface CalculationDiff {
  previousVersion: number
  currentVersion: number
  affectedEmployees: number
  grossDelta: Money
  netDelta: Money
  employerCostDelta: Money
  componentChanges: ComponentChange[]

  /** Inputs the calculation consumed, as imported. */
  inputsApplied: number
}

export interface PayRun {
  id: string

  /** Human-readable, e.g. 'PR-SG-2026-09'. What people call the run in conversation. */
  reference: string

  /** The period being paid for — inclusive of both ends. */
  periodStart: IsoDate
  periodEnd: IsoDate

  /** When employees are actually paid, which is usually after periodEnd. */
  payDate: IsoDate

  /**
   * Last moment changes are accepted. An instant, not a date: the deadline is a specific time
   * in a specific zone, and the dashboard counts down to it.
   */
  cutoffAt: IsoDateTime

  frequency: PayFrequency
  status: PayRunStatus

  /**
   * The legal entity this run belongs to. A run is always one entity's payroll: the entity fixes
   * the currency, the statutory rules and who is liable, so a run that spanned two would have no
   * single answer to any of those.
   */
  entityId: string

  /** Which population this run pays, e.g. 'SG Monthly'. One pay group per run. */
  payGroup: string

  /**
   * How many times the engine has calculated this run. Approval is of a specific calculation,
   * not of "the run": an input changed after approval invalidates it, and the audit trail has
   * to be able to say which numbers were signed off.
   */
  calculationVersion: number
  lastCalculatedAt?: IsoDateTime

  /** One currency per run. Multi-currency payroll means multiple runs, not mixed totals. */
  currency: CurrencyCode

  employeeCount: number
  totals: PayRunTotals
  exceptions: PayRunException[]
  approvals: PayRunApproval[]

  /** The review of the current or an earlier calculation. Compare its version to the run's. */
  review?: PayrollReview

  /** Set while inputs have landed that no calculation has consumed yet. */
  pendingInputs?: PendingInputs

  /** What the latest calculation changed. Absent until the run has been recalculated once. */
  lastCalculationDiff?: CalculationDiff

  createdAt: IsoDateTime

  /** Employee id of whoever opened the run. */
  createdBy: string
  updatedAt: IsoDateTime
}

export type PayslipStatus = 'draft' | 'issued' | 'paid'

/**
 * One employee's pay for one run. Holds the component detail that PayRun.totals aggregates,
 * so a run's numbers can always be traced back to the payslips that produced them.
 */
export interface Payslip {
  id: string
  payRunId: string
  employeeId: string
  status: PayslipStatus

  components: PayComponent[]
  grossPay: Money
  netPay: Money

  hoursRegular?: number
  hoursOvertime?: number
}

/** Row shape for the pay-run list, without the exception and approval arrays. */
export type PayRunSummary = Pick<
  PayRun,
  'id' | 'reference' | 'periodStart' | 'periodEnd' | 'payDate' | 'status' | 'currency' | 'employeeCount' | 'totals'
>
