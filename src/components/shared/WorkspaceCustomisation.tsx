'use client'

// React Imports
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, RefObject } from 'react'

// Third-party Imports
import { EllipsisVerticalIcon, EyeOffIcon, LayoutGridIcon, RotateCcwIcon } from 'lucide-react'

// Type Imports
import type { WorkspaceModuleSummary } from '@/types/common/workspace-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Util Imports
import { cn } from '@/lib/utils'

type WorkspaceCustomisationValue = {
  customising: boolean

  /** Optional modules the reader has taken out of view. Never contains a required module. */
  hidden: ReadonlySet<string>

  /** What the domain declared, reduced to the three facts customisation is entitled to know. */
  modules: readonly WorkspaceModuleSummary[]
  announcement: string

  /**
   * Where focus must be put, and a token that changes every time it must be put there again.
   *
   * `bar` is the whole mode arriving or leaving; `list` is a command whose own control has just
   * been removed by running it.
   */
  focus: { token: number; target: 'bar' | 'list' }

  /** Bumped when customising ends, so the page-level entry can take focus back. */
  exitToken: number
  entry: RefObject<HTMLButtonElement | null>
  enter: () => void
  exit: () => void
  hide: (id: string) => void
  restore: (id: string) => void
  reset: () => void
}

const NOTHING_HIDDEN: ReadonlySet<string> = new Set()
const NO_MODULES: readonly WorkspaceModuleSummary[] = []
const noop = () => {}

/**
 * A workspace that was never wrapped is a workspace nobody can customise, which is exactly what
 * every other page rendering a grid wants today — so the default is the whole contract, inert.
 */
const WorkspaceCustomisationContext = createContext<WorkspaceCustomisationValue>({
  customising: false,
  hidden: NOTHING_HIDDEN,
  modules: NO_MODULES,
  announcement: '',
  focus: { token: 0, target: 'bar' },
  exitToken: 0,
  entry: { current: null },
  enter: noop,
  exit: noop,
  hide: noop,
  restore: noop,
  reset: noop
})

/**
 * Leaves Customise mode on an Escape nobody else wanted.
 *
 * Attached to the temporary chrome rather than to the document, so the layering is structural: a
 * module's own menu is portalled out of this subtree, so its Escape closes the menu and never
 * reaches here. `defaultPrevented` covers anything that handles Escape inside the subtree instead.
 */
const escapeExits = (exit: () => void) => (event: KeyboardEvent<HTMLElement>) => {
  if (event.key !== 'Escape' || event.defaultPrevented) return

  event.preventDefault()
  exit()
}

/**
 * Holds one workspace's temporary visibility, and nothing else.
 *
 * The domain declaration stays the source of what exists, what it is called, which zone owns it,
 * where it sits and how wide it is. This stores only the difference a reader has asked for, as a
 * set of ids — which is why restoring cannot invent a position and resetting cannot restore a
 * stale copy of the layout: there is no copy, so emptying the set *is* the domain default.
 *
 * Ephemeral on purpose. Leaving and re-entering Customise mode keeps it because the provider stays
 * mounted; a reload loses it because nothing writes it anywhere. Persistence is a later phase, and
 * a store that persisted before order and size exist would be storing the wrong shape.
 */
export const WorkspaceCustomisation = ({
  modules,
  children
}: {
  modules: readonly WorkspaceModuleSummary[]
  children: ReactNode
}) => {
  const [customising, setCustomising] = useState(false)
  const [hidden, setHidden] = useState<ReadonlySet<string>>(NOTHING_HIDDEN)
  const [announcement, setAnnouncement] = useState('')
  const [focus, setFocus] = useState<{ token: number; target: 'bar' | 'list' }>({ token: 0, target: 'bar' })
  const [exitToken, setExitToken] = useState(0)
  const entry = useRef<HTMLButtonElement>(null)

  /*
   * The refusal, and the only place it is decided.
   *
   * A required module offers no Hide command, but absence of a control is not enforcement — it is
   * a rendering decision, and the point of putting the check here is that nothing which can reach
   * this function can get past it, including a caller that never rendered a menu at all.
   */
  const hide = useCallback(
    (id: string) => {
      const declared = modules.find(candidate => candidate.id === id)

      if (!declared || declared.required) return

      setHidden(current => (current.has(id) ? current : new Set(current).add(id)))
      setAnnouncement(`${declared.title} hidden.`)
      setFocus(current => ({ token: current.token + 1, target: 'list' }))
    },
    [modules]
  )

  const restore = useCallback(
    (id: string) => {
      const declared = modules.find(candidate => candidate.id === id)

      if (!declared || !hidden.has(id)) return

      const next = new Set(hidden)

      next.delete(id)
      setHidden(next)
      setAnnouncement(`${declared.title} restored.`)

      // Restoring the last one takes the Hidden modules control away with it, and the menu item
      // that did it is already gone. Everything else leaves the trigger standing for Base UI to
      // return focus to, which is where a reader restoring several in a row wants to be.
      if (next.size === 0) setFocus(current => ({ token: current.token + 1, target: 'list' }))
    },
    [hidden, modules]
  )

  const reset = useCallback(() => {
    if (hidden.size === 0) return

    setHidden(NOTHING_HIDDEN)
    setAnnouncement('Workspace reset to default.')
  }, [hidden])

  /*
   * Entering has the same problem leaving does: the menu item that started it took its own menu
   * and the page overflow with it, so the browser is left holding nothing. The bar takes focus,
   * which is both a stable place to stand and the sentence explaining what just happened.
   */
  const enter = useCallback(() => {
    setCustomising(true)
    setFocus(current => ({ token: current.token + 1, target: 'bar' }))
  }, [])

  const exit = useCallback(() => {
    setCustomising(false)
    setAnnouncement('')
    setExitToken(token => token + 1)
  }, [])

  const value = useMemo(
    () => ({
      customising,
      hidden,
      modules,
      announcement,
      focus,
      exitToken,
      entry,
      enter,
      exit,
      hide,
      restore,
      reset
    }),
    [announcement, customising, enter, exit, exitToken, focus, hidden, hide, modules, reset, restore]
  )

  return <WorkspaceCustomisationContext value={value}>{children}</WorkspaceCustomisationContext>
}

/**
 * The page-level way in, and the way back.
 *
 * An overflow rather than a button on the header: customising a workspace is done once and then
 * not again for months, and a permanent control for it would claim a share of the page every
 * reader pays for and almost none use. It disappears while Customise mode is running, because
 * offering to start something already running is not a command, and a menu holding nothing else
 * would be a menu with nothing in it.
 */
export const CustomiseWorkspaceAction = () => {
  const { customising, enter, entry, exitToken } = useContext(WorkspaceCustomisationContext)
  const handled = useRef(exitToken)

  /*
   * Focus back to this trigger when customising ends, whether by Done or by Escape.
   *
   * The bar that held the control the reader just used has unmounted, so there is nothing left to
   * restore focus to and no timer worth guessing with: the token changes, this effect runs after
   * the commit that re-rendered the trigger, and the element is in the document by then.
   */
  useEffect(() => {
    if (handled.current === exitToken) return

    handled.current = exitToken
    entry.current?.focus()
  }, [entry, exitToken])

  if (customising) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button ref={entry} variant='ghost' size='icon' aria-label='Workspace actions' />}>
        <EllipsisVerticalIcon className='size-4.5' aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-52'>
        <DropdownMenuItem onClick={enter}>
          <LayoutGridIcon />
          Customise workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * The temporary bar that says the workspace is being customised, and holds everything that is not
 * about one module.
 *
 * There is no Save, because there is nothing to save to: every change is already applied to what
 * the reader is looking at, and a Save button would promise a permanence this phase does not have.
 * Done is an exit, not a commit.
 */
export const WorkspaceCustomiseBar = () => {
  const { announcement, customising, exit, focus, hidden, modules, reset, restore } = useContext(
    WorkspaceCustomisationContext
  )

  const bar = useRef<HTMLDivElement>(null)
  const hiddenTrigger = useRef<HTMLButtonElement>(null)
  const done = useRef<HTMLButtonElement>(null)
  const handled = useRef(focus.token)

  /*
   * Somewhere real to stand after the control you used disappeared.
   *
   * Three commands remove the control that ran them: starting to customise takes the page overflow
   * away, hiding a module takes its menu with it, and restoring the last hidden one takes the list.
   * The browser would drop focus to the body in all three. Starting lands on the bar, which is also
   * the sentence explaining what just happened; the other two land on the Hidden modules control,
   * with Done as the fallback for when that is the control that went.
   */
  useEffect(() => {
    if (handled.current === focus.token) return

    handled.current = focus.token

    const target = focus.target === 'bar' ? bar.current : (hiddenTrigger.current ?? done.current)

    target?.focus()
  }, [focus])

  if (!customising) return null

  const hiddenModules = modules.filter(module => hidden.has(module.id))

  return (
    <div
      ref={bar}
      role='region'
      aria-label='Customising workspace'
      tabIndex={-1}
      onKeyDown={escapeExits(exit)}
      className='bg-muted/40 focus-visible:ring-ring/50 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-dashed px-4 py-3 outline-none focus-visible:ring-3'
    >
      <div className='flex min-w-0 flex-col'>
        <span className='text-sm font-medium'>Customising workspace</span>
        <span className='text-muted-foreground text-xs'>
          Hide what this company does not need. Nothing is kept — a reload brings everything back.
        </span>
      </div>

      <div className='ms-auto flex flex-wrap items-center gap-2'>
        {hiddenModules.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button ref={hiddenTrigger} variant='outline' size='sm' />}>
              <EyeOffIcon />
              Hidden modules ({hiddenModules.length})
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-56'>
              {hiddenModules.map(module => (
                <DropdownMenuItem key={module.id} onClick={() => restore(module.id)}>
                  Restore {module.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {/*
          Never disabled, which is deliberate. A control that switches itself off as its own last
          act takes the reader's focus to the document body with it, and losing your place is a
          worse outcome than a Reset that has nothing to undo.
        */}
        <Button variant='ghost' size='sm' onClick={reset} aria-label='Reset workspace'>
          <RotateCcwIcon />
          Reset
        </Button>

        <Button ref={done} size='sm' onClick={exit} aria-label='Done customising'>
          Done
        </Button>
      </div>

      <div aria-live='polite' className='sr-only'>
        {announcement}
      </div>
    </div>
  )
}

/**
 * One module, as the grid places it — plus, while customising, the frame that lets it be taken out.
 *
 * In normal mode this renders its child and nothing else: no element, no attribute, no wrapper
 * waiting to be useful later. That is the point. The module is still the grid item, still carries
 * the width the grid gave it, and the rendered workspace is the one the previous phase proved.
 *
 * While customising, a frame takes the module's place in the grid so the controls have somewhere
 * to live that is not inside a domain card. It is dashed and labelled because it is scaffolding,
 * and it goes away entirely when Done is pressed.
 */
export const WorkspaceModuleFrame = ({
  id,
  title,
  required,
  span,
  children
}: {
  id: string
  title: string
  required: boolean
  span: string
  children: ReactNode
}) => {
  const { customising, exit, hidden, hide } = useContext(WorkspaceCustomisationContext)

  // Second half of the refusal. `hide` will not put a required id in the set; this would not
  // honour it if something did.
  if (hidden.has(id) && !required) return null

  if (!customising) return children

  return (
    <div onKeyDown={escapeExits(exit)} className={cn('flex flex-col gap-2 rounded-lg border border-dashed p-2', span)}>
      <div className='flex min-h-8 items-center justify-between gap-2 ps-2'>
        <span className='text-muted-foreground truncate text-xs font-medium'>{title}</span>

        {/*
          A required module gets a word, not a menu. The only command this phase has is one it may
          not run, and a menu that opens on nothing — or on a disabled row — reads as a capability
          being withheld rather than one that was never true of this module.
        */}
        {required ? (
          <span className='text-muted-foreground shrink-0 text-xs'>Required</span>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='ghost' size='icon-sm' aria-label={`Actions for ${title}`} />}>
              <EllipsisVerticalIcon className='size-4' aria-hidden='true' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-40'>
              <DropdownMenuItem onClick={() => hide(id)} aria-label={`Hide ${title}`}>
                <EyeOffIcon />
                Hide
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {children}
    </div>
  )
}

/**
 * A band's heading, present only while the band has something under it.
 *
 * Hiding every module in a zone leaves a rule and a sentence introducing nothing, and this one's
 * sentence — that nothing below it needs action today — is false when there is no below. The zone
 * itself is untouched: its modules are still declared, still in it, and still restorable into it.
 */
export const WorkspaceZoneHeading = ({
  title,
  description,
  moduleIds
}: {
  title: string
  description?: string
  moduleIds: readonly string[]
}) => {
  const { hidden } = useContext(WorkspaceCustomisationContext)

  if (moduleIds.every(id => hidden.has(id))) return null

  return (
    <div className='col-span-full mt-2 flex flex-col gap-0.5 border-t pt-6'>
      <h2 className='text-lg font-semibold tracking-tight'>{title}</h2>
      {description ? <p className='text-muted-foreground text-sm'>{description}</p> : null}
    </div>
  )
}
