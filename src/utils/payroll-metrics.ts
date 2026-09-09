/**
 * Pure aggregations over payroll data. Kept out of the components so the dashboard renders
 * numbers it was handed rather than deriving them mid-render, and so these can be unit tested
 * without mounting anything.
 */

// Type Imports
import type { Money } from '@/types/common/primitive-types'
import type { Department, Employee } from '@/types/hrm/employee-types'
import type {
  PayRun,
  PayRunException,
  PayRunExceptionSeverity,
  PayRunExceptionStatus,
  PayRunStatus,
  Payslip
} from '@/types/payroll/pay-run-types'

// Util Imports
import { toMajorUnits } from '@/utils/money'

const sum = (values: Money[], currency: Money['currency']): Money => ({
  amount: values.reduce((total, v) => total + v.amount, 0),
  currency
})

const componentTotal = (slips: Payslip[], code: string, currency: Money['currency']): Money =>
  sum(
    slips.flatMap(s => s.components.filter(c => c.code === code).map(c => c.amount)),
    currency
  )

/**
 * The gross-to-net bridge, as ordered steps.
 *
 * Recharts has no waterfall, so each step carries an `offset` — an invisible bar that lifts
 * the visible one to where the running total sits. The two terminal bars (gross, net) sit on
 * the floor; the deductions in between float.
 */
export type BridgeStep = {
  label: string

  /** Height of the visible bar, in major units. Always positive. */
  value: number

  /** Invisible bar underneath, in major units. */
  offset: number
  kind: 'total' | 'deduction'
}

export const grossToNetBridge = (run: PayRun): BridgeStep[] => {
  // Not `/ 100`. Minor-unit digits are a property of the currency, and the dong has none, so
  // dividing every total by a hundred understated a Vietnamese run by two orders of magnitude
  // while the run status card beside it stated the same figure correctly. `toMajorUnits` reads
  // the currency off each Money, which is the fact this function was already being handed.
  const gross = toMajorUnits(run.totals.grossPay)
  const tax = toMajorUnits(run.totals.employeeTaxes)
  const deductions = toMajorUnits(run.totals.employeeDeductions)
  const net = toMajorUnits(run.totals.netPay)

  return [
    { label: 'Gross', value: gross, offset: 0, kind: 'total' },
    { label: 'Tax', value: tax, offset: gross - tax, kind: 'deduction' },
    { label: 'Deductions', value: deductions, offset: gross - tax - deductions, kind: 'deduction' },
    { label: 'Net', value: net, offset: 0, kind: 'total' }
  ]
}

export type DepartmentCost = {
  departmentId: string
  name: string
  code?: string
  employees: number
  cost: Money

  /** Share of total employer cost, 0–100. */
  share: number
}

export const costByDepartment = (
  slips: Payslip[],
  employees: Employee[],
  departments: Department[],
  currency: Money['currency']
): DepartmentCost[] => {
  const byId = new Map(employees.map(e => [e.id, e]))

  // Employer cost, not gross — this is what a department is actually charged.
  const totals = new Map<string, { cost: number; employees: Set<string> }>()

  for (const slip of slips) {
    const employee = byId.get(slip.employeeId)

    if (!employee) continue

    const employerContributions = slip.components
      .filter(c => c.kind === 'employer_contribution')
      .reduce((total, c) => total + c.amount.amount, 0)

    const entry = totals.get(employee.departmentId) ?? { cost: 0, employees: new Set<string>() }

    entry.cost += slip.grossPay.amount + employerContributions
    entry.employees.add(employee.id)
    totals.set(employee.departmentId, entry)
  }

  const grandTotal = [...totals.values()].reduce((t, e) => t + e.cost, 0)

  return departments
    .map(department => {
      const entry = totals.get(department.id)

      return {
        departmentId: department.id,
        name: department.name,
        code: department.code,
        employees: entry?.employees.size ?? 0,
        cost: { amount: entry?.cost ?? 0, currency },
        share: grandTotal === 0 ? 0 : ((entry?.cost ?? 0) / grandTotal) * 100
      }
    })
    .sort((a, b) => b.cost.amount - a.cost.amount)
}

export type OvertimeSummary = {
  hours: number
  cost: Money

  /** Overtime as a share of gross pay, 0–100. */
  shareOfGross: number
}

export const overtimeSummary = (slips: Payslip[], currency: Money['currency']): OvertimeSummary => {
  const hours = slips.reduce((total, s) => total + (s.hoursOvertime ?? 0), 0)
  const cost = componentTotal(slips, 'OT15', currency)

  const gross = sum(
    slips.map(s => s.grossPay),
    currency
  )

  return {
    hours,
    cost,
    shareOfGross: gross.amount === 0 ? 0 : (cost.amount / gross.amount) * 100
  }
}

/** Percentage change from `previous` to `current`, or null when there is nothing to compare. */
export const changeVsPrevious = (current: Money, previous?: Money): number | null => {
  if (!previous || previous.amount === 0) return null

  return ((current.amount - previous.amount) / previous.amount) * 100
}

export const formatChange = (change: number | null): string =>
  change === null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`

export type ExceptionCounts = {
  blocking: number
  error: number
  warning: number
  info: number

  /** Everything not yet resolved, acknowledged or not. */
  open: number

  /** Acknowledged but not resolved — the approver is signing off over these. */
  acknowledged: number
}

/**
 * Status is read off the timestamps, never stored alongside them. Two fields for one fact
 * is how a record ends up 'open' with a resolvedAt.
 */
export const exceptionStatusOf = (exception: PayRunException): PayRunExceptionStatus =>
  exception.resolvedAt ? 'resolved' : exception.acknowledgedAt ? 'acknowledged' : 'open'

export const countExceptions = (exceptions: PayRunException[]): ExceptionCounts => {
  const open = exceptions.filter(e => !e.resolvedAt)

  return {
    blocking: open.filter(e => e.severity === 'blocking').length,
    error: open.filter(e => e.severity === 'error').length,
    warning: open.filter(e => e.severity === 'warning').length,
    info: open.filter(e => e.severity === 'info').length,
    open: open.length,
    acknowledged: open.filter(e => e.acknowledgedAt).length
  }
}

/**
 * Severity -> label, badge colour and sort order, decided once.
 *
 * The dashboard's exception queue and the run workspace's exception list both render severity;
 * when the queue owned its own map the two would have drifted the first time a severity was added.
 * Blocking and error share the destructive tone because both stop the approver; the icon and the
 * word tell them apart, not the colour.
 */
export const EXCEPTION_SEVERITY_LABELS: Record<PayRunExceptionSeverity, string> = {
  blocking: 'Blocker',
  error: 'Error',
  warning: 'Warning',
  info: 'Info'
}

export const EXCEPTION_SEVERITY_STYLES: Record<PayRunExceptionSeverity, string> = {
  blocking: 'bg-destructive/10 text-destructive-strong',
  error: 'bg-destructive/10 text-destructive-strong',
  warning: 'bg-warning/15 text-warning-strong',
  info: 'bg-info/10 text-info-strong'
}

/** Blocking first: an exception list is a to-do, and the things that stop the run belong on top. */
export const EXCEPTION_SEVERITY_ORDER: Record<PayRunExceptionSeverity, number> = {
  blocking: 0,
  error: 1,
  warning: 2,
  info: 3
}

export const EXCEPTION_STATUS_LABELS: Record<PayRunExceptionStatus, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved'
}

export const EXCEPTION_STATUS_STYLES: Record<PayRunExceptionStatus, string> = {
  open: 'bg-muted text-foreground',
  acknowledged: 'bg-info/10 text-info-strong',
  resolved: 'bg-success/15 text-success-strong'
}

/**
 * Display labels for every run status, including the terminal ones that are not stages.
 *
 * Shared rather than per-component: the dashboard shows historical runs, so the status card
 * and the run table both have to render statuses like 'closed'. Two maps drifted apart once
 * already, with the card falling through to the raw 'closed' while the table said 'Closed'.
 */
export const PAY_RUN_STATUS_LABELS: Record<PayRunStatus, string> = {
  draft: 'Draft',
  calculating: 'Calculating',
  calculated: 'Calculated',
  pending_approval: 'Pending approval',
  approved: 'Approved',
  paid: 'Paid',
  closed: 'Closed',
  cancelled: 'Cancelled',
  failed: 'Failed'
}

/**
 * Status -> badge colour. Shared for the same reason the labels are: the status card and the run
 * table both render a status, and when each owned its own mapping they disagreed — the card
 * coloured by whether the run had blocking issues, so a run in Approval with one blocker showed
 * a red badge reading "Approval". A badge reports one fact; the blocking count has its own tile.
 */
export const PAY_RUN_STATUS_STYLES: Record<PayRunStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  calculating: 'bg-muted text-muted-foreground',
  calculated: 'bg-primary/10 text-primary',
  pending_approval: 'bg-warning/15 text-warning-strong',
  approved: 'bg-success/15 text-success-strong',
  paid: 'bg-primary/10 text-primary',
  closed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive-strong',
  failed: 'bg-destructive/10 text-destructive-strong'
}

/**
 * Whole days from `from` to `to`. Both are treated as instants; the caller supplies `from`
 * rather than this reading the clock, so components stay deterministic and testable.
 */
export const daysBetween = (from: string, to: string): number =>
  Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000)
