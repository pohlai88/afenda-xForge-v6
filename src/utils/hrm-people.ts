// Type Imports
import type {
  Employee,
  EmploymentStatus,
  EmploymentType,
  PayFrequency,
  PaymentMethod,
  WorkArrangement
} from '@/types/hrm/employee-types'
import type { Department, WorkLocation } from '@/types/hrm/employee-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type {
  PeopleAttentionItem,
  PeopleAttentionKind,
  PeopleRow,
  PeopleSummary,
  RecordCompleteness,
  WorkforceMovement
} from '@/types/hrm/people-types'

// Util Imports
import { formatDate } from '@/utils/format-datetime'

/**
 * H01's derivations. Pure, server-side, and the only place any of these words or ranks is
 * decided — a component renders a status, it does not re-decide what the status is called or
 * what colour it takes.
 */

/* -------------------------------------------------------------------------------------------- */
/* Vocabularies                                                                                 */
/* -------------------------------------------------------------------------------------------- */

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  onboarding: 'Onboarding',
  active: 'Active',
  on_leave: 'On leave',
  notice_period: 'Notice period',
  terminated: 'Left'
}

/**
 * Soft tints of semantic tokens, never palette colours and never a `chart-*` token — those are a
 * categorical set for chart series, and borrowing one for a status put two different severities
 * at the same colour in dark mode once already.
 *
 * The text token is always the `-strong` variant, never the plain one. `globals.css` states the
 * pairing directly — a tinted surface keeps `--warning` and the text takes `--warning-strong` —
 * and getting it wrong is invisible in dark mode and fails WCAG AA in light: `text-warning` on
 * `bg-warning/15` measured 1.88:1 against a required 4.5:1 before this was corrected.
 *
 * `notice_period` and `onboarding` differ deliberately: notice is a temporary state somebody is
 * watching, onboarding is merely in progress, and `info` says "in flight" without implying that
 * anybody needs to act.
 */
export const EMPLOYMENT_STATUS_STYLES: Record<EmploymentStatus, string> = {
  onboarding: 'bg-info/10 text-info-strong',
  active: 'bg-success/15 text-success-strong',
  on_leave: 'bg-muted text-muted-foreground',
  notice_period: 'bg-warning/15 text-warning-strong',
  terminated: 'bg-muted text-muted-foreground'
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  intern: 'Intern',
  temporary: 'Temporary'
}

export const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  onsite: 'Onsite',
  hybrid: 'Hybrid',
  remote: 'Remote'
}

/**
 * How and how often somebody is paid.
 *
 * These describe the employee record, which HRM owns, so they live here and `payroll-workspace`
 * re-exports `PAY_FREQUENCY_LABELS` rather than keeping a second copy. Two maps for one concept is
 * the drift this repo has already been bitten by — the run status labels lived in two maps that
 * agreed until they didn't, and a finished run rendered a lowercase "closed".
 */
export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every two weeks',
  semi_monthly: 'Twice a month',
  monthly: 'Monthly'
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
  cash: 'Cash'
}

/**
 * What the record is missing. Not what payroll can do about it.
 *
 * The distinction is the module's central domain-truth rule (`afenda-hrm-architecture.yaml` B07):
 * "Bank detail missing" is a fact about the record and HRM can prove it. "Cannot be paid" is a
 * conclusion about a run, which depends on the calculation, the open exceptions and the approval
 * policy — none of which this module holds.
 */
export const RECORD_COMPLETENESS_LABELS: Record<RecordCompleteness, string> = {
  complete: 'Complete',
  bank_missing: 'Bank detail missing',
  tax_missing: 'Tax detail missing',
  bank_and_tax_missing: 'Bank and tax details missing'
}

export const RECORD_COMPLETENESS_STYLES: Record<RecordCompleteness, string> = {
  complete: 'bg-success/15 text-success-strong',
  bank_missing: 'bg-warning/15 text-warning-strong',
  tax_missing: 'bg-warning/15 text-warning-strong',
  bank_and_tax_missing: 'bg-warning/15 text-warning-strong'
}

/** Higher sorts to the top, so incomplete records surface first. Complete records sort last. */
const COMPLETENESS_RANK: Record<RecordCompleteness, number> = {
  bank_and_tax_missing: 3,
  bank_missing: 2,
  tax_missing: 1,
  complete: 0
}

/* -------------------------------------------------------------------------------------------- */
/* Derivations                                                                                  */
/* -------------------------------------------------------------------------------------------- */

/**
 * A bank detail is only expected of someone actually paid by transfer. Flagging a cash-paid
 * employee for a missing account would report a gap that is not one — the same test the payroll
 * workspace applies for its own run-scoped purposes.
 */
const recordCompletenessOf = (employee: Employee): RecordCompleteness => {
  const bankMissing = employee.payroll.paymentMethod === 'bank_transfer' && !employee.payroll.bankAccountLast4
  const taxMissing = !employee.payroll.taxIdentifierLast4

  if (bankMissing && taxMissing) return 'bank_and_tax_missing'
  if (bankMissing) return 'bank_missing'
  if (taxMissing) return 'tax_missing'

  return 'complete'
}

export const employeeName = (employee: Pick<Employee, 'firstName' | 'lastName'>) =>
  `${employee.firstName} ${employee.lastName}`

type BuildInput = {
  employees: Employee[]
  entities: LegalEntity[]
  departments: Department[]
  locations: WorkLocation[]

  /** Employee ids with at least one payslip. Decides whether payroll history is offerable. */
  employeesWithPayroll: Set<string>
}

/**
 * Join once, on the server, and hand finished rows down.
 *
 * A manager who is not in the employee list resolves to undefined rather than to their id: a row
 * showing 'emp-014' where a name belongs reads as a bug, and claiming a reporting line the data
 * cannot resolve is worse than showing none.
 */
export const buildPeopleRows = ({
  employees,
  entities,
  departments,
  locations,
  employeesWithPayroll
}: BuildInput): PeopleRow[] => {
  const entityById = new Map(entities.map(entity => [entity.id, entity]))
  const departmentById = new Map(departments.map(department => [department.id, department]))
  const locationById = new Map(locations.map(location => [location.id, location]))
  const nameById = new Map(employees.map(employee => [employee.id, employeeName(employee)]))

  return employees.map(employee => {
    const entity = entityById.get(employee.entityId)

    // An employee whose legal employer does not resolve is not a row with a missing label — it is
    // a record that cannot be reasoned about. The employer fixes the currency the salary is
    // denominated in, the statutory rules that apply, and whose payroll the person is on. Default
    // any of that and a Vietnamese employee files under Singapore: the page renders, the figures
    // add up, and the grouping is wrong in a way nobody has reason to check. Failing is cheaper.
    if (!entity) {
      throw new Error(`employee ${employee.employeeNumber} references unknown legal entity ${employee.entityId}`)
    }

    const completeness = recordCompletenessOf(employee)

    return {
      id: employee.id,
      employeeNumber: employee.employeeNumber,
      name: employeeName(employee),
      preferredName: employee.preferredName,
      avatar: employee.avatar,
      workEmail: employee.workEmail,

      entityId: employee.entityId,
      entityName: entity.name,
      countryCode: entity.countryCode,

      departmentId: employee.departmentId,

      // Falls back to the id, unlike the employer above. A department or a location that does not
      // resolve is a labelling gap: it does not change the currency, the statutory rules or whose
      // payroll the person is on, so the row is still worth showing. Showing the raw id makes the
      // gap visible to whoever is reading, which a friendly placeholder would not.
      departmentName: departmentById.get(employee.departmentId)?.name ?? employee.departmentId,
      positionTitle: employee.positionTitle,

      locationId: employee.locationId,
      locationName: locationById.get(employee.locationId)?.name ?? employee.locationId,

      managerId: employee.managerId,
      managerName: employee.managerId ? nameById.get(employee.managerId) : undefined,

      status: employee.status,
      employmentType: employee.employmentType,
      workArrangement: employee.workArrangement,
      fte: employee.fte,

      hireDate: employee.hireDate,
      probationEndDate: employee.probationEndDate,
      terminationDate: employee.terminationDate,

      compensation: employee.compensation.amount,
      compensationBasis: employee.compensation.basis,
      compensationEffectiveFrom: employee.compensation.effectiveFrom,

      payFrequency: employee.payroll.payFrequency,
      paymentMethod: employee.payroll.paymentMethod,
      bankAccountLast4: employee.payroll.bankAccountLast4,
      taxIdentifierLast4: employee.payroll.taxIdentifierLast4,

      completeness,
      completenessRank: COMPLETENESS_RANK[completeness],

      hasPayrollHistory: employeesWithPayroll.has(employee.id)
    }
  })
}

/**
 * The OPERATE band's figures.
 *
 * Headcount excludes leavers; FTE sums the same population. Both are reported because they are
 * different measures — two half-time employees are 2 headcount and 1.0 FTE — and a surface that
 * shows one and labels it the other is stating something untrue.
 *
 * `currencies` exists so the table can refuse to total compensation rather than stamping one
 * currency onto a sum of three.
 */
export const peopleSummary = (rows: PeopleRow[]): PeopleSummary => {
  const present = rows.filter(row => row.status !== 'terminated')

  const byStatus = {} as Record<EmploymentStatus, number>

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1
  }

  return {
    headcount: present.length,

    // Rounded to one decimal at the edge of the calculation, not in a component: 0.1 + 0.2 in
    // binary floating point is 0.30000000000000004, and an FTE reading 41.900000000000006 has
    // already told the reader the arithmetic is not to be trusted.
    fte: Math.round(present.reduce((sum, row) => sum + row.fte, 0) * 10) / 10,
    entityCount: new Set(present.map(row => row.entityId)).size,
    currencies: [...new Set(present.map(row => row.compensation.currency))].sort(),
    byStatus
  }
}

/** Whole days from `from` to `to`. Both are calendar dates, so UTC midnight is exact. */
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)

const ATTENTION_LABELS: Record<PeopleAttentionKind, string> = {
  bank_missing: 'No bank account on file',
  tax_missing: 'No tax identifier on file',
  probation_ending: 'Probation ends soon',
  notice_period: 'Working notice',
  onboarding_incomplete: 'Onboarding not complete'
}

/**
 * Ranked, and every item carries a destination.
 *
 * The P02 rule this follows: an item that names neither an action nor a destination is
 * information, not attention, and belongs in a different band or nowhere. Missing details rank
 * above dated events because they are unresolved facts rather than approaching ones.
 */
export const peopleAttention = (rows: PeopleRow[], asOfDate: string, limit = 6): PeopleAttentionItem[] => {
  const items: PeopleAttentionItem[] = []

  const push = (row: PeopleRow, kind: PeopleAttentionKind, detail: string, weight: number) => {
    items.push({
      id: `${row.id}-${kind}`,
      kind,
      employeeId: row.id,
      employeeName: row.name,
      employeeNumber: row.employeeNumber,
      entityName: row.entityName,
      detail,
      href: `/hrm/people/${row.id}`,
      weight
    })
  }

  for (const row of rows) {
    // A leaver's missing tax identifier is not work anybody is going to do. Attention is for
    // records somebody still has to act on.
    if (row.status === 'terminated') continue

    if (row.completeness === 'bank_and_tax_missing') {
      push(row, 'bank_missing', 'No bank account and no tax identifier on file', 100)
    } else if (row.completeness === 'bank_missing') {
      push(row, 'bank_missing', ATTENTION_LABELS.bank_missing, 90)
    } else if (row.completeness === 'tax_missing') {
      push(row, 'tax_missing', ATTENTION_LABELS.tax_missing, 80)
    }

    if (row.status === 'notice_period') {
      push(row, 'notice_period', row.terminationDate ? `Leaves ${formatDate(row.terminationDate)}` : 'Working notice', 70)
    }

    if (row.status === 'onboarding') {
      push(row, 'onboarding_incomplete', `Joined ${formatDate(row.hireDate)}`, 60)
    }

    // Only where the date is actually recorded. The seed sets probationEndDate sparsely, and an
    // absent date means the item is absent — never assumed from the hire date.
    if (row.probationEndDate && row.probationEndDate >= asOfDate && daysBetween(asOfDate, row.probationEndDate) <= 30) {
      push(row, 'probation_ending', `Probation ends ${formatDate(row.probationEndDate)}`, 50)
    }
  }

  return items.sort((a, b) => b.weight - a.weight || a.employeeName.localeCompare(b.employeeName)).slice(0, limit)
}


const MONTHS = [
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

/** '2026-09' -> 'September 2026'. Hand-rolled for the same reason the date helpers are. */
const monthLabel = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-')

  return `${MONTHS[Number(month) - 1]} ${year}`
}

/** '2026-09' -> '2026-08'. */
const previousMonth = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-').map(Number)

  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`
}

/**
 * Joiners and leavers for the month containing `asOfDate`, against the month before it.
 *
 * The boundaries are the H01 contract's, fixed there rather than left to prose: two correct
 * readings of "this month" otherwise produce two different numbers, and neither is wrong.
 *
 * `net` carries no valence. A workforce shrinking is not a failure and growing is not a success,
 * so the direction is stated and never coloured — doctrine forbids using success and error
 * colours for neutral direction.
 */
export const workforceMovement = (rows: PeopleRow[], asOfDate: string): WorkforceMovement => {
  const current = asOfDate.slice(0, 7)
  const previous = previousMonth(current)

  const joinersIn = (month: string) => rows.filter(row => row.hireDate.slice(0, 7) === month).length
  const leaversIn = (month: string) => rows.filter(row => row.terminationDate?.slice(0, 7) === month).length

  const joiners = joinersIn(current)
  const leavers = leaversIn(current)

  return {
    periodLabel: monthLabel(current),
    previousPeriodLabel: monthLabel(previous),
    joiners,
    leavers,
    previousJoiners: joinersIn(previous),
    previousLeavers: leaversIn(previous),
    net: joiners - leavers
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Export                                                                                       */
/* -------------------------------------------------------------------------------------------- */

const csvCell = (value: string | number) => {
  const text = String(value)

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * An export produces a file, not a state change, which is why it is offered in a read-only
 * release at all. Compensation is written as amount and currency in separate columns rather than
 * formatted, so a spreadsheet can total one company's column without parsing a symbol back off.
 */
export const peopleToCsv = (rows: PeopleRow[]): string => {
  const header = [
    'Employee number',
    'Name',
    'Company',
    'Department',
    'Position',
    'Location',
    'Status',
    'Employment type',
    'FTE',
    'Compensation',
    'Currency',
    'Basis',
    'Hired',
    'Record'
  ]

  const body = rows.map(row =>
    [
      row.employeeNumber,
      row.name,
      row.entityName,
      row.departmentName,
      row.positionTitle,
      row.locationName,
      EMPLOYMENT_STATUS_LABELS[row.status],
      EMPLOYMENT_TYPE_LABELS[row.employmentType],
      row.fte,
      row.compensation.amount / 100,
      row.compensation.currency,
      row.compensationBasis,
      row.hireDate,
      RECORD_COMPLETENESS_LABELS[row.completeness]
    ]
      .map(csvCell)
      .join(',')
  )

  return [header.join(','), ...body].join('\n')
}
