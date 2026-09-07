// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon } from 'lucide-react'

// Type Imports
import type { CurrencyCode } from '@/types/common/primitive-types'
import type { ConsolidationDimension, FxBasis, GroupPeriodOption } from '@/types/payroll/group-types'

// Component Imports
import { Button } from '@/components/ui/button'
import ConsolidateBy from '@/views/payroll/group/consolidate-by'
import EntityControlMatrix from '@/views/payroll/group/entity-control-matrix'
import GroupAttention from '@/views/payroll/group/group-attention'
import GroupChanges from '@/views/payroll/group/group-changes'
import GroupHero from '@/views/payroll/group/group-hero'
import GroupMovement from '@/views/payroll/group/group-movement'
import GroupNextActions from '@/views/payroll/group/group-next-actions'
import GroupOnTrack from '@/views/payroll/group/group-on-track'
import GroupPaymentExposure, { type EntityExposure } from '@/views/payroll/group/group-payment-exposure'
import GroupReadiness from '@/views/payroll/group/group-readiness'
import GroupSelectors from '@/views/payroll/group/group-selectors'
import GroupStatutory from '@/views/payroll/group/group-statutory'
import GroupTimeline from '@/views/payroll/group/group-timeline'

// Action Imports
import {
  getDepartments,
  getEmployees,
  getFilings,
  getFxRates,
  getLegalEntities,
  getPayRuns,
  getPayrollGroup,
  getPayrollSettings,
  getPayslipsForRun,
  getFundingAccounts,
  getSettlements
} from '@/app/server/actions'

// Util Imports
import { CONSOLIDATION_DIMENSIONS, FX_BASES } from '@/types/payroll/group-types'
import { CURRENCY_CODES } from '@/types/common/primitive-types'
import { formatDate } from '@/utils/payroll-workspace'
import { consolidate, consolidateBy, periodKeyOf, periodLabel } from '@/utils/payroll-group'
import {
  groupAttention,
  groupChanges,
  groupNextActions,
  groupStatutory,
  groupTimeline,
  type ExposureInput
} from '@/utils/payroll-group-attention'
import {
  COMPARISON_BASES,
  GROUP_DEFAULTS,
  groupHref,
  type ComparisonBasis,
  type GroupQuery
} from '@/views/payroll/group/group-query'

export const metadata = { title: 'Group payroll' }

/**
 * Group Payroll Control.
 *
 * Two zones, and the order between them is the point. **Operate** answers whether the group is on
 * track and where somebody must act: readiness, what needs attention, what to do next, and the
 * company matrix. **Reconcile** answers what payroll means across every company at once: what the
 * group costs, what went into that number, what is missing from it, how much of it can still
 * change, and where it moved.
 *
 * They are separated rather than merged because they are two questions with two dominant figures,
 * and a page that leads with both leads with neither. The matrix sits between them, so the
 * readiness figure and the cost figure are never competing focal points in one viewport. The
 * reasoning is recorded as a declared divergence in
 * `.architecture/payroll/P01-group-payroll-control.yaml`; it is settled, not open.
 *
 * One company's own dashboard is `/payroll/entities/[entityId]`, one run is `/payroll/runs/[runId]`.
 *
 * Every analytical choice lives in the URL — period, reporting currency, exchange rate basis,
 * dimension, comparison — so a view someone builds can be shared, and so this page can stay a
 * server component with only the controls and the drawers on the client.
 *
 * Unknown values fall back to a default rather than 404ing: a stale bookmark should still land
 * somewhere useful.
 */
type Props = {
  searchParams: Promise<{
    period?: string
    currency?: string
    basis?: string
    by?: string
    compare?: string
  }>
}

const GroupPayrollPage = async ({ searchParams }: Props) => {
  const [params, group, entities, runs, employees, departments, rates, settings, accounts, settlements, filings] =
    await Promise.all([
      searchParams,
      getPayrollGroup(),
      getLegalEntities(),
      getPayRuns(),
      getEmployees(),
      getDepartments(),
      getFxRates(),
      getPayrollSettings(),
      getFundingAccounts(),
      getSettlements(),
      getFilings()
    ])

  // Read once, here, and passed down as a value. A component that reads the clock renders a
  // different page every time it is re-rendered, and every countdown below is derived from this.
  const today = new Date().toISOString().slice(0, 10)

  // Every period any company has calculated, newest last. The selector offers these and nothing
  // else, so a period with no data anywhere can never be chosen.
  const periodKeys = [...new Set(runs.map(periodKeyOf))].sort()

  const periods: GroupPeriodOption[] = periodKeys.map(value => ({ value, label: periodLabel(value) }))

  const defaults = {
    period: periodKeys.at(-1) ?? '2026-09',
    currency: group.reportingCurrency,
    basis: group.fxBasis
  }

  const query: GroupQuery = {
    period: params.period && periodKeys.includes(params.period) ? params.period : defaults.period,
    currency:
      params.currency && (CURRENCY_CODES as readonly string[]).includes(params.currency)
        ? (params.currency as CurrencyCode)
        : defaults.currency,
    basis:
      params.basis && (FX_BASES as readonly string[]).includes(params.basis)
        ? (params.basis as FxBasis)
        : defaults.basis,
    by:
      params.by && (CONSOLIDATION_DIMENSIONS as readonly string[]).includes(params.by)
        ? (params.by as ConsolidationDimension)
        : GROUP_DEFAULTS.by,
    compare:
      params.compare && (COMPARISON_BASES as readonly string[]).includes(params.compare)
        ? (params.compare as ComparisonBasis)
        : GROUP_DEFAULTS.compare
  }

  const payslipsByRun: Record<string, Awaited<ReturnType<typeof getPayslipsForRun>>> = {}

  await Promise.all(
    runs.map(async run => {
      payslipsByRun[run.id] = await getPayslipsForRun(run.id)
    })
  )

  const consolidation = consolidate({
    group,
    entities,
    runs,
    payslipsByRun,
    employees,
    rates,
    schedules: settings.schedules,
    period: query.period,
    basis: query.basis,
    reportingCurrency: query.currency
  })

  const breakdown = consolidateBy(consolidation, query.by, { employees, departments, payslipsByRun })

  // Can each company pay its own people? Deliberately per company and never converted: a
  // balance in Singapore cannot cover a shortfall in Vietnam, so there is no honest group
  // "available" figure to state.
  const exposures: EntityExposure[] = consolidation.entities
    .filter(row => row.run)
    .map(row => {
      const account =
        accounts.find(item => item.entityId === row.entity.id && item.isDefault) ??
        accounts.find(item => item.entityId === row.entity.id)

      const outstanding = settlements
        .filter(item => item.payRunId === row.run!.id && item.status !== 'paid' && !item.retryOfId)
        .reduce((total, item) => total + item.amount.amount, 0)

      const required = { amount: outstanding, currency: row.entity.currency }
      const available = account?.balance ?? { amount: 0, currency: row.entity.currency }

      return {
        entity: row.entity,
        required,
        available,
        headroom: { amount: available.amount - required.amount, currency: row.entity.currency },
        releasable: row.state === 'ready' || row.state === 'paid' || row.state === 'closed',
        accountName: account ? `${account.bankName} ····${account.accountLast4}` : undefined,
        href: `/payroll/payments?entity=${row.entity.id}`
      }
    })

  // The operational derivations take a flat shape rather than the exposure the payment card
  // renders: a util that reached into a view's props type would be the dependency pointing the
  // wrong way.
  const exposureInputs: ExposureInput[] = exposures.map(item => ({
    entityId: item.entity.id,
    entityName: item.entity.name,
    required: item.required,
    headroom: item.headroom,
    releasable: item.releasable,
    href: item.href
  }))

  const entityNames = new Map(entities.map(entity => [entity.id, entity.name]))

  const attention = groupAttention(consolidation.entities, exposureInputs, today)

  const nextActions = groupNextActions(
    consolidation.entities,
    exposureInputs,
    filings,
    entityNames,
    periodLabel(query.period),
    today
  )

  const statutory = groupStatutory(filings, entities, today)
  const timeline = groupTimeline(settings.schedules, settings.payGroups, filings, entities, today)
  const changes = groupChanges(employees, entities, query.period)
  const nextPayday = timeline.find(event => event.kind === 'payday')

  const comparisonLabel = consolidation.previous ? periodLabel(consolidation.previous.period) : 'the previous period'

  // Freshness is two facts about the data, never the render clock: a clock would report when the
  // page was opened and let a fortnight-old consolidation look freshly made on reload.
  const freshness = consolidation.freshness.newestCalculationAt
    ? `Newest calculation ${formatDate(consolidation.freshness.newestCalculationAt.slice(0, 10))} · rates ${periodLabel(consolidation.freshness.ratesAsOf)}`
    : `No calculation included · rates ${periodLabel(consolidation.freshness.ratesAsOf)}`

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-4'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex min-w-0 flex-col gap-1'>
            <h1 className='text-2xl font-semibold tracking-tight'>Group payroll</h1>
            <p className='text-muted-foreground text-sm'>
              {group.name} · {consolidation.entityCount} companies · {consolidation.countryCount} countries ·{' '}
              {consolidation.currencyCount} currencies
            </p>
            <p className='text-muted-foreground text-xs'>{freshness}</p>
          </div>

          {/* The one consequential action on this page. Everything else here is a scope control,
              and the sections below carry their own destinations. */}
          <Button className='w-fit shrink-0' render={<Link href='/payroll/runs' />} nativeButton={false}>
            Open run queue
            <ArrowRightIcon />
          </Button>
        </div>

        <GroupSelectors query={query} defaults={defaults} periods={periods} currencies={[...CURRENCY_CODES]} />
      </header>

      {/* Operate ----------------------------------------------------------------------------
          `items-start` rather than the grid's default stretch. Attention items carry a reason, a
          consequence and an action, so the card is far taller than the compact action rows beside
          it; stretched, Next actions ended in 350px of empty card, which reads as content that
          failed to load rather than as a short list. */}
      <div className='grid grid-cols-6 items-start gap-6'>
        <GroupOnTrack consolidation={consolidation} nextPayday={nextPayday} className='col-span-full' />

        <GroupAttention items={attention} className='col-span-full lg:col-span-3' />

        <GroupNextActions actions={nextActions} className='col-span-full lg:col-span-3' />

        <EntityControlMatrix
          consolidation={consolidation}
          returnTo={groupHref(query, defaults)}
          className='col-span-full'
        />
      </div>

      {/* Reconcile -------------------------------------------------------------------------- */}
      <section aria-labelledby='group-consolidation' className='flex flex-col gap-6 border-t pt-6'>
        <div className='flex flex-col gap-1'>
          <h2 id='group-consolidation' className='text-lg font-semibold tracking-tight'>
            Group consolidation
          </h2>
          <p className='text-muted-foreground text-sm'>
            What the group costs this period, what is in that number, and where it moved.
          </p>
        </div>

        <div className='grid grid-cols-6 items-start gap-6'>
          <GroupHero
            consolidation={consolidation}
            comparisonLabel={comparisonLabel}
            className='col-span-full lg:col-span-4'
          />

          <GroupReadiness consolidation={consolidation} className='col-span-full lg:col-span-2' />

          {/* What changed, in money and then in people. Movement stays full width: at half it
              truncated "Afenda Feed Vietnam Co. Ltd." to "Afenda Feed Vietnam Co. ", and which
              company moved the total is the only thing that card is for. */}
          <GroupMovement consolidation={consolidation} className='col-span-full' />

          <GroupChanges rows={changes} period={query.period} className='col-span-full' />

          <GroupPaymentExposure consolidation={consolidation} exposures={exposures} className='col-span-full' />

          {/* What happens next. Half width each — a third truncated the timeline's labels into
              "Input cut-off -…", which is the part of the row a reader actually needs. */}
          <GroupStatutory snapshot={statutory} className='col-span-full lg:col-span-3' />

          <GroupTimeline events={timeline} className='col-span-full lg:col-span-3' />

          <ConsolidateBy
            consolidation={consolidation}
            breakdown={breakdown}
            query={query}
            defaults={defaults}
            className='col-span-full'
          />
        </div>
      </section>
    </div>
  )
}

export default GroupPayrollPage
