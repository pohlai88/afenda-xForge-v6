/**
 * Pure builders for the payroll run workspace.
 *
 * The page joins a run to its payslips, the previous run's payslips and the employee records
 * once, here, and the components render what they are handed. Everything is deterministic — no
 * clock, no Intl — because these run on the server first and the client must agree with them.
 */

// Type Imports
import type { Money } from '@/types/common/primitive-types'
import type { Department, Employee, PayFrequency, WorkLocation } from '@/types/hrm/employee-types'
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
import { formatDate, formatInstant, formatPeriod } from '@/utils/format-datetime'
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

/**
 * How often a pay group is paid, in the words people use for it. 'biweekly' and 'semi_monthly'
 * are the pair everyone confuses, so both are spelled out rather than title-cased.
 */
export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every two weeks',
  semi_monthly: 'Twice a month',
  monthly: 'Monthly'
}

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
  needs_review: 'bg-warning/15 text-warning-strong',
  blocked: 'bg-destructive/10 text-destructive-strong',
  approved: 'bg-success/15 text-success-strong',
  paid: 'bg-success/15 text-success-strong'
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
  released: 'bg-info/10 text-info-strong',
  processing: 'bg-info/10 text-info-strong',
  paid: 'bg-success/15 text-success-strong',
  returned: 'bg-warning/15 text-warning-strong',
  failed: 'bg-destructive/10 text-destructive-strong',
  action_required: 'bg-destructive/10 text-destructive-strong'
}

/* -------------------------------------------------------------------------------------------- */
/* Formatting                                                                                   */
/* -------------------------------------------------------------------------------------------- */

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

/*
 * Calendar formatting moved to `@/utils/format-datetime` when an audit timeline had to render
 * outside payroll, and is re-exported here so every caller that already reads it from the workspace
 * builders keeps working. One definition, two doors.
 */
export { formatDate, formatInstant, formatPeriod }

/* -------------------------------------------------------------------------------------------- */
/* Rows                                                                                         */
/* -------------------------------------------------------------------------------------------- */

/**
 * Which of a run's exceptions are about one person.
 *
 * An exception names an employee, or names a department and therefore everyone in it. That rule
 * decides a row's status, its badge and its blockers, so it is written once: three surfaces read it
 * — the rows built on the server, the rows re-derived when somebody clears an exception in the
 * browser, and the 360 Query question that asks which people still have one open. Three copies of
 * one predicate is how "open exception" comes to mean two different things.
 */
export const exceptionsForEmployee = (
  exceptions: PayRunException[],
  employee: { id: string; departmentId: string }
): PayRunException[] =>
  exceptions.filter(e => e.employeeId === employee.id || (!e.employeeId && e.departmentId === employee.departmentId))

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

    const exceptions = exceptionsForEmployee(run.exceptions, employee)

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
    const exceptions = exceptionsForEmployee(run.exceptions, { id: row.employeeId, departmentId: row.departmentId })

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

/* -------------------------------------------------------------------------------------------- */
/* Input readiness                                                                              */
/* -------------------------------------------------------------------------------------------- */

export type InputFeedStatus = 'ready' | 'pending' | 'missing'

/**
 * One upstream feed the calculation reads, and whether it is complete for this run. Only feeds
 * the engine actually consumes are listed: a "Leave — ready" line for a feed nothing reads would
 * be a state the domain cannot prove.
 */
export interface InputFeed {
  key: string
  label: string
  source: string
  status: InputFeedStatus

  /** What is complete, or what is missing and for whom. */
  detail: string

  /** How many people the problem concerns, when it is per-person. */
  affected?: number
}

const namesOf = (rows: PayrollRunRow[], limit = 3) => {
  const names = rows.map(row => row.name)

  return names.length <= limit
    ? names.join(', ')
    : `${names.slice(0, limit).join(', ')} and ${names.length - limit} more`
}

/**
 * Run-level readiness: are the inputs the calculation depends on complete? Derived from the
 * same records the per-employee Inputs tab reads, so the two agree by construction.
 */
export const inputReadiness = (run: PayRun, rows: PayrollRunRow[]): InputFeed[] => {
  const noCompensation = rows.filter(row => row.employee.compensation.amount.amount <= 0)
  const noHours = rows.filter(row => !row.payslip.hoursRegular)

  const noBank = rows.filter(
    row => row.employee.payroll.paymentMethod === 'bank_transfer' && !row.employee.payroll.bankAccountLast4
  )

  const noTax = rows.filter(row => !row.employee.payroll.taxIdentifierLast4)
  const overtimeRows = rows.filter(row => (row.payslip.hoursOvertime ?? 0) > 0)
  const overtimeHours = overtimeRows.reduce((total, row) => total + (row.payslip.hoursOvertime ?? 0), 0)
  const pending = run.pendingInputs

  const perPerson = (
    key: string,
    label: string,
    source: string,
    missing: PayrollRunRow[],
    readyDetail: string,
    missingWhat: string
  ): InputFeed => ({
    key,
    label,
    source,
    status: missing.length === 0 ? 'ready' : 'missing',
    detail:
      missing.length === 0
        ? readyDetail
        : `${missing.length} ${missing.length === 1 ? 'employee has' : 'employees have'} ${missingWhat}: ${namesOf(missing)}`,
    affected: missing.length || undefined
  })

  return [
    perPerson(
      'compensation',
      'Compensation',
      'Employment profile',
      noCompensation,
      `Salary on file for all ${rows.length} employees`,
      'no salary on file'
    ),
    perPerson(
      'hours',
      'Regular hours',
      'Timesheet import',
      noHours,
      `Hours received for all ${rows.length} employees`,
      'no timesheet for the period'
    ),
    {
      key: 'overtime',
      label: 'Overtime',
      source: 'Timesheet import',
      status: 'ready',
      detail:
        overtimeRows.length === 0
          ? 'No overtime claimed this period'
          : `${overtimeHours} h across ${overtimeRows.length} ${overtimeRows.length === 1 ? 'employee' : 'employees'}`
    },
    {
      key: 'adjustments',
      label: 'Adjustments',
      source: 'Import inputs',
      status: pending ? 'pending' : 'ready',
      detail: pending
        ? `${pending.count} ${pending.count === 1 ? 'input' : 'inputs'} imported for ${pending.employees} ${pending.employees === 1 ? 'employee' : 'employees'}, not yet calculated`
        : run.lastCalculationDiff
          ? `${run.lastCalculationDiff.inputsApplied} ${run.lastCalculationDiff.inputsApplied === 1 ? 'input' : 'inputs'} applied in calculation #${run.lastCalculationDiff.currentVersion}`
          : 'Nothing imported for this run',
      affected: pending?.employees
    },
    perPerson(
      'bank',
      'Bank details',
      'Employment profile · Banking',
      noBank,
      'Every bank-transfer employee has an account on file',
      'no bank account on file'
    ),
    perPerson(
      'tax',
      'Tax identifiers',
      'Employment profile · Tax',
      noTax,
      `Identifier on file for all ${rows.length} employees`,
      'no tax identifier'
    )
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
    const diff = run.lastCalculationDiff

    events.push({
      id: `${run.id}-calculated`,
      at: run.lastCalculatedAt,
      actor: 'Payroll engine',
      action: `Calculation #${run.calculationVersion} completed`,
      detail:
        diff && diff.currentVersion === run.calculationVersion
          ? `${run.employeeCount} payslips · ${formatMoney(run.totals.netPay)} net · ${diff.affectedEmployees} changed vs #${diff.previousVersion} (net ${formatSignedMoney(diff.netDelta)})`
          : `${run.employeeCount} payslips · ${formatMoney(run.totals.netPay)} net`,
      kind: 'system'
    })
  }

  if (run.pendingInputs) {
    events.push({
      id: `${run.id}-inputs-${run.pendingInputs.importedAt}`,
      at: run.pendingInputs.importedAt,
      actor: nameOf(run.pendingInputs.importedBy),
      action: `Imported ${run.pendingInputs.count} ${run.pendingInputs.count === 1 ? 'input' : 'inputs'}`,
      detail: `${run.pendingInputs.employees} ${run.pendingInputs.employees === 1 ? 'employee' : 'employees'} affected · calculation #${run.calculationVersion} is out of date`,
      kind: 'user'
    })
  }

  if (run.review) {
    const stale = run.review.calculationVersion !== run.calculationVersion
    const findings = run.review.findingsAtReview

    events.push({
      id: `${run.id}-reviewed-${run.review.reviewedAt}`,
      at: run.review.reviewedAt,
      actor: nameOf(run.review.reviewedBy),
      action: `Reviewed calculation #${run.review.calculationVersion}${stale ? ' (superseded)' : ''}`,
      detail:
        [
          findings.blocking > 0 && `${findings.blocking} blocking`,
          findings.error > 0 && `${findings.error} error`,
          findings.warning > 0 && `${findings.warning} warning`
        ]
          .filter(Boolean)
          .join(' · ') || 'No open exceptions at review',
      kind: 'user'
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

/**
 * What the run's latest calculation changed, and what has happened to it since.
 *
 * The question a person actually asks — "what changed since the last calculation?" — has two halves
 * and the record answers both: the stored diff says what that calculation did to the figures, and
 * the run's own history says what has been done to the run afterwards. Both halves are read from
 * timestamps the run already carries; nothing here derives, estimates or explains.
 *
 * The distinction that matters is between *no change* and *no comparison*. A run carries a diff
 * only for the calculation that produced it, so a diff naming an older version proves nothing about
 * the current one — and neither does its absence. In that case this says the comparison is missing
 * rather than reporting a delta of zero, because reporting zero would be an answer the record
 * cannot support.
 */
export const calculationChangeEvents = (run: PayRun, nameOf: (employeeId: string) => string): AuditEvent[] => {
  // Never calculated: there is no calculation to have changed anything, and no instant to file an
  // event under. An empty answer is the truthful one.
  if (!run.lastCalculatedAt) return []

  const calculatedAt = run.lastCalculatedAt
  const diff = run.lastCalculationDiff
  const comparable = diff !== undefined && diff.currentVersion === run.calculationVersion

  const headline: AuditEvent = {
    id: `${run.id}-calculation-${run.calculationVersion}`,
    at: calculatedAt,
    actor: 'Payroll engine',
    action: `Calculation #${run.calculationVersion} completed`,
    detail: comparable
      ? [
          `${diff.affectedEmployees} of ${run.employeeCount} changed against #${diff.previousVersion}`,
          `net ${formatSignedMoney(diff.netDelta)}`,
          `gross ${formatSignedMoney(diff.grossDelta)}`,
          `employer cost ${formatSignedMoney(diff.employerCostDelta)}`,
          diff.inputsApplied > 0
            ? `${diff.inputsApplied} ${diff.inputsApplied === 1 ? 'input' : 'inputs'} applied`
            : null
        ]
          .filter(Boolean)
          .join(' · ')
      : `${run.employeeCount} payslips · ${formatMoney(run.totals.netPay)} net · no stored comparison with an earlier calculation`,
    kind: 'system'
  }

  // One line per figure the diff says moved, named and shown before and after. Not summarised by
  // component: the stored change is per employee, and adding them up would present a figure the
  // record does not hold.
  const changes: AuditEvent[] = comparable
    ? diff.componentChanges.map(change => ({
        id: `${run.id}-change-${change.employeeId}-${change.code}`,
        at: calculatedAt,
        actor: 'Payroll engine',
        action: `${change.label} · ${nameOf(change.employeeId)}`,
        detail: `${formatMoney(change.previous)} → ${formatMoney(change.current)}`,
        kind: 'system' as const
      }))
    : []

  // Anything the run recorded after that calculation ran — inputs that make it stale, exceptions
  // raised or cleared, a review, an approval. Taken from the run's own history rather than
  // re-derived, so there is one account of what happened and this reads a slice of it.
  const since = auditEvents(run, nameOf).filter(event => event.at > calculatedAt)

  return [...since, headline, ...changes]
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
