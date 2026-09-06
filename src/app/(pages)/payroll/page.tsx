// Third-party Imports
import { BanknoteIcon, UsersIcon, WalletIcon } from 'lucide-react'

// Component Imports
import PayrollKpiStrip, { type KpiMetric } from '@/views/dashboards/payroll/payroll-kpi-strip'
import PayrollOvertimeTrend, { type OvertimePoint } from '@/views/dashboards/payroll/payroll-overtime-trend'
import PayrollByDepartment, { type DepartmentRow } from '@/views/dashboards/payroll/payroll-by-department'
import PayrollCostTrend from '@/views/dashboards/payroll/payroll-cost-trend'
import PayrollExceptionQueue, { type ExceptionRow } from '@/views/dashboards/payroll/payroll-exception-queue'
import PayrollGrossToNet from '@/views/dashboards/payroll/payroll-gross-to-net'
import PayrollRunHistory from '@/views/dashboards/payroll/payroll-run-history'
import PayrollRunStatus from '@/views/dashboards/payroll/payroll-run-status'
import PaymentReadiness from '@/views/payroll/payments/payment-readiness'

// Action Imports
import {
  getDepartments,
  getEmployees,
  getFundingAccounts,
  getPayRuns,
  getPayslipsForRun,
  getSettlementBatches,
  getSettlements
} from '@/app/server/actions'

// Util Imports
import { currencySymbol, formatMoney, formatMoneyCompact, toMajorUnits } from '@/utils/money'
import {
  changeVsPrevious,
  costByDepartment,
  countExceptions,
  daysBetween,
  grossToNetBridge,
  overtimeSummary
} from '@/utils/payroll-metrics'
import { fundingSummary, paymentReadiness } from '@/utils/payroll-payments'

/** Share of gross above which overtime stops being noise and becomes a staffing question. */
const OVERTIME_TARGET_SHARE = 2

/** Once a run reaches one of these, the cut-off has passed and counting down to it is noise. */
const TERMINAL_STATUSES = new Set(['paid', 'closed', 'cancelled', 'failed'])

/**
 * `/payroll` is the payroll overview; the run workspace is `/payroll/runs/[runId]`.
 * `?run=PR-2026-08` selects a past run. Absent or unrecognised falls back to the latest.
 * `?dept=eng` filters the exception queue to one department, set by clicking a department
 * in the cost chart. Absent or unrecognised means no filter.
 */
type Props = {
  searchParams: Promise<{ run?: string; dept?: string }>
}

const PayrollDashboard = async ({ searchParams }: Props) => {
  const [{ run: requestedReference, dept: requestedDepartmentId }, runs, employees, departments] = await Promise.all([
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

  // An unrecognised department id is dropped rather than kept, the same way an unknown run
  // reference falls back to the latest instead of filtering everything out silently.
  const selectedDepartment = requestedDepartmentId
    ? departments.find(department => department.id === requestedDepartmentId)
    : undefined

  const [slips, previousSlips] = await Promise.all([
    getPayslipsForRun(currentRun.id),
    previousRun ? getPayslipsForRun(previousRun.id) : Promise.resolve([])
  ])

  const exceptionCounts = countExceptions(currentRun.exceptions)

  // Payment readiness for the selected run: the same gates the payments page shows, so the
  // overview and the payment centre never disagree about whether payday is safe.
  const [runSettlements, fundingAccounts, batches] = await Promise.all([
    getSettlements(currentRun.id),
    getFundingAccounts(),
    getSettlementBatches()
  ])

  const batch = batches.find(candidate => candidate.payRunId === currentRun.id)
  const fundingAccount = fundingAccounts.find(account => account.isDefault) ?? fundingAccounts[0]
  const funding = fundingSummary(runSettlements, fundingAccount, currentRun.currency)
  const readiness = paymentReadiness(currentRun, runSettlements, funding, batch)

  // The currency is the run's, never a constant: a Malaysian pay group will render here too.
  const symbol = currencySymbol(currentRun.currency)

  // "Paid" is a settlement fact. Until the bank has settled, these people are in the run, not paid.
  const paidCount = runSettlements.filter(settlement => settlement.status === 'paid' && !settlement.retryOfId).length
  const settled = paidCount > 0

  // The clock is read once, here, and the result passed down as a number. Components that read
  // it themselves render differently on the server and the client, which is a hydration bug.
  // A finished run has no countdown: '83 days overdue' on a run that was paid in June is
  // technically true and completely useless, so it is suppressed rather than rendered.
  const daysToCutoff = TERMINAL_STATUSES.has(currentRun.status)
    ? null
    : daysBetween(new Date().toISOString(), currentRun.cutoffAt)

  const employeeById = new Map(employees.map(e => [e.id, e]))
  const departmentNames = new Map(departments.map(d => [d.id, d.name]))

  const exceptionRows: ExceptionRow[] = currentRun.exceptions.map(exception => {
    const employee = exception.employeeId ? employeeById.get(exception.employeeId) : undefined

    return {
      ...exception,

      // An exception about a person is filed under their department too, so clicking a
      // department in the cost chart surfaces both its own budget-variance exceptions and the
      // people-level ones underneath it.
      departmentId: exception.departmentId ?? employee?.departmentId,
      subject: exception.employeeId
        ? employee
          ? `${employee.firstName} ${employee.lastName}`
          : undefined
        : exception.departmentId
          ? departmentNames.get(exception.departmentId)
          : undefined,
      avatar: employee?.avatar
    }
  })

  const filteredExceptionRows = selectedDepartment
    ? exceptionRows.filter(exception => exception.departmentId === selectedDepartment.id)
    : exceptionRows

  const overtime = overtimeSummary(slips, currentRun.currency)

  // Sparkline series, oldest first. Overtime has no equivalent: it is derived from payslips,
  // and fetching every run's payslips to draw one 80px line is not a trade worth making.
  // Truncated at the selected run: a sparkline running past the run you are looking at would
  // show a delta the headline number does not.
  const historyToDate = runs.slice(0, currentIndex + 1)
  const costSeries = historyToDate.map(run => run.totals.employerCost.amount)
  const netSeries = historyToDate.map(run => run.totals.netPay.amount)

  // One block, three measures. Three copies of one card was the only repeated block on any
  // dashboard here, and grouping the figures lets them be read against each other.
  const metrics: KpiMetric[] = [
    {
      key: 'employer-cost',
      icon: <WalletIcon />,
      value: formatMoneyCompact(currentRun.totals.employerCost),
      title: 'Total employer cost',
      change: changeVsPrevious(currentRun.totals.employerCost, previousRun?.totals.employerCost),
      polarity: 'higher-is-worse',
      series: costSeries
    },
    {
      key: 'net-pay',
      icon: <BanknoteIcon />,
      value: formatMoneyCompact(currentRun.totals.netPay),
      title: 'Net pay to employees',
      change: changeVsPrevious(currentRun.totals.netPay, previousRun?.totals.netPay),
      polarity: 'neutral',
      series: netSeries,
      iconClassName: 'bg-chart-2/10 text-chart-2'
    },
    {
      key: 'employees',
      icon: <UsersIcon />,
      value: settled ? `${paidCount} / ${currentRun.employeeCount}` : String(currentRun.employeeCount),
      title: settled ? 'Employees paid' : 'Employees in run',
      change: previousRun
        ? ((currentRun.employeeCount - previousRun.employeeCount) / previousRun.employeeCount) * 100
        : null,
      polarity: 'neutral',
      series: historyToDate.map(run => run.employeeCount),
      iconClassName: 'bg-chart-1/10 text-chart-1'
    }
  ]

  // Overtime for every run, not just this one. An earlier pass decided fetching all payslips to
  // draw one 80px sparkline was not worth it; a chart that answers whether overtime is creeping
  // is a different trade, and against the fake-db this is an array filter per run.
  const overtimeByRun = await Promise.all(
    historyToDate.map(async run => {
      const runSlips = await getPayslipsForRun(run.id)
      const summary = overtimeSummary(runSlips, run.currency)

      return {
        reference: run.reference.replace('PR-', ''),
        share: summary.shareOfGross,
        variance: summary.shareOfGross - OVERTIME_TARGET_SHARE,
        hours: summary.hours
      }
    })
  )

  const overtimePoints: OvertimePoint[] = overtimeByRun

  const departmentHeads = new Map(departments.map(d => [d.id, d.headEmployeeId]))

  // Every department appears in this map even at zero cost, because `costByDepartment` maps
  // over the full department list rather than only the ones with payslips this run — so a
  // missing entry never has to be told apart from a department that genuinely cost nothing.
  const previousDepartmentShares = previousRun
    ? new Map(
        costByDepartment(previousSlips, employees, departments, previousRun.currency).map(department => [
          department.departmentId,
          department.share
        ])
      )
    : null

  const departmentRows: DepartmentRow[] = costByDepartment(slips, employees, departments, currentRun.currency).map(
    row => {
      const head = employeeById.get(departmentHeads.get(row.departmentId) ?? '')

      return {
        ...row,
        headName: head && `${head.firstName} ${head.lastName}`,
        headAvatar: head?.avatar,
        shareDelta: previousDepartmentShares ? row.share - (previousDepartmentShares.get(row.departmentId) ?? 0) : null
      }
    }
  )

  const costTrend = runs.map(run => ({
    reference: run.reference.replace('PR-', ''),
    cost: toMajorUnits(run.totals.employerCost),
    employees: run.employeeCount
  }))

  // Operational first, analytics second. The first screen answers "can payroll proceed, what is
  // wrong, when is payday, can we fund it"; the trends are for a different moment and sit below
  // a heading that says so. A payroll overview is a control room, not an analytics dashboard.
  return (
    <div className='grid grid-cols-6 gap-6'>
      <PayrollRunStatus
        run={currentRun}
        daysToCutoff={daysToCutoff}
        blockingCount={exceptionCounts.blocking}
        className='col-span-full lg:col-span-4'
      />

      <PayrollExceptionQueue
        exceptions={filteredExceptionRows}
        departmentFilter={selectedDepartment && { id: selectedDepartment.id, name: selectedDepartment.name }}
        runReference={currentRun.reference}
        runId={currentRun.id}
        className='col-span-full lg:col-span-2'
      />

      <PayrollKpiStrip
        metrics={metrics}
        caption={`${currentRun.reference} · ${currentRun.periodStart} to ${currentRun.periodEnd}`}
        className='col-span-full'
      />

      <PayrollGrossToNet
        steps={grossToNetBridge(currentRun)}
        currencySymbol={symbol}
        className='col-span-full lg:col-span-4'
      />

      <PaymentReadiness percent={readiness.percent} checks={readiness.checks} className='col-span-full lg:col-span-2' />

      <PayrollRunHistory
        runs={[...runs].reverse()}
        selectedReference={currentRun.reference}
        className='col-span-full'
      />

      <div className='col-span-full mt-2 flex flex-col gap-0.5 border-t pt-6'>
        <h2 className='text-lg font-semibold tracking-tight'>Trends</h2>
        <p className='text-muted-foreground text-sm'>
          How this run compares with the six before it. Nothing here needs action today.
        </p>
      </div>

      <PayrollOvertimeTrend
        points={overtimePoints}
        target={OVERTIME_TARGET_SHARE}
        currentHours={overtime.hours}
        currentCost={formatMoney(overtime.cost)}
        className='col-span-full lg:col-span-3'
      />

      <PayrollByDepartment
        departments={departmentRows}
        runReference={currentRun.reference}
        selectedDepartmentId={selectedDepartment?.id}
        className='col-span-full lg:col-span-3'
      />

      <PayrollCostTrend points={costTrend} currencySymbol={symbol} className='col-span-full' />
    </div>
  )
}

export default PayrollDashboard
