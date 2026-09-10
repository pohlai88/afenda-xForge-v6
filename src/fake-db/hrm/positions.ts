/**
 * ! Seed data for HRM positions. Swap this export for a real query when the database lands —
 * ! src/app/server/actions.ts is the only place that reads it.
 *
 * Derived from the titles the employee seed already uses, rather than hand-listed beside it.
 * A hand-written list would drift the first time somebody added an employee with a new title,
 * and a position catalogue that disagrees with the people filling it is worse than no catalogue:
 * it makes a vacancy look real when it is a typo.
 *
 * A position carries no job grade. Grades are compensation configuration, nothing here seeds a
 * band, and a field that is always undefined teaches every reader to ignore it.
 */

// Data Imports
import { departments, employees } from '@/fake-db/hrm/employees'

// Type Imports
import type { Position } from '@/types/hrm/employee-types'

const DEPARTMENT_CODES = new Map(departments.map(department => [department.id, department.code ?? 'GEN']))

/**
 * 'Senior Engineer' -> 'SENIOR-ENGINEER', so a code is stable against the title it came from
 * rather than an index that shifts when the seed grows.
 */
const slug = (title: string) =>
  title
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * One position per distinct department-and-title pair.
 *
 * The pair, not the title alone: 'Manager' in Engineering and 'Manager' in Sales are two
 * positions that happen to share a word, and collapsing them would put one department's people
 * under another's structure.
 */
const build = (): Position[] => {
  const seen = new Map<string, Position>()

  for (const employee of employees) {
    const key = `${employee.departmentId}::${employee.positionTitle}`

    if (seen.has(key)) continue

    const departmentCode = DEPARTMENT_CODES.get(employee.departmentId) ?? 'GEN'

    seen.set(key, {
      id: `pos-${employee.departmentId.replace(/^dept-/, '')}-${slug(employee.positionTitle).toLowerCase()}`,
      title: employee.positionTitle,
      code: `${departmentCode}-${slug(employee.positionTitle)}`,
      departmentId: employee.departmentId
    })
  }

  return [...seen.values()].sort((a, b) => a.title.localeCompare(b.title))
}

export const positions: Position[] = build()
