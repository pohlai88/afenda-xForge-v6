// Next Imports
import { notFound } from 'next/navigation'

// Type Imports
import type { PayHistoryPoint } from '@/views/payroll/run/payroll-employee-drilldown'

// Component Imports
import PayrollRunWorkspace from '@/views/payroll/run/payroll-run-workspace'

// Action Imports
import {
  getCurrentUser,
  getDepartments,
  getEmployees,
  getLocations,
  getPayRun,
  getPayRuns,
  getPayrollSettings,
  getPayslipsForRun
} from '@/app/server/actions'

// Util Imports
import { daysBetween } from '@/utils/payroll-metrics'
import { buildRunRows } from '@/utils/payroll-workspace'

/** Once a run reaches one of these, counting down to payday is noise. */
const TERMINAL_STATUSES = new Set(['paid', 'closed', 'cancelled', 'failed'])

type Props = {
  params: Promise<{ runId: string }>
}

export const generateMetadata = async ({ params }: Props) => {
  const { runId } = await params
  const run = await getPayRun(runId)

  return { title: run ? `${run.reference} · Payroll` : 'Payroll run' }
}

/**
 * The payroll operations workspace. Joins are done here, once, on the server; the client
 * component receives finished rows and never re-derives them.
 */
const PayrollRunPage = async ({ params }: Props) => {
  const { runId } = await params

  const [run, runs, employees, departments, locations, settings, actor] = await Promise.all([
    getPayRun(runId),
    getPayRuns(),
    getEmployees(),
    getDepartments(),
    getLocations(),
    getPayrollSettings(),
    getCurrentUser()
  ])

  if (!run) notFound()

  // Runs come oldest-first; the comparison baseline is the run before this one.
  const index = runs.findIndex(candidate => candidate.id === run.id)
  const previousRun = index > 0 ? runs[index - 1] : undefined

  const [slips, previousSlips] = await Promise.all([
    getPayslipsForRun(run.id),
    previousRun ? getPayslipsForRun(previousRun.id) : Promise.resolve([])
  ])

  const rows = buildRunRows({ run, slips, previousSlips, employees, departments, locations })

  // Pay history per employee, oldest first, for the inspector. Against the fake-db this is an
  // array filter per run; against a database it is one query keyed by employee.
  const historyByEmployee: Record<string, PayHistoryPoint[]> = {}

  for (const earlier of runs.slice(0, index + 1)) {
    const earlierSlips = await getPayslipsForRun(earlier.id)

    for (const slip of earlierSlips) {
      ;(historyByEmployee[slip.employeeId] ??= []).push({
        runId: earlier.id,
        reference: earlier.reference,
        payDate: earlier.payDate,
        gross: slip.grossPay,
        net: slip.netPay
      })
    }
  }

  const employeeNames = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]))

  // The clock is read once, here, and passed down as a number — components that read it
  // themselves render differently on the server and the client.
  const daysToPayday = TERMINAL_STATUSES.has(run.status)
    ? null
    : daysBetween(new Date().toISOString().slice(0, 10), run.payDate)

  // Keyed on the calculation version: a recalculation produces new payslips on the server, and
  // the workspace remounts on the new rows rather than keeping the old ones in state.
  return (
    <PayrollRunWorkspace
      key={`${run.id}-${run.calculationVersion}`}
      run={run}
      previousRun={previousRun}
      rows={rows}
      previousSlips={previousSlips}
      departments={departments}
      locations={locations}
      employeeNames={employeeNames}
      historyByEmployee={historyByEmployee}
      daysToPayday={daysToPayday}
      actor={actor}
      approvalSettings={settings.approvals}
      roles={settings.access}
    />
  )
}

export default PayrollRunPage
