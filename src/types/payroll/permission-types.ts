/**
 * What a person may do in payroll. Not "login": who may see compensation, who may sign, who may
 * move money. Every server action checks one of these, and the interface hides what the actor
 * cannot do — but the action is the gate, the interface is a courtesy.
 */
export const PAYROLL_PERMISSIONS = [
  'payroll.view',
  'payroll.process',
  'payroll.review',
  'payroll.approve',
  'payroll.payment.release',
  'payroll.payment.reissue',
  'payroll.settings.manage',
  'payroll.report.export',
  'payroll.audit.view'
] as const

export type PayrollPermission = (typeof PAYROLL_PERMISSIONS)[number]

/**
 * Whoever is acting. Assembled server-side from the session and the Access roles; the client
 * receives it as a prop and never constructs one.
 */
export interface PayrollActor {

  /** Employee id, so actions can be stamped with a person the org chart knows. */
  id: string
  name: string

  /** Access role ids, e.g. 'role-payroll-admin'. */
  roleIds: string[]
  permissions: PayrollPermission[]
}
