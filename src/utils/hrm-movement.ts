// Type Imports
import type { EmployeeMovement, MovementDimension, MovementKind } from '@/types/hrm/movement-types'

/**
 * Movement vocabulary and ordering. Decided once here, imported everywhere.
 *
 * The rule this file serves (`afenda-hrm-architecture.yaml` B04): the current Employee record is
 * authoritative and this ledger explains how it came to be what it is. Nothing here computes a
 * present value from the entries — no folding, no replay, no "latest wins" resolution — because a
 * gap in the ledger would then silently produce a wrong answer that looks derived.
 */

export const MOVEMENT_KIND_LABELS: Record<MovementKind, string> = {
  hire: 'Hired',
  promotion: 'Promotion',
  transfer: 'Transfer',
  department_change: 'Department change',
  manager_change: 'Manager change',
  location_change: 'Location change',
  salary_adjustment: 'Salary change',
  status_change: 'Status change',
  disciplinary: 'Disciplinary',
  termination: 'Left'
}

/**
 * Tints, following the same pairing rule the status badges do: a tinted surface takes the
 * `-strong` text token, never the plain one. `globals.css` states this directly, and the plain
 * token reads correctly in dark while failing WCAG AA in light.
 *
 * Most kinds are deliberately neutral. A transfer is not good or bad, and colouring it would use
 * semantic colour for direction — which the doctrine's anti-pattern list forbids. Only the two
 * kinds that genuinely carry weight take a tint.
 */
export const MOVEMENT_KIND_STYLES: Record<MovementKind, string> = {
  hire: 'bg-success/15 text-success-strong',
  promotion: 'bg-info/10 text-info-strong',
  transfer: 'bg-muted text-muted-foreground',
  department_change: 'bg-muted text-muted-foreground',
  manager_change: 'bg-muted text-muted-foreground',
  location_change: 'bg-muted text-muted-foreground',
  salary_adjustment: 'bg-muted text-muted-foreground',
  status_change: 'bg-muted text-muted-foreground',
  disciplinary: 'bg-warning/15 text-warning-strong',
  termination: 'bg-muted text-muted-foreground'
}

export const MOVEMENT_DIMENSION_LABELS: Record<MovementDimension, string> = {
  legal_employer: 'Legal employer',
  branch: 'Branch',
  location: 'Location',
  department: 'Department',
  cost_centre: 'Cost centre',
  position: 'Position',
  manager: 'Manager',
  pay_group: 'Pay group',
  employment_basis: 'Employment basis'
}

/**
 * One person's ledger, newest first.
 *
 * Ties break on `recordedAt`: a promotion and the salary adjustment applied with it share an
 * effective date, and the pair reads wrongly in either arbitrary order.
 */
export const movementsFor = (movements: EmployeeMovement[], employeeId: string): EmployeeMovement[] =>
  movements
    .filter(movement => movement.employeeId === employeeId)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.recordedAt.localeCompare(a.recordedAt))

/**
 * The salary changes on record, oldest first.
 *
 * This is the only honest source of a previous rate. `Compensation.effectiveFrom` is the start of
 * the *currently* effective record and says nothing about what came before it, so a page that
 * wants earlier rates reads them here or states that they are not held.
 */
export const salaryHistoryFor = (movements: EmployeeMovement[], employeeId: string): EmployeeMovement[] =>
  movements
    .filter(movement => movement.employeeId === employeeId && movement.kind === 'salary_adjustment')
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
