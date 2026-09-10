// Type Imports
import type { IsoDate, IsoDateTime, Money } from '@/types/common/primitive-types'

/**
 * Effective-dated employment movement.
 *
 * The architecture rule this file exists to hold (`afenda-hrm-architecture.yaml` B04): the current
 * `Employee` record is authoritative, and this ledger explains how it came to be what it is. The
 * ledger is never summed, replayed or otherwise used to compute a present value — a gap in it
 * would then silently produce a wrong one, and a wrong salary that looks derived is worse than an
 * absent one that says so.
 *
 * The inverse rule matters just as much: a current department, manager or salary cannot prove a
 * *previous* one. Nothing here may be reverse-engineered from today's `Employee`.
 */

/** The dimensions A07 names as movable. A movement changes exactly one of them. */
export type MovementDimension =
  | 'legal_employer'
  | 'branch'
  | 'location'
  | 'department'
  | 'cost_centre'
  | 'position'
  | 'manager'
  | 'pay_group'
  | 'employment_basis'

/**
 * What kind of event this was, in the words the business uses.
 *
 * Distinct from `dimension`, which says what field moved. A promotion and a lateral transfer can
 * both change `position`, and only the kind tells them apart — which is the difference between a
 * career history and a list of field edits.
 */
export type MovementKind =
  | 'hire'
  | 'promotion'
  | 'transfer'
  | 'department_change'
  | 'manager_change'
  | 'location_change'
  | 'salary_adjustment'
  | 'status_change'
  | 'disciplinary'
  | 'termination'

/**
 * One recorded change.
 *
 * `effectiveFrom` and `recordedAt` are separate on purpose. A transfer agreed in August and
 * effective in October is one event with two dates, and a timeline that shows only the order
 * events were entered is reconstructing history from sequence — which is what A07 forbids.
 */
export interface EmployeeMovement {
  id: string
  employeeId: string
  kind: MovementKind

  /**
   * Absent for events that are not a field change on the employee record — a disciplinary
   * warning, for instance, is a recorded fact about the person rather than a move between values.
   */
  dimension?: MovementDimension

  /** The date the change takes effect in the business. */
  effectiveFrom: IsoDate

  /**
   * What it was and what it became, already resolved to display text.
   *
   * Text rather than ids because the ledger has to stay readable when the thing it names is
   * renamed or retired — a department that no longer exists must still show the name it had when
   * somebody moved out of it. Absent on a hire's `previous` side, where there is no prior value.
   */
  previousValue?: string
  nextValue?: string

  /** Set only on `salary_adjustment`, where the figures are the point and text would lose them. */
  previousAmount?: Money
  nextAmount?: Money

  /** Why, in the words the recorder used. Absent when none was given. */
  reason?: string

  /** The employee id of whoever recorded it. */
  recordedBy: string
  recordedAt: IsoDateTime
}
