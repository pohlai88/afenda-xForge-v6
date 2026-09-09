'use client'

// React Imports
import { useEffect } from 'react'

// Store Imports
import { getObjectContextSnapshot } from '@/lib/object-context-store'
import { propertiesInspectorFor } from '@/lib/properties-store'

/**
 * Controls the reader is composing text in, where Enter belongs to what they are writing.
 *
 * This is not the blacklist this app already rejected. That one guarded a bare `/` — a printable
 * key with no modifier — and its list of forbidden places kept growing until the shortcut was
 * removed instead. `Alt+Enter` is a modified binding like `⌘K`, which needs no guard at all; the
 * difference that earns this one is that Enter is a key text controls genuinely use, and the app
 * has two in the way already: the 360 Query filter is a `role=combobox` input, and every table
 * search is an `input`. One rule, not a list, and everything else — links, buttons, rows, charts,
 * the page itself — reaches the shortcut.
 */
const EDITABLE =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"], [role="combobox"]'

/**
 * Alt+Enter opens Properties for the object this page is about.
 *
 * Doctrine names the binding twice — `properties.invocation.default_shortcut` and
 * `keyboard.default_bindings.properties` — and Phase 06 deferred it to the shared layer by name.
 * This is that layer, and it is one listener rather than one per page: the two shortcuts this app
 * already ships (`⌘K`, and the sidebar toggle) are both a single document listener, and a binding
 * that every object must remember to install is a binding the next object will forget.
 *
 * Two facts decide whether anything happens, and neither is invented here. The subject comes from
 * the object-context store — the same value the breadcrumb names and Recents remembers, so the
 * shortcut cannot drift into a second notion of "the current object". The capability comes from
 * an inspector being mounted for that object, which is the same fact that puts Properties in its
 * context menu. So this can neither offer Properties where there is none nor withhold it where
 * there is; it is a second route to one capability, never a second source of truth about it.
 *
 * The event is consumed only when it is acted on. No subject, no inspector, or a reader mid-word
 * in a text field, and it is left exactly as it arrived — not prevented, not stopped.
 *
 * Renders nothing. Mounted once in the app shell.
 */
const PropertiesShortcut = () => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Read from the modifier flags, never from what the key would type: the whole binding is
      // which modifiers are down, and `Enter` alone already means Open in this vocabulary.
      if (event.key !== 'Enter' || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return

      if (event.target instanceof Element && event.target.closest(EDITABLE)) return

      const inspector = propertiesInspectorFor(getObjectContextSnapshot())

      if (!inspector) return

      event.preventDefault()
      inspector.open()
    }

    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return null
}

export default PropertiesShortcut
