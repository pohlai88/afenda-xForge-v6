// Type Imports
import type { CurrencyCode, IsoDate, Money } from '@/types/common/primitive-types'
import type { PayFrequency } from '@/types/hrm/employee-types'
import type { PayComponentKind } from '@/types/payroll/pay-run-types'
import type { PayrollPermission } from '@/types/payroll/permission-types'

/**
 * Payroll configuration: everything a run reads but does not change. Each section of
 * `/payroll/settings` edits one of these shapes.
 */

export interface PayrollGeneralSettings {
  entityName: string
  registrationNumber: string
  defaultCurrency: CurrencyCode

  /** IANA zone the cut-off and payday are evaluated in. */
  timezone: string

  /** Address payslips are sent from. */
  payslipSender: string
  rounding: 'nearest_cent' | 'nearest_dollar'
}

export interface PayGroup {
  id: string
  name: string
  entity: string
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
  active: boolean
}

export interface StatutoryRule {
  id: string
  name: string
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
  payGroups: PayGroup[]
  schedules: PaySchedule[]
  components: PayComponentDefinition[]
  statutory: StatutoryRule[]
  accounting: GlMapping[]
  approvals: ApprovalSettings
  notifications: NotificationPreference[]
  access: AccessRole[]
}
