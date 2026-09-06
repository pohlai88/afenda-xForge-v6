// Type Imports
import type { Payslip } from '@/types/payroll/pay-run-types'
import type { Settlement } from '@/types/payroll/settlement-types'

// Component Imports
import ReportsWorkspace from '@/views/payroll/reports/reports-workspace'

// Action Imports
import {
  getCurrentPayRun,
  getDepartments,
  getEmployees,
  getLocations,
  getPayRuns,
  getPayslipsForRun,
  getRecentExports,
  getSettlements
} from '@/app/server/actions'

// Util Imports
import { toMajorUnits } from '@/utils/money'
import { buildReportTables } from '@/utils/payroll-reports'
import { formatPeriod } from '@/utils/payroll-workspace'

const CURRENCY_SYMBOL = 'S$'

export const metadata = { title: 'Payroll reports' }

/**
 * Every report for every run is rendered here, once, on the server: the joins are the same ones
 * the run workspace does, and against the fake-db they are array filters. The client only picks
 * a run and a format and writes the file.
 */
const PayrollReportsPage = async () => {
  const [runs, currentRun, employees, departments, locations, exports] = await Promise.all([
    getPayRuns(),
    getCurrentPayRun(),
    getEmployees(),
    getDepartments(),
    getLocations(),
    getRecentExports()
  ])

  const payslipsByRun: Record<string, Payslip[]> = {}
  const settlementsByRun: Record<string, Settlement[]> = {}

  for (const run of runs) {
    ;[payslipsByRun[run.id], settlementsByRun[run.id]] = await Promise.all([
      getPayslipsForRun(run.id),
      getSettlements(run.id)
    ])
  }

  const tables = buildReportTables({ runs, employees, departments, locations, payslipsByRun, settlementsByRun })

  // Newest first in the selector, so the run someone most likely wants is at the top.
  const runOptions = [...runs].reverse().map(run => ({
    id: run.id,
    reference: run.reference,
    label: formatPeriod(run.periodStart, run.periodEnd)
  }))

  const costTrend = runs.map(run => ({
    reference: run.reference.replace('PR-', ''),
    cost: toMajorUnits(run.totals.employerCost),
    employees: run.employeeCount
  }))

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Reports</h1>
        <p className='text-muted-foreground text-sm'>
          The figures finance and auditors ask for, in the file they ask for, from the same numbers the screens show.
        </p>
      </header>

      <ReportsWorkspace
        runs={runOptions}
        currentRunId={currentRun.id}
        tables={tables}
        exports={exports}
        employees={employees}
        costTrend={costTrend}
        currencySymbol={CURRENCY_SYMBOL}
      />
    </div>
  )
}

export default PayrollReportsPage
