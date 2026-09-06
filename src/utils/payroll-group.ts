// Type Imports
import type { CountryCode, CurrencyCode, FxQuote, Money } from '@/types/common/primitive-types'
import type { Employee, Department } from '@/types/hrm/employee-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { PayRun, Payslip } from '@/types/payroll/pay-run-types'
import type { PaySchedule } from '@/types/payroll/settings-types'
import type {
  Consolidation,
  ConsolidatedMoney,
  ConsolidationDimension,
  Coverage,
  DimensionBreakdown,
  DimensionRow,
  EntityPayrollState,
  EntityRow,
  EntityStateTier,
  Finality,
  FxBasis,
  FxRate,
  MeasureDefinition,
  MeasureKey,
  MovementLine,
  PayrollGroup,
  PeriodComparison,
  SourceCalculation
} from '@/types/payroll/group-types'

// Util Imports
import { addMoney, convertAllocated, convertMoney, inverseQuote, percentageOf, subtractMoney } from '@/utils/money'
import { countExceptions, exceptionStatusOf } from '@/utils/payroll-metrics'

/**
 * The consolidation layer: what payroll means across entities, countries and currencies.
 *
 * Two rules live here and nowhere else, because a copy of either is a copy that will disagree.
 *
 * The first is that measures do not all aggregate the same way. Money is translated and then
 * summed; headcount is a distinct count of people, since one person can sit on two payrolls; a
 * contribution rate cannot be combined at all. `MEASURES` records which is which.
 *
 * The second is that a consolidated number is meaningless without knowing what went into it.
 * Every figure this module produces carries its coverage, and an entity with no calculation is
 * named rather than quietly counted as nil.
 */

// ---------------------------------------------------------------------------
// Vocabularies, decided once
// ---------------------------------------------------------------------------

export const ENTITY_STATE_LABELS: Record<EntityPayrollState, string> = {
  awaiting_data: 'Awaiting data',
  in_progress: 'In progress',
  blocked: 'Blocked',
  review: 'Review',
  ready: 'Ready',
  paid: 'Paid',
  closed: 'Closed'
}

/**
 * Four tiers rather than seven colours. Seven equally saturated badges are a rainbow the eye
 * cannot sort; a tier says how much attention a row deserves before the label is read.
 */
export const ENTITY_STATE_TIER: Record<EntityPayrollState, EntityStateTier> = {
  awaiting_data: 'incomplete',
  in_progress: 'incomplete',
  blocked: 'attention',
  review: 'attention',
  ready: 'proceed',
  paid: 'complete',
  closed: 'complete'
}

export const ENTITY_STATE_STYLES: Record<EntityPayrollState, string> = {
  awaiting_data: 'bg-muted text-muted-foreground',
  in_progress: 'bg-muted text-muted-foreground',
  blocked: 'bg-destructive/10 text-destructive',
  review: 'bg-warning/15 text-warning',
  ready: 'bg-success/15 text-success',
  paid: 'bg-muted text-muted-foreground',
  closed: 'bg-muted text-muted-foreground'
}

/** Worst first, so a table sorted by state puts what cannot proceed at the top. */
export const ENTITY_STATE_ORDER: Record<EntityPayrollState, number> = {
  blocked: 0,
  awaiting_data: 1,
  in_progress: 2,
  review: 3,
  ready: 4,
  paid: 5,
  closed: 6
}

export const FINALITY_LABELS: Record<Finality, string> = {
  final: 'Final',
  provisional: 'Provisional',
  not_applicable: 'Not included'
}

export const FX_BASIS_LABELS: Record<FxBasis, string> = {
  pay_date_spot: 'Pay-date spot',
  period_end: 'Period end',
  period_average: 'Period average'
}

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  SG: 'Singapore',
  MY: 'Malaysia',
  VN: 'Vietnam'
}

export const DIMENSION_LABELS: Record<ConsolidationDimension, string> = {
  entity: 'Entity',
  country: 'Country',
  currency: 'Currency',
  department: 'Department',
  cost_centre: 'Cost centre',
  component: 'Component'
}

/**
 * How each measure combines. The `note` is shown where a reader might reasonably expect a
 * different answer — most often on headcount, which people expect to be a sum.
 */
export const MEASURES: Record<MeasureKey, MeasureDefinition> = {
  employer_cost: {
    key: 'employer_cost',
    label: 'Employer cost',
    aggregate: 'sum',
    fx: true,
    note: 'Translated into the reporting currency, then summed.'
  },
  net_pay: {
    key: 'net_pay',
    label: 'Net pay',
    aggregate: 'sum',
    fx: true,
    note: 'Translated into the reporting currency, then summed.'
  },
  gross_pay: {
    key: 'gross_pay',
    label: 'Gross pay',
    aggregate: 'sum',
    fx: true,
    note: 'Translated into the reporting currency, then summed.'
  },
  employee_deductions: {
    key: 'employee_deductions',
    label: 'Employee deductions',
    aggregate: 'sum',
    fx: true,
    note: 'Translated into the reporting currency, then summed.'
  },
  employee_taxes: {
    key: 'employee_taxes',
    label: 'Employee taxes',
    aggregate: 'sum',
    fx: true,
    note: 'Translated into the reporting currency, then summed.'
  },
  employer_contributions: {
    key: 'employer_contributions',
    label: 'Employer contributions',
    aggregate: 'sum',
    fx: true,
    note: 'Statutory liability stays local; only the cost is consolidated.'
  },
  headcount: {
    key: 'headcount',
    label: 'Employees',
    aggregate: 'unique',
    fx: false,
    note: 'Counted once per person. Someone on two payrolls is one employee, not two.'
  },
  fte: {
    key: 'fte',
    label: 'Full-time equivalent',
    aggregate: 'sum',
    fx: false,
    note: 'Capacity adds up across entities; headcount does not.'
  },
  average_cost: {
    key: 'average_cost',
    label: 'Average cost per employee',
    aggregate: 'derived',
    fx: true,
    note: 'Recomputed from the consolidated total and unique headcount, never averaged.'
  },
  contribution_rate: {
    key: 'contribution_rate',
    label: 'Contribution rate',
    aggregate: 'none',
    fx: false,
    note: 'Rates belong to a country and cannot be combined. Shown per entity only.'
  },
  readiness: {
    key: 'readiness',
    label: 'Readiness',
    aggregate: 'derived',
    fx: false,
    note: 'Derived from entity states, not averaged.'
  }
}

// ---------------------------------------------------------------------------
// Periods and runs
// ---------------------------------------------------------------------------

/** 'YYYY-MM' for a run, taken from the period it pays rather than from its id. */
export const periodKeyOf = (run: PayRun): string => run.periodStart.slice(0, 7)

export const previousPeriodKey = (period: string): string => {
  const [year, month] = period.split('-').map(Number)

  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`
}

export const periodLabel = (period: string): string => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const [year, month] = period.split('-').map(Number)

  return `${months[month - 1]} ${year}`
}

/**
 * The run before this one, for the same entity.
 *
 * Emphatically not `runs[index - 1]`. That worked while every run belonged to one company; with
 * several entities interleaved in one array it silently compares a Singapore run with a
 * Malaysian one, and every variance built on it is nonsense.
 */
export const previousRunOf = (runs: PayRun[], run: PayRun): PayRun | undefined =>
  runs
    .filter(candidate => candidate.entityId === run.entityId && candidate.periodEnd < run.periodStart)
    .sort((a, b) => a.periodEnd.localeCompare(b.periodEnd))
    .at(-1)

export const runsForEntity = (runs: PayRun[], entityId: string): PayRun[] =>
  runs.filter(run => run.entityId === entityId).sort((a, b) => a.periodStart.localeCompare(b.periodStart))

/**
 * Where an entity stands on a period.
 *
 * Blocked outranks review deliberately. The approval policy refuses over an open blocking
 * exception whatever has been signed, so a run carrying one cannot advance; calling it "in
 * review" would describe the paperwork rather than the position.
 */
export const entityStateOf = (run: PayRun | undefined): EntityPayrollState => {
  if (!run) return 'awaiting_data'

  if (run.status === 'draft' || run.status === 'calculating' || run.status === 'cancelled') return 'awaiting_data'
  if (run.status === 'closed') return 'closed'
  if (run.status === 'paid') return 'paid'

  const blocking = run.exceptions.filter(
    exception => exception.severity === 'blocking' && exceptionStatusOf(exception) !== 'resolved'
  ).length

  if (run.status === 'failed' || blocking > 0) return 'blocked'
  if (run.status === 'approved') return 'ready'
  if (run.status === 'pending_approval') return 'review'

  return 'in_progress'
}

/**
 * Whether the figure can still move.
 *
 * Distinct from state and from coverage. "Included" says the number is in the total; it does not
 * say the number is settled, and a reader who takes one for the other has been misled.
 */
export const finalityOf = (run: PayRun | undefined): Finality => {
  if (!run) return 'not_applicable'

  return run.status === 'approved' || run.status === 'paid' || run.status === 'closed' ? 'final' : 'provisional'
}

/** One line saying what the state means for this entity, in the interface's voice. */
export const entityStateDetail = (
  run: PayRun | undefined,
  state: EntityPayrollState,
  schedule?: PaySchedule
): string => {
  if (!run) {
    return schedule
      ? `Period open since ${schedule.periodStart} — no run has been created`
      : 'No run has been created for this period'
  }

  const counts = countExceptions(run.exceptions)

  switch (state) {
    case 'blocked':
      return counts.blocking === 1 ? '1 blocking exception' : `${counts.blocking} blocking exceptions`
    case 'review':
      return counts.open > 0 ? `Awaiting approval · ${counts.open} open findings` : 'Awaiting approval'
    case 'in_progress':
      return 'Calculated, not yet reviewed'
    case 'ready':
      return 'Approved and ready to pay'
    case 'paid':
      return 'Paid'
    case 'closed':
      return 'Closed'
    default:
      return 'Awaiting data'
  }
}

// ---------------------------------------------------------------------------
// Exchange rates
// ---------------------------------------------------------------------------

const IDENTITY = (currency: CurrencyCode): FxQuote => ({
  from: currency,
  to: currency,
  numerator: 1,
  denominator: 1
})

/**
 * Find the rate between two currencies.
 *
 * Deliberately does not triangulate through a third currency. A missing pair is a coverage gap
 * with a reason the interface can state; a rate invented by chaining two others is a number
 * nobody quoted, which is exactly the sort of unprovable figure this module exists to refuse.
 */
export const quoteFor = (quotes: FxQuote[], from: CurrencyCode, to: CurrencyCode): FxQuote | undefined => {
  if (from === to) return IDENTITY(from)

  const direct = quotes.find(quote => quote.from === from && quote.to === to)

  if (direct) return direct

  const reverse = quotes.find(quote => quote.from === to && quote.to === from)

  return reverse ? inverseQuote(reverse) : undefined
}

export const rateFor = (
  rates: FxRate[],
  options: { from: CurrencyCode; to: CurrencyCode; period: string; basis: FxBasis }
): FxQuote | undefined =>
  quoteFor(
    rates.filter(rate => rate.period === options.period && rate.basis === options.basis),
    options.from,
    options.to
  )

// ---------------------------------------------------------------------------
// Consolidation
// ---------------------------------------------------------------------------

export type ConsolidateInput = {
  group: PayrollGroup
  entities: LegalEntity[]
  runs: PayRun[]
  payslipsByRun: Record<string, Payslip[]>
  employees: Employee[]
  rates: FxRate[]
  schedules?: PaySchedule[]
  period: string
  basis?: FxBasis
  reportingCurrency?: CurrencyCode

  /** False for the inner previous-period pass, so the comparison does not recurse forever. */
  compare?: boolean
}

type Prepared = {
  entity: LegalEntity
  run?: PayRun
  state: EntityPayrollState
  finality: Finality
  included: boolean
  excludedReason?: string
  quote?: FxQuote
  slips: Payslip[]
}

const MEASURE_OF = {
  employer_cost: (run: PayRun) => run.totals.employerCost,
  net_pay: (run: PayRun) => run.totals.netPay,
  gross_pay: (run: PayRun) => run.totals.grossPay
} as const

type MoneyMeasure = keyof typeof MEASURE_OF

const zero = (currency: CurrencyCode): Money => ({ amount: 0, currency })

const prepare = (input: ConsolidateInput): Prepared[] => {
  const basis = input.basis ?? input.group.fxBasis
  const reporting = input.reportingCurrency ?? input.group.reportingCurrency

  return input.group.entityIds.map(entityId => {
    const entity = input.entities.find(candidate => candidate.id === entityId)

    if (!entity) throw new Error(`Group references unknown entity '${entityId}'.`)

    const run = input.runs.find(candidate => candidate.entityId === entityId && periodKeyOf(candidate) === input.period)

    const state = entityStateOf(run)
    const finality = finalityOf(run)

    if (!run || state === 'awaiting_data') {
      return {
        entity,
        run,
        state: 'awaiting_data' as const,
        finality: 'not_applicable' as const,
        included: false,
        excludedReason: `${entity.name} has no calculation for ${periodLabel(input.period)}`,
        slips: []
      }
    }

    const quote = rateFor(input.rates, { from: entity.currency, to: reporting, period: input.period, basis })

    if (!quote) {
      return {
        entity,
        run,
        state,
        finality,
        included: false,
        excludedReason: `No ${FX_BASIS_LABELS[basis].toLowerCase()} rate from ${entity.currency} to ${reporting} for ${periodLabel(input.period)}`,
        slips: input.payslipsByRun[run.id] ?? []
      }
    }

    return { entity, run, state, finality, included: true, quote, slips: input.payslipsByRun[run.id] ?? [] }
  })
}

const consolidateMeasure = (
  prepared: Prepared[],
  measure: MoneyMeasure,
  reporting: CurrencyCode,
  budgetRates: FxQuote[]
): ConsolidatedMoney => {
  const included = prepared.filter(row => row.included && row.run && row.quote)

  const converted = included.map(row => convertMoney(MEASURE_OF[measure](row.run!), row.quote!))

  const atBudget = included.map(row => {
    const budget = quoteFor(budgetRates, row.entity.currency, reporting)

    // No budget rate for this pair means the bridge cannot be split for it. Falling back to the
    // period rate makes its FX movement zero, which is honest: nothing is being claimed about a
    // budget that was never set.
    return convertMoney(MEASURE_OF[measure](row.run!), budget ?? row.quote!)
  })

  const total = addMoney(converted, reporting)
  const budgetTotal = addMoney(atBudget, reporting)

  const byCurrency = [...new Set(included.map(row => row.entity.currency))].map(currency => {
    const rows = included.filter(row => row.entity.currency === currency)

    return {
      currency,
      local: addMoney(
        rows.map(row => MEASURE_OF[measure](row.run!)),
        currency
      ),
      entities: rows.length,
      quote: rows[0]?.quote,
      converted: addMoney(
        rows.map(row => convertMoney(MEASURE_OF[measure](row.run!), row.quote!)),
        reporting
      )
    }
  })

  const measureKey: MeasureKey =
    measure === 'employer_cost' ? 'employer_cost' : measure === 'net_pay' ? 'net_pay' : 'gross_pay'

  return {
    measure: measureKey,
    total,
    atBudget: budgetTotal,
    fxMovement: subtractMoney(total, budgetTotal),
    byCurrency
  }
}

const buildCoverage = (
  prepared: Prepared[],
  reporting: CurrencyCode,
  employerCost: ConsolidatedMoney,
  previousCost: Money | undefined,
  previousHeadcount: number | undefined,
  uniqueHeadcount: number
): Coverage => {
  const included = prepared.filter(row => row.included)
  const missing = prepared.filter(row => !row.included)

  const byState = Object.fromEntries(
    (Object.keys(ENTITY_STATE_LABELS) as EntityPayrollState[]).map(state => [
      state,
      prepared.filter(row => row.state === state).length
    ])
  ) as Record<EntityPayrollState, number>

  const provisionalRows = included.filter(row => row.finality === 'provisional' && row.run && row.quote)

  const provisionalAmount = addMoney(
    provisionalRows.map(row => convertMoney(row.run!.totals.employerCost, row.quote!)),
    reporting
  )

  const expectedCost = previousCost ?? employerCost.total

  return {
    entities: {
      included: included.length,
      total: prepared.length,
      missing: missing.map(row => ({
        entityId: row.entity.id,
        entityName: row.entity.name,
        reason: row.excludedReason ?? 'Not included'
      }))
    },
    employees: {
      counted: uniqueHeadcount,
      expected: previousHeadcount ?? uniqueHeadcount,
      percent: previousHeadcount ? Math.min(100, (uniqueHeadcount / previousHeadcount) * 100) : 100
    },
    expectedCost: {
      covered: employerCost.total,
      expected: expectedCost,
      percent: expectedCost.amount === 0 ? 100 : Math.min(100, percentageOf(employerCost.total, expectedCost))
    },
    provisional: {
      count: provisionalRows.length,
      amount: provisionalAmount,
      share: employerCost.total.amount === 0 ? 0 : percentageOf(provisionalAmount, employerCost.total)
    },
    byState,
    complete: missing.length === 0
  }
}

const comparisonLine = (
  measure: MeasureKey,
  current: Money,
  previous: Money,
  currentAtPreviousRates: Money
): PeriodComparison['employerCost'] => {
  const change = subtractMoney(current, previous)
  const constantCurrencyChange = subtractMoney(currentAtPreviousRates, previous)

  return {
    measure,
    current,
    previous,
    change,
    changePercent: previous.amount === 0 ? null : (change.amount / Math.abs(previous.amount)) * 100,
    constantCurrencyChange,
    fxEffect: subtractMoney(change, constantCurrencyChange)
  }
}

/**
 * Consolidate one period.
 *
 * Every money figure is translated per entity and then summed; nothing is added across
 * currencies. Coverage is computed from the same pass, so a total and the statement of what it
 * includes can never drift apart.
 */
export const consolidate = (input: ConsolidateInput): Consolidation => {
  const basis = input.basis ?? input.group.fxBasis
  const reporting = input.reportingCurrency ?? input.group.reportingCurrency
  const prepared = prepare(input)
  const included = prepared.filter(row => row.included && row.run && row.quote)

  const employerCost = consolidateMeasure(prepared, 'employer_cost', reporting, input.group.budgetRates)
  const netPay = consolidateMeasure(prepared, 'net_pay', reporting, input.group.budgetRates)
  const grossPay = consolidateMeasure(prepared, 'gross_pay', reporting, input.group.budgetRates)

  // Headcount is a distinct count of people. Adding the entities' own counts would double-count
  // anyone who sits on two payrolls, which is precisely the error a group figure must not make.
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const row of included) {
    const ids = row.slips.length > 0 ? row.slips.map(slip => slip.employeeId) : []

    for (const id of ids) {
      if (seen.has(id)) duplicates.add(id)
      seen.add(id)
    }
  }

  const summed = included.reduce((total, row) => total + (row.run?.employeeCount ?? 0), 0)
  const unique = seen.size > 0 ? seen.size : summed

  // Entities that were consolidated last period and are not this one. Their absence is the
  // single largest movement on the page whenever it happens, so it is computed here rather
  // than left for the movement list to overlook.
  const droppedOut: { entity: LegalEntity; previous: Money }[] = []

  const previous =
    input.compare === false
      ? undefined
      : (() => {
          const previousPeriod = previousPeriodKey(input.period)
          const previousInput: ConsolidateInput = { ...input, period: previousPeriod, compare: false }
          const previousPrepared = prepare(previousInput)
          const previousIncluded = previousPrepared.filter(row => row.included && row.run && row.quote)

          if (previousIncluded.length === 0) return undefined

          const currentlyIncluded = new Set(included.map(row => row.entity.id))

          for (const row of previousIncluded) {
            if (currentlyIncluded.has(row.entity.id)) continue

            droppedOut.push({
              entity: row.entity,
              previous: convertMoney(row.run!.totals.employerCost, row.quote!)
            })
          }

          const previousCost = consolidateMeasure(previousPrepared, 'employer_cost', reporting, input.group.budgetRates)

          const previousNet = consolidateMeasure(previousPrepared, 'net_pay', reporting, input.group.budgetRates)

          // Current local amounts, translated at the PREVIOUS period's rates. The gap between
          // this and the previous total is the operational movement; the rest is the exchange
          // rate moving under a payroll that did not change.
          const atPreviousRates = (measure: MoneyMeasure) =>
            addMoney(
              included.map(row => {
                const quote = rateFor(input.rates, {
                  from: row.entity.currency,
                  to: reporting,
                  period: previousPeriod,
                  basis
                })

                return convertMoney(MEASURE_OF[measure](row.run!), quote ?? row.quote!)
              }),
              reporting
            )

          const previousUnique = previousIncluded.reduce((total, row) => total + (row.run?.employeeCount ?? 0), 0)

          const currentIds = new Set(included.map(row => row.entity.id))
          const previousIds = new Set(previousIncluded.map(row => row.entity.id))
          const likeForLike = [...currentIds].filter(id => previousIds.has(id))

          return {
            period: previousPeriod,
            employerCost: comparisonLine(
              'employer_cost',
              employerCost.total,
              previousCost.total,
              atPreviousRates('employer_cost')
            ),
            netPay: comparisonLine('net_pay', netPay.total, previousNet.total, atPreviousRates('net_pay')),
            headcount: { current: unique, previous: previousUnique, change: unique - previousUnique },
            comparable: likeForLike.length === currentIds.size && likeForLike.length === previousIds.size,
            likeForLikeEntityIds: likeForLike
          } satisfies PeriodComparison
        })()

  const coverage = buildCoverage(
    prepared,
    reporting,
    employerCost,
    previous?.employerCost.previous,
    previous?.headcount.previous,
    unique
  )

  const entities: EntityRow[] = prepared.map(row => {
    const previousRun = row.run ? previousRunOf(input.runs, row.run) : undefined

    const change =
      row.included && row.run && row.quote && previousRun
        ? subtractMoney(
            convertMoney(row.run.totals.employerCost, row.quote),
            convertMoney(previousRun.totals.employerCost, row.quote)
          )
        : undefined

    const previousConverted =
      previousRun && row.quote ? convertMoney(previousRun.totals.employerCost, row.quote) : undefined

    return {
      entity: row.entity,
      state: row.state,
      finality: row.finality,
      detail: entityStateDetail(
        row.run,
        row.state,
        input.schedules?.find(
          schedule =>
            schedule.periodStart.slice(0, 7) === input.period && schedule.id.includes(row.entity.id.replace('ent-', ''))
        )
      ),
      run: row.run,
      included: row.included,
      excludedReason: row.excludedReason,
      employees: row.run?.employeeCount ?? 0,
      local: row.run
        ? {
            employerCost: row.run.totals.employerCost,
            netPay: row.run.totals.netPay,
            grossPay: row.run.totals.grossPay
          }
        : undefined,
      quote: row.quote,
      reporting:
        row.included && row.run && row.quote
          ? {
              employerCost: convertMoney(row.run.totals.employerCost, row.quote),
              netPay: convertMoney(row.run.totals.netPay, row.quote),
              grossPay: convertMoney(row.run.totals.grossPay, row.quote)
            }
          : undefined,
      change,
      changePercent:
        change && previousConverted && previousConverted.amount !== 0
          ? (change.amount / Math.abs(previousConverted.amount)) * 100
          : null,
      blockingCount: row.run
        ? row.run.exceptions.filter(
            exception => exception.severity === 'blocking' && exceptionStatusOf(exception) !== 'resolved'
          ).length
        : 0,
      href: `/payroll/entities/${row.entity.id}`
    }
  })

  const sourceCalculations: SourceCalculation[] = included.map(row => ({
    runId: row.run!.id,
    reference: row.run!.reference,
    entityId: row.entity.id,
    entityName: row.entity.name,
    status: row.run!.status,
    calculationVersion: row.run!.calculationVersion,
    currency: row.entity.currency,
    href: `/payroll/runs/${row.run!.id}`
  }))

  const movement = buildMovement(entities, droppedOut, reporting, previous?.employerCost.change)

  const countries = new Set(prepared.map(row => row.entity.countryCode))
  const currencies = new Set(prepared.map(row => row.entity.currency))

  const calculatedAt = included
    .map(row => row.run?.lastCalculatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()

  return {
    group: input.group,
    period: input.period,
    reportingCurrency: reporting,
    fxBasis: basis,
    entityCount: prepared.length,
    countryCount: countries.size,
    currencyCount: currencies.size,
    coverage,
    freshness: {
      newestCalculationAt: calculatedAt.at(-1),
      ratesAsOf: input.rates.find(rate => rate.period === input.period && rate.basis === basis)?.period ?? input.period
    },
    employerCost,
    netPay,
    grossPay,
    headcount: { unique, summed, duplicateEmployeeIds: [...duplicates] },
    entities,
    sourceCalculations,
    previous,
    movement
  }
}

/**
 * Where the change came from, ranked by size.
 *
 * The question a group finance lead actually asks is not what the total is but which company
 * moved it. Ranking by absolute contribution puts the answer first whether it rose or fell.
 *
 * An entity that was in the previous period and is missing from this one is the largest movement
 * of all, and it is the one a naive decomposition drops: its rows simply are not there to
 * subtract. Listing it explicitly is what lets the movement add up to the headline instead of
 * quietly falling short by the size of the company that went missing.
 */
const buildMovement = (
  entities: EntityRow[],
  droppedOut: { entity: LegalEntity; previous: Money }[],
  reporting: CurrencyCode,
  totalChange?: Money
): MovementLine[] => {
  const lines: MovementLine[] = [
    ...entities
      .filter(row => row.change)
      .map(row => ({
        key: row.entity.id,
        label: row.entity.name,
        entityId: row.entity.id,
        change: row.change!,
        share: 0,
        href: row.href
      })),
    ...droppedOut.map(item => ({
      key: item.entity.id,
      label: `${item.entity.name} — no calculation this period`,
      entityId: item.entity.id,
      change: { amount: -item.previous.amount, currency: reporting },
      share: 0,
      href: `/payroll/entities/${item.entity.id}`
    }))
  ]

  // Each entity's own movement is measured at this period's rate, so what the entities explain
  // is the operational change. Whatever is left between that and the headline is the exchange
  // rate moving under a payroll that did not. It gets its own line rather than being left as an
  // unexplained gap between a total and the rows beneath it.
  if (totalChange) {
    const explained = lines.reduce((total, line) => total + line.change.amount, 0)
    const residual = totalChange.amount - explained

    if (residual !== 0) {
      lines.push({
        key: 'fx',
        label: 'Exchange rate movement',
        change: { amount: residual, currency: reporting },
        share: 0
      })
    }
  }

  const magnitude = lines.reduce((total, line) => total + Math.abs(line.change.amount), 0)

  return lines
    .map(line => ({
      ...line,
      share: magnitude === 0 ? 0 : (Math.abs(line.change.amount) / magnitude) * 100,
      change: { ...line.change, currency: reporting }
    }))
    .sort((a, b) => Math.abs(b.change.amount) - Math.abs(a.change.amount))
}

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

export type ConsolidateBySources = {
  employees: Employee[]
  departments: Department[]
  payslipsByRun: Record<string, Payslip[]>
}

/**
 * Break the consolidated cost down by one dimension.
 *
 * Each entity's buckets are converted with `convertAllocated`, so the rows of every breakdown
 * sum to exactly the same figure as the headline. Converting each bucket independently would
 * leave a stray minor unit and a table that does not reconcile with the number above it.
 */
export const consolidateBy = (
  consolidation: Consolidation,
  dimension: ConsolidationDimension,
  sources: ConsolidateBySources
): DimensionBreakdown => {
  const reporting = consolidation.reportingCurrency
  const employeeById = new Map(sources.employees.map(employee => [employee.id, employee]))
  const departmentById = new Map(sources.departments.map(department => [department.id, department]))

  type Bucket = {
    key: string
    label: string
    code?: string
    amount: number
    employees: Set<string>
    entities: Set<string>
  }
  const buckets = new Map<string, Bucket>()

  const bucketFor = (key: string, label: string, code?: string) => {
    const existing = buckets.get(key)

    if (existing) return existing

    const created: Bucket = { key, label, code, amount: 0, employees: new Set(), entities: new Set() }

    buckets.set(key, created)

    return created
  }

  for (const row of consolidation.entities) {
    if (!row.included || !row.run || !row.quote) continue

    const slips = sources.payslipsByRun[row.run.id] ?? []

    // Group this entity's payslips into local buckets first, then convert them together so the
    // rounding residual lands once rather than once per bucket.
    const local = new Map<string, { label: string; code?: string; amount: number; employees: Set<string> }>()

    const put = (key: string, label: string, amount: number, employeeId: string, code?: string) => {
      const entry = local.get(key) ?? { label, code, amount: 0, employees: new Set<string>() }

      entry.amount += amount
      entry.employees.add(employeeId)
      local.set(key, entry)
    }

    for (const slip of slips) {
      const employee = employeeById.get(slip.employeeId)

      const cost =
        slip.grossPay.amount +
        slip.components
          .filter(component => component.kind === 'employer_contribution')
          .reduce((sum, component) => sum + component.amount.amount, 0)

      switch (dimension) {
        case 'entity':
          put(row.entity.id, row.entity.name, cost, slip.employeeId, row.entity.code)
          break
        case 'country':
          put(
            row.entity.countryCode,
            COUNTRY_LABELS[row.entity.countryCode],
            cost,
            slip.employeeId,
            row.entity.countryCode
          )
          break
        case 'currency':
          put(row.entity.currency, row.entity.currency, cost, slip.employeeId)
          break

        case 'department': {
          const department = employee ? departmentById.get(employee.departmentId) : undefined

          put(department?.id ?? 'unassigned', department?.name ?? 'Unassigned', cost, slip.employeeId, department?.code)
          break
        }

        case 'cost_centre': {
          const department = employee ? departmentById.get(employee.departmentId) : undefined
          const centre = department?.costCenter ?? 'unassigned'

          put(centre, centre === 'unassigned' ? 'Unassigned' : centre, cost, slip.employeeId)
          break
        }

        case 'component': {
          for (const component of slip.components) {
            if (component.kind === 'deduction' || component.kind === 'tax') continue
            put(component.code, component.label, component.amount.amount, slip.employeeId)
          }

          break
        }
      }
    }

    const keys = [...local.keys()]

    const converted = convertAllocated(
      keys.map(key => ({ amount: local.get(key)!.amount, currency: row.entity.currency })),
      row.quote
    )

    keys.forEach((key, index) => {
      const entry = local.get(key)!
      const bucket = bucketFor(key, entry.label, entry.code)

      bucket.amount += converted[index].amount
      bucket.entities.add(row.entity.id)
      for (const id of entry.employees) bucket.employees.add(id)
    })
  }

  const total = addMoney(
    [...buckets.values()].map(bucket => ({ amount: bucket.amount, currency: reporting })),
    reporting
  )

  const rows: DimensionRow[] = [...buckets.values()]
    .map(bucket => ({
      key: bucket.key,
      label: bucket.label,
      code: bucket.code,
      entities: bucket.entities.size,
      employees: bucket.employees.size,
      cost: { amount: bucket.amount, currency: reporting },
      share: total.amount === 0 ? 0 : (bucket.amount / total.amount) * 100
    }))
    .sort((a, b) => b.cost.amount - a.cost.amount)

  return { dimension, rows, total, coverage: consolidation.coverage }
}

/** Zero in the reporting currency, for an empty group. Exported so callers need not invent one. */
export const zeroIn = zero
