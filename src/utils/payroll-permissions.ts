/**
 * Who may do what. One map from Access roles to permissions, read by the server when it builds
 * the actor and by the interface when it decides which controls to show. Deterministic; no clock.
 */

// Type Imports
import type { PayrollActor, PayrollPermission } from '@/types/payroll/permission-types'
import type { AccessRole } from '@/types/payroll/settings-types'

export const PERMISSION_LABELS: Record<PayrollPermission, string> = {
  'payroll.view': 'View runs',
  'payroll.process': 'Edit inputs and recalculate',
  'payroll.review': 'Review and resolve exceptions',
  'payroll.approve': 'Approve',
  'payroll.payment.release': 'Release payments',
  'payroll.payment.reissue': 'Re-issue payments',
  'payroll.settings.manage': 'Edit settings',
  'payroll.report.export': 'Export reports',
  'payroll.audit.view': 'View audit trail'
}

/** The union of every permission the given roles grant, in a stable order. */
export const permissionsForRoles = (roleIds: string[], roles: AccessRole[]): PayrollPermission[] => {
  const granted = new Set<PayrollPermission>()

  for (const role of roles) {
    if (roleIds.includes(role.id)) role.permissions.forEach(permission => granted.add(permission))
  }

  return [...granted]
}

/** Build the actor for a person from the roles that list them as a member. */
export const actorFor = (
  employee: { id: string; firstName: string; lastName: string },
  roles: AccessRole[]
): PayrollActor => {
  const roleIds = roles.filter(role => role.memberIds.includes(employee.id)).map(role => role.id)

  return {
    id: employee.id,
    name: `${employee.firstName} ${employee.lastName}`,
    roleIds,
    permissions: permissionsForRoles(roleIds, roles)
  }
}

export const can = (actor: PayrollActor | null | undefined, permission: PayrollPermission): boolean =>
  !!actor && actor.permissions.includes(permission)

/** The refusal a server action returns when the actor lacks a permission. */
export const permissionRefusal = (permission: PayrollPermission): string =>
  `Your role cannot ${PERMISSION_LABELS[permission].toLowerCase()}. Ask a payroll administrator to change your access.`
