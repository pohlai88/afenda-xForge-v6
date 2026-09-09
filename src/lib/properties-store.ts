/**
 * Which objects currently have a Properties inspector mounted, and how to open each one.
 *
 * The third store of this shape, and for the third time the same reason: a page knows something the
 * shell needs, React context only flows downward, and a store the shell subscribes to is the seam
 * that works in that direction. `object-context-store` answers *what is this page about* for the
 * breadcrumb; `query-store` answers *what is the panel asking about*; this one answers *what can be
 * inspected right now, and by what*.
 *
 * It holds openers rather than sections. Properties is owned per surface — each one keeps its own
 * open state and mounts its own `PropertiesSheet` with fields only its domain understands — so
 * lifting the content up here would be rebuilding every inspector in the shared layer to satisfy a
 * shortcut. Registering the sheet that already exists keeps one Properties per object: the context
 * menu and the keyboard reach the same component instance, so their fields cannot disagree.
 *
 * Registered by `<PropertiesSheet>` itself while it is mounted, never by a page. That is what keeps
 * every domain file out of this: no workspace, view or provider knows a shortcut exists.
 */

/** The one definition of the binding. Rendered as a hint, matched by the listener, written once. */
export const PROPERTIES_SHORTCUT = 'Alt+Enter'

type Inspector = {
  type: string
  id: string

  /** Opens the sheet that is already mounted for this object. */
  open: () => void
}

const keyOf = (object: { type: string; id: string }) => `${object.type}:${object.id}`

const inspectors = new Map<string, Inspector>()

/**
 * Record that this object can be inspected, and hand back the way to stop saying so.
 *
 * Keyed by type and id, so a workspace mounting one inspector for its run and another for an
 * employee registers two distinct objects rather than one of them replacing the other. Unregistering
 * checks it still owns the entry before removing it, the same ownership check
 * `clearObjectContext` makes: React can mount the next sheet before the previous one's cleanup
 * runs, and an unconditional delete would then remove the live entry.
 */
export function registerPropertiesInspector(inspector: Inspector) {
  const key = keyOf(inspector)

  inspectors.set(key, inspector)

  return () => {
    if (inspectors.get(key) === inspector) inspectors.delete(key)
  }
}

/** The inspector for this object, or nothing — which is also the answer for an absent object. */
export function propertiesInspectorFor(object: { type: string; id: string } | null) {
  return object ? inspectors.get(keyOf(object)) : undefined
}
