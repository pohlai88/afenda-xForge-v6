// Type Imports
import type { CurrencyCode, FxQuote, Money } from '@/types/common/primitive-types'

/**
 * Deliberately not Intl.NumberFormat.
 *
 * Intl is backed by ICU, and the server (Node) and the browser ship different ICU versions.
 * They disagree on small things — which space character separates a symbol from its digits,
 * how a negative is bracketed — and any such disagreement inside a server-rendered component
 * is a hydration mismatch. Formatting money by hand is a dozen lines and is identical
 * everywhere, which matters more here than locale awareness.
 *
 * If real localisation is needed later, do it in a client-only component so there is nothing
 * server-rendered to mismatch against.
 */

const SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  MYR: 'RM',
  VND: '₫',
  AUD: 'A$',
  INR: '₹'
}

/**
 * How many minor-unit digits each currency has.
 *
 * Not every currency has cents. The dong has none, so a VND amount of 12,500,000 is twelve and
 * a half million dong, not a hundred and twenty-five thousand — and printing it as '₫12,500,000.00'
 * is wrong by two decimal places in a way that looks plausible. This map is the single fact that
 * keeps minor units honest across currencies.
 *
 * The symbol is still prefixed for every currency. Vietnamese convention suffixes it, but that is
 * localisation, which this file deliberately declines to take on.
 */
const DIGITS: Record<CurrencyCode, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  SGD: 2,
  MYR: 2,
  VND: 0,
  AUD: 2,
  INR: 2
}

/**
 * The symbol for a currency, for chart axes and input adornments that format major-unit numbers
 * themselves. Read it from the run or pay group in hand; never hard-code one in a screen.
 */
export const currencySymbol = (currency: CurrencyCode): string => SYMBOLS[currency]

/** Minor-unit digits for a currency: 2 for most, 0 for VND. Pair it with `currencySymbol`. */
export const currencyDigits = (currency: CurrencyCode): number => DIGITS[currency]

const scaleOf = (currency: CurrencyCode) => 10 ** DIGITS[currency]

const groupDigits = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

/**
 * A whole number with thousands separators: 3412 -> '3,412'.
 *
 * Not money, but the same reason to exist. `toLocaleString` is Intl, and Intl in anything that
 * server-renders is the hydration mismatch this file was written to avoid — which includes a
 * client component's first render.
 */
export const formatCount = (value: number): string => groupDigits(String(Math.round(value)))

/** 28446495 SGD -> 'S$284,464.95'; 12500000 VND -> '₫12,500,000'. Input is minor units. */
export const formatMoney = (money: Money): string => {
  const digits = DIGITS[money.currency]
  const scale = 10 ** digits
  const negative = money.amount < 0
  const absolute = Math.abs(money.amount)
  const major = groupDigits(String(Math.floor(absolute / scale)))
  const minor = digits === 0 ? '' : `.${String(absolute % scale).padStart(digits, '0')}`
  const formatted = `${SYMBOLS[money.currency]}${major}${minor}`

  return negative ? `-${formatted}` : formatted
}

/**
 * 28446495 SGD -> 'S$284.5K'. For KPI tiles, where the exact cent is noise and the magnitude
 * is the message. Never use this on anything someone has to reconcile.
 *
 * Carries a billions tier because a group payroll cost stated in dong reaches ten figures, and
 * '₫4,821,330.0M' is not a readable number.
 */
export const formatMoneyCompact = (money: Money): string => {
  const negative = money.amount < 0
  const major = Math.abs(money.amount) / scaleOf(money.currency)
  const symbol = SYMBOLS[money.currency]

  const scaled =
    major >= 1_000_000_000
      ? `${(major / 1_000_000_000).toFixed(1)}B`
      : major >= 1_000_000
        ? `${(major / 1_000_000).toFixed(1)}M`
        : major >= 1_000
          ? `${(major / 1_000).toFixed(1)}K`
          : major.toFixed(0)

  return `${negative ? '-' : ''}${symbol}${scaled}`
}

/** Major units as a plain number, for charts. Charts need magnitudes, not strings. */
export const toMajorUnits = (money: Money): number => money.amount / scaleOf(money.currency)

/** The inverse of `toMajorUnits`: 84000 major SGD -> 8400000 minor. Rounds to the minor unit. */
export const fromMajorUnits = (major: number, currency: CurrencyCode): Money => ({
  amount: Math.round(major * scaleOf(currency)),
  currency
})

/**
 * 284464.95 -> 'S$284,464.95'. For values that have already been reduced to a major-unit number,
 * which is what chart series carry.
 *
 * Exists so chart components can write a screen-reader summary without reaching for
 * `toLocaleString`. Recharts tooltip formatters may use Intl safely because they only ever run on
 * the client, but text rendered in a component's own body is server-rendered first, and that is
 * where the ICU disagreement this file was written to avoid turns into a hydration mismatch.
 *
 * `digits` defaults to 2; pass `currencyDigits(currency)` so a dong figure does not grow decimals.
 */
export const formatMajorUnits = (major: number, symbol: string, digits = 2): string => {
  const negative = major < 0
  const absolute = Math.abs(major)
  const whole = Math.floor(absolute)

  if (digits === 0) {
    const formatted = `${symbol}${groupDigits(String(Math.round(absolute)))}`

    return negative ? `-${formatted}` : formatted
  }

  const scale = 10 ** digits
  const fraction = String(Math.round((absolute - whole) * scale)).padStart(digits, '0')
  const formatted = `${symbol}${groupDigits(String(whole))}.${fraction}`

  return negative ? `-${formatted}` : formatted
}

/** A short magnitude for a chart axis: 1_250_000_000 with '₫' -> '₫1.3B'. No decimals below 1K. */
export const formatMajorUnitsCompact = (major: number, symbol: string): string => {
  const negative = major < 0
  const absolute = Math.abs(major)

  const scaled =
    absolute >= 1_000_000_000
      ? `${(absolute / 1_000_000_000).toFixed(1)}B`
      : absolute >= 1_000_000
        ? `${(absolute / 1_000_000).toFixed(1)}M`
        : absolute >= 1_000
          ? `${(absolute / 1_000).toFixed(0)}K`
          : String(Math.round(absolute))

  return `${negative ? '-' : ''}${symbol}${scaled}`
}

/**
 * Throws when two amounts are in different currencies.
 *
 * Every helper below that adds or compares goes through this. Summing across currencies is not a
 * user error to be reported in the interface — it is a programming error that would produce a
 * number with no meaning, and it should stop the render rather than print a plausible lie.
 */
export const assertSameCurrency = (...values: Money[]): CurrencyCode | undefined => {
  const [first, ...rest] = values

  if (!first) return undefined

  for (const value of rest) {
    if (value.currency !== first.currency) {
      throw new Error(`Cannot combine ${first.currency} with ${value.currency}.`)
    }
  }

  return first.currency
}

/** Sum of amounts that must already share a currency. Returns zero in `fallback` when empty. */
export const addMoney = (values: Money[], fallback: CurrencyCode): Money => {
  const currency = assertSameCurrency(...values) ?? fallback

  return { amount: values.reduce((total, value) => total + value.amount, 0), currency }
}

/** a − b, in their shared currency. */
export const subtractMoney = (a: Money, b: Money): Money => {
  assertSameCurrency(a, b)

  return { amount: a.amount - b.amount, currency: a.currency }
}

/** The same rate the other way round. Exact, because a fraction inverts by swapping. */
export const inverseQuote = (quote: FxQuote): FxQuote => ({
  from: quote.to,
  to: quote.from,
  numerator: quote.denominator,
  denominator: quote.numerator
})

/** Round a fraction to the nearest integer, halves away from zero, without leaving integers. */
const divideHalfUp = (numerator: number, denominator: number): number => {
  const quotient = Math.trunc(numerator / denominator)
  const remainder = numerator - quotient * denominator

  if (Math.abs(remainder) * 2 < Math.abs(denominator)) return quotient

  return quotient + (numerator < 0 !== denominator < 0 ? -1 : 1)
}

/**
 * Convert an amount into another currency at an exact rate, in integer minor units throughout.
 *
 * The two shift factors handle currencies with different minor-unit digits: SGD has two and VND
 * has none, so S$1.00 (100 minor) at 19,012 dong per dollar is ₫19,012 (19012 minor), not
 * ₫1,901,200. Without the shift the amount is wrong by two orders of magnitude while still
 * looking like a number.
 */
export const convertMoney = (money: Money, quote: FxQuote): Money => {
  if (money.currency !== quote.from) {
    throw new Error(`Rate converts ${quote.from}, not ${money.currency}.`)
  }

  if (quote.from === quote.to) return money

  const shiftUp = 10 ** Math.max(0, DIGITS[quote.to] - DIGITS[quote.from])
  const shiftDown = 10 ** Math.max(0, DIGITS[quote.from] - DIGITS[quote.to])
  const numerator = money.amount * quote.numerator * shiftUp
  const denominator = quote.denominator * shiftDown

  if (!Number.isSafeInteger(numerator)) {
    throw new Error(`Conversion of ${money.amount} ${money.currency} exceeds exact integer range.`)
  }

  return { amount: divideHalfUp(numerator, denominator), currency: quote.to }
}

/**
 * Convert a set of parts so that they still add up to the converted whole.
 *
 * Converting each part independently and summing them can miss the converted total by a minor
 * unit or two, because each conversion rounds on its own. On a consolidation screen that means a
 * breakdown that does not reconcile with the headline it sits under, which is precisely the thing
 * the surface exists to prove. So the parts are converted, and the residual is placed on the
 * largest of them, where it is proportionally smallest.
 */
export const convertAllocated = (parts: Money[], quote: FxQuote): Money[] => {
  if (parts.length === 0) return []

  const converted = parts.map(part => convertMoney(part, quote))
  const total = convertMoney(addMoney(parts, quote.from), quote)
  const residual = total.amount - converted.reduce((sum, part) => sum + part.amount, 0)

  if (residual === 0) return converted

  let largest = 0

  converted.forEach((part, index) => {
    if (Math.abs(part.amount) > Math.abs(converted[largest].amount)) largest = index
  })

  return converted.map((part, index) => (index === largest ? { ...part, amount: part.amount + residual } : part))
}

/** part / whole as a percentage. Both must be the same currency; mixing them is meaningless. */
export const percentageOf = (part: Money, whole: Money): number => {
  assertSameCurrency(part, whole)

  return whole.amount === 0 ? 0 : (part.amount / whole.amount) * 100
}
