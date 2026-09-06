// Type Imports
import type { CurrencyCode } from '@/types/common/primitive-types'
import type { ConsolidationDimension, FxBasis } from '@/types/payroll/group-types'

/**
 * The analytical state of the group page, which lives entirely in the URL.
 *
 * Someone who has built a view — this period, in ringgit, at period-average, by cost centre —
 * should be able to send it to a colleague and have them see the same thing. That is only true
 * if every choice is in the address, which is also what lets the page stay a server component.
 */
export type GroupQuery = {
  period: string
  currency: CurrencyCode
  basis: FxBasis
  by: ConsolidationDimension
  compare: ComparisonBasis
}

export const COMPARISON_BASES = ['previous_period'] as const

export type ComparisonBasis = (typeof COMPARISON_BASES)[number]

export const COMPARISON_BASIS_LABELS: Record<ComparisonBasis, string> = {
  previous_period: 'Previous period'
}

export const GROUP_DEFAULTS = {
  by: 'country' as ConsolidationDimension,
  compare: 'previous_period' as ComparisonBasis
}

/**
 * Build a link to the group page.
 *
 * A parameter equal to its default is left out, so a plain `/payroll` stays clean and a shared
 * link carries only the choices that were actually made.
 */
export const groupHref = (
  query: GroupQuery,
  defaults: { period: string; currency: CurrencyCode; basis: FxBasis },
  overrides?: Partial<GroupQuery>
): string => {
  const next = { ...query, ...overrides }
  const params = new URLSearchParams()

  if (next.period !== defaults.period) params.set('period', next.period)
  if (next.currency !== defaults.currency) params.set('currency', next.currency)
  if (next.basis !== defaults.basis) params.set('basis', next.basis)
  if (next.by !== GROUP_DEFAULTS.by) params.set('by', next.by)
  if (next.compare !== GROUP_DEFAULTS.compare) params.set('compare', next.compare)

  const search = params.toString()

  return search ? `/payroll?${search}` : '/payroll'
}

/**
 * Where an entity row leads, carrying the view the reader built so returning restores it.
 *
 * The return path is read back defensively on the other side: it arrives through the URL, so it
 * is validated as a same-origin payroll path before anything navigates to it.
 */
export const entityHref = (
  entityId: string,
  query: GroupQuery,
  defaults: { period: string; currency: CurrencyCode; basis: FxBasis }
): string => `/payroll/entities/${entityId}?return=${encodeURIComponent(groupHref(query, defaults))}`
