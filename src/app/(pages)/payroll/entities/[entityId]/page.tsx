// React Imports
import type { ReactNode } from 'react'

// Next Imports
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Third-party Imports
import { BanknoteIcon, ChevronLeftIcon, UsersIcon, WalletIcon } from 'lucide-react'

// Type Imports
import type { KpiMetric } from '@/views/dashboards/payroll/payroll-kpi-strip'
import type { OvertimePoint } from '@/views/dashboards/payroll/payroll-overtime-trend'
import type { DepartmentRow } from '@/views/dashboards/payroll/payroll-by-department'
import type { ExceptionRow } from '@/views/dashboards/payroll/payroll-exception-queue'

// Component Imports
import EntityIdentity from '@/views/payroll/entity-identity'
import WorkspaceGrid from '@/components/shared/WorkspaceGrid'
import { CustomiseWorkspaceAction, WorkspaceCustomisation } from '@/components/shared/WorkspaceCustomisation'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Workspace Imports
import { workspaceModules } from '@/types/common/workspace-types'
import { entityWorkspace } from '@/views/payroll/entity-workspace'

// Action Imports
import {
  getDepartments,
  getEmployees,
  getFundingAccounts,
  getLegalEntity,
  getPayRunsForEntity,
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
import { COUNTRY_LABELS, entityStateDetail, entityStateOf } from '@/utils/payroll-group'

/** Share of gross above which overtime stops being noise and becomes a staffing question. */
const OVERTIME_TARGET_SHARE = 2

/** Once a run reaches one of these, the cut-off has passed and counting down to it is noise. */
const TERMINAL_STATUSES = new Set(['paid', 'closed', 'cancelled', 'failed'])

/**
 * The period the group is consolidating, which is not necessarily the period this page displays.
 *
 * Named because two things now read it — this company's standing in the group, and the Properties
 * panel that reports that standing — and two copies of a period key is exactly how one of them
 * ends up a month behind the other.
 */
const OPEN_PERIOD = '2026-09'

/**
 * One company's payroll. `/payroll` is the group above it; `/payroll/runs/[runId]` is the
 * workspace below.
 *
 * This page was `/payroll` until the group surface took that route. Everything it shows is
 * scoped to one legal entity, which is what it always really was — the difference is that the
 * scope is now named rather than assumed.
 *
 * `?run=PR-SG-2026-08` selects a past run of this entity. Absent or unrecognised falls back to
 * the latest. `?dept=eng` filters the exception queue to one department, set by clicking a
 * department in the cost chart. Absent or unrecognised means no filter.
 */
type Props = {
  params: Promise<{ entityId: string }>
  searchParams: Promise<{ run?: string; dept?: string; return?: string }>
}

export const generateMetadata = async ({ params }: Props) => {
  const entity = await getLegalEntity((await params).entityId)

  return { title: entity ? `${entity.name} · Payroll` : 'Payroll entity' }
}

const EntityPayrollPage = async ({ params, searchParams }: Props) => {
  const [{ entityId }, { run: requestedReference, dept: requestedDepartmentId, return: returnTo }] = await Promise.all([
    params,
    searchParams
  ])

  const entity = await getLegalEntity(entityId)

  if (!entity) notFound()

  const [runs, employees, departments] = await Promise.all([
    getPayRunsForEntity(entity.id),
    getEmployees(),
    getDepartments()
  ])

  // What the group says about this company for the OPEN period, which is not necessarily the run
  // being displayed. Read before the no-payroll branch below, because a company with no run at all
  // still has a standing in the group — 'awaiting data' — and still deserves its identity.
  const state = entityStateOf(runs.find(run => run.periodStart.slice(0, 7) === OPEN_PERIOD))

  // A return path arrives in the URL and is therefore untrusted. Only a same-origin payroll path
  // is followed; anything else — an absolute URL, a protocol-relative one — is dropped for the
  // plain group route. A navigation target taken raw from a query parameter is an open redirect.
  const backHref = returnTo && /^\/payroll(?:[/?#]|$)/.test(returnTo) ? returnTo : '/payroll'

  /*
   * `action` is the page's overflow, which only exists once there is a workspace to customise.
   *
   * `displayedRun` is narrowed to the five fields Properties and the commands render rather than
   * passed whole: everything handed to `EntityIdentity` crosses to the client, and a `PayRun`
   * carries its exceptions with it.
   */
  const header = (
    displayedRun?: { id: string; reference: string; periodStart: string; periodEnd: string; employeeCount: number },
    action?: ReactNode
  ) => (
    <EntityIdentity
      entity={entity}
      href={`/payroll/entities/${entity.id}`}
      displayedRun={displayedRun}
      runCount={runs.length}
      openPeriod={OPEN_PERIOD}
      state={state}
    >
      <header className='flex items-start justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <Button
            variant='link'
            size='xs'
            className='text-muted-foreground w-fit px-0 font-normal'
            render={<Link href={backHref} />}
            nativeButton={false}
          >
            <ChevronLeftIcon /> Group payroll
          </Button>
          <h1 className='text-2xl font-semibold tracking-tight'>{entity.name}</h1>
          <p className='text-muted-foreground text-sm'>
            {COUNTRY_LABELS[entity.countryCode]} · pays in {entity.currency} · {entity.registrationNumber}
          </p>
        </div>
        {action}
      </header>
    </EntityIdentity>
  )

  // A company with no run at all is not an error and not an empty dashboard: it is a company
  // whose payroll has not started. Say that, rather than rendering six cards of nothing.
  if (runs.length === 0) {
    return (
      <div className='flex flex-col gap-6'>
        {header()}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>No payroll yet</CardTitle>
            <CardDescription>
              No pay run has been calculated for {entity.name}. It will appear here as soon as one is.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

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

  // A company whose latest run is August has nothing for September, and the page should say so
  // rather than let August read as current. `state` itself is read further up, before the branch
  // for a company that has no payroll at all.
  const stateDetail = entityStateDetail(undefined, state)

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
  const basePath = `/payroll/entities/${entity.id}`

  const workspace = entityWorkspace({
    run: currentRun,
    runs: [...runs].reverse(),
    basePath,
    currencySymbol: symbol,
    daysToCutoff,
    blockingCount: exceptionCounts.blocking,
    exceptions: filteredExceptionRows,
    departmentFilter: selectedDepartment && { id: selectedDepartment.id, name: selectedDepartment.name },
    metrics,
    kpiCaption: `${currentRun.reference} · ${currentRun.periodStart} to ${currentRun.periodEnd}`,
    grossToNet: grossToNetBridge(currentRun),
    readiness: { percent: readiness.percent, checks: readiness.checks },
    overtime: {
      points: overtimePoints,
      target: OVERTIME_TARGET_SHARE,
      hours: overtime.hours,
      cost: formatMoney(overtime.cost)
    },
    departments: departmentRows,
    selectedDepartmentId: selectedDepartment?.id,
    costTrend
  })

  return (
    <WorkspaceCustomisation workspaceId={workspace.id} modules={workspaceModules(workspace)}>
      <div className='flex flex-col gap-6'>
        {header(
          {
            id: currentRun.id,
            reference: currentRun.reference,
            periodStart: currentRun.periodStart,
            periodEnd: currentRun.periodEnd,
            employeeCount: currentRun.employeeCount
          },
          <CustomiseWorkspaceAction />
        )}

        {state === 'awaiting_data' && (
          <Card>
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>{stateDetail}</CardTitle>
              <CardDescription>
                The figures below are {currentRun.reference}, the most recent calculation. This company is not included
                in the group total for the open period.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <WorkspaceGrid definition={workspace} />
      </div>
    </WorkspaceCustomisation>
  )
}

export default EntityPayrollPage
