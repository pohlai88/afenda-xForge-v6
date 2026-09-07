// Type Imports
import type { IsoDateTime, Money } from '@/types/common/primitive-types'
import type { Employee } from '@/types/hrm/employee-types'
import type { PayRunException, Payslip } from '@/types/payroll/pay-run-types'

/**
 * View models for the payroll run workspace (`/payroll/runs/[runId]`).
 *
 * These are shapes the page assembles once on the server from the domain records — a run, its
 * payslips, the previous run's payslips, the employees — and hands to the client. They exist so
 * the table, the inspector and the reconciliation read the same pre-joined row rather than each
 * re-joining employees to payslips mid-render.
 */

/**
 * The six stages a run moves through. Not a wizard: the bar shows where the run is, and people
 * are expected to move back to earlier stages while investigating.
 */
export const PAYROLL_STAGES = ['inputs', 'calculate', 'review', 'approve', 'pay', 'close'] as const

export type PayrollStage = (typeof PAYROLL_STAGES)[number]

/**
 * One employee's standing within this run. Derived from their payslip plus the open exceptions
 * about them — the run status alone cannot say that one person is blocked while the rest are fine.
 */
export type EmployeePayrollStatus = 'calculated' | 'needs_review' | 'blocked' | 'approved' | 'paid'

/**
 * The canonical payroll settlement vocabulary, shared with `/payroll/payments` when it lands.
 * Do not add a parallel set of words for the same states elsewhere.
 */
export type EmployeePaymentStatus =
  | 'ready'
  | 'released'
  | 'processing'
  | 'paid'
  | 'returned'
  | 'failed'
  | 'action_required'

export interface PayrollRunRow {
  employeeId: string
  employeeNumber: string
  name: string
  avatar?: string
  positionTitle: string
  departmentId: string
  departmentName: string
  locationId: string
  locationName: string
  gross: Money
  net: Money

  /** Absent for someone who was not on the previous run — a new joiner has nothing to vary from. */
  previousNet?: Money

  /** current net − previous net, in minor units. Null when there is no previous payslip. */
  variance: Money | null
  variancePercent: number | null
  payrollStatus: EmployeePayrollStatus
  paymentStatus: EmployeePaymentStatus

  /** Every exception about this person, open or not. Counts below are of the open ones only. */
  exceptions: PayRunException[]
  openBlockers: number
  openWarnings: number
  payslip: Payslip
  previousPayslip?: Payslip
  employee: Employee
}

/** One line of the previous-vs-current explanation. Components missing on one side show as zero. */
export interface PayVarianceLine {
  code: string
  label: string
  previous: Money
  current: Money
  delta: Money

  /** Whether an increase in this line moves net pay up or down. */
  direction: 'earning' | 'deduction' | 'employer'
}

/** An input the calculation consumed, with where it came from and whether it looks complete. */
export interface PayrollInput {
  label: string
  value: string
  source: string
  effectiveFrom?: string
  status: 'ok' | 'missing' | 'changed'
}

/** Where a payslip line came from and which rule produced it. */
export interface SourceTraceEntry {
  code: string
  label: string
  amount: Money
  source: string
  rule: string
  calculatedAt: IsoDateTime
}

/*
 * An audit event is six neutral fields, and three payroll modules plus one shared timeline already
 * produced and consumed them, so the definition now lives in `@/types/common/audit-types` and is
 * re-exported here. Payroll keeps the door it has always used; there is one definition behind it.
 */
export type { AuditEvent } from '@/types/common/audit-types'

export interface ReconciliationLine {
  key: string
  label: string
  current: Money
  previous: Money | null

  /** Which employees this figure aggregates, for the drill-down. */
  drillDown?: { sortBy: string; desc: boolean }
}

/** The employee-count line of the reconciliation, which is a count rather than money. */
export interface ReconciliationCount {
  current: number
  previous: number | null
}
