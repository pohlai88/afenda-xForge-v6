// Type Imports
import type { CountryCode, CurrencyCode, IsoDate, Money } from '@/types/common/primitive-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { PayFrequency } from '@/types/hrm/employee-types'
import type { FxBasis } from '@/types/payroll/group-types'
import type { PayComponentKind } from '@/types/payroll/pay-run-types'
import type { PayrollPermission } from '@/types/payroll/permission-types'

/**
 * Payroll configuration: everything a run reads but does not change. Each section of
 * `/payroll/settings` edits one of these shapes.
 */

/**
 * Settings that belong to the group rather than to any one company.
 *
 * This was previously the single employer: an `entityName`, its registration number, its currency
 * and its time zone. Those are facts about a legal entity, and they moved to `LegalEntity` when
 * there was more than one. What remains here is what the group decides once — how consolidated
 * figures are stated, and which company is the default lens.
 */
export interface PayrollGeneralSettings {
  groupName: string

  /** The entity used when no other is chosen. Consolidated views fall back to it. */
  homeEntityId: string

  /** What consolidated figures are stated in. Runs still calculate in their entity's currency. */
  reportingCurrency: CurrencyCode

  /** Which rate consolidation translates at. A choice, so it is stated wherever it is applied. */
  fxBasis: FxBasis

  /** Address payslips are sent from. */
  payslipSender: string
  rounding: 'nearest_cent' | 'nearest_dollar'
}

export interface PayGroup {
  id: string
  name: string

  /** The legal entity that employs this population. Fixes the currency and the statutory rules. */
  entityId: string

  currency: CurrencyCode
  frequency: PayFrequency

  /** e.g. 'Last working day' or '28th'. Free text because payday rules are messy in practice. */
  paydayRule: string
  cutoffDaysBeforePayday: number
  employeeCount: number
  active: boolean
}

export interface PaySchedule {
  id: string
  payGroupId: string
  label: string
  periodStart: IsoDate
  periodEnd: IsoDate
  cutoff: IsoDate
  payDate: IsoDate
  status: 'closed' | 'open' | 'upcoming'
}

export interface PayComponentDefinition {
  code: string
  label: string
  kind: PayComponentKind
  taxable: boolean

  /** Whether statutory contributions are calculated on it. */
  contributable: boolean
  glAccount: string

  /** Which country uses this component. Undefined means every country, e.g. base pay. */
  countryCode?: CountryCode

  active: boolean
}

export interface StatutoryRule {
  id: string
  name: string

  /** Which country's law this rule belongs to. Rules are not global; CPF is not EPF. */
  countryCode: CountryCode

  /** The currency the ceiling is denominated in, which is the entity's, not the group's. */
  currency: CurrencyCode

  /** The payslip component this rule produces, e.g. 'CPF_EE'. Joins a rule to what it calculates. */
  componentCode: string

  /** The statutory profile this rule was flattened from. */
  profileId: string

  party: 'employee' | 'employer'

  /** Percentage, e.g. 20 for 20%. */
  rate: number

  /** Wage ceiling the rate applies up to. Null means uncapped. */
  ceiling: Money | null
  effectiveFrom: IsoDate
}

export interface GlMapping {
  componentCode: string
  debitAccount: string
  creditAccount: string
  splitByCostCentre: boolean
}

export interface ApprovalSettings {
  /** Access role ids that may sign a run. One vocabulary with `AccessRole.id`, never free text. */
  approverRoles: string[]

  /** Runs above this net total need a second approver. Null disables the threshold. */
  secondApproverAbove: Money | null
  requireWarningsAcknowledged: boolean
  blockOnErrors: boolean
  lockInputsOnApproval: boolean
}

export interface NotificationPreference {
  key: string
  label: string
  description: string
  email: boolean
  inApp: boolean
}

export interface AccessRole {
  id: string
  name: string
  description: string

  /** Employee ids holding the role. Membership is a fact here, not a count someone typed. */
  memberIds: string[]
  permissions: PayrollPermission[]
}

export interface PayrollSettings {
  general: PayrollGeneralSettings

  /** Every company the group runs payroll for. */
  entities: LegalEntity[]

  payGroups: PayGroup[]
  schedules: PaySchedule[]
  components: PayComponentDefinition[]
  statutory: StatutoryRule[]
  accounting: GlMapping[]
  approvals: ApprovalSettings
  notifications: NotificationPreference[]
  access: AccessRole[]
}
