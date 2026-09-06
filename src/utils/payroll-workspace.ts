/**
 * Pure builders for the payroll run workspace.
 *
 * The page joins a run to its payslips, the previous run's payslips and the employee records
 * once, here, and the components render what they are handed. Everything is deterministic — no
 * clock, no Intl — because these run on the server first and the client must agree with them.
 */

// Type Imports
import type { Money } from '@/types/common/primitive-types'
import type { Department, Employee, WorkLocation } from '@/types/hrm/employee-types'
import type { PayRun, PayRunException, PayRunStatus, Payslip } from '@/types/payroll/pay-run-types'
import type {
  AuditEvent,
  EmployeePaymentStatus,
  EmployeePayrollStatus,
  PayVarianceLine,
  PayrollInput,
  PayrollRunRow,
  PayrollStage,
  ReconciliationCount,
  ReconciliationLine,
  SourceTraceEntry
} from '@/types/payroll/run-workspace-types'
import { PAYROLL_STAGES } from '@/types/payroll/run-workspace-types'

// Util Imports
import { formatMoney } from '@/utils/money'
import { exceptionStatusOf } from '@/utils/payroll-metrics'

/* -------------------------------------------------------------------------------------------- */
/* Lifecycle                                                                                    */
/* -------------------------------------------------------------------------------------------- */

export const PAYROLL_STAGE_LABELS: Record<PayrollStage, string> = {
  inputs: 'Inputs',
  calculate: 'Calculate',
  review: 'Review',
  approve: 'Approve',
  pay: 'Pay',
  close: 'Close'
}

/**
 * Which stage a run status sits at. Everything before the returned index is done, the index
 * itself is current, everything after is not started. `closed` is past the end: every stage done.
 *
 * The terminal exits (cancelled, failed) are not on this path at all; callers branch on those
 * before drawing a stage bar.
 */
export const stageIndexForStatus = (status: PayRunStatus): number => {
  switch (status) {
    case 'draft':
      return 0
    case 'calculating':
      return 1
    case 'calculated':
      return 2
    case 'pending_approval':
      return 3
    case 'approved':
      return 4
    case 'paid':
      return 5
    case 'closed':
      return PAYROLL_STAGES.length
    default:
      return 0
  }
}

/** True once a run has moved past the point where inputs may still change. */
export const isLocked = (status: PayRunStatus) => status === 'approved' || status === 'paid' || status === 'closed'

/* -------------------------------------------------------------------------------------------- */
/* Per-employee status vocabularies                                                             */
/* -------------------------------------------------------------------------------------------- */

export const EMPLOYEE_PAYROLL_STATUS_LABELS: Record<EmployeePayrollStatus, string> = {
  calculated: 'Calculated',
  needs_review: 'Needs review',
  blocked: 'Blocked',
  approved: 'Approved',
  paid: 'Paid'
}

export const EMPLOYEE_PAYROLL_STATUS_STYLES: Record<EmployeePayrollStatus, string> = {
  calculated: 'bg-muted text-foreground',
  needs_review: 'bg-warning/15 text-warning',
  blocked: 'bg-destructive/10 text-destructive',
  approved: 'bg-success/15 text-success',
  paid: 'bg-success/15 text-success'
}

export const PAYMENT_STATUS_LABELS: Record<EmployeePaymentStatus, string> = {
  ready: 'Ready',
  released: 'Released',
  processing: 'Processing',
  paid: 'Paid',
  returned: 'Returned',
  failed: 'Failed',
  action_required: 'Action required'
}

export const PAYMENT_STATUS_STYLES: Record<EmployeePaymentStatus, string> = {
  ready: 'bg-muted text-foreground',
  released: 'bg-info/10 text-info',
  processing: 'bg-info/10 text-info',
  paid: 'bg-success/15 text-success',
  returned: 'bg-warning/15 text-warning',
  failed: 'bg-destructive/10 text-destructive',
  action_required: 'bg-destructive/10 text-destructive'
}

/* -------------------------------------------------------------------------------------------- */
/* Formatting                                                                                   */
/* -------------------------------------------------------------------------------------------- */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

/** 'Yuki Tanaka' -> 'YT'. */
export const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map(part => part[0] ?? '')
    .join('')
    .toUpperCase()

/** '+S$932.00' / '-S$103.00' / 'S$0.00'. The sign is the message, so it is never dropped. */
export const formatSignedMoney = (money: Money): string => {
  if (money.amount === 0) return formatMoney(money)

  return money.amount > 0 ? `+${formatMoney(money)}` : formatMoney(money)
}

export const formatSignedPercent = (value: number | null, digits = 1): string =>
  value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`

/** '2026-09-18T01:00:00.000Z' -> '18 Sep 2026, 01:00 UTC'. Hand-rolled for the same reason money is. */
export const formatInstant = (iso: string): string => {
  const [date, time] = iso.split('T')
  const [year, month, day] = date.split('-')

  return `${Number(day)} ${MONTHS_SHORT[Number(month) - 1]} ${year}, ${time.slice(0, 5)} UTC`
}

/** '2026-09-30' -> '30 Sep 2026'. */
export const formatDate = (iso: string): string => {
  const [year, month, day] = iso.split('-')

  return `${Number(day)} ${MONTHS_SHORT[Number(month) - 1]} ${year}`
}

/** '2026-09-01' + '2026-09-30' -> 'September 2026' when the period is a calendar month. */
export const formatPeriod = (start: string, end: string): string => {
  const [year, month] = start.split('-')
  const endMonth = end.split('-')[1]

  return month === endMonth ? `${MONTHS_LONG[Number(month) - 1]} ${year}` : `${formatDate(start)} – ${formatDate(end)}`
}

/* -------------------------------------------------------------------------------------------- */
/* Rows                                                                                         */
/* -------------------------------------------------------------------------------------------- */

const employeePayrollStatus = (run: PayRun, openBlockers: number, openWarnings: number): EmployeePayrollStatus => {
  if (run.status === 'paid' || run.status === 'closed') return 'paid'
  if (run.status === 'approved') return 'approved'
  if (openBlockers > 0) return 'blocked'
  if (openWarnings > 0) return 'needs_review'

  return 'calculated'
}

const employeePaymentStatus = (
  run: PayRun,
  employee: Employee,
  exceptions: PayRunException[]
): EmployeePaymentStatus => {
  if (exceptions.some(e => e.kind === 'failed_payment' && !e.resolvedAt)) return 'failed'
  if (run.status === 'paid' || run.status === 'closed') return 'paid'

  if (employee.payroll.paymentMethod === 'bank_transfer' && !employee.payroll.bankAccountLast4) {
    return 'action_required'
  }

  if (run.status === 'approved') return 'released'

  return 'ready'
}

type RowSources = {
  run: PayRun
  slips: Payslip[]
  previousSlips: Payslip[]
  employees: Employee[]
  departments: Department[]
  locations: WorkLocation[]
}

// Blocked people first, then by name. The table lets the user re-sort; this is the order that
// makes the first screen useful.
const PAYROLL_STATUS_ORDER: Record<EmployeePayrollStatus, number> = {
  blocked: 0,
  needs_review: 1,
  calculated: 2,
  approved: 3,
  paid: 4
}

/**
 * One row per payslip on the run, joined to its employee and to the same person's payslip on the
 * previous run. Exceptions about a department are attached to every employee in it: a Sales
 * budget overrun is something the approver should see against each Sales payslip, not only in a
 * run-level list they may never open.
 */
export const buildRunRows = ({ run, slips, previousSlips, employees, departments, locations }: RowSources) => {
  const employeeById = new Map(employees.map(e => [e.id, e]))
  const departmentById = new Map(departments.map(d => [d.id, d]))
  const locationById = new Map(locations.map(l => [l.id, l]))
  const previousByEmployee = new Map(previousSlips.map(s => [s.employeeId, s]))

  const rows: PayrollRunRow[] = []

  for (const slip of slips) {
    const employee = employeeById.get(slip.employeeId)

    if (!employee) continue

    const exceptions = run.exceptions.filter(
      e => e.employeeId === employee.id || (!e.employeeId && e.departmentId === employee.departmentId)
    )

    const open = exceptions.filter(e => !e.resolvedAt)
    const openBlockers = open.filter(e => e.severity === 'blocking').length
    const openWarnings = open.filter(e => e.severity === 'error' || e.severity === 'warning').length
    const previous = previousByEmployee.get(employee.id)

    const variance: Money | null = previous
      ? { amount: slip.netPay.amount - previous.netPay.amount, currency: run.currency }
      : null

    rows.push({
      employeeId: employee.id,
      employeeNumber: employee.employeeNumber,
      name: `${employee.firstName} ${employee.lastName}`,
      avatar: employee.avatar,
      positionTitle: employee.positionTitle,
      departmentId: employee.departmentId,
      departmentName: departmentById.get(employee.departmentId)?.name ?? employee.departmentId,
      locationId: employee.locationId,
      locationName: locationById.get(employee.locationId)?.name ?? employee.locationId,
      gross: slip.grossPay,
      net: slip.netPay,
      previousNet: previous?.netPay,
      variance,
      variancePercent:
        variance && previous && previous.netPay.amount !== 0 ? (variance.amount / previous.netPay.amount) * 100 : null,
      payrollStatus: employeePayrollStatus(run, openBlockers, openWarnings),
      paymentStatus: employeePaymentStatus(run, employee, exceptions),
      exceptions,
      openBlockers,
      openWarnings,
      payslip: slip,
      previousPayslip: previous,
      employee
    })
  }

  return rows.sort(
    (a, b) =>
      PAYROLL_STATUS_ORDER[a.payrollStatus] - PAYROLL_STATUS_ORDER[b.payrollStatus] || a.name.localeCompare(b.name)
  )
}

/**
 * Re-derive the exception-dependent fields of every row from the run's current exceptions.
 *
 * The rows are built once on the server; when someone acknowledges or resolves an exception in
 * the browser, the run's exception list changes and the per-employee status, counts and payment
 * state have to follow. This keeps that derivation in one place instead of inlined in the view.
 */
export const refreshRows = (rows: PayrollRunRow[], run: PayRun): PayrollRunRow[] =>
  rows.map(row => {
    const exceptions = run.exceptions.filter(
      e => e.employeeId === row.employeeId || (!e.employeeId && e.departmentId === row.departmentId)
    )

    const open = exceptions.filter(e => !e.resolvedAt)
    const openBlockers = open.filter(e => e.severity === 'blocking').length
    const openWarnings = open.filter(e => e.severity === 'error' || e.severity === 'warning').length

    return {
      ...row,
      exceptions,
      openBlockers,
      openWarnings,
      payrollStatus: employeePayrollStatus(run, openBlockers, openWarnings),
      paymentStatus: employeePaymentStatus(run, row.employee, exceptions)
    }
  })

/* -------------------------------------------------------------------------------------------- */
/* Variance                                                                                     */
/* -------------------------------------------------------------------------------------------- */

const directionOf = (kind: Payslip['components'][number]['kind']): PayVarianceLine['direction'] =>
  kind === 'earning' ? 'earning' : kind === 'employer_contribution' ? 'employer' : 'deduction'

/**
 * Component-by-component explanation of why net pay moved. Lines are ordered so that the reader
 * follows the payslip: earnings, then what came off, then what the employer paid on top.
 */
export const payVariance = (
  current: Payslip,
  previous: Payslip | undefined,
  currency: Money['currency']
): PayVarianceLine[] => {
  const directionOrder: Record<PayVarianceLine['direction'], number> = { earning: 0, deduction: 1, employer: 2 }
  const zero: Money = { amount: 0, currency }
  const lines = new Map<string, PayVarianceLine>()

  for (const component of current.components) {
    lines.set(component.code, {
      code: component.code,
      label: component.label,
      previous: zero,
      current: component.amount,
      delta: component.amount,
      direction: directionOf(component.kind)
    })
  }

  for (const component of previous?.components ?? []) {
    const line = lines.get(component.code)

    if (line) {
      line.previous = component.amount
      line.delta = { amount: line.current.amount - component.amount.amount, currency }
    } else {
      lines.set(component.code, {
        code: component.code,
        label: component.label,
        previous: component.amount,
        current: zero,
        delta: { amount: -component.amount.amount, currency },
        direction: directionOf(component.kind)
      })
    }
  }

  return [...lines.values()].sort((a, b) => directionOrder[a.direction] - directionOrder[b.direction])
}

/* -------------------------------------------------------------------------------------------- */
/* Inputs and source trace                                                                      */
/* -------------------------------------------------------------------------------------------- */

const BASIS_LABELS: Record<Employee['compensation']['basis'], string> = {
  annual: 'per year',
  monthly: 'per month',
  hourly: 'per hour'
}

/**
 * What the calculation read for this person. The seed has no separate inputs table, so these are
 * read off the employee record and the payslip — which is also where a real engine would read them.
 */
export const payrollInputs = (row: PayrollRunRow): PayrollInput[] => {
  const { employee, payslip, previousPayslip } = row
  const previousOvertime = previousPayslip?.hoursOvertime ?? 0
  const currentOvertime = payslip.hoursOvertime ?? 0

  return [
    {
      label: 'Compensation',
      value: `${formatMoney(employee.compensation.amount)} ${BASIS_LABELS[employee.compensation.basis]}`,
      source: 'Employment profile · Compensation',
      effectiveFrom: employee.compensation.effectiveFrom,
      status: 'ok'
    },
    {
      label: 'Full-time equivalent',
      value: employee.fte.toFixed(2),
      source: 'Employment profile · Contract',
      status: 'ok'
    },
    {
      label: 'Regular hours',
      value: `${payslip.hoursRegular ?? 0} h`,
      source: 'Timesheet import',
      status: 'ok'
    },
    {
      label: 'Overtime hours',
      value: `${currentOvertime} h`,
      source: 'Timesheet import',
      status: previousPayslip && currentOvertime !== previousOvertime ? 'changed' : 'ok'
    },
    {
      label: 'Bank account',
      value: employee.payroll.bankAccountLast4 ? `···· ${employee.payroll.bankAccountLast4}` : 'Not on file',
      source: 'Employment profile · Banking',
      status: employee.payroll.bankAccountLast4 ? 'ok' : 'missing'
    },
    {
      label: 'Tax identifier',
      value: employee.payroll.taxIdentifierLast4 ? `···· ${employee.payroll.taxIdentifierLast4}` : 'Not on file',
      source: 'Employment profile · Tax',
      status: employee.payroll.taxIdentifierLast4 ? 'ok' : 'missing'
    }
  ]
}

const COMPONENT_RULES: Record<string, { source: string; rule: string }> = {
  BASE: { source: 'Employment profile · Compensation', rule: 'Annual salary ÷ 12 × FTE' },
  OT15: { source: 'Timesheet import', rule: 'Overtime hours × hourly rate × 1.5' },
  TAX: { source: 'Statutory · Income tax', rule: '15% of (gross − employee CPF)' },
  CPF_EE: { source: 'Statutory · CPF', rule: '20% of ordinary wages, capped at S$6,800' },
  CPF_ER: { source: 'Statutory · CPF', rule: '17% of ordinary wages, capped at S$6,800' }
}

export const sourceTrace = (row: PayrollRunRow, run: PayRun): SourceTraceEntry[] =>
  row.payslip.components.map(component => {
    const known = COMPONENT_RULES[component.code]

    return {
      code: component.code,
      label: component.label,
      amount: component.amount,
      source: known?.source ?? 'Payroll input · Manual',
      rule: known?.rule ?? 'Entered by hand',
      calculatedAt: run.lastCalculatedAt ?? run.updatedAt
    }
  })

/* -------------------------------------------------------------------------------------------- */
/* Audit                                                                                        */
/* -------------------------------------------------------------------------------------------- */

/**
 * Run-level history, newest first. Assembled from the timestamps the run already carries: when
 * a real audit table lands this becomes a query, and the shape it returns should be this one.
 */
export const auditEvents = (run: PayRun, nameOf: (employeeId: string) => string): AuditEvent[] => {
  const events: AuditEvent[] = [
    {
      id: `${run.id}-created`,
      at: run.createdAt,
      actor: nameOf(run.createdBy),
      action: 'Opened the run',
      detail: `${run.payGroup} · ${formatDate(run.periodStart)} to ${formatDate(run.periodEnd)}`,
      kind: 'user'
    }
  ]

  for (const exception of run.exceptions) {
    events.push({
      id: `${exception.id}-detected`,
      at: exception.detectedAt,
      actor: 'Payroll engine',
      action: `Raised ${exception.title.toLowerCase()}`,
      detail: exception.message,
      kind: 'exception'
    })

    if (exception.acknowledgedAt) {
      events.push({
        id: `${exception.id}-acknowledged`,
        at: exception.acknowledgedAt,
        actor: exception.acknowledgedBy ? nameOf(exception.acknowledgedBy) : 'Unknown',
        action: `Acknowledged ${exception.title.toLowerCase()}`,
        kind: 'user'
      })
    }

    if (exception.resolvedAt) {
      events.push({
        id: `${exception.id}-resolved`,
        at: exception.resolvedAt,
        actor: exception.resolvedBy ? nameOf(exception.resolvedBy) : 'Unknown',
        action: `Resolved ${exception.title.toLowerCase()}`,
        kind: 'user'
      })
    }
  }

  if (run.lastCalculatedAt) {
    events.push({
      id: `${run.id}-calculated`,
      at: run.lastCalculatedAt,
      actor: 'Payroll engine',
      action: `Calculation #${run.calculationVersion} completed`,
      detail: `${run.employeeCount} payslips · ${formatMoney(run.totals.netPay)} net`,
      kind: 'system'
    })
  }

  for (const approval of run.approvals) {
    events.push({
      id: `${run.id}-approved-${approval.approvedAt}`,
      at: approval.approvedAt,
      actor: nameOf(approval.approvedBy),
      action: 'Approved the run',
      detail: approval.note,
      kind: 'approval'
    })
  }

  return events.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
}

/* -------------------------------------------------------------------------------------------- */
/* Reconciliation                                                                               */
/* -------------------------------------------------------------------------------------------- */

export const reconciliationLines = (run: PayRun, previous: PayRun | undefined): ReconciliationLine[] => {
  const line = (
    key: string,
    label: string,
    pick: (totals: PayRun['totals']) => Money,
    drillDown?: ReconciliationLine['drillDown']
  ): ReconciliationLine => ({
    key,
    label,
    current: pick(run.totals),
    previous: previous ? pick(previous.totals) : null,
    drillDown
  })

  return [
    line('gross', 'Gross pay', t => t.grossPay, { sortBy: 'gross', desc: true }),
    line('employeeStatutory', 'Employee statutory', t => t.employeeDeductions),
    line('tax', 'Income tax', t => t.employeeTaxes),
    line('net', 'Net pay', t => t.netPay, { sortBy: 'net', desc: true }),
    line('employerStatutory', 'Employer statutory', t => t.employerContributions),
    line('employerCost', 'Employer cost', t => t.employerCost)
  ]
}

export const reconciliationHeadcount = (run: PayRun, previous: PayRun | undefined): ReconciliationCount => ({
  current: run.employeeCount,
  previous: previous?.employeeCount ?? null
})

/**
 * Who moved the most. Used by the reconciliation to point at the people behind a run-level
 * variance instead of leaving the number unexplained.
 */
export const largestMovers = (rows: PayrollRunRow[], limit = 5) =>
  rows
    .filter(row => row.variance !== null)
    .sort((a, b) => Math.abs(b.variance!.amount) - Math.abs(a.variance!.amount))
    .slice(0, limit)

export const newJoiners = (rows: PayrollRunRow[]) => rows.filter(row => row.variance === null)

/** Exceptions sorted the way a to-do list should be: unresolved before resolved, then severity. */
export const sortExceptions = (exceptions: PayRunException[], order: Record<string, number>) =>
  [...exceptions].sort((a, b) => {
    const resolvedA = exceptionStatusOf(a) === 'resolved' ? 1 : 0
    const resolvedB = exceptionStatusOf(b) === 'resolved' ? 1 : 0

    return resolvedA - resolvedB || order[a.severity] - order[b.severity] || (a.detectedAt < b.detectedAt ? -1 : 1)
  })
