// Component Imports
import OrganisationWorkspace from '@/views/hrm/organisation/organisation-workspace'

// Action Imports
import {
  getDepartments,
  getEmployees,
  getEmployeesWithPayroll,
  getLegalEntities,
  getLocations,
  getPositions
} from '@/app/server/actions'

// Util Imports
import { buildPeopleRows } from '@/utils/hrm-people'
import { departmentTree, flattenTree, locationRows, positionRows, reportingGroups } from '@/utils/hrm-org'

export const metadata = { title: 'Organisation' }

/**
 * H03 — Organisation. The structure people sit in.
 *
 * A settings archetype: the reader is here to find one thing and see where it sits, so the page
 * leads with navigable sections rather than a summary, and nothing on it is a headline figure.
 *
 * Every count links into People with the matching filter applied. `anti_patterns` forbids a dead
 * summary card — a figure with no drill-down when an explanation exists — so "23 in Engineering"
 * has to be answerable rather than merely true.
 */
const OrganisationPage = async () => {
  const [employees, entities, departments, locations, positions, employeesWithPayroll] = await Promise.all([
    getEmployees(),
    getLegalEntities(),
    getDepartments(),
    getLocations(),
    getPositions(),
    getEmployeesWithPayroll()
  ])

  const rows = buildPeopleRows({ employees, entities, departments, locations, employeesWithPayroll })

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Organisation</h1>
        <p className='text-muted-foreground text-sm'>
          Departments, positions, locations and reporting lines. Every count opens the people behind it.
        </p>
      </header>

      <OrganisationWorkspace
        tree={flattenTree(departmentTree(departments, rows))}
        positions={positionRows(positions, departments, rows)}
        locations={locationRows(locations, rows)}
        reporting={reportingGroups(rows)}
      />
    </div>
  )
}

export default OrganisationPage
