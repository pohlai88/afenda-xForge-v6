// Type Imports
import type { CountryCode, IsoDate, IsoDateTime, Money } from '@/types/common/primitive-types'

/**
 * The HRM domain model.
 *
 * An Employee is deliberately NOT an AppUser. AppUser models a login — role, plan, billing —
 * and answers "what may this account do". Employee models a person's engagement with the
 * company and answers "who works here, under whom, on what terms". Most employees have both,
 * some have only one: a warehouse hire with no system access has no AppUser, and a contractor
 * with a login has no employment record. Collapsing them means bolting salary bands onto a
 * permissions model, and the two never stop fighting.
 */

export type EmploymentStatus = 'onboarding' | 'active' | 'on_leave' | 'notice_period' | 'terminated'

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'temporary'

export type WorkArrangement = 'onsite' | 'hybrid' | 'remote'

export type PayFrequency = 'weekly' | 'biweekly' | 'semi_monthly' | 'monthly'

export type CompensationBasis = 'annual' | 'monthly' | 'hourly'

export type PaymentMethod = 'bank_transfer' | 'cheque' | 'cash'

/**
 * Why someone left. Not cosmetic: every retention metric worth showing splits on it.
 * Voluntary turnover is the headline HR KPI, and mixing in redundancies makes it meaningless.
 */
export type TerminationReason = 'voluntary' | 'involuntary' | 'end_of_contract' | 'retirement'

export interface Department {
  id: string
  name: string

  /** Short code used on reports and payslips, e.g. 'ENG'. */
  code?: string

  /** Self-referential, for org hierarchies. Undefined at the top. */
  parentId?: string

  /** Finance's cost centre, so payroll can roll up spend the way the GL expects. */
  costCenter?: string
  headEmployeeId?: string
}

export interface WorkLocation {
  id: string
  name: string

  /** Display name, e.g. 'Singapore'. For reading; group and compare on `countryCode`. */
  country: string

  /** ISO 3166-1 alpha-2. The key statutory rules and consolidation group by. */
  countryCode: CountryCode

  /** IANA zone, e.g. 'Asia/Singapore'. Drives cut-off times and local holidays. */
  timezone?: string
}

/**
 * A named job, distinct from the person filling it.
 *
 * `Employee.positionTitle` is a free-text string and stays that way: it is what the person's
 * payslip and org listing call them, and it is already seeded. This models the position as a
 * thing the organisation defines, which is what makes a vacancy, a headcount plan or a reporting
 * structure expressible at all.
 *
 * Deliberately minimal. No job grade and no salary band — a grade hierarchy is compensation
 * configuration, it is not seeded here, and a field carrying a concept nothing populates is worse
 * than its absence because every reader has to discover it means nothing.
 */
export interface Position {
  id: string
  title: string

  /** Short code used on reports and structure listings, e.g. 'ENG-SR'. */
  code?: string
  departmentId: string

  /**
   * The legal employer this position belongs to, when it is employer-specific. Undefined for a
   * position the group defines once and every company fills.
   */
  entityId?: string
}

export interface Compensation {
  basis: CompensationBasis

  /** Per the basis: annual salary, monthly salary, or hourly rate. */
  amount: Money

  /**
   * Compensation is a timeline, not a value — raises are effective from a date and payroll
   * must be able to recompute a past period at the rate that applied then. This field is the
   * start of the currently-effective record; history belongs in its own table when we add it.
   */
  effectiveFrom: IsoDate
  payGrade?: string
}

/**
 * Payroll-facing details.
 *
 * Deliberately holds no full bank number and no full tax identifier. This object is read by
 * dashboards and lists, and neither needs the real values — only enough to recognise a record
 * and to flag one that is incomplete. Full credentials belong behind a server boundary with
 * its own access control, never in a client store or seed file.
 */
export interface PayrollProfile {
  payFrequency: PayFrequency
  paymentMethod: PaymentMethod

  /** Last four digits only, for display and for spotting missing bank details. */
  bankAccountLast4?: string

  /** Last four digits only. Absence is what drives the 'missing tax details' exception. */
  taxIdentifierLast4?: string
}

export interface Employee {
  id: string

  /** Human-readable identifier used on payslips and by HR, e.g. 'EMP-0142'. */
  employeeNumber: string

  /** Links to an AppUser when this person has a login. Absent for staff with no system access. */
  userId?: string

  firstName: string
  lastName: string

  /** What they are actually called, when it differs from the legal name on payroll documents. */
  preferredName?: string
  workEmail: string
  personalEmail?: string
  phone?: string
  avatar?: string

  status: EmploymentStatus
  employmentType: EmploymentType

  /**
   * Full-time equivalent, 0–1. Headcount counts people; FTE counts capacity. Two half-time
   * employees are 2 headcount and 1.0 FTE, and cost reporting needs the second number.
   */
  fte: number

  /**
   * The legal employer. Distinct from `locationId`: someone can work in the Kuala Lumpur office
   * while being employed, paid and taxed by the Singapore company. Payroll, statutory liability
   * and consolidation follow the entity; desks and time zones follow the location.
   */
  entityId: string

  departmentId: string
  positionTitle: string

  /** Self-referential. Undefined for whoever sits at the top of the org. */
  managerId?: string
  locationId: string
  workArrangement?: WorkArrangement

  hireDate: IsoDate
  probationEndDate?: IsoDate

  /** Set together with terminationReason when status becomes 'terminated'. */
  terminationDate?: IsoDate
  terminationReason?: TerminationReason

  compensation: Compensation
  payroll: PayrollProfile

  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

/** Shape used by list rows and pickers, where the full record is more than the UI needs. */
export type EmployeeSummary = Pick<
  Employee,
  'id' | 'employeeNumber' | 'firstName' | 'lastName' | 'preferredName' | 'avatar' | 'positionTitle' | 'departmentId'
>
