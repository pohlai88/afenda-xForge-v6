/**
 * Cross-module primitives. Money and dates are the two things an ERP gets wrong first, so
 * they are defined once here rather than re-invented per module.
 */

/**
 * A calendar date with no time and no zone: 'YYYY-MM-DD'.
 *
 * Payroll dates are calendar facts, not instants. A hire date of the 1st is the 1st in every
 * office. Storing them as a timestamp reintroduces the classic off-by-one, where UTC midnight
 * renders as the previous day for anyone west of Greenwich — which in payroll means a period
 * boundary silently moving and an employee landing in the wrong run.
 */
export type IsoDate = string

/** An instant in UTC: '2026-09-06T14:03:00.000Z'. Use for audit trails and cut-offs. */
export type IsoDateTime = string

/**
 * The one list of currencies. It is a runtime tuple rather than a bare union because the same
 * seven-then-eight codes were being retyped in three Zod enums and three Select options, and
 * those copies had already started to drift. Everything else derives from this.
 */
export const CURRENCY_CODES = ['SGD', 'MYR', 'VND', 'USD', 'EUR', 'GBP', 'AUD', 'INR'] as const

export type CurrencyCode = (typeof CURRENCY_CODES)[number]

/**
 * ISO 3166-1 alpha-2, for the countries payroll actually runs in.
 *
 * A cross-module primitive like CurrencyCode: an HR work location and a payroll legal entity
 * both carry one, and payroll consolidates by it. `WorkLocation.country` remains a display
 * string ('Singapore'); this is the key you group and compare on.
 */
export const COUNTRY_CODES = ['SG', 'MY', 'VN'] as const

export type CountryCode = (typeof COUNTRY_CODES)[number]

/**
 * An amount in **minor units** — cents, not dollars. 1234 with currency 'USD' is $12.34.
 *
 * Floating point cannot represent most decimal fractions, so 0.1 + 0.2 !== 0.3. Summing a few
 * hundred payslips in major units drifts by cents, and a payroll run that does not reconcile
 * to the bank file to the cent is a payroll run nobody can sign off. Integers make the whole
 * class of error impossible rather than unlikely.
 *
 * Convert at the display boundary only.
 */
export interface Money {
  /** Minor units (cents). Always an integer. */
  amount: number
  currency: CurrencyCode
}

/**
 * An exchange rate as an exact fraction: `numerator` units of `to` per `denominator` units of
 * `from`.
 *
 * Rates are fractions rather than decimals for the same reason Money is minor units. A decimal
 * rate is a float, and converting a few hundred thousand minor units through a float and back
 * does not round-trip: the inverse of 3.4512 is not exactly representable, so SGD → MYR → SGD
 * loses cents. Two integers invert by swapping, so the round trip is exact and conversion never
 * leaves integer arithmetic.
 *
 * 1 SGD = 19,012 VND is { numerator: 19012, denominator: 1 }.
 * 1 SGD = 3.4512 MYR is { numerator: 34512, denominator: 10000 }.
 */
export interface FxQuote {
  from: CurrencyCode
  to: CurrencyCode
  numerator: number
  denominator: number
}
