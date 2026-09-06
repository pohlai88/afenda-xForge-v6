/**
 * A one-slot external store holding the object that is the subject of the current page.
 *
 * This exists because the breadcrumb lives in the app shell, above `<main>`, while the page
 * that knows its own subject renders inside it. React context flows downward, so the page
 * cannot provide to the shell; a store the shell subscribes to and the page writes is the
 * seam that works in that direction without a parent re-render during render.
 *
 * Read it with `useSyncExternalStore`. Write it with `<PublishObjectContext>`, never
 * directly from a component body.
 */

import type { ObjectContext } from '@/types/common/object-context-types'

let current: ObjectContext | null = null

const listeners = new Set<() => void>()

/** Stable identity for the server render, so `useSyncExternalStore` does not loop. */
const SERVER_SNAPSHOT: ObjectContext | null = null

function sameObject(a: ObjectContext | null, b: ObjectContext | null) {
  if (a === b) return true
  if (!a || !b) return false

  return a.type === b.type && a.id === b.id && a.label === b.label && a.href === b.href
}

function emit() {
  for (const listener of listeners) listener()
}

/** Declare the subject of the current page. No-ops when nothing actually changed. */
export function publishObjectContext(next: ObjectContext) {
  if (sameObject(current, next)) return
  current = next
  emit()
}

/**
 * Release the subject, but only if it is still the one being released.
 *
 * Route transitions can mount the next page before the previous one's cleanup runs. An
 * unconditional clear would then wipe the incoming page's subject and leave the breadcrumb
 * showing a raw id, so ownership is checked first.
 */
export function clearObjectContext(owner: ObjectContext) {
  if (!current || current.type !== owner.type || current.id !== owner.id) return
  current = null
  emit()
}

export function subscribeObjectContext(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getObjectContextSnapshot() {
  return current
}

export function getObjectContextServerSnapshot() {
  return SERVER_SNAPSHOT
}
