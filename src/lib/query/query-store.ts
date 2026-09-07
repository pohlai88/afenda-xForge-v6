/**
 * What 360 Query is currently being asked about, and where focus goes when it closes.
 *
 * A one-slot external store, the same seam the breadcrumb already uses, because the invocation is
 * a row deep inside a table and the panel is mounted once in the app shell. React context flows
 * downward and could not connect the two.
 *
 * It is emphatically **not** `ObjectContextStore`. That store answers "what is the subject of this
 * page?" and the breadcrumb reads it; this one answers "what is the panel currently asking about?".
 * A nested object — an employee inside a run — must be askable without being published as the
 * page's subject, so 360 Query takes an `ObjectContext` *value* and the shell's orientation state
 * is left alone.
 */

import type { ObjectContext } from '@/types/common/object-context-types'

export type QueryInvocation = {
  object: ObjectContext

  /**
   * The control the panel was opened from, so closing puts focus back on it.
   *
   * Held rather than inferred: by the time the panel mounts, the menu that opened it has already
   * unmounted, so "the previously focused element" is a race rather than an answer.
   */
  returnFocus: HTMLElement | null

  /**
   * Where the question was asked.
   *
   * A subject belongs to the page it was asked from, and there is no cross-route persistence yet.
   * Recording the route here lets the panel decide that from a value rather than by watching for a
   * navigation, and opening a result — which changes the query string and not the path — keeps the
   * question rather than throwing it away.
   */
  route: string | null
}

let current: QueryInvocation | null = null

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

/** Ask about an object. The caller supplies the subject it already owns; nothing is published. */
export function openQuery(object: ObjectContext, returnFocus: HTMLElement | null = null) {
  current = {
    object,
    returnFocus,
    route: typeof window === 'undefined' ? null : window.location.pathname
  }
  emit()
}

export function closeQuery() {
  if (!current) return
  current = null
  emit()
}

export function subscribeQuery(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getQuerySnapshot() {
  return current
}
