'use client'

import * as React from 'react'

import { Command as CommandPrimitive } from 'cmdk'

import { CheckIcon, SearchIcon } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot='command'
      className={cn(
        'bg-popover text-popover-foreground flex size-full flex-col overflow-hidden rounded-xl! p-1',
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, 'children'> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  children: React.ReactNode
}) {
  const popup = React.useRef<HTMLDivElement>(null)
  const restoreTo = React.useRef<HTMLElement | null>(null)

  /*
   * A command palette exists to be typed into, so opening one puts the caret in its filter.
   *
   * The input is found by its own `data-slot` rather than by a ref threaded through the caller,
   * because `CommandInput` is rendered by whoever uses the palette and every one of them would
   * otherwise have to remember to wire focus up.
   */
  const focusFilter = (node: HTMLDivElement | null) => {
    const filter = node?.querySelector<HTMLInputElement>('[data-slot=command-input]')

    if (!filter || node?.contains(document.activeElement)) return

    restoreTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    filter.focus()
  }

  /*
   * The first open, which has no other moment.
   *
   * `Dialog.Portal` mounts the popup a commit later than `open` becomes true, so an effect keyed on
   * `open` finds this ref still empty the first time — measured, and the reason one mechanism was
   * not enough here. A callback ref fires exactly when the element attaches, and by then its own
   * children are already inside it, so the filter is there to find.
   */
  const attach = React.useCallback((node: HTMLDivElement | null) => {
    popup.current = node
    focusFilter(node)
  }, [])

  /*
   * Every open after the first, where nothing mounts and `open` is all that changed.
   *
   * A closed popup lingers in the document carrying `data-closed` until its exit transition ends,
   * so a reopen inside that window is a state change rather than a mount and the callback ref above
   * does not fire — measured both ways, closing and reopening. Measured on its own,
   * this covers the second and third opens and misses the first — the exact inverse of the ref, and
   * why both are here rather than one out of habit.
   *
   * `initialFocus` is deliberately not declared. It was tried first, as the primitive's own API and
   * the thing Phase 10 leaned on for Properties, and measured doing nothing at all here: Base UI
   * resolves it before this wrapper's ref exists. A declaration that provably never fires would be
   * decoration. No timer either: mount and `open` are the two moments, and this uses both.
   */
  React.useEffect(() => {
    if (props.open) {
      focusFilter(popup.current)

      return
    }

    /*
     * And every close, because taking focus is what made the reader lose their place.
     *
     * It is explicit for the same reason entry is: on a controlled dialog with no `Dialog.Trigger`,
     * the primitive has nothing it can call the origin, and its own focus props measured inert here.
     * Focus is only pulled back when it is still inside the palette being closed — running a command
     * navigates, and dragging someone back from where they chose to go is worse than leaving them.
     * By the time this runs the background is interactive again, because the wrapper below lifts
     * `inert` in its own effect and effects run child-first.
     */
    const target = restoreTo.current

    restoreTo.current = null

    if (!target?.isConnected || !popup.current?.contains(document.activeElement)) return

    target.focus({ preventScroll: true })
  }, [props.open])

  return (
    <Dialog {...props}>
      <DialogHeader className='sr-only'>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        ref={attach}
        open={props.open ?? false}
        className={cn('top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0', className)}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot='command-input-wrapper' className='p-1 pb-0'>
      <InputGroup className='border-input/30 bg-input/30 h-8! rounded-lg! shadow-none! *:data-[slot=input-group-addon]:pl-2!'>
        <CommandPrimitive.Input
          data-slot='command-input'
          className={cn('w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50', className)}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className='size-4 shrink-0 opacity-50' />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot='command-list'
      className={cn('no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none', className)}
      {...props}
    />
  )
}

function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot='command-empty'
      className={cn('py-6 text-center text-sm', className)}
      {...props}
    />
  )
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot='command-group'
      className={cn(
        'text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium',
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot='command-separator'
      className={cn('bg-border -mx-1 h-px w-auto', className)}
      {...props}
    />
  )
}

function CommandItem({ className, children, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot='command-item'
      className={cn(
        "group/command-item data-selected:bg-muted data-selected:text-foreground data-selected:**:[svg]:text-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <CheckIcon className='ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100' />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='command-shortcut'
      className={cn(
        'text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs tracking-widest',
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
}
