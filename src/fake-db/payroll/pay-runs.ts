/**
 * ! Seed data for the Payroll module. Swap these exports for real queries when the database
 * ! lands — src/app/server/actions.ts is the only place that reads them.
 *
 * Runs are COMPUTED from the employee seed rather than typed out. Hand-written payroll totals
 * drift from their payslips the moment either is edited, and a dashboard whose gross-to-net
 * bridge does not balance is worse than no dashboard. Deriving them means the two identities
 * in PayRunTotals hold by construction.
 *
 * A run belongs to one legal entity, and the entity decides the currency, the payday rule and
 * which statutory profile the calculation applies. There is no group-level run: consolidation
 * translates and adds finished runs, it does not calculate across them.
 *
 * Everything here is deterministic — no Math.random or Date.now. These modules are imported on
 * both sides of the server/client boundary, and anything that varies between the two renders
 * is a hydration mismatch waiting to happen.
 */

// Type Imports
import type { CurrencyCode, Money } from '@/types/common/primitive-types'
import type { Employee } from '@/types/hrm/employee-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { PayComponent, PayRun, PayRunException, PayRunTotals, Payslip } from '@/types/payroll/pay-run-types'
import type { StatutoryProfile } from '@/types/payroll/statutory-types'

// Data Imports
import { employees } from '@/fake-db/hrm/employees'
import { legalEntities, entityFor } from '@/fake-db/hrm/entities'
import { statutoryProfileFor } from '@/fake-db/payroll/statutory-profiles'

const money = (amount: number, currency: CurrencyCode): Money => ({ amount: Math.round(amount), currency })

const add = (values: Money[], currency: CurrencyCode): Money =>
  money(
    values.reduce((sum, v) => sum + v.amount, 0),
    currency
  )

export type Period = {
  id: string
  reference: string

  /** 'YYYY-MM'. The key every entity's run for the same month shares. */
  key: string

  entityId: string
  currency: CurrencyCode
  payGroup: string
  periodStart: string
  periodEnd: string
  payDate: string
  cutoffAt: string

  /** Index within this entity's own series, used by the deterministic overtime pattern. */
  monthIndex: number
}

const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

/** Singapore's paydays, kept exactly as seeded: the 28th, except June, when it falls on a Sunday. */
const SG_PAY_DAY = [28, 28, 26, 28, 28, 28]

const lastDayOf = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

const iso = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const minusDays = (date: string, days: number) => {
  const at = new Date(`${date}T00:00:00.000Z`)

  at.setUTCDate(at.getUTCDate() - days)

  return at.toISOString().slice(0, 10)
}

/**
 * When each entity pays, and how long before that the inputs close.
 *
 * These differ on purpose. A group whose companies all paid on the same day would never show
 * the thing that makes multi-entity payroll hard: on any given day the entities are at different
 * stages, and "is the group ready" is not one question.
 */
const PAYDAY: Record<string, (year: number, month: number, index: number) => string> = {
  'ent-sg': (year, month, index) => iso(year, month, SG_PAY_DAY[index]),
  'ent-my': (year, month) => iso(year, month, lastDayOf(year, month)),
  'ent-mfg': (year, month) => iso(year, month, lastDayOf(year, month)),
  'ent-vn': (year, month) => (month === 12 ? iso(year + 1, 1, 5) : iso(year, month + 1, 5)),
  'ent-feed': (year, month) => (month === 12 ? iso(year + 1, 1, 5) : iso(year, month + 1, 5))
}

const CUTOFF_DAYS: Record<string, number> = { 'ent-sg': 4, 'ent-my': 5, 'ent-mfg': 5, 'ent-vn': 7, 'ent-feed': 7 }

/**
 * Afenda Feed Vietnam has not calculated September.
 *
 * The run is absent rather than present with zero totals. A zeroed draft would be a claim that
 * the payroll is nil; absence is the truth, which is that nobody has run it yet. Everything
 * downstream reads the missing run as "awaiting data" and excludes the entity from the group
 * figure by name.
 */
const SKIPPED: { entityId: string; key: string }[] = [{ entityId: 'ent-feed', key: '2026-09' }]

const buildPeriods = (): Period[] => {
  const built: Period[] = []

  for (const entity of legalEntities) {
    MONTHS.forEach((key, index) => {
      if (SKIPPED.some(skip => skip.entityId === entity.id && skip.key === key)) return

      const [year, month] = key.split('-').map(Number)
      const payDate = PAYDAY[entity.id](year, month, index)
      const code = entity.code.toLowerCase()

      built.push({
        id: `run-${code}-${key}`,
        reference: `PR-${entity.code}-${key}`,
        key,
        entityId: entity.id,
        currency: entity.currency,
        payGroup: `${entity.code} Monthly`,
        periodStart: iso(year, month, 1),
        periodEnd: iso(year, month, lastDayOf(year, month)),
        payDate,
        cutoffAt: `${minusDays(payDate, CUTOFF_DAYS[entity.id])}T09:00:00.000Z`,
        monthIndex: index
      })
    })
  }

  return built
}

const periods: Period[] = buildPeriods()

/** On the payroll for a period if employed by this entity, hired by the end, and not gone before. */
const isPaidIn = (employee: Employee, period: Period) =>
  employee.entityId === period.entityId &&
  employee.hireDate <= period.periodEnd &&
  (!employee.terminationDate || employee.terminationDate >= period.periodStart)

/**
 * Overtime hours, derived from the employee number and the period index so the same person
 * gets the same hours on every render. Only the departments that actually work shifts.
 */
const overtimeHours = (employee: Employee, period: Period) => {
  if (employee.departmentId !== 'dept-ops' && employee.departmentId !== 'dept-support') return 0

  const seed = Number(employee.employeeNumber.replace('EMP-', ''))

  // The September spike in Singapore Operations is deliberate — it is what the overtime
  // exception flags. Scoped to that entity so the other companies are not made anomalous
  // by a pattern that belongs to one run's story.
  const spike = period.monthIndex === 5 && employee.departmentId === 'dept-ops' && period.entityId === 'ent-sg' ? 9 : 0

  return ((seed * 7 + period.monthIndex * 5) % 7) + spike
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
 *
 * The statutory profile is a parameter rather than a constant, which is the whole reason a
 * Malaysian payslip can show EPF and SOCSO while a Singaporean one shows CPF.
 */
export const calculatePayslip = (
  employee: Employee,
  period: Period,
  profile: StatutoryProfile,
  overrides: PayInputOverride[] = []
): Payslip => {
  const currency = period.currency
  const at = (amount: number) => money(amount, currency)
  const annual = employee.compensation.amount.amount
  const base = Math.round((annual / 12) * employee.fte)
  const otHours = overtimeHours(employee, period)
  const hourlyRate = Math.round(base / profile.monthlyHours)
  const otRate = Math.round(hourlyRate * 1.5)
  const overtime = otHours * otRate

  const components: PayComponent[] = [
    { code: 'BASE', label: 'Base salary', kind: 'earning', amount: at(base), taxable: true }
  ]

  if (overtime > 0) {
    components.push({
      code: 'OT15',
      label: 'Overtime 1.5x',
      kind: 'earning',
      amount: at(overtime),
      taxable: true,
      quantity: otHours,
      rate: at(otRate)
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

  // Each contribution is capped independently: SOCSO and EIS stop at their ceiling while EPF
  // does not, and applying one ceiling to all of them would quietly under-report the uncapped
  // ones on every Malaysian payslip.
  const contributions = profile.contributions.map(rule => {
    const contributable = rule.ceiling ? Math.min(gross, rule.ceiling.amount) : gross

    return { rule, amount: Math.round((contributable * rule.rate) / 100) }
  })

  const employeeContributions = contributions
    .filter(c => c.rule.party === 'employee')
    .reduce((sum, c) => sum + c.amount, 0)

  const tax = Math.round(((gross - employeeContributions) * profile.tax.rate) / 100)
  const net = gross - tax - employeeContributions

  components.push({ code: profile.tax.code, label: profile.tax.label, kind: 'tax', amount: at(tax) })

  for (const { rule, amount } of contributions) {
    components.push({
      code: rule.code,
      label: rule.label,
      kind: rule.party === 'employee' ? 'deduction' : 'employer_contribution',
      amount: at(amount)
    })
  }

  return {
    id: `slip-${period.id}-${employee.id}`,
    payRunId: period.id,
    employeeId: employee.id,
    status: period.monthIndex === MONTHS.length - 1 ? 'draft' : 'paid',
    components,
    grossPay: at(gross),
    netPay: at(net),
    hoursRegular: Math.round(profile.monthlyHours * employee.fte),
    hoursOvertime: otHours || undefined
  }
}

/**
 * The period a run belongs to, with the statutory profile that priced it.
 *
 * Matches an id or a reference, because `getPayRun` accepts either and a recalculation that
 * silently found nothing would leave the run untouched while reporting success.
 */
export const periodForRun = (runIdOrReference: string) => {
  const period = periods.find(p => p.id === runIdOrReference || p.reference === runIdOrReference)

  if (!period) return undefined

  return { period, profile: statutoryProfileFor(entityFor(period.entityId)) }
}

export const periodsForEntity = (entityId: string) => periods.filter(period => period.entityId === entityId)

/**
 * Totals from payslips, summed by component KIND rather than by hard-coded codes.
 *
 * The previous version added up 'TAX', 'CPF_EE' and 'CPF_ER' by name, which silently returned
 * zero deductions for every country that does not call them that. The kind is the thing the
 * totals actually mean.
 */
export const totalsFor = (slips: Payslip[], currency: CurrencyCode): PayRunTotals => {
  const ofKind = (kind: PayComponent['kind']) =>
    add(
      slips.flatMap(s => s.components.filter(c => c.kind === kind).map(c => c.amount)),
      currency
    )

  const grossPay = add(
    slips.map(s => s.grossPay),
    currency
  )

  const employeeTaxes = ofKind('tax')
  const employeeDeductions = ofKind('deduction')
  const employerContributions = ofKind('employer_contribution')

  return {
    grossPay,
    employeeTaxes,
    employeeDeductions,
    netPay: money(grossPay.amount - employeeTaxes.amount - employeeDeductions.amount, currency),
    employerContributions,
    employerCost: money(grossPay.amount + employerContributions.amount, currency)
  }
}

const sgd = (amount: number): Money => money(amount, 'SGD')
const myr = (amount: number): Money => money(amount, 'MYR')

/**
 * Exceptions on the open runs. Earlier runs closed clean.
 *
 * Owners are the people who would actually clear each one: missing HR data goes to People,
 * calculation questions to Finance, spend questions to the department head.
 */
const sgOpenExceptions: PayRunException[] = [
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

/** Manufacturing cannot advance: one of its line operators has no account to pay into. */
const mfgOpenExceptions: PayRunException[] = [
  {
    id: 'exc-mfg-001',
    kind: 'missing_bank_details',
    severity: 'blocking',
    employeeId: 'emp-063',
    title: 'No bank account on file',
    message: 'Aiman Zainal has no bank account on file — payment cannot be issued',
    rule: 'Every employee paid by bank transfer must have a verified account before approval',
    source: 'Employment profile · Banking',
    ownerId: 'emp-023',
    detectedAt: '2026-09-20T01:10:00.000Z'
  },
  {
    id: 'exc-mfg-002',
    kind: 'overtime_spike',
    severity: 'warning',
    departmentId: 'dept-ops',
    title: 'Plant overtime above plan',
    message: 'Johor Bahru overtime is 1.8x its six-month average',
    rule: 'Department overtime above 2x its trailing six-month average is flagged for review',
    source: 'Timesheet import · 20 Sep',
    impact: myr(184000),
    previousValue: '212 hours',
    currentValue: '381 hours',
    ownerId: 'emp-015',
    detectedAt: '2026-09-20T01:10:00.000Z'
  }
]

/** Vietnam is in review with one acknowledged warning — reviewed, not merely untouched. */
const vnOpenExceptions: PayRunException[] = [
  {
    id: 'exc-vn-001',
    kind: 'missing_tax_details',
    severity: 'warning',
    employeeId: 'emp-093',
    title: 'Tax identifier missing',
    message: 'Anh Ngo is missing a tax identifier — withholding defaulted to standard rate',
    rule: 'Withholding uses the standard rate when no tax identifier is on file',
    source: 'Employment profile · Tax',
    previousValue: 'Personal rate',
    currentValue: 'Standard rate (10%)',
    ownerId: 'emp-023',
    detectedAt: '2026-09-16T02:00:00.000Z',
    acknowledgedAt: '2026-09-19T04:15:00.000Z',
    acknowledgedBy: 'emp-020'
  }
]

const exceptionsByRun: Record<string, PayRunException[]> = {
  'run-sg-2026-09': sgOpenExceptions,
  'run-mfg-2026-09': mfgOpenExceptions,
  'run-vn-2026-09': vnOpenExceptions
}

/**
 * Where each entity stands on the open month.
 *
 * Chosen so the group surface has every state it must be able to prove: one approved and ready,
 * two that cannot advance, one under review, and one that has not calculated at all. Two blocked
 * entities is not a shortfall — Singapore's blocker was already in the seed, and a run that
 * cannot advance is blocked whatever has been signed on it.
 */
type OpenState = { status: PayRun['status']; calculationVersion: number; reviewed: boolean; approved: boolean }

const OPEN_STATE: Record<string, OpenState> = {
  'ent-sg': { status: 'pending_approval', calculationVersion: 8, reviewed: true, approved: false },
  'ent-my': { status: 'approved', calculationVersion: 3, reviewed: true, approved: true },
  'ent-mfg': { status: 'calculated', calculationVersion: 2, reviewed: false, approved: false },
  'ent-vn': { status: 'pending_approval', calculationVersion: 3, reviewed: true, approved: false }
}

const profileByEntity = new Map<string, StatutoryProfile>(
  legalEntities.map((entity: LegalEntity) => [entity.id, statutoryProfileFor(entity)])
)

const allPayslips: Payslip[] = periods.flatMap(period =>
  employees
    .filter(e => isPaidIn(e, period))
    .map(e => calculatePayslip(e, period, profileByEntity.get(period.entityId)!))
)

export const payslips = allPayslips

export const payRuns: PayRun[] = periods.map(period => {
  const slips = allPayslips.filter(s => s.payRunId === period.id)
  const isOpen = period.monthIndex === MONTHS.length - 1
  const open = OPEN_STATE[period.entityId]
  const exceptions = isOpen ? (exceptionsByRun[period.id] ?? []) : []
  const version = isOpen && open ? open.calculationVersion : 3

  const findings = {
    blocking: exceptions.filter(e => e.severity === 'blocking' && !e.resolvedAt).length,
    error: exceptions.filter(e => e.severity === 'error' && !e.resolvedAt).length,
    warning: exceptions.filter(e => e.severity === 'warning' && !e.resolvedAt).length
  }

  const reviewed = isOpen ? Boolean(open?.reviewed) : true
  const approved = isOpen ? Boolean(open?.approved) : true

  return {
    id: period.id,
    reference: period.reference,
    entityId: period.entityId,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    payDate: period.payDate,
    cutoffAt: period.cutoffAt,
    frequency: 'monthly' as const,
    status: isOpen && open ? open.status : ('closed' as const),
    payGroup: period.payGroup,

    // Closed runs settled on their third calculation; an open one has been re-run each time an
    // exception was cleared or a timesheet landed.
    calculationVersion: version,
    lastCalculatedAt: isOpen ? '2026-09-20T01:00:00.000Z' : period.cutoffAt,
    currency: period.currency,
    employeeCount: slips.length,
    totals: totalsFor(slips, period.currency),
    exceptions,
    approvals: approved
      ? [
          {
            approvedBy: 'emp-020',
            approvedAt: `${period.payDate}T02:00:00.000Z`,
            note: 'Reviewed and approved'
          }
        ]
      : [],

    // A run in Pending approval has, by definition, been reviewed: the payroll specialist signed
    // off a specific calculation, which is what the approver now reads. A run in Calculated has
    // not, and the interface must not imply otherwise.
    review: reviewed
      ? {
          calculationVersion: version,
          reviewedBy: 'emp-022',
          reviewedAt: isOpen ? '2026-09-20T02:10:00.000Z' : `${period.payDate}T00:30:00.000Z`,
          findingsAtReview: findings,
          acknowledgedWarnings: exceptions.filter(e => e.severity === 'warning' && e.acknowledgedAt).length,
          note:
            isOpen && period.entityId === 'ent-sg'
              ? 'Overtime spike in Operations checked against timesheets.'
              : undefined
        }
      : undefined,
    createdAt: `${period.periodStart}T00:30:00.000Z`,
    createdBy: 'emp-022',
    updatedAt: `${period.payDate}T02:00:00.000Z`
  }
})

export const runsForEntity = (entityId: string) => payRuns.filter(run => run.entityId === entityId)

/** The run currently being worked on for an entity — what that entity's overview opens to. */
export const latestRunFor = (entityId: string) => {
  const own = runsForEntity(entityId)

  return own[own.length - 1]
}

/** The home entity's open run, which is what the single-entity screens still default to. */
export const currentPayRun = latestRunFor('ent-sg')
