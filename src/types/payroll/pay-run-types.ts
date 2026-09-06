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

/** 'blocking' must be cleared before the run may be approved. The others are advisory. */
export type PayRunExceptionSeverity = 'blocking' | 'warning' | 'info'

export interface PayRunException {
  id: string
  kind: PayRunExceptionKind
  severity: PayRunExceptionSeverity

  /** Set when the exception is about one person. */
  employeeId?: string

  /** Set when it is about a whole department, as budget variance is. */
  departmentId?: string
  message: string
  detectedAt: IsoDateTime
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

export interface PayRun {
  id: string

  /** Human-readable, e.g. 'PR-2026-09'. What people call the run in conversation. */
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

  /** One currency per run. Multi-currency payroll means multiple runs, not mixed totals. */
  currency: CurrencyCode

  employeeCount: number
  totals: PayRunTotals
  exceptions: PayRunException[]
  approvals: PayRunApproval[]

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
