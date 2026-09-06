'use client'

// React Imports
import * as React from 'react'
import { useEffect, useRef } from 'react'
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

  return (
    <ContextMenu
      onOpenChange={(open, details) => {
        if (open) invocation.current = keyboardInvocationFrom(details.event)
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
