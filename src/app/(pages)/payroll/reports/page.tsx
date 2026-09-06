// Type Imports
import type { Payslip } from '@/types/payroll/pay-run-types'
import type { Settlement } from '@/types/payroll/settlement-types'

// Component Imports
import ReportsWorkspace from '@/views/payroll/reports/reports-workspace'
import EntityPicker from '@/views/payroll/entity-picker'

// Action Imports
import {
  getLegalEntities,
  getPayrollSettings,
  getDepartments,
  getEmployees,
  getLocations,
  getPayRuns,
  getPayslipsForRun,
  getRecentExports,
  getSettlements
} from '@/app/server/actions'

// Util Imports
import { currencySymbol, toMajorUnits } from '@/utils/money'
import { latestRunFor } from '@/utils/payroll-group'
import { buildReportTables } from '@/utils/payroll-reports'
import { formatPeriod } from '@/utils/payroll-workspace'

export const metadata = { title: 'Payroll reports' }

/**
 * Every report for every run is rendered here, once, on the server: the joins are the same ones
 * the run workspace does, and against the fake-db they are array filters. The client only picks
 * a run and a format and writes the file.
 *
 * Scoped to one company, because a register is a list of one company's people and a bank file is
 * drawn on one account. `?entity=` chooses whose. The one exception is the run summary, which is
 * deliberately cross-company and carries the currency on every row instead of a total.
 */
type Props = {
  searchParams: Promise<{ entity?: string }>
}

const PayrollReportsPage = async ({ searchParams }: Props) => {
  const [params, runs, employees, departments, locations, entities, settings, exports] = await Promise.all([
    searchParams,
    getPayRuns(),
    getEmployees(),
    getDepartments(),
    getLocations(),
    getLegalEntities(),
    getPayrollSettings(),
    getRecentExports()
  ])

  const entity =
    entities.find(candidate => candidate.id === params.entity) ??
    entities.find(candidate => candidate.id === settings.general.homeEntityId) ??
    entities[0]

  const entityRuns = runs.filter(run => run.entityId === entity.id)
  const currentRun = latestRunFor(entityRuns)

  if (!currentRun) {
    return (
      <div className='flex flex-col gap-6'>
        <header className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
          <div className='flex flex-col gap-1'>
            <h1 className='text-2xl font-semibold tracking-tight'>Reports</h1>
            <p className='text-muted-foreground text-sm'>
              {entity.name} has no pay run yet, so there is nothing to report on.
            </p>
          </div>
          <EntityPicker entities={entities} value={entity.id} basePath='/payroll/reports' />
        </header>
      </div>
    )
  }

  const payslipsByRun: Record<string, Payslip[]> = {}
  const settlementsByRun: Record<string, Settlement[]> = {}

  for (const run of runs) {
    ;[payslipsByRun[run.id], settlementsByRun[run.id]] = await Promise.all([
      getPayslipsForRun(run.id),
      getSettlements(run.id)
    ])
  }

  const tables = buildReportTables({
    entities, runs, employees, departments, locations, payslipsByRun, settlementsByRun })

  // Newest first in the selector, so the run someone most likely wants is at the top. Scoped to
  // the chosen company: a register for a Vietnamese run has no business being offered on a page
  // captioned for the Singapore one.
  const runOptions = [...entityRuns].reverse().map(run => ({
    id: run.id,
    reference: run.reference,
    label: formatPeriod(run.periodStart, run.periodEnd)
  }))

  // One company's runs only. Charting every company on one axis put a dong figure in the
  // billions beside a dollar figure in the hundreds of thousands, under a single currency
  // symbol — a chart where the tallest bar meant "pays in dong" rather than "costs the most".
  const costTrend = entityRuns.map(run => ({
    reference: run.reference.replace('PR-', ''),
    cost: toMajorUnits(run.totals.employerCost),
    employees: run.employeeCount
  }))

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Reports</h1>
          <p className='text-muted-foreground text-sm'>
            The figures finance and auditors ask for, for {entity.name}, from the same numbers the
            screens show. The run summary is the one report that spans every company.
          </p>
        </div>
        <EntityPicker entities={entities} value={entity.id} basePath='/payroll/reports' />
      </header>

      <ReportsWorkspace
        runs={runOptions}
        currentRunId={currentRun.id}
        tables={tables}
        exports={exports}
        employees={employees}
        costTrend={costTrend}
        currencySymbol={currencySymbol(currentRun.currency)}
      />
    </div>
  )
}

export default PayrollReportsPage
