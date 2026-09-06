// Third-party Imports
import { BanknoteIcon, ClockIcon, WalletIcon } from 'lucide-react'

// Component Imports
import PayrollStatCard from '@/views/dashboards/payroll/payroll-stat-card'
import PayrollByDepartment from '@/views/dashboards/payroll/payroll-by-department'
import PayrollCostTrend from '@/views/dashboards/payroll/payroll-cost-trend'
import PayrollExceptionQueue, { type ExceptionRow } from '@/views/dashboards/payroll/payroll-exception-queue'
import PayrollGrossToNet from '@/views/dashboards/payroll/payroll-gross-to-net'
import PayrollRunHistory from '@/views/dashboards/payroll/payroll-run-history'
import PayrollRunStatus from '@/views/dashboards/payroll/payroll-run-status'

// Action Imports
import { getDepartments, getEmployees, getPayRuns, getPayslipsForRun } from '@/app/server/actions'

// Util Imports
import { formatMoneyCompact, toMajorUnits } from '@/utils/money'
import {
  changeVsPrevious,
  costByDepartment,
  countExceptions,
  daysBetween,
  grossToNetBridge,
  overtimeSummary
} from '@/utils/payroll-metrics'

const CURRENCY_SYMBOL = 'S$'

/** Once a run reaches one of these, the cut-off has passed and counting down to it is noise. */
const TERMINAL_STATUSES = new Set(['paid', 'closed', 'cancelled', 'failed'])

type Props = {

  /** `?run=PR-2026-08` selects a past run. Absent or unrecognised falls back to the latest. */
  searchParams: Promise<{ run?: string }>
}

const PayrollDashboard = async ({ searchParams }: Props) => {
  const [{ run: requestedReference }, runs, employees, departments] = await Promise.all([
    searchParams,
    getPayRuns(),
    getEmployees(),
    getDepartments()
  ])

  // Runs come oldest-first from the source; the open one is the last.
  // An unknown reference falls back to the latest rather than 404ing, so a stale bookmark
  // still lands somewhere useful.
  const selectedIndex = requestedReference
    ? runs.findIndex(run => run.reference === requestedReference)
    : runs.length - 1

  const currentIndex = selectedIndex === -1 ? runs.length - 1 : selectedIndex

  const currentRun = runs[currentIndex]

  // The comparison baseline is the run before the *selected* one, not before the latest.
  const previousRun = runs[currentIndex - 1]
  const slips = await getPayslipsForRun(currentRun.id)

  const exceptionCounts = countExceptions(currentRun.exceptions)

  // The clock is read once, here, and the result passed down as a number. Components that read
  // it themselves render differently on the server and the client, which is a hydration bug.
  // A finished run has no countdown: '83 days overdue' on a run that was paid in June is
  // technically true and completely useless, so it is suppressed rather than rendered.
  const daysToCutoff = TERMINAL_STATUSES.has(currentRun.status)
    ? null
    : daysBetween(new Date().toISOString(), currentRun.cutoffAt)

  const employeeNames = new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]))
  const departmentNames = new Map(departments.map(d => [d.id, d.name]))

  const exceptionRows: ExceptionRow[] = currentRun.exceptions.map(exception => ({
    ...exception,
    subject: exception.employeeId
      ? employeeNames.get(exception.employeeId)
      : exception.departmentId
        ? departmentNames.get(exception.departmentId)
        : undefined
  }))

  const overtime = overtimeSummary(slips, currentRun.currency)
  const previousSlips = previousRun ? await getPayslipsForRun(previousRun.id) : []
  const previousOvertime = overtimeSummary(previousSlips, currentRun.currency)

  // Sparkline series, oldest first. Overtime has no equivalent: it is derived from payslips,
  // and fetching every run's payslips to draw one 80px line is not a trade worth making.
  // Truncated at the selected run: a sparkline running past the run you are looking at would
  // show a delta the headline number does not.
  const historyToDate = runs.slice(0, currentIndex + 1)
  const costSeries = historyToDate.map(run => run.totals.employerCost.amount)
  const netSeries = historyToDate.map(run => run.totals.netPay.amount)

  const costTrend = runs.map(run => ({
    reference: run.reference.replace('PR-', ''),
    cost: toMajorUnits(run.totals.employerCost),
    employees: run.employeeCount
  }))

  return (
    <div className='grid grid-cols-6 gap-6'>
      <PayrollRunStatus
        run={currentRun}
        daysToCutoff={daysToCutoff}
        blockingCount={exceptionCounts.blocking}
        className='col-span-full lg:col-span-4'
      />

      <PayrollExceptionQueue exceptions={exceptionRows} className='col-span-full lg:col-span-2' />

      <PayrollStatCard
        icon={<WalletIcon />}
        value={formatMoneyCompact(currentRun.totals.employerCost)}
        title='Total employer cost'
        change={changeVsPrevious(currentRun.totals.employerCost, previousRun?.totals.employerCost)}
        polarity='higher-is-worse'
        caption='vs last run'
        series={costSeries}
        className='col-span-full sm:col-span-3 lg:col-span-2'
      />

      <PayrollStatCard
        icon={<BanknoteIcon />}
        value={formatMoneyCompact(currentRun.totals.netPay)}
        title='Net pay to employees'
        change={changeVsPrevious(currentRun.totals.netPay, previousRun?.totals.netPay)}
        polarity='neutral'
        caption='vs last run'
        series={netSeries}
        className='col-span-full sm:col-span-3 lg:col-span-2'
        iconClassName='bg-chart-2/10 text-chart-2'
      />

      <PayrollStatCard
        icon={<ClockIcon />}
        value={`${overtime.hours} hrs`}
        title={`Overtime · ${overtime.shareOfGross.toFixed(1)}% of gross`}
        change={changeVsPrevious(overtime.cost, previousOvertime.cost)}
        polarity='higher-is-worse'
        caption='vs last run'
        className='col-span-full sm:col-span-3 lg:col-span-2'
        iconClassName='bg-chart-5/10 text-chart-5'
      />

      <PayrollGrossToNet
        steps={grossToNetBridge(currentRun)}
        currencySymbol={CURRENCY_SYMBOL}
        className='col-span-full lg:col-span-4'
      />

      <PayrollByDepartment
        departments={costByDepartment(slips, employees, departments, currentRun.currency)}
        className='col-span-full lg:col-span-2'
      />

      <PayrollCostTrend points={costTrend} currencySymbol={CURRENCY_SYMBOL} className='col-span-full' />

      <PayrollRunHistory
        runs={[...runs].reverse()}
        selectedReference={currentRun.reference}
        className='col-span-full'
      />
    </div>
  )
}

export default PayrollDashboard
