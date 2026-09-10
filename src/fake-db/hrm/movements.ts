/**
 * ! Seed data for the employee movement ledger. Swap this export for a real query when the
 * ! database lands — src/app/server/actions.ts is the only place that reads it.
 *
 * Two kinds of entry live here, and the difference between them is a domain rule rather than a
 * convenience (`afenda-hrm-architecture.yaml` B04):
 *
 *   Derived     hire and termination, read from `hireDate` and `terminationDate`. These are facts
 *               the Employee record itself holds, so reading them back out states nothing new.
 *
 *   Fixtures    promotions, transfers, department and manager changes, salary adjustments and a
 *               disciplinary record. These are INTENTIONAL TEST FIXTURES, written out by hand.
 *
 * The fixtures are not derived, and must never become derived. A current department, manager or
 * salary cannot prove a previous one — inferring "transferred from Sales" because somebody is in
 * Operations today would manufacture history the domain does not have, which is exactly what A07
 * prohibits. If the employee seed changes, these entries stay as they are or are edited by hand.
 */

// Data Imports
import { employees } from '@/fake-db/hrm/employees'

// Type Imports
import type { EmployeeMovement } from '@/types/hrm/movement-types'

const byId = new Map(employees.map(employee => [employee.id, employee]))

/** Whoever recorded a change in this seed. A stub until a session exists. */
const HR_LEAD = 'emp-023'

/**
 * Hire and termination, read straight off the record.
 *
 * `recordedAt` is the effective date at midnight rather than a separate invented timestamp: the
 * record genuinely does not hold when somebody typed the hire in, and inventing a plausible
 * back-office delay would be fabricating provenance.
 */
const derived: EmployeeMovement[] = employees.flatMap(employee => {
  const entries: EmployeeMovement[] = [
    {
      id: `mov-${employee.id}-hire`,
      employeeId: employee.id,
      kind: 'hire',
      effectiveFrom: employee.hireDate,
      nextValue: employee.positionTitle,
      recordedBy: HR_LEAD,
      recordedAt: `${employee.hireDate}T00:00:00.000Z`
    }
  ]

  if (employee.terminationDate) {
    entries.push({
      id: `mov-${employee.id}-termination`,
      employeeId: employee.id,
      kind: 'termination',
      effectiveFrom: employee.terminationDate,
      previousValue: employee.positionTitle,
      reason: employee.terminationReason ? `Recorded as ${employee.terminationReason.replace(/_/g, ' ')}` : undefined,
      recordedBy: HR_LEAD,
      recordedAt: `${employee.terminationDate}T00:00:00.000Z`
    })
  }

  return entries
})

/**
 * Intentional test fixtures. Not derived from anything.
 *
 * Written against employees the hand-authored part of the seed defines, so the ids are stable;
 * `build` below drops any entry whose employee is absent rather than rendering a movement for
 * somebody who does not exist.
 *
 * Every `nextValue` must equal what the employee record currently holds. The record is
 * authoritative and this only explains how it got there, so a fixture saying somebody moved to
 * Remote (APAC) while their record reads Singapore HQ does not read as a gap in the ledger — it
 * reads as one of the two being wrong, and nothing on screen tells a reader which.
 */
const fixtures: EmployeeMovement[] = [
  {
    id: 'mov-fix-001',
    employeeId: 'emp-002',
    kind: 'promotion',
    dimension: 'position',
    effectiveFrom: '2023-04-01',
    previousValue: 'Senior Engineer',
    nextValue: 'Staff Engineer',
    reason: 'Promotion confirmed at the March technical review.',
    recordedBy: HR_LEAD,
    recordedAt: '2023-03-18T09:20:00.000Z'
  },
  {
    id: 'mov-fix-002',
    employeeId: 'emp-002',
    kind: 'salary_adjustment',
    dimension: 'employment_basis',
    effectiveFrom: '2023-04-01',
    previousAmount: { amount: 13200000, currency: 'SGD' },
    nextAmount: { amount: 14000000, currency: 'SGD' },
    reason: 'Applied with the promotion above.',
    recordedBy: HR_LEAD,
    recordedAt: '2023-03-18T09:22:00.000Z'
  },
  {
    id: 'mov-fix-003',
    employeeId: 'emp-003',
    kind: 'manager_change',
    dimension: 'manager',
    effectiveFrom: '2025-01-06',
    previousValue: 'Marcus Tan',
    nextValue: 'Priya Raman',
    reason: 'Platform and product engineering merged under one lead.',
    recordedBy: HR_LEAD,
    recordedAt: '2024-12-11T14:05:00.000Z'
  },
  {
    id: 'mov-fix-004',
    employeeId: 'emp-005',
    kind: 'department_change',
    dimension: 'department',
    effectiveFrom: '2025-07-01',
    previousValue: 'Customer Support',
    nextValue: 'Engineering',
    reason: 'Internal move following the support tooling project.',
    recordedBy: HR_LEAD,
    recordedAt: '2025-06-02T10:40:00.000Z'
  },
  {
    id: 'mov-fix-005',
    employeeId: 'emp-005',
    kind: 'salary_adjustment',
    dimension: 'employment_basis',
    effectiveFrom: '2026-01-01',
    previousAmount: { amount: 8800000, currency: 'SGD' },
    nextAmount: { amount: 9600000, currency: 'SGD' },
    reason: 'Annual review.',
    recordedBy: HR_LEAD,
    recordedAt: '2025-12-15T11:00:00.000Z'
  },
  {
    id: 'mov-fix-006',
    employeeId: 'emp-004',
    kind: 'location_change',
    dimension: 'location',
    effectiveFrom: '2025-09-15',
    previousValue: 'Remote (APAC)',
    nextValue: 'Singapore HQ',
    reason: 'Returned to the office full time.',
    recordedBy: HR_LEAD,
    recordedAt: '2025-08-28T16:30:00.000Z'
  },
  {
    id: 'mov-fix-007',
    employeeId: 'emp-009',
    kind: 'promotion',
    dimension: 'position',
    effectiveFrom: '2024-10-01',
    previousValue: 'Sales Director',
    nextValue: 'VP Sales',
    recordedBy: HR_LEAD,
    recordedAt: '2024-09-09T08:15:00.000Z'
  },
  {
    id: 'mov-fix-008',
    employeeId: 'emp-006',
    kind: 'disciplinary',
    effectiveFrom: '2026-05-12',
    reason: 'Written warning recorded. Review scheduled after three months.',
    recordedBy: HR_LEAD,
    recordedAt: '2026-05-12T13:45:00.000Z'
  }
]

/**
 * Newest first, which is how the ledger is read: the most recent change to a person is the one
 * somebody opening their record is usually looking for.
 *
 * Ties break on `recordedAt`, because a promotion and the salary adjustment applied with it share
 * an effective date and the pair reads wrongly in either arbitrary order.
 */
const build = (): EmployeeMovement[] =>
  [...derived, ...fixtures.filter(movement => byId.has(movement.employeeId))].sort(
    (a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.recordedAt.localeCompare(a.recordedAt)
  )

export const employeeMovements: EmployeeMovement[] = build()

