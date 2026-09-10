// Component Imports
import PeopleAttention from '@/views/hrm/people/people-attention'
import PeopleHeadline from '@/views/hrm/people/people-headline'
import PeopleMovement from '@/views/hrm/people/people-movement'
import PeopleTable from '@/views/hrm/people/people-table'

// Action Imports
import {
  getDepartments,
  getEmployees,
  getEmployeesWithPayroll,
  getLegalEntities,
  getLocations
} from '@/app/server/actions'

// Util Imports
import { buildPeopleRows, peopleAttention, peopleSummary, workforceMovement } from '@/utils/hrm-people'

export const metadata = { title: 'People' }



/**
 * H01 — People. The workforce population across every legal employer.
 *
 * This is the surface that finally gives an employee an address of their own. Until it existed,
 * `findEmployees` resolved a person to `/payroll/runs/{runId}?employee={id}` and dropped them
 * entirely when their company had no pay run, so the same human being was a different conceptual
 * identity depending on whether payroll had executed — which doctrine `identity_rule` forbids.
 *
 * The archetype is an operational workbench, not a dashboard: the reader is here to work a list,
 * so the page leads with the work and its filters rather than a hero figure. The bands run
 * OPERATE → ATTEND → INSPECT → UNDERSTAND, and each earns its place by what can be done with it.
 */
const PeoplePage = async () => {
  const [employees, entities, departments, locations, employeesWithPayroll] = await Promise.all([
    getEmployees(),
    getLegalEntities(),
    getDepartments(),
    getLocations(),
    getEmployeesWithPayroll()
  ])

  // The clock is read once, here, and passed down as a date — components that read it themselves
  // render differently on the server and the client.
  const asOfDate = new Date().toISOString().slice(0, 10)

  const rows = buildPeopleRows({ employees, entities, departments, locations, employeesWithPayroll })
  const summary = peopleSummary(rows)
  const attention = peopleAttention(rows, asOfDate)
  const movement = workforceMovement(rows, asOfDate)

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>People</h1>
        <p className='text-muted-foreground text-sm'>
          Everyone employed across the group. Open a person to see their employment and how it changed.
        </p>
      </header>

      {/*
        items-start, not the grid default of stretch: these three cards hold different amounts and
        letting the short one inherit the tall one's height leaves empty card under its content.
      */}
      <div className='grid grid-cols-6 items-start gap-6'>
        <PeopleHeadline summary={summary} className='col-span-full lg:col-span-2' />
        <PeopleAttention items={attention} className='col-span-full lg:col-span-2' />
        <PeopleMovement movement={movement} className='col-span-full lg:col-span-2' />
        <PeopleTable rows={rows} className='col-span-full' />
      </div>
    </div>
  )
}

export default PeoplePage
