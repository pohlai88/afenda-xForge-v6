// Type Imports
import type { Department, Position, WorkLocation } from '@/types/hrm/employee-types'
import type { PeopleRow } from '@/types/hrm/people-types'

/**
 * H03's derivations: the structure people sit in, assembled from what the records actually hold.
 *
 * The rule running through all of it: where a relationship is not recorded, say so. A department
 * with no parent is a root and a person with no manager is unreported — neither gets attached to
 * whatever looks plausible so that the tree renders tidily. A structure that looks complete when
 * it is not is the failure `domain_truth` exists to prevent.
 */

export interface DepartmentNode {
  department: Department
  depth: number

  /** People in this department alone, excluding leavers. */
  own: number

  /** This department plus everything beneath it. What a reader means by "how big is Operations". */
  total: number
  headName?: string
  children: DepartmentNode[]
}

export interface PositionRow {
  position: Position
  departmentName: string
  headcount: number
}

export interface LocationRow {
  location: WorkLocation
  headcount: number

  /** Legal employers whose people sit here. A location is not an employer, and may serve several. */
  entityNames: string[]
}

export interface ReportingGroup {
  managerId: string
  managerName: string
  managerPosition: string
  reports: PeopleRow[]
}

/** Leavers are excluded from every count on this page, and the page says so. */
const present = (rows: PeopleRow[]) => rows.filter(row => row.status !== 'terminated')

/**
 * The department hierarchy, with headcount rolled up.
 *
 * A parent's `total` includes its children's people. A parent showing only its own would read as
 * a smaller department than it is — Operations with Customer Support beneath it employs both, and
 * anybody asking "how big is Operations" means the second number.
 *
 * A department whose `parentId` names something absent is treated as a root rather than dropped.
 * Losing a department because its parent is missing would silently remove its people from the page.
 */
export const departmentTree = (departments: Department[], rows: PeopleRow[]): DepartmentNode[] => {
  const active = present(rows)
  const byId = new Map(departments.map(department => [department.id, department]))
  const nameById = new Map(rows.map(row => [row.id, row.name]))

  const ownCount = (departmentId: string) => active.filter(row => row.departmentId === departmentId).length

  const childrenOf = (parentId: string | undefined, depth: number): DepartmentNode[] =>
    departments
      .filter(department => {
        const parent = department.parentId && byId.has(department.parentId) ? department.parentId : undefined

        return parent === parentId
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(department => {
        const children = childrenOf(department.id, depth + 1)
        const own = ownCount(department.id)

        return {
          department,
          depth,
          own,
          total: own + children.reduce((sum, child) => sum + child.total, 0),
          headName: department.headEmployeeId ? nameById.get(department.headEmployeeId) : undefined,
          children
        }
      })

  const roots = childrenOf(undefined, 0)

  // Every department must appear exactly once. `childrenOf` walks down from the roots, so a parent
  // relationship that cycles — A under B, B under A — leaves neither reachable from a root and
  // neither reachable from the other. Both vanish from the page, and their people vanish with them,
  // with no error and a tree that still looks complete. That is the one failure worse than a crash
  // here, so it is checked rather than assumed.
  const placed = new Set(flattenTree(roots).map(node => node.department.id))

  if (placed.size !== departments.length) {
    const missing = departments.filter(department => !placed.has(department.id)).map(department => department.id)

    throw new Error(`department hierarchy is not a tree: ${missing.join(', ')} unreachable from any root`)
  }

  return roots
}

/** Depth-first, so a tree renders as an indented list without the caller recursing. */
export const flattenTree = (nodes: DepartmentNode[]): DepartmentNode[] =>
  nodes.flatMap(node => [node, ...flattenTree(node.children)])

export const positionRows = (positions: Position[], departments: Department[], rows: PeopleRow[]): PositionRow[] => {
  const active = present(rows)
  const departmentName = new Map(departments.map(department => [department.id, department.name]))

  return positions
    .map(position => ({
      position,
      departmentName: departmentName.get(position.departmentId) ?? position.departmentId,
      headcount: active.filter(
        row => row.departmentId === position.departmentId && row.positionTitle === position.title
      ).length
    }))
    .sort(
      (a, b) => a.departmentName.localeCompare(b.departmentName) || a.position.title.localeCompare(b.position.title)
    )
}

export const locationRows = (locations: WorkLocation[], rows: PeopleRow[]): LocationRow[] => {
  const active = present(rows)

  return locations
    .map(location => {
      const here = active.filter(row => row.locationId === location.id)

      return {
        location,
        headcount: here.length,
        entityNames: [...new Set(here.map(row => row.entityName))].sort()
      }
    })
    .sort((a, b) => a.location.name.localeCompare(b.location.name))
}

/**
 * Who reports to whom, built from `managerId` and nothing else.
 *
 * `unreported` is returned separately rather than folded under whoever sits at the top. Both a
 * genuine top-of-org and a record whose manager was never filled in have no `managerId`, and the
 * page cannot tell them apart — so it names the group honestly instead of choosing one reading.
 */
export const reportingGroups = (rows: PeopleRow[]): { groups: ReportingGroup[]; unreported: PeopleRow[] } => {
  const active = present(rows)
  const byId = new Map(active.map(row => [row.id, row]))

  const groups = new Map<string, PeopleRow[]>()
  const unreported: PeopleRow[] = []

  for (const row of active) {
    // A manager who is not in the active population — someone who left, say — leaves their reports
    // unreported rather than grouped under a name the page cannot resolve.
    if (row.managerId && byId.has(row.managerId)) {
      const reports = groups.get(row.managerId)

      if (reports) {
        reports.push(row)
      } else {
        groups.set(row.managerId, [row])
      }
    } else {
      unreported.push(row)
    }
  }

  return {
    groups: [...groups.entries()]
      .map(([managerId, reports]) => ({
        managerId,
        managerName: byId.get(managerId)?.name ?? managerId,
        managerPosition: byId.get(managerId)?.positionTitle ?? '',
        reports: reports.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => b.reports.length - a.reports.length || a.managerName.localeCompare(b.managerName)),
    unreported: unreported.sort((a, b) => a.name.localeCompare(b.name))
  }
}
