'use client'

// React Imports
import { useEffect, useRef } from 'react'

/**
 * Takes the page behind an open modal out of the tab order.
 *
 * Base UI contains focus with two sentinel guards around the popup: reaching one schedules focus
 * back to the first or last thing inside. Measured in this app, that bounce is scheduled rather than
 * immediate, and there is a reproducible state where it does not happen at all — focus parks on the
 * guard, and the next Tab leaves the modal for `document.body` and then walks the page behind it,
 * with the modal still open.
 *
 * So this does not add a second focus trap, intercept a key, or run a timer. It removes the
 * destination: `inert` takes a subtree out of the tab order and out of hit-testing, which is the
 * platform's own answer to "there is a modal in front of this". Base UI already marks the background
 * `aria-hidden` — correct for a screen reader and no help at all to a Tab key — so this is the other
 * half of the same statement rather than a competing one. If the guards bounce, nothing changes; if
 * they miss, there is nowhere outside to land.
 *
 * "Background" is every direct child of `<body>` that does not contain the popup, which is
 * deterministic and does not depend on when Base UI's own marking runs. The portal is excluded by
 * that test rather than by name.
 *
 * `open` is passed rather than read off the popup, and the timing is the reason. The popup outlives
 * its own closing — it stays in the document carrying `data-closed` — and Base UI writes those state
 * attributes after this effect has already run, so an element that looks open here can be closed a
 * moment later and nothing would lift `inert` again. Worse, the surface that opened the modal
 * restores focus in its own effect, and focusing an element that is still inert silently does
 * nothing: the reader would be left with the page dimmed out of the tab order and focus nowhere.
 *
 * Taking `open` as an argument makes the lift happen in the same commit as the close, and effects
 * run child-first, so the background is interactive again before the caller above tries to put focus
 * back into it. Nothing polls, nothing is scheduled, and nothing is inferred.
 *
 * Nesting is handled without counting: each caller remembers only the elements *it* marked and skips
 * anything already inert, so an inner modal closing cannot un-inert the outer one's background.
 */
export const useModalBackgroundInert = (popup: HTMLElement | null, open: boolean) => {
  const marked = useRef<Element[]>([])

  const restore = () => {
    for (const element of marked.current) element.removeAttribute('inert')
    marked.current = []
  }

  useEffect(() => {
    if (!popup || !open) {
      restore()

      return
    }

    if (marked.current.length > 0) return

    marked.current = [...document.body.children].filter(
      element => !element.contains(popup) && !element.hasAttribute('inert')
    )

    for (const element of marked.current) element.setAttribute('inert', '')
  })

  // The page must not be left inert by a modal that was unmounted rather than closed — a route
  // change while Properties is open, for instance.
  useEffect(() => restore, [])
}
