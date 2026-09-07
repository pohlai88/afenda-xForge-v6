/**
 * Find: the contract for "what is the user looking for, and how is it reached later?".
 *
 * The rule the whole file exists to hold is that **a target is a stable name, never a way of
 * getting somewhere**. A stored `href` rots the moment a route changes; a stored callback cannot be
 * written to a cookie at all. So a target is four fields of plain data, and turning one into a URL
 * is a separate step done at the moment of opening, by whoever knows the domain.
 *
 * That is what lets Recent and Favourites store exactly what Find returns, and it is why a
 * favourite pointing at a deleted run can say "no longer available" rather than break.
 *
 * Doctrine: `search` (D18) and `shortcuts_and_favourites` (D02) in
 * `.architecture/ux/afenda-ui-ux-doctrine.yaml`.
 */

import type { LucideIcon } from 'lucide-react'

import type { ObjectContext } from '@/types/common/object-context-types'

/**
 * A thing Find can point at, in a form that survives a reload, a cookie and a server round trip.
 *
 * Serializable and discriminated on purpose. `object` names identity the way the rest of the app
 * already does — type plus id — so it is the same pair `ObjectContext` carries and the same pair a
 * command resolves against. The other three are keys into registries the app already has: a path
 * is a route's identity, a `ReportKey` is a report's, and a global command's key is its own.
 *
 * There is deliberately no `open()` here. A target says *what*; resolving *where* is the adapter's
 * job, because only the domain knows that an employee is read on a run workspace.
 */
export type FindTarget =
  | { kind: 'object'; type: string; id: string }
  | { kind: 'route'; path: string }
  | { kind: 'report'; key: string }
  | { kind: 'command'; key: string }

export type FindKind = FindTarget['kind']

/** Stable equality for targets, so Recent can de-duplicate and Favourites can toggle. */
export const sameTarget = (a: FindTarget, b: FindTarget): boolean => {
  if (a.kind !== b.kind) return false
  if (a.kind === 'object' && b.kind === 'object') return a.type === b.type && a.id === b.id
  if (a.kind === 'route' && b.kind === 'route') return a.path === b.path

  return 'key' in a && 'key' in b && a.key === b.key
}

/**
 * What a hit looks like on screen.
 *
 * `sublabel` exists for one job: telling two results apart. Two employees are genuinely called Anh
 * Ngo in this dataset, and a list showing that name twice is unusable — so the line beneath carries
 * `EMP-103 · Customer Support`. It is business data, which is exactly why it lives here and not in
 * `ObjectContext`: identity is four fields and stays four fields.
 */
type FindPresentation = {
  label: string
  sublabel?: string
  icon: LucideIcon

  /** Extra words the ranker may match, never displayed. */
  keywords?: readonly string[]
}

/**
 * One hit, presenting one target.
 *
 * A union rather than an optional field, so an object result without its `ObjectContext` — or a
 * route result carrying one — cannot be written down. An object result has already resolved its
 * identity through the domain's own builder; nothing downstream re-derives it.
 */
export type FindResult =
  | (FindPresentation & { target: Extract<FindTarget, { kind: 'object' }>; object: ObjectContext })
  | (FindPresentation & { target: Exclude<FindTarget, { kind: 'object' }>; object?: never })

/**
 * A hit as it crosses the server boundary.
 *
 * Icons are React components and do not serialize, so a server source returns identity and the
 * words, and the client adapter supplies the icon from the object's type. `ObjectContext` is four
 * strings and crosses cleanly, which is why the server can build it with the domain's own resolver
 * and the client never has to guess at identity.
 */
export type FindObjectHit = {
  object: ObjectContext
  sublabel?: string
  keywords?: readonly string[]
}

/**
 * Where results come from.
 *
 * Async in the contract even where an implementation is a synchronous array filter, so that moving
 * a source behind a database later is an implementation detail rather than a change to everything
 * that renders results. `heading` is the group a result appears under, and grouping is by kind so
 * that a route called "Payroll Runs" and a run called "PR-SG-2026-09" are never listed as though
 * they were the same sort of thing.
 */
export type FindSource = {
  id: string
  kind: FindKind
  heading: string

  /** Shortest query worth asking for. Server-backed sources set this above zero. */
  minQueryLength?: number

  search: (query: string) => Promise<FindResult[]>
}
