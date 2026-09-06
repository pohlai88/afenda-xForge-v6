// Type Imports
import type { CurrencyCode } from '@/types/common/primitive-types'
import type { ConsolidationDimension, FxBasis, GroupPeriodOption } from '@/types/payroll/group-types'

// Component Imports
import ConsolidateBy from '@/views/payroll/group/consolidate-by'
import EntityControlMatrix from '@/views/payroll/group/entity-control-matrix'
import GroupHero from '@/views/payroll/group/group-hero'
import GroupMovement from '@/views/payroll/group/group-movement'
import GroupPaymentExposure, { type EntityExposure } from '@/views/payroll/group/group-payment-exposure'
import GroupReadiness from '@/views/payroll/group/group-readiness'
import GroupSelectors from '@/views/payroll/group/group-selectors'

// Action Imports
import {
  getDepartments,
  getEmployees,
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
 * What payroll means across every company at once: what the group costs, what went into that
 * number, what is missing from it, how much of it can still change, and where it moved. One
 * company's own dashboard is `/payroll/entities/[entityId]`, one run is `/payroll/runs/[runId]`.
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
  const [params, group, entities, runs, employees, departments, rates, settings, accounts, settlements] =
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
    getSettlements()
  ])

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

  const comparisonLabel = consolidation.previous ? periodLabel(consolidation.previous.period) : 'the previous period'

  // Freshness is two facts about the data, never the render clock: a clock would report when the
  // page was opened and let a fortnight-old consolidation look freshly made on reload.
  const freshness = consolidation.freshness.newestCalculationAt
    ? `Newest calculation ${formatDate(consolidation.freshness.newestCalculationAt.slice(0, 10))} · rates ${periodLabel(consolidation.freshness.ratesAsOf)}`
    : `No calculation included · rates ${periodLabel(consolidation.freshness.ratesAsOf)}`

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='flex min-w-0 flex-col gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Group payroll</h1>
          <p className='text-muted-foreground text-sm'>
            {group.name} · {consolidation.entityCount} companies · {consolidation.countryCount} countries ·{' '}
            {consolidation.currencyCount} currencies
          </p>
          <p className='text-muted-foreground text-xs'>{freshness}</p>
        </div>

        <GroupSelectors query={query} defaults={defaults} periods={periods} currencies={[...CURRENCY_CODES]} />
      </header>

      <div className='grid grid-cols-6 gap-6'>
        <GroupHero
          consolidation={consolidation}
          comparisonLabel={comparisonLabel}
          className='col-span-full lg:col-span-4'
        />

        <GroupReadiness consolidation={consolidation} className='col-span-full lg:col-span-2' />

        <EntityControlMatrix
          consolidation={consolidation}
          returnTo={groupHref(query, defaults)}
          className='col-span-full'
        />

        <GroupPaymentExposure consolidation={consolidation} exposures={exposures} className='col-span-full' />

        <GroupMovement consolidation={consolidation} className='col-span-full' />

        <ConsolidateBy
          consolidation={consolidation}
          breakdown={breakdown}
          query={query}
          defaults={defaults}
          className='col-span-full'
        />
      </div>
    </div>
  )
}

export default GroupPayrollPage
