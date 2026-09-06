'use client'

// React Imports
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { EllipsisVerticalIcon, InfoIcon } from 'lucide-react'

// Type Imports
import type { ObjectCommand, ObjectContext } from '@/types/common/object-context-types'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Util Imports
import { groupCommands } from '@/types/common/object-context-types'

type MenuParts = {
  Group: typeof ContextMenuGroup | typeof DropdownMenuGroup
  Item: typeof ContextMenuItem | typeof DropdownMenuItem
  Separator: typeof ContextMenuSeparator | typeof DropdownMenuSeparator
}

const CONTEXT_PARTS: MenuParts = {
  Group: ContextMenuGroup,
  Item: ContextMenuItem,
  Separator: ContextMenuSeparator
}

const DROPDOWN_PARTS: MenuParts = {
  Group: DropdownMenuGroup,
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator
}

type ObjectCommandsProps = {
  object: ObjectContext
  commands: readonly ObjectCommand[]
  onOpenProperties?: (object: ObjectContext) => void
}

/**
 * The command list itself, rendered with whichever menu family is hosting it.
 *
 * Right-click and the overflow button must offer exactly the same commands — the phase brief
 * requires that right-click never be the only route to an operation — so the list is built
 * once here and the trigger is the only thing that differs.
 */
const ObjectCommandItems = ({
  object,
  commands,
  onOpenProperties,
  parts,
  anchorRef
}: ObjectCommandsProps & { parts: MenuParts; anchorRef?: React.Ref<HTMLDivElement> }) => {
  const { Group, Item, Separator } = parts
  const groups = groupCommands(commands)

  if (groups.length === 0 && !onOpenProperties) return null

  return (
    <>
      {/*
        The object's name, and — when the caller asks for it — the handle by which the mounted
        popup is found. It is already inside the popup and already rendered, so a menu needs no
        extra element to be reachable from its own content, and nothing is added to the accessible
        tree that was not there before.
      */}
      <div
        ref={anchorRef}
        aria-hidden='true'
        className='text-muted-foreground truncate px-2 py-1.5 text-xs font-medium'
      >
        {object.label}
      </div>
      {groups.map((group, index) => (
        <Group key={group[0].id}>
          {index > 0 ? <Separator /> : null}
          {group.map(command => {
            const Icon = command.icon

            return command.href ? (
              <Item key={command.id} render={<Link href={command.href} />}>
                {Icon ? <Icon /> : null}
                {command.label}
              </Item>
            ) : (
              <Item
                key={command.id}
                variant={command.destructive ? 'destructive' : 'default'}
                onClick={command.onSelect}
              >
                {Icon ? <Icon /> : null}
                {command.label}
              </Item>
            )
          })}
        </Group>
      ))}
      {onOpenProperties ? (
        <Group>
          {groups.length > 0 ? <Separator /> : null}
          <Item onClick={() => onOpenProperties(object)}>
            <InfoIcon />
            Properties
          </Item>
        </Group>
      ) : null}
    </>
  )
}

/** The control the keypress came from, remembered so focus can be handed back to exactly it. */
type KeyboardInvocation = { target: HTMLElement | null }

const FIRST_ENABLED_ITEM = '[role="menuitem"]:not([data-disabled]):not([aria-disabled="true"])'

/**
 * Whether an opening came from the keyboard, read from the event that opened the menu.
 *
 * Shift+F10 and the Menu key make the browser raise a `contextmenu` reporting no mouse button at
 * all; a right-click reports button 2. Measured on this app: keyboard `button: -1, buttons: 0,
 * detail: 0`, right-click `button: 2`.
 *
 * Taken from Base UI's own opening event rather than from an `onKeyDown` passed alongside
 * `render`, because whether a caller's handler survives the primitive's prop merging is not
 * something a keyboard user's only route to a command should rest on.
 */
const keyboardInvocationFrom = (event: Event | undefined): KeyboardInvocation | null => {
  if (!event || event.type !== 'contextmenu') return null

  const mouse = event as MouseEvent

  if (mouse.button === 2 || mouse.buttons !== 0 || mouse.detail !== 0) return null

  return { target: (event.target as HTMLElement | null) ?? null }
}

/**
 * Hands focus to the first command when the menu was opened from the keyboard.
 *
 * This renders *inside* the popup, which is the whole point. The previous attempt ran from
 * `onOpenChange` — which fires before the portalled popup exists — and chased it across ten
 * animation frames; that is a race, and it lost, observed on Run History as a menu that opened
 * correctly and could not then be driven. Mounting is the signal: by the time this effect runs its
 * siblings are in the document, so there is nothing to poll for and nothing to cancel, because the
 * popup unmounts on close and takes the effect with it.
 *
 * The first enabled item takes focus rather than the popup itself, so a keyboard user lands on
 * something actionable and Base UI's roving focus continues from there. Focusing twice under
 * Strict Mode is the same as focusing once.
 *
 * Nothing here runs for a pointer opening.
 */
const KeyboardFocusHandoff = ({
  invocation,
  anchorRef
}: {
  invocation: React.RefObject<KeyboardInvocation | null>
  anchorRef: React.RefObject<HTMLDivElement | null>
}) => {
  useEffect(() => {
    if (!invocation.current) return

    const popup = anchorRef.current?.closest<HTMLElement>('[role="menu"]')

    popup?.querySelector<HTMLElement>(FIRST_ENABLED_ITEM)?.focus()
  }, [invocation, anchorRef])

  return null
}

/**
 * Wraps a row, card or header so right-clicking it asks "what can I do with this object?".
 *
 * `render` supplies the element the trigger becomes, which matters inside a table: a wrapper
 * element is not valid between `<tbody>` and `<tr>`, so callers pass the row itself.
 *
 * Deliberately does not make its child focusable. Keyboard users reach the same commands
 * through `<ObjectCommandsButton>`, and Shift+F10 works from whatever focusable element the
 * object already owns — its link or name button — because the contextmenu event bubbles.
 * Giving rows their own focus behaviour belongs with the One Table Engine, not here.
 */
export const ObjectContextMenu = ({
  object,
  commands,
  onOpenProperties,
  render,
  children
}: ObjectCommandsProps & { render?: ReactElement; children: ReactNode }) => {
  const anchorRef = useRef<HTMLDivElement>(null)

  // Decided afresh on every opening, so a pointer open can never inherit a keyboard one.
  const invocation = useRef<KeyboardInvocation | null>(null)

  /*
   * Whether this closing is the one case that has to put focus back itself.
   *
   * Only Escape. Every other way out of the menu has a destination that owns focus already —
   * choosing a command navigates or opens a sheet, clicking away moves focus where the click went,
   * tabbing out is the user driving. Cancelling is the only exit that means "put me back where I
   * was", and it is the only one this restores.
   */
  const restoreOnClose = useRef(false)

  /*
   * The menu's own open state, observed rather than controlled.
   *
   * It is deliberately not passed back to `ContextMenu` — Base UI keeps owning opening and closing,
   * and taking that over stopped Escape closing the menu at all when it was tried. This exists only
   * so that closing is a render, which is the one close-time boundary this version of Base UI
   * actually offers: `onOpenChangeComplete` is never called with `false` for a menu (`MenuPopup`
   * has a single call site, guarded by `if (open)`), and the popup does not unmount on close —
   * it stays in the document carrying `data-closed` — so there is no unmount to hook either.
   */
  const [open, setOpen] = useState(false)

  /*
   * Put focus back where a cancelling keyboard user started.
   *
   * `finalFocus` below is the first attempt and is left alone; Base UI hands it to Floating UI's
   * return-focus, which is conditional on where focus sits as the popup closes and so cannot be
   * relied on. When it works this sees focus already on the target and does nothing. Both aim at
   * the same control, so there is no argument between them either way.
   */
  useEffect(() => {
    if (open) return

    const target = restoreOnClose.current ? invocation.current?.target : null

    invocation.current = null
    restoreOnClose.current = false

    if (!target?.isConnected || document.activeElement === target) return

    target.focus({ preventScroll: true })
  }, [open])

  return (
    <ContextMenu
      onOpenChange={(next, details) => {
        setOpen(next)

        if (next) {
          invocation.current = keyboardInvocationFrom(details.event)
          restoreOnClose.current = false

          return
        }

        // Read from the close reason Base UI reports, never from a key event seen elsewhere: this
        // menu's own closing is the only thing that can say this menu was cancelled.
        restoreOnClose.current = details.reason === 'escape-key' && invocation.current !== null
      }}

    >
      <ContextMenuTrigger render={render ?? <div className='contents' />}>{children}</ContextMenuTrigger>
      <ContextMenuContent

        /*
         * Back to the exact control the keypress came from, never the row or the table.
         *
         * Needed only because the user may have arrowed away from where focus was handed: Base UI
         * restores correctly while focus is still on the item it was given, and strands it on the
         * unmounting popup once the highlight has moved. Observed both ways. `true` hands the
         * pointer path back to Base UI's own behaviour, which is what returns focus to the ellipsis
         * trigger and is left untouched.
         */
        finalFocus={() => invocation.current?.target ?? true}
        className='min-w-52'
        aria-label={`Commands for ${object.label}`}
      >
        <ObjectCommandItems
          object={object}
          commands={commands}
          onOpenProperties={onOpenProperties}
          parts={CONTEXT_PARTS}
          anchorRef={anchorRef}
        />
        <KeyboardFocusHandoff invocation={invocation} anchorRef={anchorRef} />
      </ContextMenuContent>
    </ContextMenu>
  )
}

/** The pointer- and keyboard-reachable twin of the context menu. */
export const ObjectCommandsButton = ({ object, commands, onOpenProperties }: ObjectCommandsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant='ghost' size='icon' aria-label={`Commands for ${object.label}`} />}>
      <EllipsisVerticalIcon className='size-4.5' aria-hidden='true' />
    </DropdownMenuTrigger>
    <DropdownMenuContent align='end' className='min-w-52' aria-label={`Commands for ${object.label}`}>
      <ObjectCommandItems
        object={object}
        commands={commands}
        onOpenProperties={onOpenProperties}
        parts={DROPDOWN_PARTS}
      />
    </DropdownMenuContent>
  </DropdownMenu>
)
