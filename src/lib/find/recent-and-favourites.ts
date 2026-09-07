'use client'

/**
 * The two lists the command palette opens with, and the rule that keeps them apart.
 *
 * **Recent is what you did; Favourites is what you chose.** Recent is written by the app and may be
 * thrown away — it lives for the session, holds ten entries, and evicts the oldest without asking.
 * Favourites is written only by a person, so nothing evicts it and it outlives the browser being
 * closed. Same structure, opposite lifetimes, which is why they are one store with two arguments.
 *
 * Neither is authorization and neither is a cache. A stored target is a name; every label, figure
 * and address around it is resolved fresh, under the current actor, at the moment it is shown.
 *
 * Doctrine: `shortcuts_and_favourites` (D02) and `search` (D18).
 */

import type { FindTarget } from '@/types/common/find-types'
import { browserPersistence, createTargetStore } from '@/lib/find/target-store'

/**
 * Ten.
 *
 * Recent is for the handful of things still in your head from this session, and a list long enough
 * to need scanning has stopped being that. Deliberately not configurable: a setting would make the
 * reader responsible for tuning something they should never have to think about.
 */
const RECENT_LIMIT = 10

const memoryOnly = () => {
  const held = new Map<string, string>()

  return {
    getItem: (key: string) => held.get(key) ?? null,
    setItem: (key: string, value: string) => void held.set(key, value)
  } as unknown as Storage
}

/**
 * Recent belongs to this visit, so it goes in session storage: closing the tab is a reasonable way
 * to say "I am done with that". Favourites is a decision, so it goes somewhere that survives —
 * local storage rather than the cookie this app uses for theme settings, because a cookie travels
 * with every request and a growing list of pins has no business being in a request header.
 *
 * Both fall back to memory when storage is unavailable, so a private window loses persistence and
 * nothing else.
 */
const sessionStore = () => (typeof window === 'undefined' ? memoryOnly() : window.sessionStorage)
const durableStore = () => (typeof window === 'undefined' ? memoryOnly() : window.localStorage)

export const recentStore = createTargetStore(browserPersistence('afenda.find.recent', sessionStore), RECENT_LIMIT)

export const favouriteStore = createTargetStore(browserPersistence('afenda.find.favourites', durableStore))

/**
 * Record that an object became the thing on screen.
 *
 * Called when an object is genuinely active — published to the object-context store, or derived
 * from the URL by the workspace showing it — never when a result is merely highlighted or hovered,
 * and never on an open that failed. Re-opening something already in the list moves it to the front
 * rather than adding a second copy.
 *
 * Objects only. A route recent would fill the list with the four pages everybody visits and bury
 * the work, and there is no evidence yet that anyone wants it; `FindTarget` already carries routes
 * if that changes.
 */
export const recordRecentObject = (object: { type: string; id: string }) => {
  const target: FindTarget = { kind: 'object', type: object.type, id: object.id }

  recentStore.promote(target)
}

/**
 * Forget a target that the current actor can no longer resolve.
 *
 * Called only when resolution has actually been attempted and come back empty, so a target is
 * never dropped because a request failed. Recent forgets silently; a favourite is a decision
 * somebody made, so it stays until they unmake it — a permission restored tomorrow should find the
 * pin still there.
 */
export const forgetUnresolvedRecent = (targets: readonly FindTarget[]) => {
  for (const target of targets) recentStore.remove(target)
}
