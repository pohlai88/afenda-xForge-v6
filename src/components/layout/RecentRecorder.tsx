'use client'

// React Imports
import { useEffect } from 'react'

// Store Imports
import { getObjectContextSnapshot, subscribeObjectContext } from '@/lib/object-context-store'
import { recordRecentObject } from '@/lib/find/recent-and-favourites'

/**
 * Watches which object is active and remembers that it was.
 *
 * It reads the object-context store from outside and adds nothing to it. That store answers one
 * question — *what is the subject of this page right now* — and turning it into a history would
 * have made it answer two, which is how a small correct thing becomes a large ambiguous one.
 * Recent owns Recent; this is the wire between them.
 *
 * Subscribing rather than recording at each call site is what makes the source of an open
 * irrelevant: a row clicked in a table, a link pasted into the address bar, the back button and a
 * result chosen in the palette all end with the same publication, so all four are remembered the
 * same way and none of them knows Recent exists.
 *
 * Rendered once in the app shell. Renders nothing.
 */
const RecentRecorder = () => {
  useEffect(
    () =>
      subscribeObjectContext(() => {
        const active = getObjectContextSnapshot()

        // Publication is the proof the object opened. A cleared subject means a page left, which is
        // not something to remember.
        if (active) recordRecentObject(active)
      }),
    []
  )

  return null
}

export default RecentRecorder
