// Next Imports
import { notFound } from 'next/navigation'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'

// Component Imports
import EntityAttention, { type EntityAttentionItem } from '@/views/payroll/entity/entity-attention'
import EntityDepartment, { type DepartmentRow } from '@/views/payroll/entity/entity-department'
import EntityFunding, { type FundingPosition } from '@/views/payroll/entity/entity-funding'
import EntityGrossToNet from '@/views/payroll/entity/entity-gross-to-net'
import EntityIdentity from '@/views/payroll/entity/entity-identity'
import EntityNextAction, { type ActionableContext } from '@/views/payroll/entity/entity-next-action'
import EntityObligations, { type ObligationRow } from '@/views/payroll/entity/entity-obligations'
import EntityPayrollState from '@/views/payroll/entity/entity-payroll-state'
import EntityPeriodComparison, { countRow, moneyRow } from '@/views/payroll/entity/entity-period-comparison'
import EntityRunHistory from '@/views/payroll/entity/entity-run-history'
import EntityRunTotals from '@/views/payroll/entity/entity-run-totals'
import PaymentReadiness from '@/views/payroll/payments/payment-readiness'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Action Imports
import {
  getDepartments,
  getEmployees,
  getFilings,
  getFundingAccounts,
  getLegalEntity,
  getPayRuns,
  getPayrollSettings,
  getPayslipsForRun,
  getSettlementBatches,
  getSettlements
} from '@/app/server/actions'

// Util Imports
import { currencyDigits, currencySymbol, formatMoney } from '@/utils/money'
import { FILING_KIND_LABELS } from '@/utils/payroll-compliance'
import {
  costByDepartment,
  countExceptions,
  daysBetween,
  EXCEPTION_SEVERITY_ORDER,
  grossToNetBridge,
  PAY_RUN_STATUS_LABELS
} from '@/utils/payroll-metrics'
import { fundingSummary, paymentReadiness } from '@/utils/payroll-payments'
import { latestRunFor, periodKeyOf, periodLabel, previousRunOf, runsForEntity } from '@/utils/payroll-group'

/**
 * Once a run reaches one of these it is finished, so it is not payroll work anybody can still do.
 *
 * Membership, not rank. This decides which runs are open, never which open run matters most —
 * the domain holds no record that would make the second claim true.
 */
const TERMINAL_STATUSES = new Set<PayRun['status']>(['paid', 'closed', 'cancelled', 'failed'])

/** How close a dated obligation has to be before it is worth listing. Forward-looking only. */
const OBLIGATION_LIMIT = 6

/** What a validated return path is called, so the control names where it goes rather than 'Back'. */
const RETURN_LABELS: { prefix: string; label: string }[] = [
  { prefix: '/payroll/runs', label: 'Payroll runs' },
  { prefix: '/payroll/payments', label: 'Payments' },
  { prefix: '/payroll/compliance', label: 'Compliance' },
  { prefix: '/payroll/reports', label: 'Reports' },
  { prefix: '/payroll', label: 'Group payroll' }
]

/** What happens if an exception is left, in the interface's voice. Severity alone is not work. */
const CONSEQUENCE: Record<string, string> = {
  blocking: 'This payroll cannot be approved until it is cleared.',
  error: 'It needs a decision before the figures can be relied on.',
  warning: 'Approval will ask someone to sign off over it.',
  info: 'Recorded for the audit trail. Nothing is blocked.'
}

type Props = {
  params: Promise<{ entityId: string }>
  searchParams: Promise<{ run?: string; dept?: string; return?: string }>
}

export const generateMetadata = async ({ params }: Props) => {
  const entity = await getLegalEntity((await params).entityId)

  return { title: entity ? `${entity.name} · Payroll` : 'Payroll entity' }
}

/**
 * One company's payroll. `/payroll` is the group above it; `/payroll/runs/[runId]` is the
 * workspace below.
 *
 * Four bands, in one order that does not change: what this payroll is doing and the next step
 * (OPERATE), what is stopping it and what is dated (ATTEND), what the run contains (INSPECT), and
 * how it moved (UNDERSTAND). It is not a dashboard — nothing here is on the page because the grid
 * had room for it.
 *
 * `?run=` selects a past run of this entity; unknown falls back to the latest. `?dept=` scopes the
 * attention surface to one department; unknown is dropped. `?return=` is where the header control
 * goes back to, and it is validated as a same-origin payroll path before anything follows it.
 */
const EntityPayrollPage = async ({ params, searchParams }: Props) => {
  const [{ entityId }, { run: requestedReference, dept: requestedDepartmentId, return: returnTo }] = await Promise.all([
    params,
    searchParams
  ])

  const entity = await getLegalEntity(entityId)

  if (!entity) notFound()

  const [allRuns, employees, departments, settings, filings] = await Promise.all([
    getPayRuns(),
    getEmployees(),
    getDepartments(),
    getPayrollSettings(),
    getFilings()
  ])

  // Sorted by period through the shared helper rather than trusted in fixture order. The same
  // helper P01 uses, so the two surfaces cannot disagree about what "the latest run" means.
  const runs = runsForEntity(allRuns, entity.id)

  // A return path arrives in the URL and is therefore untrusted. Only a same-origin payroll path
  // is followed; anything else — an absolute URL, a protocol-relative one — is dropped for the
  // plain group route. A navigation target taken raw from a query parameter is an open redirect.
  const backHref = returnTo && /^\/payroll(?:[/?#]|$)/.test(returnTo) ? returnTo : '/payroll'
  const backLabel = RETURN_LABELS.find(candidate => backHref.startsWith(candidate.prefix))?.label ?? 'Group payroll'

  // The clock is read once, here, and passed down as a value. Components that read it themselves
  // render differently on the server and the client, which is a hydration bug.
  const today = new Date().toISOString().slice(0, 10)

  // The open period is the newest any company has calculated — a group fact, not this company's
  // own latest. That distinction is the whole point: a company whose last run was August has
  // nothing for September, and the page has to be able to say so.
  const openPeriodKey = [...new Set(allRuns.map(periodKeyOf))].sort().at(-1)
  const openPeriodLabel = openPeriodKey ? periodLabel(openPeriodKey) : undefined
  const openPeriodRun = openPeriodKey ? runs.find(run => periodKeyOf(run) === openPeriodKey) : undefined

  if (runs.length === 0) {
    return (
      <div className='flex flex-col gap-6'>
        <EntityIdentity
          entity={entity}
          backHref={backHref}
          backLabel={backLabel}
          openPeriodLabel={openPeriodLabel}
          className='flex flex-col gap-1'
        />
        <Card>
          <CardHeader>
            <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
              No payroll yet
            </CardTitle>
            <CardDescription>
              No pay run has been calculated for {entity.name}. It will appear here as soon as one is.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // An unknown reference falls back to the latest rather than 404ing, so a stale bookmark still
  // lands somewhere useful. This is an identity lookup, not a choice between candidates.
  const requested = requestedReference ? runs.find(run => run.reference === requestedReference) : undefined
  const currentRun = requested ?? latestRunFor(runs)!

  // The run before the *selected* one, for this entity. Never `runs[index - 1]`.
  const previousRun = previousRunOf(allRuns, currentRun)

  // An unrecognised department id is dropped rather than kept, the same way an unknown run
  // reference falls back to the latest instead of filtering everything out silently.
  const selectedDepartment = requestedDepartmentId
    ? departments.find(department => department.id === requestedDepartmentId)
    : undefined

  const [slips, previousSlips, runSettlements, accounts, batches] = await Promise.all([
    getPayslipsForRun(currentRun.id),
    previousRun ? getPayslipsForRun(previousRun.id) : Promise.resolve([]),
    getSettlements(currentRun.id),
    getFundingAccounts(),
    getSettlementBatches()
  ])

  /*
   * Into the run workspace, with no return parameter.
   *
   * P02 carries `?return=` inbound because P01 sets it and this page reads it. The run workspace
   * does not: its page takes no search params, and the workspace itself reads only `view` and
   * `employee`. Appending a return destination there would put a parameter in the address that
   * nothing consumes, which looks like context preservation without being it. The capability gap
   * is recorded as S5-C2 rather than papered over from this side — P02 does not get to invent
   * P04's contract.
   */
  const runHref = (run: Pick<PayRun, 'id'>, view?: string) => `/payroll/runs/${run.id}${view ? `?${view}` : ''}`

  /* ---------------------------------------------------------------------------------------- */
  /* OPERATE — what this payroll is doing, and the next step                                   */
  /* ---------------------------------------------------------------------------------------- */

  // Open runs of this employer. Ordered by period for display only: newest first because that is
  // how a reader scans a list of periods, with the reference as a stable tie-break. Nothing here
  // ranks them, because no domain record ranks them.
  const actionableRuns = runs
    .filter(run => !TERMINAL_STATUSES.has(run.status))
    .sort((a, b) => b.periodStart.localeCompare(a.periodStart) || a.reference.localeCompare(b.reference))

  const contexts: ActionableContext[] = actionableRuns.map(run => {
    const counts = countExceptions(run.exceptions)
    const blocking = counts.blocking + counts.error

    return {
      runId: run.id,
      reference: run.reference,
      periodLabel: periodLabel(periodKeyOf(run)),
      statusLabel: PAY_RUN_STATUS_LABELS[run.status],
      blockerLabel: blocking > 0 ? `${blocking} to clear` : undefined,
      href: runHref(run)
    }
  })

  // One statement, not a banner plus an explanation. It says which period is open and which run
  // is on screen whenever those are different things.
  const periodStatement = !openPeriodRun
    ? `No run has been created for ${openPeriodLabel}. The figures below are ${currentRun.reference}, the most recent calculation, so this company is not in the group total for the open period.`
    : openPeriodRun.reference !== currentRun.reference
      ? `You are looking at ${currentRun.reference}. The open period is ${openPeriodLabel}, calculated as ${openPeriodRun.reference}.`
      : undefined

  /* ---------------------------------------------------------------------------------------- */
  /* ATTEND — what is stopping it, whether it can be funded, and what is dated                 */
  /* ---------------------------------------------------------------------------------------- */

  const employeeById = new Map(employees.map(employee => [employee.id, employee]))
  const departmentNames = new Map(departments.map(department => [department.id, department.name]))

  const daysToPayday = daysBetween(today, currentRun.payDate)

  const paydayLabel =
    daysToPayday < 0
      ? undefined
      : daysToPayday === 0
        ? 'Payday today'
        : `${daysToPayday} ${daysToPayday === 1 ? 'day' : 'days'} to payday`

  const openExceptions = currentRun.exceptions.filter(exception => !exception.resolvedAt)

  const scopedExceptions = selectedDepartment
    ? openExceptions.filter(exception => {
        const employee = exception.employeeId ? employeeById.get(exception.employeeId) : undefined

        return (exception.departmentId ?? employee?.departmentId) === selectedDepartment.id
      })
    : openExceptions

  const attentionItems: EntityAttentionItem[] = [...scopedExceptions]
    .sort(
      (a, b) =>
        EXCEPTION_SEVERITY_ORDER[a.severity] - EXCEPTION_SEVERITY_ORDER[b.severity] ||
        (b.impact?.amount ?? 0) - (a.impact?.amount ?? 0)
    )
    .map(exception => {
      const employee = exception.employeeId ? employeeById.get(exception.employeeId) : undefined

      const scope = employee
        ? `${employee.firstName} ${employee.lastName}`
        : exception.departmentId
          ? (departmentNames.get(exception.departmentId) ?? 'This run')
          : 'This run'

      return {
        id: exception.id,
        severity: exception.severity,
        scope,
        entityId: entity.id,
        title: exception.title,
        rule: exception.rule,
        reason: exception.message,
        consequence: CONSEQUENCE[exception.severity],
        dueLabel: paydayLabel,

        // A zero impact is not a small amount of money at stake, it is the domain saying this
        // exception has no financial size. Stating 'Worth nothing' beside it is noise.
        impactLabel: exception.impact && exception.impact.amount !== 0 ? formatMoney(exception.impact) : undefined,
        actionLabel: employee ? 'Open this employee' : 'Review exceptions',
        href: employee ? runHref(currentRun, `employee=${employee.id}`) : runHref(currentRun, 'view=exceptions')
      }
    })

  // The blocking tile counts the same set the list is showing. A company-wide count beside a
  // department-filtered list is two different answers to one question.
  const scopedCounts = countExceptions(scopedExceptions)

  /*
   * P02-DEF-001A. Funding is compared only against an account this company owns, and only when
   * that account's currency matches the run's. Everything else reports no position rather than a
   * number: an obligation in one currency subtracted from a balance in another is not a smaller
   * amount, it is not an amount at all.
   */
  const entityAccounts = accounts.filter(account => account.entityId === entity.id)
  const fundingAccount = entityAccounts.find(account => account.isDefault) ?? entityAccounts[0]
  const fundingProven = fundingAccount !== undefined && fundingAccount.currency === currentRun.currency

  const funding = fundingProven ? fundingSummary(runSettlements, fundingAccount, fundingAccount.currency) : undefined

  const fundingPosition: FundingPosition =
    funding && fundingAccount
      ? {
          state: 'resolved',
          summary: funding,
          accountLabel: `${fundingAccount.name} · ${fundingAccount.bankName} ····${fundingAccount.accountLast4}`
        }
      : {
          state: 'unresolved',
          reason: fundingAccount
            ? `${entity.name} funds payroll from an account held in ${fundingAccount.currency}, but ${currentRun.reference} pays in ${currentRun.currency}. Comparing them would need a rate the payroll domain does not hold.`
            : `No funding account is configured for ${entity.name}, so there is no balance of its own to compare this run against.`
        }

  const batch = batches.find(candidate => candidate.payRunId === currentRun.id)
  const readiness = funding ? paymentReadiness(currentRun, runSettlements, funding, batch) : undefined

  // Cut-offs and paydays from this company's own pay groups, and statutory dates from filings
  // that name it. Three kinds, which is every kind the domain stores.
  const payGroupIds = new Set(settings.payGroups.filter(group => group.entityId === entity.id).map(group => group.id))

  const obligations: ObligationRow[] = [
    ...settings.schedules
      .filter(schedule => payGroupIds.has(schedule.payGroupId) && schedule.status !== 'closed')
      .flatMap(schedule => [
        {
          id: `cutoff-${schedule.id}`,
          kind: 'cutoff' as const,
          label: `Input cut-off · ${schedule.label}`,
          date: schedule.cutoff,
          days: daysBetween(today, schedule.cutoff),
          href: runHref(currentRun)
        },
        {
          id: `payday-${schedule.id}`,
          kind: 'payday' as const,
          label: `Payday · ${schedule.label}`,
          date: schedule.payDate,
          days: daysBetween(today, schedule.payDate),
          href: `/payroll/payments?entity=${encodeURIComponent(entity.id)}`
        }
      ]),
    ...filings
      .filter(filing => filing.entityId === entity.id && filing.status !== 'accepted')
      .map(filing => ({
        id: `filing-${filing.id}`,
        kind: 'statutory' as const,
        label: `${FILING_KIND_LABELS[filing.kind]} due`,
        date: filing.dueDate,
        days: daysBetween(today, filing.dueDate),
        href: `/payroll/compliance?entity=${encodeURIComponent(entity.id)}`
      }))
  ]
    .filter(row => row.days >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, OBLIGATION_LIMIT)

  /* ---------------------------------------------------------------------------------------- */
  /* INSPECT — what is in this run                                                             */
  /* ---------------------------------------------------------------------------------------- */

  const departmentHeads = new Map(departments.map(department => [department.id, department.headEmployeeId]))

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

  /* ---------------------------------------------------------------------------------------- */
  /* UNDERSTAND — how it moved                                                                 */
  /* ---------------------------------------------------------------------------------------- */

  const comparisonRows = previousRun
    ? [
        moneyRow('Employer cost', currentRun.totals.employerCost, previousRun.totals.employerCost),
        moneyRow('Gross payroll', currentRun.totals.grossPay, previousRun.totals.grossPay),
        moneyRow('Net payroll', currentRun.totals.netPay, previousRun.totals.netPay),
        countRow('Headcount', currentRun.employeeCount, previousRun.employeeCount)
      ]
    : []

  const daysToCutoff = TERMINAL_STATUSES.has(currentRun.status) ? null : daysBetween(today, currentRun.cutoffAt)

  return (
    <div className='flex flex-col gap-10'>
      {/* OPERATE */}
      <section className='flex flex-col gap-4'>
        <EntityIdentity
          entity={entity}
          backHref={backHref}
          backLabel={backLabel}
          openPeriodLabel={openPeriodLabel}
          displayedRunReference={currentRun.reference}
          displayedRunStatusLabel={PAY_RUN_STATUS_LABELS[currentRun.status]}
          className='flex flex-col gap-1'
        />

        {periodStatement && (
          <p role='status' className='text-warning-strong text-sm'>
            {periodStatement}
          </p>
        )}

        <EntityNextAction contexts={contexts} />

        <EntityPayrollState
          run={currentRun}
          daysToCutoff={daysToCutoff}
          blockingCount={scopedCounts.blocking}
          blockingScope={selectedDepartment?.name}
          runHref={runHref(currentRun)}
        />
      </section>

      {/* ATTEND */}
      <section className='flex flex-col gap-6'>
        <EntityAttention
          items={attentionItems}
          departmentFilter={selectedDepartment && { id: selectedDepartment.id, name: selectedDepartment.name }}
          clearFilterHref={`/payroll/entities/${entity.id}?run=${encodeURIComponent(currentRun.reference)}`}
          checkedLabel={`Nothing is outstanding on ${currentRun.reference}. Bank details, tax identifiers, overtime, budget variance, negative net pay and off-cycle payments were all checked.`}
        />

        <div className='grid gap-6 lg:grid-cols-2'>
          <EntityFunding position={fundingPosition} />
          {readiness && <PaymentReadiness percent={readiness.percent} checks={readiness.checks} />}
          <EntityObligations rows={obligations} className={readiness ? 'lg:col-span-2' : undefined} />
        </div>
      </section>

      {/* INSPECT */}
      <section className='flex flex-col gap-6'>
        <EntityRunTotals run={currentRun} />

        <div className='grid gap-6 lg:grid-cols-2'>
          <EntityGrossToNet
            steps={grossToNetBridge(currentRun)}
            currencySymbol={currencySymbol(currentRun.currency)}
            currencyDigits={currencyDigits(currentRun.currency)}
          />
          <EntityDepartment
            departments={departmentRows}
            runReference={currentRun.reference}
            selectedDepartmentId={selectedDepartment?.id}
            basePath={`/payroll/entities/${entity.id}`}
          />
        </div>

        <EntityRunHistory
          runs={[...runs].reverse()}
          selectedReference={currentRun.reference}
          basePath={`/payroll/entities/${entity.id}`}
        />
      </section>

      {/* UNDERSTAND — absent when there is no prior run to compare against. */}
      {previousRun && <EntityPeriodComparison rows={comparisonRows} baselineReference={previousRun.reference} />}
    </div>
  )
}

export default EntityPayrollPage
