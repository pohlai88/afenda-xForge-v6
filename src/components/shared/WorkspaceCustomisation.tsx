'use client'

// React Imports
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, RefObject } from 'react'

// Third-party Imports
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EllipsisVerticalIcon,
  EyeOffIcon,
  LayoutGridIcon,
  RotateCcwIcon,
  ScalingIcon
} from 'lucide-react'

// Type Imports
import type { ModuleSize, WorkspaceModuleSummary } from '@/types/common/workspace-types'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Util Imports
import { MODULE_SIZE_LABEL, MODULE_SPAN } from '@/types/common/workspace-types'
import { cn } from '@/lib/utils'

type WorkspaceCustomisationValue = {
  customising: boolean

  /** Optional modules the reader has taken out of view. Never contains a required module. */
  hidden: ReadonlySet<string>

  /** What the domain declared, reduced to the facts customisation is entitled to know. */
  modules: readonly WorkspaceModuleSummary[]

  /** Puts a band's modules in the order they are currently in. Zone-scoped, so nothing can leave. */
  sequence: (ids: readonly string[]) => string[]

  /** Which of Move up and Move down would actually change what this reader can see. */
  moves: (id: string) => { up: boolean; down: boolean }

  /** The width this reader has chosen for a module, when it is not the one the domain ships. */
  sizeOf: (id: string) => ModuleSize | undefined

  /** The widths worth offering: the domain's list, or nothing at all when it holds only one. */
  sizeChoices: (id: string) => readonly ModuleSize[]
  announcement: string

  /**
   * Where focus must be put, and a token that changes every time it must be put there again.
   *
   * `bar` is the whole mode arriving or leaving; `list` is a command whose own control has just
   * been removed by running it; `module` is a command that moved the control it was run from and
   * has to catch up with it, named by id because the element is somewhere else now.
   */
  focus: { token: number; target: 'bar' | 'list' | 'module'; moduleId?: string }

  /** Bumped when customising ends, so the page-level entry can take focus back. */
  exitToken: number
  entry: RefObject<HTMLButtonElement | null>
  enter: () => void
  exit: () => void
  hide: (id: string) => void
  restore: (id: string) => void
  move: (id: string, direction: 'up' | 'down') => void
  resize: (id: string, size: ModuleSize) => void
  reset: () => void
}

const NOTHING_HIDDEN: ReadonlySet<string> = new Set()
const NO_MODULES: readonly WorkspaceModuleSummary[] = []
const NO_MOVES = { up: false, down: false }
const NO_SIZES: readonly ModuleSize[] = []
const NO_OVERRIDES: ReadonlyMap<string, ModuleSize> = new Map()
const noop = () => {}

/**
 * A band, cut into the runs of modules that may be shuffled against each other.
 *
 * An immovable module is not a member of any segment — it is the cut. That is the whole of the
 * anchor rule, and it is written here rather than anywhere a zone or a module is named: two
 * modules may swap only if they turn up in the same returned run, so a movable module cannot pass
 * a fixed one and a lone module between two fixed ones has nobody to swap with.
 */
const segmentsOf = (ids: readonly string[], movable: (id: string) => boolean): string[][] => {
  const runs: string[][] = []
  let run: string[] = []

  for (const id of ids) {
    if (movable(id)) {
      run.push(id)
      continue
    }

    if (run.length > 0) runs.push(run)
    run = []
  }

  if (run.length > 0) runs.push(run)

  return runs
}

/**
 * A workspace that was never wrapped is a workspace nobody can customise, which is exactly what
 * every other page rendering a grid wants today — so the default is the whole contract, inert.
 */
const WorkspaceCustomisationContext = createContext<WorkspaceCustomisationValue>({
  customising: false,
  hidden: NOTHING_HIDDEN,
  modules: NO_MODULES,
  sequence: ids => [...ids],
  moves: () => NO_MOVES,
  sizeOf: () => undefined,
  sizeChoices: () => NO_SIZES,
  announcement: '',
  focus: { token: 0, target: 'bar' },
  exitToken: 0,
  entry: { current: null },
  enter: noop,
  exit: noop,
  hide: noop,
  restore: noop,
  move: noop,
  resize: noop,
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
 * Holds one workspace's temporary visibility and order, and nothing else.
 *
 * The domain declaration stays the source of what exists, what it is called, which band owns it,
 * how wide it is and where it starts. This stores the two differences a reader can ask for: a set
 * of hidden ids, and one sequence of ids. There is no second copy of the default layout anywhere —
 * resetting rebuilds the sequence from the declaration it was built from in the first place.
 *
 * One sequence, not an index on every module. A number per module and an array would be two
 * answers to the same question, and the day they disagreed there would be no way to say which was
 * wrong. Hidden modules keep their place in it, because whether you can see something and where it
 * sits are different preferences and neither one should quietly decide the other.
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

  // Declaration order, which is the domain default and therefore also the starting point.
  const [order, setOrder] = useState<readonly string[]>(() => modules.map(module => module.id))

  // Only the widths that differ from the declared one. A module absent from this map is at the
  // width its domain ships, which is why there is nothing here to keep in step with a declaration.
  const [overrides, setOverrides] = useState<ReadonlyMap<string, ModuleSize>>(NO_OVERRIDES)
  const [announcement, setAnnouncement] = useState('')

  const [focus, setFocus] = useState<{ token: number; target: 'bar' | 'list' | 'module'; moduleId?: string }>({
    token: 0,
    target: 'bar'
  })

  const [exitToken, setExitToken] = useState(0)
  const entry = useRef<HTMLButtonElement>(null)

  const declared = useMemo(() => new Map(modules.map(module => [module.id, module])), [modules])

  /*
   * Where each module currently sits, as a lookup.
   *
   * A module the sequence has never heard of — one a domain added since — sorts to the end of its
   * own band rather than throwing or vanishing, which is the only sane thing to do with a fact
   * that arrived after the preference did.
   */
  const rank = useMemo(() => {
    const ranks = new Map(order.map((id, index) => [id, index]))

    return (id: string) => ranks.get(id) ?? order.length
  }, [order])

  /** A band's own ids, in the order this reader has them. Nothing else can get in. */
  const sequence = useCallback(
    (ids: readonly string[]) => [...ids].sort((a, b) => rank(a) - rank(b)),
    [rank]
  )

  /*
   * The run of modules this one may be shuffled within, reduced to what the reader can see.
   *
   * Visible, because a Move that only stepped over something hidden would be a command that
   * appears to do nothing. Hidden ids stay in the stored sequence either way — they are skipped
   * for deciding what is legal, not removed for it.
   */
  const segmentFor = useCallback(
    (id: string) => {
      const found = declared.get(id)

      if (!found?.movable) return []

      const band = sequence(modules.filter(candidate => candidate.zone === found.zone).map(candidate => candidate.id))

      const run = segmentsOf(band, candidate => declared.get(candidate)?.movable === true).find(candidate =>
        candidate.includes(id)
      )

      return (run ?? []).filter(candidate => !hidden.has(candidate))
    },
    [declared, hidden, modules, sequence]
  )

  const moves = useCallback(
    (id: string) => {
      const run = segmentFor(id)
      const at = run.indexOf(id)

      if (at === -1) return NO_MOVES

      return { up: at > 0, down: at < run.length - 1 }
    },
    [segmentFor]
  )

  /*
   * The refusal, and the only place it is decided.
   *
   * A required module offers no Hide command, but absence of a control is not enforcement — it is
   * a rendering decision, and the point of putting the check here is that nothing which can reach
   * this function can get past it, including a caller that never rendered a menu at all.
   */
  const hide = useCallback(
    (id: string) => {
      const found = declared.get(id)

      if (!found || found.required) return

      setHidden(current => (current.has(id) ? current : new Set(current).add(id)))
      setAnnouncement(`${found.title} hidden.`)
      setFocus(current => ({ token: current.token + 1, target: 'list' }))
    },
    [declared]
  )

  const restore = useCallback(
    (id: string) => {
      const found = declared.get(id)

      if (!found || !hidden.has(id)) return

      const next = new Set(hidden)

      next.delete(id)
      setHidden(next)
      setAnnouncement(`${found.title} restored.`)

      // Restoring the last one takes the Hidden modules control away with it, and the menu item
      // that did it is already gone. Everything else leaves the trigger standing for Base UI to
      // return focus to, which is where a reader restoring several in a row wants to be.
      if (next.size === 0) setFocus(current => ({ token: current.token + 1, target: 'list' }))
    },
    [declared, hidden]
  )

  /*
   * The other refusal, decided the same way and in the same place.
   *
   * Both ends of the swap come out of one visible segment, so crossing an anchor or leaving a band
   * is not something this has to check for — it is something it cannot express. The two ids trade
   * their slots in the sequence rather than one being spliced past the other, which is what leaves
   * anything hidden between them exactly where it was.
   */
  const move = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const found = declared.get(id)

      if (!found?.movable) return

      const run = segmentFor(id)
      const at = run.indexOf(id)
      const to = direction === 'up' ? at - 1 : at + 1

      if (at === -1 || to < 0 || to >= run.length) return

      const neighbour = declared.get(run[to])

      if (!neighbour) return

      const next = [...order]
      const a = next.indexOf(id)
      const b = next.indexOf(neighbour.id)

      if (a === -1 || b === -1) return

      next[a] = neighbour.id
      next[b] = id

      setOrder(next)
      setAnnouncement(`${found.title} moved ${direction === 'up' ? 'before' : 'after'} ${neighbour.title}.`)
      setFocus(current => ({ token: current.token + 1, target: 'module', moduleId: id }))
    },
    [declared, order, segmentFor]
  )

  const sizeOf = useCallback((id: string) => overrides.get(id), [overrides])

  /*
   * What to offer, which is not the same as what the engine can render.
   *
   * The engine renders all four widths. A module gets the ones its domain says stay truthful for
   * it, and a module whose domain named only one gets none at all — a Size command that opens on
   * the width you already have is a capability being mimed rather than offered.
   */
  const sizeChoices = useCallback(
    (id: string) => {
      const found = declared.get(id)

      return found && found.sizes.length > 1 ? found.sizes : NO_SIZES
    },
    [declared]
  )

  /*
   * The third refusal, and it is the domain's list that decides.
   *
   * A width the declaration does not name is refused here whether or not a menu ever offered it,
   * and so is the width the module already has: re-choosing what you already have changed nothing,
   * so there is nothing to announce and nothing to move focus for.
   */
  const resize = useCallback(
    (id: string, size: ModuleSize) => {
      const found = declared.get(id)

      if (!found || !found.sizes.includes(size)) return
      if ((overrides.get(id) ?? found.defaultSize) === size) return

      const next = new Map(overrides)

      next.set(id, size)
      setOverrides(next)
      setAnnouncement(`${found.title} resized to ${MODULE_SIZE_LABEL[size].toLowerCase()}.`)
      setFocus(current => ({ token: current.token + 1, target: 'module', moduleId: id }))
    },
    [declared, overrides]
  )

  const reset = useCallback(() => {
    const declaration = modules.map(module => module.id)
    const ordered = order.every((id, index) => id === declaration[index])

    if (hidden.size === 0 && overrides.size === 0 && ordered) return

    setHidden(NOTHING_HIDDEN)
    setOrder(declaration)
    setOverrides(NO_OVERRIDES)
    setAnnouncement('Workspace reset to default.')
  }, [hidden, modules, order, overrides])

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
      sequence,
      moves,
      sizeOf,
      sizeChoices,
      announcement,
      focus,
      exitToken,
      entry,
      enter,
      exit,
      hide,
      restore,
      move,
      resize,
      reset
    }),
    [
      announcement,
      customising,
      enter,
      exit,
      exitToken,
      focus,
      hidden,
      hide,
      modules,
      move,
      moves,
      reset,
      resize,
      restore,
      sequence,
      sizeChoices,
      sizeOf
    ]
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
 * One module, as the grid places it — plus, while customising, the frame that lets it be worked on.
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
  defaultSize,
  children
}: {
  id: string
  title: string
  required: boolean
  defaultSize: ModuleSize
  children: ReactNode
}) => {
  const { customising, exit, focus, hidden, hide, move, moves, resize, sizeChoices, sizeOf } = useContext(
    WorkspaceCustomisationContext
  )

  const trigger = useRef<HTMLButtonElement>(null)
  const handled = useRef(focus.token)

  /*
   * Catch up with a control that moved because of what it did.
   *
   * The menu closes, the module lands somewhere else in the grid, and the trigger the reader was
   * on is now several hundred pixels away — same element, because React keys these by module id
   * and moves the node rather than rebuilding it, so the ref is still the right one. Every frame
   * sees the token change and only the one that was asked for acts on it, which is what makes this
   * an id handoff rather than a search of the document.
   */
  useEffect(() => {
    if (handled.current === focus.token) return

    handled.current = focus.token

    if (focus.target !== 'module' || focus.moduleId !== id) return

    trigger.current?.focus()
  }, [focus, id])

  // Second half of the refusal. `hide` will not put a required id in the set; this would not
  // honour it if something did.
  if (hidden.has(id) && !required) return null

  /*
   * A width the reader chose, applied where the grid could not.
   *
   * The grid gives every module the width its domain declared, and while that is still the width
   * the module has, nothing here touches it — the card is the grid item, exactly as the previous
   * phases proved. A module that has been resized cannot be given a new class the same way: it
   * reaches this component as an already-rendered payload, and half of them arrive as references
   * their chunk has not resolved yet, so cloning finds nothing to clone. So the chosen width goes
   * on a box around it instead, which becomes the grid item and hands its full height back down.
   * That box exists only while a module is somewhere other than where its domain put it.
   */
  const size = sizeOf(id) ?? defaultSize
  const span = MODULE_SPAN[size]

  if (!customising) {
    return size === defaultSize ? children : <div className={cn(span, '[&>*]:h-full')}>{children}</div>
  }

  const legal = moves(id)
  const choices = sizeChoices(id)
  const any = legal.up || legal.down || choices.length > 0 || !required

  return (
    <div onKeyDown={escapeExits(exit)} className={cn('flex flex-col gap-2 rounded-lg border border-dashed p-2', span)}>
      <div className='flex min-h-8 items-center justify-between gap-2 ps-2'>
        <span className='text-muted-foreground truncate text-xs font-medium'>{title}</span>

        <div className='flex shrink-0 items-center gap-2'>
          {/*
            Why there is no Hide, said once, in a word. It is not a state to be discovered by
            opening a menu and finding a command missing from it.
          */}
          {required ? <span className='text-muted-foreground text-xs'>Required</span> : null}

          {/*
            A module with nothing legal to offer gets no menu. Its commands are exactly the ones it
            can run: no greyed-out rows, no Size that opens on the width it already has, and no
            Move on a module that has nowhere to go.
          */}
          {any ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button ref={trigger} variant='ghost' size='icon-sm' aria-label={`Actions for ${title}`} />}
              >
                <EllipsisVerticalIcon className='size-4' aria-hidden='true' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-40' aria-label={`Actions for ${title}`}>
                {legal.up ? (
                  <DropdownMenuItem onClick={() => move(id, 'up')}>
                    <ArrowUpIcon />
                    Move up
                  </DropdownMenuItem>
                ) : null}
                {legal.down ? (
                  <DropdownMenuItem onClick={() => move(id, 'down')}>
                    <ArrowDownIcon />
                    Move down
                  </DropdownMenuItem>
                ) : null}
                {choices.length > 0 ? (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ScalingIcon />
                      Size
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent aria-label={`Size of ${title}`}>
                      <DropdownMenuRadioGroup
                        value={size}
                        onValueChange={next => resize(id, next as ModuleSize)}
                      >
                        {/*
                          Closing on choice, which a radio group does not do by itself. Choosing a
                          width is finishing something, and focus goes back to the module the width
                          belongs to — a menu left standing open behind a reader who is no longer
                          in it is worse than either behaviour on its own.
                        */}
                        {choices.map(choice => (
                          <DropdownMenuRadioItem key={choice} value={choice} closeOnClick>
                            {MODULE_SIZE_LABEL[choice]}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ) : null}
                {required ? null : (
                  <DropdownMenuItem onClick={() => hide(id)} aria-label={`Hide ${title}`}>
                    <EyeOffIcon />
                    Hide
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {children}
    </div>
  )
}

/**
 * A band of the workspace: its heading, and its modules in the order this reader has them.
 *
 * The band is the unit of ordering, and it is one here because it is one in the DOM — a module can
 * only be rendered among the ids this component was handed, so leaving a band is not a move the
 * engine refuses, it is a move it has no way to express. What arrives is the domain's own list;
 * what is rendered is that list sorted, with each module keyed by its id so React moves the node
 * instead of rebuilding the card inside it.
 *
 * The heading goes when everything under it does. A rule and a sentence introducing nothing is
 * worse than no rule, and this band's sentence — that nothing below it needs action today — is
 * false when there is no below. The zone itself is untouched: its modules are still declared,
 * still in it, and still restorable into it.
 */
export const WorkspaceZone = ({
  title,
  description,
  modules
}: {
  title?: string
  description?: string
  modules: readonly { id: string; frame: ReactNode }[]
}) => {
  const { hidden, sequence } = useContext(WorkspaceCustomisationContext)

  const ids = modules.map(module => module.id)
  const ordered = sequence(ids)
  const empty = ids.every(id => hidden.has(id))

  return (
    <>
      {title && !empty ? (
        <div className='col-span-full mt-2 flex flex-col gap-0.5 border-t pt-6'>
          <h2 className='text-lg font-semibold tracking-tight'>{title}</h2>
          {description ? <p className='text-muted-foreground text-sm'>{description}</p> : null}
        </div>
      ) : null}

      {ordered.map(id => modules.find(module => module.id === id)?.frame)}
    </>
  )
}
