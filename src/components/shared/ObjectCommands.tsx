'use client'

// React Imports
import * as React from 'react'
import { useRef } from 'react'
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
  parts
}: ObjectCommandsProps & { parts: MenuParts }) => {
  const { Group, Item, Separator } = parts
  const groups = groupCommands(commands)

  if (groups.length === 0 && !onOpenProperties) return null

  return (
    <>
      <div aria-hidden='true' className='text-muted-foreground truncate px-2 py-1.5 text-xs font-medium'>
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
  const popupRef = useRef<HTMLDivElement>(null)
  const keyboardInvoked = useRef(false)

  // The keypress lands on whatever focusable control the object owns — its link or name button —
  // and bubbles here, which is why the row itself never needs to be focusable.
  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
      keyboardInvoked.current = true
    }
  }

  return (
    <ContextMenu
      onOpenChange={open => {
        // Base UI builds this menu for right-click and long-press, so it leaves focus on the
        // trigger. Opened with Shift+F10 that gave a menu the keyboard could not drive at all:
        // it appeared, but arrow keys still went to the row behind it. Handing focus to the
        // popup starts the menu's own roving focus, and Base UI returns focus to the trigger
        // on close. A frame's delay because the popup mounts into a portal.
        //
        // Only for keyboard invocation. Pointer users already get the behaviour they expect,
        // and moving focus underneath a right-click would be a change to a path that works.
        if (open && keyboardInvoked.current) {
          // The popup mounts into a portal after this callback, so a single frame is too early —
          // the first attempt found nothing to focus and the menu opened undriveable. Retry across
          // a few frames and give up quietly rather than leave a loop running.
          let attempts = 0

          const focusPopup = () => {
            if (popupRef.current) {
              popupRef.current.focus()

              return
            }

            attempts += 1

            if (attempts < 10) {
              requestAnimationFrame(focusPopup)
            }
          }

          requestAnimationFrame(focusPopup)
        }

        if (!open) {
          keyboardInvoked.current = false
        }
      }}
    >
      <ContextMenuTrigger render={render ?? <div className='contents' />} onKeyDown={handleTriggerKeyDown}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent ref={popupRef} className='min-w-52' aria-label={`Commands for ${object.label}`}>
        <ObjectCommandItems
          object={object}
          commands={commands}
          onOpenProperties={onOpenProperties}
          parts={CONTEXT_PARTS}
        />
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
