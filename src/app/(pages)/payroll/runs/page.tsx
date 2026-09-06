// Component Imports
import RunQueueFocus from '@/views/payroll/runs/run-queue-focus'
import RunQueueTable from '@/views/payroll/runs/run-queue-table'
import RunQueueYear from '@/views/payroll/runs/run-queue-year'

// Action Imports
import { getEmployees, getLegalEntities, getPayRuns } from '@/app/server/actions'

// Util Imports
import { buildRunQueue, queueSummary } from '@/utils/payroll-queue'

export const metadata = { title: 'Payroll runs' }

/**
 * The run queue. The run that needs working comes first, the year so far beside it, and every
 * run underneath. Rows open the run workspace rather than re-pointing the dashboard.
 */
const PayrollRunsPage = async () => {
  const [runs, employees, entities] = await Promise.all([getPayRuns(), getEmployees(), getLegalEntities()])

  // The clock is read once, here, and passed down as a date — components that read it
  // themselves render differently on the server and the client.
  const today = new Date().toISOString().slice(0, 10)

  const rows = buildRunQueue({ runs, employees, entities, today })
  const summary = queueSummary(rows)

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Payroll runs</h1>
        <p className='text-muted-foreground text-sm'>Every pay period, newest first. Open a run to work it.</p>
      </header>

      {/*
        items-start, not the grid default of stretch: the focal run is three tiles and a stage rail,
        the year column is a long list, and letting the short card inherit the tall one's height put
        ~260px of empty card under the tiles. Each takes the height its own content needs.
      */}
      <div className='grid grid-cols-6 items-start gap-6'>
        <RunQueueFocus row={summary.focus} className='col-span-full lg:col-span-4' />
        <RunQueueYear summary={summary} className='col-span-full lg:col-span-2' />
        <RunQueueTable rows={rows} className='col-span-full' />
      </div>
    </div>
  )
}

export default PayrollRunsPage
