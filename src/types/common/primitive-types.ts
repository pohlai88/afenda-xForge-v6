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

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'SGD' | 'MYR' | 'AUD' | 'INR'

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
