'use client'

// React Imports
import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

// Type Imports
import type { ObjectContext } from '@/types/common/object-context-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// Store Imports
import { registerPropertiesInspector } from '@/lib/properties-store'

export type PropertyField = {
  label: string
  value: ReactNode
}

export type PropertySection = {
  title: string
  fields: PropertyField[]
}

type Props = {
  object: ObjectContext | null

  /** What kind of thing this is, in the user's words: 'Pay run', 'Employee'. */
  typeLabel: string
  sections: PropertySection[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const Field = ({ label, value }: PropertyField) => (
  <div className='grid grid-cols-[8rem_1fr] gap-x-3 py-1.5 text-sm'>
    <dt className='text-muted-foreground'>{label}</dt>
    <dd className='min-w-0 break-words'>{value}</dd>
  </div>
)

/**
 * The canonical read-oriented object inspector: "what exactly is this object?".
 *
 * Properties is not Edit. It states what the object is and never offers to change it, which
 * is why this component takes no actions — a surface that needs to act on the object exposes
 * that through its commands, not through here.
 *
 * This owns presentation only: the header, the object's identity, section layout, scrolling,
 * close and focus behaviour. Every field comes from the domain, because the shared layer has
 * no business knowing what a payslip or a legal entity is made of.
 *
 * It also says, while it is mounted, that this object can be inspected — which is what lets the
 * shell's Alt+Enter reach the inspector a surface already built without that surface being told a
 * shortcut exists. The opener is the sheet's own `onOpenChange`, so the keyboard and the context
 * menu end at the same component instance and cannot show different fields.
 */
const PropertiesSheet = ({ object, typeLabel, sections, open, onOpenChange }: Props) => {
  /*
   * Where focus goes when Properties opens: the popup itself, which Base UI already gives
   * `tabIndex: -1` and already focuses on its own touch path.
   *
   * Not the first tabbable, which is what the primitive would take by default and is the Close
   * button — one of the three ways in is `Alt+Enter`, so a reader still holding Enter would dismiss
   * the inspector they had just asked for. Not the scroll viewport either: it is a container for the
   * fields, not a control. The popup announces the object and puts the reader inside the trap, which
   * is what a read-oriented inspector wants and what makes `Tab` reach the content instead of the
   * page behind it.
   */
  const popup = useRef<HTMLDivElement | null>(null)

  /*
   * The moment the popup exists, which is the only moment the first open has.
   *
   * A callback ref rather than an effect, because on the first open there is no commit at which the
   * element is both mounted and reachable from an effect that runs early enough — measured, an
   * effect keyed on `open` finds the ref still empty the first time and lands on nothing. React
   * calls this with the node as it attaches, so there is nothing to poll for and no frame to chase.
   *
   * It does not fire again. After the first close the popup stays in the document carrying
   * `data-closed`, so reopening is a state change and not a mount — which is what the effect below
   * is for.
   */
  /*
   * Where focus goes back to, captured at the instant before it is taken away.
   *
   * Entry and restoration are one lifecycle here and this is why: nothing else knows what the reader
   * was on. There is no `Dialog.Trigger` — the sheet is opened by controlled state from a menu item,
   * a shortcut or a row — so the primitive's own "return to the trigger" has no trigger to return
   * to, and Phase 09's measured restoration only worked because focus had never left in the first
   * place. Taking focus correctly is what makes putting it back this component's job.
   */
  const restoreTo = useRef<HTMLElement | null>(null)

  const takeFocus = useCallback((node: HTMLDivElement | null) => {
    if (!node || node.contains(document.activeElement)) return

    restoreTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    node.focus({ preventScroll: true })
  }, [])

  const attachPopup = useCallback(
    (node: HTMLDivElement | null) => {
      popup.current = node
      takeFocus(node)
    },
    [takeFocus]
  )

  /*
   * Held in a ref so registration depends on which object this is, not on how the caller happened
   * to write its handler. Several call sites pass an inline arrow, which is a new function every
   * render; keying the effect on it would re-register on every render for no change at all.
   */
  const openChange = useRef(onOpenChange)

  // Written after the commit, never during render: a ref mutated while rendering is the shape React
  // 19 cannot reason about, and `react-hooks/refs` says so. The initial value is already correct.
  useEffect(() => {
    openChange.current = onOpenChange
  })

  /*
   * The rest of the opens, and every close.
   *
   * **Opening.** The callback ref above covers the first open, this covers the rest, and both were
   * measured failing on the other's case: the first open has no commit where the element is already
   * reachable from an effect, and a reopen mounts nothing for a callback ref to fire on. Focusing an
   * element that already has focus is a no-op, so on the one open where they could overlap they
   * agree rather than fight. `initialFocus` says the same thing to the primitive and stays, because
   * it aims Base UI at this element rather than at its own default, which is the Close button.
   *
   * **Closing.** `finalFocus` is declared and cannot run: Base UI restores focus when the popup
   * unmounts, and this popup does not — after a close it stays in the document carrying
   * `data-closed`. Since taking focus is what made the reader lose their place, putting it back is
   * this component's job too, and it is the same thing `QueryPanel` does for the same reason.
   *
   * Focus is only pulled back when it is still inside the sheet being closed. Every other way out
   * already has a destination that owns focus — a link followed, a control clicked — and dragging
   * the reader somewhere they have already left is worse than leaving them there.
   *
   * No timer anywhere. Mount, `open` and its inverse are the moments that exist, and this uses them.
   */
  useEffect(() => {
    if (open) {
      takeFocus(popup.current)

      return
    }

    const target = restoreTo.current

    restoreTo.current = null

    if (!target?.isConnected || !popup.current?.contains(document.activeElement)) return

    target.focus({ preventScroll: true })
  }, [open, takeFocus])

  const type = object?.type
  const id = object?.id

  useEffect(() => {
    if (!type || !id) return

    return registerPropertiesInspector({ type, id, open: () => openChange.current(true) })
  }, [type, id])

  if (!object) return null

  const populated = sections.filter(section => section.fields.length > 0)

  /*
   * Back to what the reader was on, and only while it is still there to go back to.
   *
   * A context menu unmounts the item that opened this, and `true` hands that case to the primitive
   * rather than focusing a detached node and stranding the next Tab at the top of the document.
   */
  const finalFocus = () => (restoreTo.current?.isConnected ? restoreTo.current : true)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent ref={attachPopup} initialFocus={popup} finalFocus={finalFocus} className='gap-0 sm:max-w-md'>
        <SheetHeader className='pr-12'>
          <Badge variant='secondary' className='w-fit'>
            {typeLabel}
          </Badge>
          <SheetTitle className='text-base'>{object.label}</SheetTitle>
          <SheetDescription>Properties — what this object is, not what to do with it.</SheetDescription>
        </SheetHeader>

        <ScrollArea className='min-h-0 flex-1'>
          <div className='flex flex-col gap-4 px-4 pb-4'>
            {populated.map((section, index) => (
              <div key={section.title} className='flex flex-col gap-1'>
                {index > 0 ? <Separator className='mb-3' /> : null}
                <h3 className='text-sm font-semibold'>{section.title}</h3>
                <dl>
                  {section.fields.map(field => (
                    <Field key={field.label} label={field.label} value={field.value} />
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default PropertiesSheet
