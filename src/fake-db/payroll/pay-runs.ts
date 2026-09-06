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

const buildPayslip = (employee: Employee, period: Period, periodIndex: number): Payslip => {
  const annual = employee.compensation.amount.amount
  const base = Math.round((annual / 12) * employee.fte)
  const otHours = overtimeHours(employee, periodIndex)
  const hourlyRate = Math.round(base / MONTHLY_HOURS)
  const otRate = Math.round(hourlyRate * 1.5)
  const overtime = otHours * otRate

  const gross = base + overtime
  const contributable = Math.min(gross, CONTRIBUTION_CEILING)
  const cpfEmployee = Math.round(contributable * EMPLOYEE_RATE)
  const cpfEmployer = Math.round(contributable * EMPLOYER_RATE)
  const tax = Math.round((gross - cpfEmployee) * TAX_RATE)
  const net = gross - tax - cpfEmployee

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

const sumComponent = (slips: Payslip[], code: string): Money =>
  add(...slips.flatMap(s => s.components.filter(c => c.code === code).map(c => c.amount)))

const totalsFor = (slips: Payslip[]): PayRunTotals => {
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

/** Exceptions on the open run. Earlier runs closed clean. */
const openRunExceptions: PayRunException[] = [
  {
    id: 'exc-001',
    kind: 'missing_bank_details',
    severity: 'blocking',
    employeeId: 'emp-013',
    message: 'Yuki Tanaka has no bank account on file — payment cannot be issued',
    detectedAt: '2026-09-02T02:15:00.000Z'
  },
  {
    id: 'exc-002',
    kind: 'missing_tax_details',
    severity: 'warning',
    employeeId: 'emp-022',
    message: 'Samuel Adeyemi is missing a tax identifier — withholding defaulted to standard rate',
    detectedAt: '2026-09-02T02:15:00.000Z'
  },
  {
    id: 'exc-003',
    kind: 'overtime_spike',
    severity: 'warning',
    departmentId: 'dept-ops',
    message: 'Operations overtime is 2.4x its six-month average',
    detectedAt: '2026-09-18T01:00:00.000Z'
  },
  {
    id: 'exc-004',
    kind: 'budget_variance',
    severity: 'warning',
    departmentId: 'dept-sales',
    message: 'Sales is 8.2% over its monthly payroll budget',
    detectedAt: '2026-09-18T01:00:00.000Z'
  },
  {
    id: 'exc-005',
    kind: 'manual_adjustment',
    severity: 'info',
    employeeId: 'emp-018',
    message: 'Bram de Vries — SGD 420.00 shift allowance added manually',
    detectedAt: '2026-09-15T06:40:00.000Z',
    resolvedAt: '2026-09-15T07:02:00.000Z',
    resolvedBy: 'emp-022'
  }
]

const allPayslips: Payslip[] = periods.flatMap((period, index) =>
  employees.filter(e => isPaidIn(e, period)).map(e => buildPayslip(e, period, index))
)

export const payslips = allPayslips

export const payRuns: PayRun[] = periods.map((period, index) => {
  const slips = allPayslips.filter(s => s.payRunId === period.id)
  const isOpen = index === periods.length - 1

  return {
    ...period,
    frequency: 'monthly' as const,
    status: isOpen ? ('pending_approval' as const) : ('closed' as const),
    currency: CURRENCY,
    employeeCount: slips.length,
    totals: totalsFor(slips),
    exceptions: isOpen ? openRunExceptions : [],
    approvals: isOpen
      ? []
      : [{ approvedBy: 'emp-020', approvedAt: `${period.payDate}T02:00:00.000Z`, note: 'Reviewed and approved' }],
    createdAt: `${period.periodStart}T00:30:00.000Z`,
    createdBy: 'emp-022',
    updatedAt: `${period.payDate}T02:00:00.000Z`
  }
})

/** The run currently being worked on — what the dashboard opens to. */
export const currentPayRun = payRuns[payRuns.length - 1]
