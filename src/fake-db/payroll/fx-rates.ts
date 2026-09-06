/**
 * ! Seed data for exchange rates. Swap for a rate feed when one lands.
 *
 * Rates are written here as readable decimals and expanded into exact fractions, because a rate
 * that lives as a float does not invert cleanly and a consolidation that cannot invert cannot
 * reconcile. Only direct quotes are stored; the reverse is derived by swapping the fraction, so
 * the table cannot contradict itself.
 *
 * Three bases are seeded because the choice of basis is a real one with a real consequence. The
 * period average is the mean of the month's daily fixes; the spot is a single day. Through 2026
 * the seed drifts the ringgit and the dong slightly weaker across each month, so the spot on
 * payday sits above the month's average and switching basis visibly moves the group total. If
 * the two agreed, the FX basis selector would be a control that does nothing.
 */

// Type Imports
import type { FxQuote } from '@/types/common/primitive-types'
import type { FxBasis, FxRate } from '@/types/payroll/group-types'

type Pair = 'SGD_MYR' | 'SGD_VND' | 'MYR_VND'

type Row = Record<Pair, Record<FxBasis, number>>

/** Units of the second currency per one unit of the first. */
const TABLE: Record<string, Row> = {
  '2026-04': {
    SGD_MYR: { period_average: 3.421, period_end: 3.429, pay_date_spot: 3.427 },
    SGD_VND: { period_average: 18_760, period_end: 18_810, pay_date_spot: 18_795 },
    MYR_VND: { period_average: 5_484, period_end: 5_486, pay_date_spot: 5_485 }
  },
  '2026-05': {
    SGD_MYR: { period_average: 3.429, period_end: 3.44, pay_date_spot: 3.437 },
    SGD_VND: { period_average: 18_812, period_end: 18_874, pay_date_spot: 18_858 },
    MYR_VND: { period_average: 5_486, period_end: 5_487, pay_date_spot: 5_487 }
  },
  '2026-06': {
    SGD_MYR: { period_average: 3.436, period_end: 3.447, pay_date_spot: 3.444 },
    SGD_VND: { period_average: 18_871, period_end: 18_932, pay_date_spot: 18_915 },
    MYR_VND: { period_average: 5_492, period_end: 5_492, pay_date_spot: 5_492 }
  },
  '2026-07': {
    SGD_MYR: { period_average: 3.442, period_end: 3.455, pay_date_spot: 3.451 },
    SGD_VND: { period_average: 18_918, period_end: 18_981, pay_date_spot: 18_964 },
    MYR_VND: { period_average: 5_496, period_end: 5_494, pay_date_spot: 5_495 }
  },
  '2026-08': {
    SGD_MYR: { period_average: 3.449, period_end: 3.463, pay_date_spot: 3.46 },
    SGD_VND: { period_average: 18_954, period_end: 19_021, pay_date_spot: 19_004 },
    MYR_VND: { period_average: 5_496, period_end: 5_493, pay_date_spot: 5_493 }
  },
  '2026-09': {
    SGD_MYR: { period_average: 3.456, period_end: 3.471, pay_date_spot: 3.468 },
    SGD_VND: { period_average: 18_990, period_end: 19_060, pay_date_spot: 19_012 },
    MYR_VND: { period_average: 5_495, period_end: 5_490, pay_date_spot: 5_483 }
  }
}

const PAIRS: Record<Pair, { from: FxQuote['from']; to: FxQuote['to']; scale: number }> = {
  SGD_MYR: { from: 'SGD', to: 'MYR', scale: 10_000 },
  SGD_VND: { from: 'SGD', to: 'VND', scale: 1 },
  MYR_VND: { from: 'MYR', to: 'VND', scale: 1 }
}

const SOURCES: Record<FxBasis, (period: string) => string> = {
  pay_date_spot: period => `Spot on the paying entity's payday, ${period}`,
  period_end: period => `Closing reference rate, last business day of ${period}`,
  period_average: period => `Mean of the daily reference rates through ${period}`
}

const expand = (): FxRate[] => {
  const rates: FxRate[] = []

  for (const [period, row] of Object.entries(TABLE)) {
    for (const [pair, bases] of Object.entries(row) as [Pair, Record<FxBasis, number>][]) {
      const { from, to, scale } = PAIRS[pair]

      for (const [basis, value] of Object.entries(bases) as [FxBasis, number][]) {
        rates.push({
          from,
          to,
          numerator: Math.round(value * scale),
          denominator: scale,
          period,
          basis,
          source: SOURCES[basis](period)
        })
      }
    }
  }

  return rates
}

export const fxRates: FxRate[] = expand()

/**
 * The rates the budget was set at, fixed for the year.
 *
 * Deliberately a little stronger than the market turned out to be for both the ringgit and the
 * dong, so translating actual local payroll at budget rates gives a visibly different number from
 * translating it at the period's rates. That difference is the FX movement, and it is the whole
 * point of showing a bridge rather than a single converted total.
 */
export const budgetRates: FxQuote[] = [
  { from: 'SGD', to: 'MYR', numerator: 34_000, denominator: 10_000 },
  { from: 'SGD', to: 'VND', numerator: 18_800, denominator: 1 },
  { from: 'MYR', to: 'VND', numerator: 5_530, denominator: 1 }
]

export const BUDGET_YEAR = '2026'

/** The date the rates for a period are stated as of, for the freshness line. */
export const ratesAsOf = (period: string, basis: FxBasis): string => {
  const [year, month] = period.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()

  return basis === 'period_average' ? `${period}-01` : `${period}-${String(lastDay).padStart(2, '0')}`
}
