// Type Imports
import type { CountryCode, IsoDate, Money } from '@/types/common/primitive-types'
import type {
  CompensationBasis,
  EmploymentStatus,
  EmploymentType,
  PayFrequency,
  PaymentMethod,
  WorkArrangement
} from '@/types/hrm/employee-types'

/**
 * View models for H01 — People.
 *
 * Built once on the server by `src/utils/hrm-people.ts` and handed down finished, the same way
 * the payroll queue builds its rows. Components render what they are given; nothing here is
 * derived a second time in a component.
 */

/**
 * What a record is missing, stated as a fact about the record.
 *
 * Deliberately NOT called readiness. Whether a person can actually be paid is a run fact — it
 * depends on the calculation, the open exceptions and the approval policy, none of which HRM
 * holds. `afenda-hrm-architecture.yaml` B07 bans the word from this module for that reason: a
 * column headed "Payroll readiness" would state a conclusion the domain cannot prove.
 */
export type RecordCompleteness = 'complete' | 'bank_missing' | 'tax_missing' | 'bank_and_tax_missing'

/** Why one person appears in the attention band. Each maps to one destination. */
export type PeopleAttentionKind =
  | 'bank_missing'
  | 'tax_missing'
  | 'probation_ending'
  | 'notice_period'
  | 'onboarding_incomplete'

export interface PeopleAttentionItem {
  id: string
  kind: PeopleAttentionKind
  employeeId: string
  employeeName: string
  employeeNumber: string
  entityName: string

  /** What is missing or approaching, in the interface's voice. */
  detail: string

  /**
   * Where this gets resolved. Every attention item names one destination — an item with neither
   * an action nor a destination is information, not attention.
   */
  href: string

  /** Ordering weight. Higher sorts first; decided once in `hrm-people.ts`. */
  weight: number
}

/** One row of the People table. Everything already joined and resolved. */
export interface PeopleRow {
  id: string
  employeeNumber: string
  name: string

  /** What they are actually called, when it differs from the payroll name. */
  preferredName?: string
  avatar?: string
  workEmail: string

  entityId: string
  entityName: string
  countryCode: CountryCode

  departmentId: string
  departmentName: string
  positionTitle: string

  locationId: string
  locationName: string

  managerId?: string

  /** Resolved for display. Absent when the person has no manager on record — never invented. */
  managerName?: string

  status: EmploymentStatus
  employmentType: EmploymentType
  workArrangement?: WorkArrangement
  fte: number

  hireDate: IsoDate
  probationEndDate?: IsoDate
  terminationDate?: IsoDate

  /**
   * The currently-effective rate, in that person's own currency.
   *
   * Never summed with another row's: the population spans three currencies, and a column total
   * stamping one of them onto the sum would look precise and mean nothing.
   */
  compensation: Money
  compensationBasis: CompensationBasis
  compensationEffectiveFrom: IsoDate

  payFrequency: PayFrequency
  paymentMethod: PaymentMethod

  /**
   * Last four digits only, exactly as the record holds them. `PayrollProfile` deliberately stores
   * no full bank number and no full tax identifier — those live behind a server boundary with its
   * own access control — and the last four are what let a reader recognise a record and spot one
   * that is incomplete.
   */
  bankAccountLast4?: string
  taxIdentifierLast4?: string

  completeness: RecordCompleteness

  /** Sort weight for the completeness column. Complete records sort last. */
  completenessRank: number

  /** True when the person has at least one payslip, which is what makes payroll history offerable. */
  hasPayrollHistory: boolean
}

/** The OPERATE band's figures, plus what they do and do not cover. */
export interface PeopleSummary {
  headcount: number

  /**
   * Capacity, not people. Two half-time employees are 2 headcount and 1.0 FTE, and both numbers
   * get stated because cost reporting needs the second one.
   */
  fte: number

  /** How many legal employers the population spans, so the figure's scope is never implied. */
  entityCount: number

  /** Currencies present. More than one is why compensation is not totalled. */
  currencies: string[]

  byStatus: Record<EmploymentStatus, number>
}

/**
 * Joiners and leavers for the month containing `asOfDate`, against the month before it.
 *
 * The boundaries are fixed in the H01 contract rather than left to prose, because two correct
 * implementations of "this month" can otherwise produce different numbers.
 */
export interface WorkforceMovement {
  periodLabel: string
  previousPeriodLabel: string

  joiners: number
  leavers: number
  previousJoiners: number
  previousLeavers: number

  /** Net change over the current period. Direction carries no valence — it is not good or bad. */
  net: number
}
