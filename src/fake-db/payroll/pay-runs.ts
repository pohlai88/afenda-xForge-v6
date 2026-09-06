/**
 * ! Seed data for the Payroll module. Swap these exports for real queries when the database
 * ! lands — src/app/server/actions.ts is the only place that reads them.
 *
 * Runs are COMPUTED from the employee seed rather than typed out. Hand-written payroll totals
 * drift from their payslips the moment either is edited, and a dashboard whose gross-to-net
 * bridge does not balance is worse than no dashboard. Deriving them means the two identities
 * in PayRunTotals hold by construction.
 *
 * Everything here is deterministic — no Math.random or Date.now. These modules are imported on
 * both sides of the server/client boundary, and anything that varies between the two renders
 * is a hydration mismatch waiting to happen.
 */

// Type Imports
import type { Money } from '@/types/common/primitive-types'
import type { Employee } from '@/types/hrm/employee-types'
import type { PayComponent, PayRun, PayRunException, PayRunTotals, Payslip } from '@/types/payroll/pay-run-types'

// Data Imports
import { employees } from '@/fake-db/hrm/employees'

const CURRENCY = 'SGD' as const

/** Ordinary-wage ceiling that statutory contributions are capped at, in minor units. */
const CONTRIBUTION_CEILING = 680000
const EMPLOYEE_RATE = 0.2
const EMPLOYER_RATE = 0.17
const TAX_RATE = 0.15
const MONTHLY_HOURS = 176

const sgd = (amount: number): Money => ({ amount: Math.round(amount), currency: CURRENCY })

const add = (...values: Money[]): Money => sgd(values.reduce((sum, v) => sum + v.amount, 0))

type Period = {
  id: string
  reference: string
  periodStart: string
  periodEnd: string
  payDate: string
  cutoffAt: string
}

// Six months to Sept 2026. The last one is still open; the rest are paid and closed.
const periods: Period[] = [
  {
    id: 'run-2026-04',
    reference: 'PR-2026-04',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    payDate: '2026-04-28',
    cutoffAt: '2026-04-24T09:00:00.000Z'
  },
  {
    id: 'run-2026-05',
    reference: 'PR-2026-05',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    payDate: '2026-05-28',
    cutoffAt: '2026-05-25T09:00:00.000Z'
  },
  {
    id: 'run-2026-06',
    reference: 'PR-2026-06',
    periodStart: '2026-06-01',
    periodEnd: '2026-06-30',
    payDate: '2026-06-26',
    cutoffAt: '2026-06-24T09:00:00.000Z'
  },
  {
    id: 'run-2026-07',
    reference: 'PR-2026-07',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    payDate: '2026-07-28',
    cutoffAt: '2026-07-24T09:00:00.000Z'
  },
  {
    id: 'run-2026-08',
    reference: 'PR-2026-08',
    periodStart: '2026-08-01',
    periodEnd: '2026-08-31',
    payDate: '2026-08-28',
    cutoffAt: '2026-08-25T09:00:00.000Z'
  },
  {
    id: 'run-2026-09',
    reference: 'PR-2026-09',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    payDate: '2026-09-28',
    cutoffAt: '2026-09-24T09:00:00.000Z'
  }
]

/** On the payroll for a period if hired by the end of it and not gone before it started. */
const isPaidIn = (employee: Employee, period: Period) =>
  employee.hireDate <= period.periodEnd && (!employee.terminationDate || employee.terminationDate >= period.periodStart)

/**
 * Overtime hours, derived from the employee number and the period index so the same person
 * gets the same hours on every render. Only the departments that actually work shifts.
 */
const overtimeHours = (employee: Employee, periodIndex: number) => {
  if (employee.departmentId !== 'dept-ops' && employee.departmentId !== 'dept-support') return 0

  const seed = Number(employee.employeeNumber.replace('EMP-', ''))

  // The September spike in Operations is deliberate — it is what the overtime exception flags.
  const spike = periodIndex === 5 && employee.departmentId === 'dept-ops' ? 9 : 0

  return ((seed * 7 + periodIndex * 5) % 7) + spike
}

/** Earnings an import may add or override, with the label the payslip shows for each. */
const EARNING_LABELS: Record<string, string> = {
  BASE: 'Base salary',
  OT15: 'Overtime 1.5x',
  SHIFT: 'Shift allowance',
  BONUS: 'Bonus'
}

/** One imported figure for one person: replaces the engine's own value for that component. */
export type PayInputOverride = { code: string; amount: Money }

/**
 * The calculation, in one place. The seed calls it to build every payslip at load; the
 * recalculation action calls it again with imported overrides so "Calculation #9" is a real
 * calculation over real inputs rather than a version number moving on its own.
 */
export const calculatePayslip = (
  employee: Employee,
  period: Period,
  periodIndex: number,
  overrides: PayInputOverride[] = []
): Payslip => {
  const annual = employee.compensation.amount.amount
  const base = Math.round((annual / 12) * employee.fte)
  const otHours = overtimeHours(employee, periodIndex)
  const hourlyRate = Math.round(base / MONTHLY_HOURS)
  const otRate = Math.round(hourlyRate * 1.5)
  const overtime = otHours * otRate

  const components: PayComponent[] = [
    { code: 'BASE', label: 'Base salary', kind: 'earning', amount: sgd(base), taxable: true }
  ]

  if (overtime > 0) {
    components.push({
      code: 'OT15',
      label: 'Overtime 1.5x',
      kind: 'earning',
      amount: sgd(overtime),
      taxable: true,
      quantity: otHours,
      rate: sgd(otRate)
    })
  }

  // Imported earnings win over the engine's own figure for the same code. A quantity and rate
  // no longer describe an amount someone typed, so they are dropped rather than left to lie.
  for (const override of overrides) {
    const label = EARNING_LABELS[override.code]

    if (!label) continue

    const existing = components.findIndex(c => c.code === override.code)

    const component: PayComponent = {
      code: override.code,
      label,
      kind: 'earning',
      amount: override.amount,
      taxable: true
    }

    if (existing === -1) components.push(component)
    else components[existing] = component
  }

  const gross = components.reduce((sum, c) => sum + c.amount.amount, 0)
  const contributable = Math.min(gross, CONTRIBUTION_CEILING)
  const cpfEmployee = Math.round(contributable * EMPLOYEE_RATE)
  const cpfEmployer = Math.round(contributable * EMPLOYER_RATE)
  const tax = Math.round((gross - cpfEmployee) * TAX_RATE)
  const net = gross - tax - cpfEmployee

  components.push(
    { code: 'TAX', label: 'Income tax', kind: 'tax', amount: sgd(tax) },
    { code: 'CPF_EE', label: 'CPF (employee)', kind: 'deduction', amount: sgd(cpfEmployee) },
    { code: 'CPF_ER', label: 'CPF (employer)', kind: 'employer_contribution', amount: sgd(cpfEmployer) }
  )

  return {
    id: `slip-${period.id}-${employee.id}`,
    payRunId: period.id,
    employeeId: employee.id,
    status: periodIndex === periods.length - 1 ? 'draft' : 'paid',
    components,
    grossPay: sgd(gross),
    netPay: sgd(net),
    hoursRegular: Math.round(MONTHLY_HOURS * employee.fte),
    hoursOvertime: otHours || undefined
  }
}

/** The period a run id belongs to, with its index, for recalculating that run's payslips. */
export const periodForRun = (runId: string) => {
  const index = periods.findIndex(period => period.id === runId)

  return index === -1 ? undefined : { period: periods[index], index }
}

const sumComponent = (slips: Payslip[], code: string): Money =>
  add(...slips.flatMap(s => s.components.filter(c => c.code === code).map(c => c.amount)))

export const totalsFor = (slips: Payslip[]): PayRunTotals => {
  const grossPay = add(...slips.map(s => s.grossPay))
  const employeeTaxes = sumComponent(slips, 'TAX')
  const employeeDeductions = sumComponent(slips, 'CPF_EE')
  const employerContributions = sumComponent(slips, 'CPF_ER')

  return {
    grossPay,
    employeeTaxes,
    employeeDeductions,
    netPay: sgd(grossPay.amount - employeeTaxes.amount - employeeDeductions.amount),
    employerContributions,
    employerCost: sgd(grossPay.amount + employerContributions.amount)
  }
}

/**
 * Exceptions on the open run. Earlier runs closed clean.
 *
 * Owners are the people who would actually clear each one: missing HR data goes to People,
 * calculation questions to Finance, spend questions to the department head.
 */
const openRunExceptions: PayRunException[] = [
  {
    id: 'exc-001',
    kind: 'missing_bank_details',
    severity: 'blocking',
    employeeId: 'emp-013',
    title: 'No bank account on file',
    message: 'Yuki Tanaka has no bank account on file — payment cannot be issued',
    rule: 'Every employee paid by bank transfer must have a verified account before approval',
    source: 'Employment profile · Banking',
    ownerId: 'emp-023',
    detectedAt: '2026-09-02T02:15:00.000Z'
  },
  {
    id: 'exc-002',
    kind: 'missing_tax_details',
    severity: 'warning',
    employeeId: 'emp-022',
    title: 'Tax identifier missing',
    message: 'Samuel Adeyemi is missing a tax identifier — withholding defaulted to standard rate',
    rule: 'Withholding uses the standard rate when no tax identifier is on file',
    source: 'Employment profile · Tax',
    impact: sgd(0),
    previousValue: 'Personal rate',
    currentValue: 'Standard rate (15%)',
    ownerId: 'emp-023',
    detectedAt: '2026-09-02T02:15:00.000Z',
    acknowledgedAt: '2026-09-10T03:20:00.000Z',
    acknowledgedBy: 'emp-020'
  },
  {
    id: 'exc-006',
    kind: 'overtime_spike',
    severity: 'error',
    employeeId: 'emp-017',
    title: 'Overtime above statutory cap',
    message: 'Farah Aziz has 14 overtime hours this period against a 12-hour monthly cap for her grade',
    rule: 'Overtime for grade G3 is capped at 12 hours per month unless an exemption is on file',
    source: 'Timesheet import · 18 Sep',
    impact: sgd(2 * 4600),
    previousValue: '5 hours',
    currentValue: '14 hours',
    ownerId: 'emp-016',
    detectedAt: '2026-09-18T01:00:00.000Z'
  },
  {
    id: 'exc-003',
    kind: 'overtime_spike',
    severity: 'warning',
    departmentId: 'dept-ops',
    title: 'Operations overtime spike',
    message: 'Operations overtime is 2.4x its six-month average',
    rule: 'Department overtime above 2x its trailing six-month average is flagged for review',
    source: 'Timesheet import · 18 Sep',
    impact: sgd(412600),
    previousValue: '38 hours',
    currentValue: '91 hours',
    ownerId: 'emp-015',
    detectedAt: '2026-09-18T01:00:00.000Z'
  },
  {
    id: 'exc-004',
    kind: 'budget_variance',
    severity: 'warning',
    departmentId: 'dept-sales',
    title: 'Sales over payroll budget',
    message: 'Sales is 8.2% over its monthly payroll budget',
    rule: 'Department employer cost more than 5% over budget is flagged for review',
    source: 'Budget · FY2026',
    impact: sgd(682000),
    previousValue: 'Budget S$83,200.00',
    currentValue: 'Actual S$90,020.00',
    ownerId: 'emp-009',
    detectedAt: '2026-09-18T01:00:00.000Z'
  },
  {
    id: 'exc-005',
    kind: 'manual_adjustment',
    severity: 'info',
    employeeId: 'emp-018',
    title: 'Manual adjustment',
    message: 'Bram de Vries — SGD 420.00 shift allowance added manually',
    rule: 'Any hand-entered component is recorded for the approver to see',
    source: 'Payroll input · Manual',
    impact: sgd(42000),
    ownerId: 'emp-022',
    detectedAt: '2026-09-15T06:40:00.000Z',
    resolvedAt: '2026-09-15T07:02:00.000Z',
    resolvedBy: 'emp-022'
  }
]

const allPayslips: Payslip[] = periods.flatMap((period, index) =>
  employees.filter(e => isPaidIn(e, period)).map(e => calculatePayslip(e, period, index))
)

export const payslips = allPayslips

export const payRuns: PayRun[] = periods.map((period, index) => {
  const slips = allPayslips.filter(s => s.payRunId === period.id)
  const isOpen = index === periods.length - 1

  return {
    ...period,
    frequency: 'monthly' as const,
    status: isOpen ? ('pending_approval' as const) : ('closed' as const),
    payGroup: 'SG Monthly',

    // Closed runs settled on their third calculation; the open one has been re-run each time an
    // exception was cleared or a timesheet landed.
    calculationVersion: isOpen ? 8 : 3,
    lastCalculatedAt: isOpen ? '2026-09-18T01:00:00.000Z' : `${period.cutoffAt}`,
    currency: CURRENCY,
    employeeCount: slips.length,
    totals: totalsFor(slips),
    exceptions: isOpen ? openRunExceptions : [],
    approvals: isOpen
      ? []
      : [{ approvedBy: 'emp-020', approvedAt: `${period.payDate}T02:00:00.000Z`, note: 'Reviewed and approved' }],

    // A run in Pending approval has, by definition, been reviewed: the payroll specialist signed
    // off calculation #8 with the blocker still open, which is what the approver now reads.
    // Closed runs were reviewed on their final calculation the morning they were approved.
    review: isOpen
      ? {
          calculationVersion: 8,
          reviewedBy: 'emp-022',
          reviewedAt: '2026-09-18T02:10:00.000Z',
          findingsAtReview: {
            blocking: openRunExceptions.filter(e => e.severity === 'blocking' && !e.resolvedAt).length,
            error: openRunExceptions.filter(e => e.severity === 'error' && !e.resolvedAt).length,
            warning: openRunExceptions.filter(e => e.severity === 'warning' && !e.resolvedAt).length
          },
          acknowledgedWarnings: openRunExceptions.filter(e => e.severity === 'warning' && e.acknowledgedAt).length,
          note: 'Overtime spike in Operations checked against timesheets.'
        }
      : {
          calculationVersion: 3,
          reviewedBy: 'emp-022',
          reviewedAt: `${period.payDate}T00:30:00.000Z`,
          findingsAtReview: { blocking: 0, error: 0, warning: 0 },
          acknowledgedWarnings: 0
        },
    createdAt: `${period.periodStart}T00:30:00.000Z`,
    createdBy: 'emp-022',
    updatedAt: `${period.payDate}T02:00:00.000Z`
  }
})

/** The run currently being worked on — what the dashboard opens to. */
export const currentPayRun = payRuns[payRuns.length - 1]
