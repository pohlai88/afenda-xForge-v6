// Type Imports
import type { CurrencyCode, FxQuote, IsoDate, IsoDateTime, Money } from '@/types/common/primitive-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { PayRun, PayRunStatus } from '@/types/payroll/pay-run-types'

/**
 * Group payroll: what payroll means across several legal entities, countries and currencies.
 *
 * The rule this file exists to enforce is that not every measure aggregates the same way. Money
 * must be converted before it is summed; headcount is a distinct count, because one person can
 * appear in two entities; a contribution rate cannot be summed or averaged at all. Encoding that
 * once here is the difference between consolidation and adding up columns.
 */

// ---------------------------------------------------------------------------
// Exchange rates
// ---------------------------------------------------------------------------

export const FX_BASES = ['pay_date_spot', 'period_end', 'period_average'] as const

/**
 * Which rate to translate at. It is a choice, not a fact, which is why it belongs in the URL and
 * on screen: the same payroll consolidates to different totals on different bases, and a figure
 * that does not name its basis cannot be checked.
 */
export type FxBasis = (typeof FX_BASES)[number]

export interface FxRate extends FxQuote {
  /** The pay period the rate applies to, 'YYYY-MM'. */
  period: string

  basis: FxBasis

  /** Provenance, shown in the lineage drawer, e.g. 'Spot on payday, 30 Sep 2026'. */
  source: string
}

// ---------------------------------------------------------------------------
// The group
// ---------------------------------------------------------------------------

export interface PayrollGroup {
  id: string
  name: string

  /** The entity whose settings and default views the group falls back to. */
  homeEntityId: string

  entityIds: string[]

  /** What consolidated figures are stated in, unless the reader picks another. */
  reportingCurrency: CurrencyCode

  fxBasis: FxBasis

  /**
   * One fixed rate per currency pair for the budget year. The gap between a figure at budget
   * rates and the same figure at the period's rates is the FX movement — the part of a change
   * that is not operational.
   */
  budgetRates: FxQuote[]

  budgetYear: string
}

// ---------------------------------------------------------------------------
// State, coverage, finality
// ---------------------------------------------------------------------------

/**
 * Where an entity's payroll stands for a period.
 *
 * Derived from the run, never stored. `awaiting_data` covers both "no run exists" and "a run
 * exists but has not been calculated", because from the group's point of view they are the same
 * fact: there is no figure to include.
 */
export type EntityPayrollState = 'awaiting_data' | 'in_progress' | 'blocked' | 'review' | 'ready' | 'paid' | 'closed'

/**
 * Visual weight for a state. Seven equally saturated badges are a rainbow; four tiers let the eye
 * sort before it reads.
 */
export type EntityStateTier = 'incomplete' | 'attention' | 'proceed' | 'complete'

/**
 * Whether an included figure can still change.
 *
 * Separate from state and from coverage because it answers a different question. "Included" says
 * the number is in the total. It does not say the number is settled, and a reader who takes one
 * for the other has been misled by omission.
 */
export type Finality = 'final' | 'provisional' | 'not_applicable'

export interface MissingEntity {
  entityId: string
  entityName: string

  /** In the interface's voice: 'No September run has been created.' */
  reason: string
}

/**
 * What a consolidated figure includes, in three measures.
 *
 * One measure is not enough. Missing a dormant company and missing the largest business unit are
 * both "4 of 5", and only the second changes what anyone should do with the number. Employee and
 * cost coverage answer whether the gap is material; expectation comes from the previous period,
 * because that is the only expectation the domain can actually prove.
 */
export interface Coverage {
  entities: {
    included: number
    total: number
    missing: MissingEntity[]
  }

  employees: {
    counted: number
    expected: number
    percent: number
  }

  expectedCost: {
    covered: Money
    expected: Money
    percent: number
  }

  /** Included entities whose figures are not yet approved, so the total can still move. */
  provisional: {
    count: number
    amount: Money
    share: number
  }

  byState: Record<EntityPayrollState, number>

  /** True only when nothing is missing. Every consolidated figure renders this beside itself. */
  complete: boolean
}

/**
 * How current the consolidation is.
 *
 * Deliberately not a render timestamp. A render timestamp reports when the page was opened, which
 * would let a fortnight-old consolidation look freshly made simply because someone reloaded it.
 * Both fields below are facts about the data.
 */
export interface Freshness {
  /** The newest calculation among the runs actually included. Undefined when nothing is included. */
  newestCalculationAt?: IsoDateTime

  /** The date of the exchange rates in use. */
  ratesAsOf: IsoDate
}

// ---------------------------------------------------------------------------
// Measures
// ---------------------------------------------------------------------------

export type MeasureKey =
  | 'employer_cost'
  | 'net_pay'
  | 'gross_pay'
  | 'employee_deductions'
  | 'employee_taxes'
  | 'employer_contributions'
  | 'headcount'
  | 'fte'
  | 'average_cost'
  | 'contribution_rate'
  | 'readiness'

export type MeasureAggregation = 'sum' | 'unique' | 'derived' | 'none'

export interface MeasureDefinition {
  key: MeasureKey
  label: string
  aggregate: MeasureAggregation

  /** Whether the measure is money and must be converted before it is summed. */
  fx: boolean

  /** Why it aggregates the way it does. Shown where a reader might expect a different answer. */
  note: string
}

// ---------------------------------------------------------------------------
// The consolidation itself
// ---------------------------------------------------------------------------

/**
 * One money measure, consolidated, carrying its own explanation.
 *
 * `total` is what the screen shows. `atBudget` is the same local payroll translated at budget
 * rates, and `fxMovement` is the difference. Those three are the bridge in the lineage drawer,
 * and they hold by construction: every term is an integer computed from the same parts.
 */
export interface ConsolidatedMoney {
  measure: MeasureKey
  total: Money
  atBudget: Money
  fxMovement: Money

  /** Local amounts are only summable within a currency, so the breakdown is per currency. */
  byCurrency: {
    currency: CurrencyCode
    local: Money
    entities: number
    quote?: FxQuote
    converted: Money
  }[]
}

export interface EntityRow {
  entity: LegalEntity
  state: EntityPayrollState
  finality: Finality

  /** One line saying what the state means here, e.g. 'Blocked · 1 blocking exception'. */
  detail: string

  run?: PayRun
  included: boolean

  /** Why it is not included. Present only when `included` is false. */
  excludedReason?: string

  employees: number

  /** Absent when there is no calculation. Absence is the truth; zero would be a claim. */
  local?: {
    employerCost: Money
    netPay: Money
    grossPay: Money
  }

  quote?: FxQuote

  reporting?: {
    employerCost: Money
    netPay: Money
    grossPay: Money
  }

  /** Change against the comparison basis, in the reporting currency. */
  change?: Money
  changePercent?: number | null

  blockingCount: number
  href: string
}

export interface ComparisonLine {
  measure: MeasureKey
  current: Money
  previous: Money
  change: Money
  changePercent: number | null

  /**
   * The change with exchange rates held still: current local amounts translated at the previous
   * period's rates, less the previous total. This is the operational movement.
   */
  constantCurrencyChange: Money

  /** change less constantCurrencyChange. The part of the movement that is only the exchange rate. */
  fxEffect: Money
}

/** One contributor to the total movement, for the variance concentration list. */
export interface MovementLine {
  key: string
  label: string

  /**
   * What kind of contribution this is.
   *
   * It decides how the row reads, and the distinction matters: a company that dropped out of the
   * period lowers the total, but that is not payroll getting cheaper. Colouring it as an
   * improvement would tell the reader the opposite of the truth.
   */
  kind: 'entity' | 'absence' | 'fx'

  /** Entity, when the contributor is one; absent for an aggregated remainder. */
  entityId?: string

  change: Money

  /** Share of the total absolute movement, 0–100. Ranking, not arithmetic. */
  share: number

  href?: string
}

export interface SourceCalculation {
  runId: string
  reference: string
  entityId: string
  entityName: string
  status: PayRunStatus
  calculationVersion: number
  currency: CurrencyCode
  href: string
}

export interface PeriodComparison {
  period: string
  employerCost: ComparisonLine
  netPay: ComparisonLine
  headcount: {
    current: number
    previous: number
    change: number
  }

  /**
   * Whether both periods covered the same entities. A movement between differently covered
   * periods is not a like-for-like movement, and the screen has to say so rather than imply it.
   */
  comparable: boolean

  /** Entities present in both periods; the like-for-like figures are over these only. */
  likeForLikeEntityIds: string[]
  likeForLike?: {
    employerCost: ComparisonLine
    netPay: ComparisonLine
  }
}

export interface Consolidation {
  group: PayrollGroup
  period: string
  reportingCurrency: CurrencyCode
  fxBasis: FxBasis

  entityCount: number
  countryCount: number
  currencyCount: number

  coverage: Coverage
  freshness: Freshness

  employerCost: ConsolidatedMoney
  netPay: ConsolidatedMoney
  grossPay: ConsolidatedMoney

  /**
   * `unique` counts people; `summed` adds the entities' own counts. They differ when someone is
   * on two payrolls, which is exactly the case a group figure must not double-count.
   */
  headcount: {
    unique: number
    summed: number
    duplicateEmployeeIds: string[]
  }

  entities: EntityRow[]
  sourceCalculations: SourceCalculation[]
  previous?: PeriodComparison
  movement: MovementLine[]
}

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

export const CONSOLIDATION_DIMENSIONS = [
  'entity',
  'country',
  'currency',
  'department',
  'cost_centre',
  'component'
] as const

export type ConsolidationDimension = (typeof CONSOLIDATION_DIMENSIONS)[number]

export interface DimensionRow {
  key: string
  label: string
  code?: string
  entities: number
  employees: number

  /** Reporting currency, allocated so the rows sum to the headline exactly. */
  cost: Money

  /** Present only where every contributor shares one currency, i.e. by currency or by entity. */
  local?: Money

  /** Share of covered cost, 0–100. */
  share: number
}

export interface DimensionBreakdown {
  dimension: ConsolidationDimension
  rows: DimensionRow[]
  total: Money
  coverage: Coverage
}

/** A period the group can be consolidated for, for the period selector. */
export interface GroupPeriodOption {
  value: string
  label: string
}

/** One point on the group trend: cost and headcount over time, with its own coverage. */
export interface GroupTrendPoint {
  period: string
  label: string
  cost: Money
  headcount: number
  included: number
  total: number
  complete: boolean
}
