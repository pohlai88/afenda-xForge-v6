'use client'

/**
 * A list of `FindTarget`s that outlives a render, and the seam that decides where it is kept.
 *
 * Recent and Favourites are the same data structure with different lifetimes and different rules
 * about who puts things in it, so they share one store and differ only in the persistence handed
 * to them. That is the whole reason this exists: swapping either for a server-backed user
 * preference later should replace an argument, not rewrite the feature.
 *
 * Read with `useSyncExternalStore`, the same way the app already reads its object context.
 */

import type { FindTarget } from '@/types/common/find-types'
import { sameTarget } from '@/types/common/find-types'

/**
 * Where a list lives between visits.
 *
 * Deliberately not `Storage`. A server-backed implementation has no `getItem`, and typing this
 * against the browser API would bake the browser into the contract — which is the one thing this
 * boundary exists to prevent.
 */
export type TargetPersistence = {
  read: () => FindTarget[]
  write: (targets: FindTarget[]) => void
}

export type TargetStore = {
  list: () => FindTarget[]
  has: (target: FindTarget) => boolean

  /** Puts a target at the front, removing any earlier copy of it. */
  promote: (target: FindTarget) => void
  remove: (target: FindTarget) => void
  toggle: (target: FindTarget) => void
  subscribe: (listener: () => void) => () => void
  getServerSnapshot: () => FindTarget[]
}

const EMPTY: FindTarget[] = []

/**
 * A target is only worth keeping if it still looks like one.
 *
 * Storage is a string a person can edit and a shape a future version can change, so everything
 * read back is checked before it is trusted. Anything unrecognised is dropped rather than
 * rendered — a stored blob must never be able to put arbitrary text into the palette.
 */
const isTarget = (value: unknown): value is FindTarget => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>

  if (candidate.kind === 'object') return typeof candidate.type === 'string' && typeof candidate.id === 'string'

  if (candidate.kind === 'route' || candidate.kind === 'report' || candidate.kind === 'command') {
    return typeof candidate.key === 'string'
  }

  return false
}

/**
 * Browser storage as persistence.
 *
 * Every access is guarded: a private window, cleared site data or a browser refusing storage all
 * throw, and none of those is a reason for the command palette to fail to open.
 */
export const browserPersistence = (key: string, storage: () => Storage): TargetPersistence => ({
  read: () => {
    try {
      const raw = storage().getItem(key)

      if (!raw) return EMPTY

      const parsed: unknown = JSON.parse(raw)

      return Array.isArray(parsed) ? parsed.filter(isTarget) : EMPTY
    } catch {
      return EMPTY
    }
  },
  write: targets => {
    try {
      storage().setItem(key, JSON.stringify(targets))
    } catch {
      // Nothing to do and nothing worth saying: the list simply will not outlive this visit.
    }
  }
})

/**
 * @param limit the most entries to keep, oldest dropped first. Favourites pass none, because a
 * person who deliberately pinned something should not have it silently evicted by pinning another.
 */
export const createTargetStore = (persistence: TargetPersistence, limit?: number): TargetStore => {
  let targets: FindTarget[] | null = null
  const listeners = new Set<() => void>()

  const load = () => {
    targets ??= persistence.read()

    return targets
  }

  const commit = (next: FindTarget[]) => {
    targets = limit ? next.slice(0, limit) : next
    persistence.write(targets)
    for (const listener of listeners) listener()
  }

  return {
    list: load,
    has: target => load().some(candidate => sameTarget(candidate, target)),
    promote: target => commit([target, ...load().filter(candidate => !sameTarget(candidate, target))]),
    remove: target => commit(load().filter(candidate => !sameTarget(candidate, target))),
    toggle: target => {
      const current = load()
      const kept = current.filter(candidate => !sameTarget(candidate, target))

      commit(kept.length === current.length ? [target, ...current] : kept)
    },
    subscribe: listener => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },

    // One frozen empty array, so `useSyncExternalStore` sees a stable server snapshot rather than
    // a new value every render.
    getServerSnapshot: () => EMPTY
  }
}
