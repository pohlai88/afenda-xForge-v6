// Next Imports
import { notFound } from 'next/navigation'

// Component Imports
import EmployeeIdentity from '@/views/hrm/employee/employee-identity'
import EmployeeWorkspace from '@/views/hrm/employee/employee-workspace'

// Action Imports
import {
  getDepartments,
  getEmployeeMovements,
  getEmployees,
  getEmployeesWithPayroll,
  getLegalEntities,
  getLocations,
  getPayRuns
} from '@/app/server/actions'

// Util Imports
import { buildPeopleRows, employeeName } from '@/utils/hrm-people'
import { movementsFor, salaryHistoryFor } from '@/utils/hrm-movement'

type Props = {
  params: Promise<{ employeeId: string }>
  searchParams: Promise<{ return?: string }>
}

export const generateMetadata = async ({ params }: Props) => {
  const { employeeId } = await params
  const employees = await getEmployees()
  const employee = employees.find(candidate => candidate.id === employeeId)

  return { title: employee ? employeeName(employee) : 'Employee' }
}

/**
 * H02 — the employee workspace. One person, five tabs, one route.
 *
 * Not seven pages. Doctrine `drill_down` and `domain_page_budget` both require hierarchical detail
 * to drill down before navigating away, and `anti_patterns` forbids a route for every nested
 * object — which is exactly what the reference product does for contracts, dependants and
 * onboarding, several of them dead links.
 */
const EmployeePage = async ({ params, searchParams }: Props) => {
  const [
    { employeeId },
    { return: returnTo },
    employees,
    entities,
    departments,
    locations,
    employeesWithPayroll,
    movements,
    runs
  ] = await Promise.all([
    params,
    searchParams,
    getEmployees(),
    getLegalEntities(),
    getDepartments(),
    getLocations(),
    getEmployeesWithPayroll(),
    getEmployeeMovements(),
    getPayRuns()
  ])

  const rows = buildPeopleRows({ employees, entities, departments, locations, employeesWithPayroll })
  const person = rows.find(row => row.id === employeeId)

  // An id that resolves to nobody is a 404, not an empty workspace. A page that renders a shell
  // for a person who does not exist is asserting that they do.
  if (!person) notFound()

  // Resolved on the server into a plain object: a client component cannot receive a function.
  const recorderNames = Object.fromEntries(rows.map(row => [row.id, row.name]))

  // The newest run for this person's company is what "their pay history" means. Absent when the
  // company has never run payroll, in which case the workspace offers no link rather than one
  // that lands on nothing.
  const latestRun = person.hasPayrollHistory
    ? [...runs]
        .filter(run => run.entityId === person.entityId)
        .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
        .at(-1)
    : undefined

  // Only an internal path is honoured, and only one under /hrm. An unvalidated `return` is an
  // open-redirect, which is why the entity workspace validates its own the same way.
  const backHref = returnTo && /^\/hrm(?:[/?#]|$)/.test(returnTo) ? returnTo : '/hrm'

  return (
    <div className='flex flex-col gap-6'>
      <EmployeeIdentity person={person} backHref={backHref} />

      <EmployeeWorkspace
        person={person}
        movements={movementsFor(movements, person.id)}
        salaryHistory={salaryHistoryFor(movements, person.id)}
        recorderNames={recorderNames}
        payrollHref={latestRun ? `/payroll/runs/${latestRun.id}?employee=${encodeURIComponent(person.id)}` : null}
      />
    </div>
  )
}

export default EmployeePage
