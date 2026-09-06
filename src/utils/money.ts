// Type Imports
import type { CurrencyCode, Money } from '@/types/common/primitive-types'

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
  AUD: 'A$',
  INR: '₹'
}

const groupDigits = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

/** 28446495 SGD -> 'S$284,464.95'. Input is minor units, as Money always is. */
export const formatMoney = (money: Money): string => {
  const negative = money.amount < 0
  const absolute = Math.abs(money.amount)
  const major = Math.floor(absolute / 100)
  const minor = String(absolute % 100).padStart(2, '0')
  const formatted = `${SYMBOLS[money.currency]}${groupDigits(String(major))}.${minor}`

  return negative ? `-${formatted}` : formatted
}

/**
 * 28446495 SGD -> 'S$284.5K'. For KPI tiles, where the exact cent is noise and the magnitude
 * is the message. Never use this on anything someone has to reconcile.
 */
export const formatMoneyCompact = (money: Money): string => {
  const negative = money.amount < 0
  const major = Math.abs(money.amount) / 100
  const symbol = SYMBOLS[money.currency]

  const scaled =
    major >= 1_000_000
      ? `${(major / 1_000_000).toFixed(1)}M`
      : major >= 1_000
        ? `${(major / 1_000).toFixed(1)}K`
        : major.toFixed(0)

  return `${negative ? '-' : ''}${symbol}${scaled}`
}

/** Major units as a plain number, for charts. Charts need magnitudes, not strings. */
export const toMajorUnits = (money: Money): number => money.amount / 100

export const percentageOf = (part: Money, whole: Money): number =>
  whole.amount === 0 ? 0 : (part.amount / whole.amount) * 100
