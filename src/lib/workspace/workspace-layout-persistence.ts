// Type Imports
import type { ModuleSize, WorkspaceModuleSummary } from '@/types/common/workspace-types'

// Util Imports
import { MODULE_SPAN, segmentsOf } from '@/types/common/workspace-types'

/**
 * What a reader has done to a workspace, in the smallest form that can be written down.
 *
 * Three differences from the declaration and a version, and nothing else. No titles, no zones, no
 * sizes a module is allowed, no element — everything a module *is* stays in the domain declaration,
 * where it can change without this file knowing. That is the point of storing differences rather
 * than a layout: a stored layout goes stale the day a module is renamed, and a stored difference
 * does not.
 */
export type WorkspaceLayout = {
  version: number

  /** Every module the reader had, in the order they had them. */
  order: readonly string[]

  /** The optional ones they put away. */
  hidden: readonly string[]

  /** Only the widths that differ from the declared one, by module id. */
  sizes: Readonly<Record<string, ModuleSize>>
}

/** The same three differences in the shape the workspace engine holds them. */
export type WorkspaceLayoutState = {
  order: readonly string[]
  hidden: ReadonlySet<string>
  sizes: ReadonlyMap<string, ModuleSize>
}

/**
 * Where a layout is kept, as three operations.
 *
 * The engine depends on this and not on a browser API, so the browser is one implementation of
 * remembering rather than the architecture of it. A later phase that keeps layouts on a server
 * replaces the adapter; nothing above this line has an opinion about where the bytes went.
 *
 * Reading is `load`: an adapter is handed a callback and hands back whatever is stored, then
 * returns the way to stop caring. It is a delivery rather than a return value because a browser
 * can answer immediately and something further away cannot, and the engine should not have to be
 * rewritten the day the answer arrives late. What is delivered is typed `unknown` on purpose — see
 * `reconcileWorkspaceLayout`.
 */
export type WorkspaceLayoutPersistence = {
  load: (workspaceId: string, onLoaded: (stored: unknown) => void) => () => void
  write: (workspaceId: string, layout: WorkspaceLayout) => void
  clear: (workspaceId: string) => void
}

/** The shape this version of the app writes. A payload announcing anything else is not read. */
export const WORKSPACE_LAYOUT_VERSION = 1

/*
 * Namespaced, and keyed by the workspace rather than by the page.
 *
 * `payroll.entity` is one workspace whichever company is being looked at, because a layout is a
 * preference about a kind of screen and not about a company's figures — and because the id comes
 * from the declaration, this file never learns what payroll is.
 */
const KEY_PREFIX = 'afenda.workspace.layout'

const keyFor = (workspaceId: string) => `${KEY_PREFIX}:${workspaceId}`

/**
 * The browser's own memory, behind the seam.
 *
 * Every call is guarded. `localStorage` throws rather than returns when a browser is set to block
 * site data, and it throws again when a quota is reached, so a reader in a locked-down browser
 * must get a workspace that works and forgets rather than a page that does not load. Failing to
 * remember is not a failure worth telling anyone about.
 */
export const browserWorkspaceLayoutPersistence: WorkspaceLayoutPersistence = {
  load: (workspaceId, onLoaded) => {
    let stored: unknown = null

    try {
      const raw = window.localStorage.getItem(keyFor(workspaceId))

      stored = raw === null ? null : JSON.parse(raw)
    } catch {
      // A browser that blocks site data throws here rather than returning nothing. Either way the
      // reader gets the workspace their domain ships, which is a working workspace.
      stored = null
    }

    onLoaded(stored)

    return () => {}
  },

  write: (workspaceId, layout) => {
    try {
      window.localStorage.setItem(keyFor(workspaceId), JSON.stringify(layout))
    } catch {
      // Nothing to do and nobody to tell: the workspace on screen is already correct.
    }
  },

  clear: workspaceId => {
    try {
      window.localStorage.removeItem(keyFor(workspaceId))
    } catch {
      // As above.
    }
  }
}

/** What the reader gets when nothing has been stored, or when what was stored made no sense. */
const defaultsOf = (modules: readonly WorkspaceModuleSummary[]): WorkspaceLayoutState => ({
  order: modules.map(module => module.id),
  hidden: new Set(),
  sizes: new Map()
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stringsIn = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []

/**
 * Puts a stored order back inside the law the live workspace obeys.
 *
 * A reader can only ever have produced a legal order, because Move refuses anything else. A stored
 * payload is not a reader — it is a string somebody could have edited, or one this app wrote before
 * the declaration changed underneath it — so it is treated as a preference about sequence and not
 * as a sequence.
 *
 * The law is 05C's and it is not reimplemented here: a band is cut into runs of movable modules by
 * its immovable ones, and a module may only be arranged against the others in its own run. So each
 * run is re-laid in whatever relative order the payload asked for, the anchors stay at the indices
 * their declaration gives them, and a stored order that had a module on the wrong side of an anchor
 * simply cannot express that once it lands. A module the payload never mentioned sorts last within
 * its run, which is the same fallback the live renderer applies to an id it has no rank for.
 */
const reconcileOrder = (modules: readonly WorkspaceModuleSummary[], stored: readonly string[]): string[] => {
  const rank = new Map(stored.map((id, index) => [id, index]))
  const movable = new Map(modules.map(module => [module.id, module.movable]))
  const rankOf = (id: string) => rank.get(id) ?? stored.length
  const zones = [...new Set(modules.map(module => module.zone))]

  return zones.flatMap(zone => {
    const declared = modules.filter(module => module.zone === zone).map(module => module.id)

    // Each run re-laid in the order the payload asked for, then poured back into the slots the
    // declaration keeps for movable modules. The anchors never move because their slots are never
    // offered, and a run's members land in that run's slots because the runs stay in band order.
    const relaid = segmentsOf(declared, id => movable.get(id) === true)
      .map(run => [...run].sort((a, b) => rankOf(a) - rankOf(b)))
      .flat()

    let poured = 0

    return declared.map(id => (movable.get(id) === true ? relaid[poured++] : id))
  })
}

/**
 * Reads a payload against the declaration and keeps only what is still true.
 *
 * Everything here exists because stored data is input, not memory. It was written by an earlier
 * version of this app, or by hand, or by a browser extension, and the declaration it was written
 * against may have gained modules, lost modules, or narrowed which widths a module will stand
 * behind. So a module that no longer exists is dropped, a required module cannot be hidden however
 * the payload asks, a width the domain does not currently name is dropped rather than clamped —
 * dropping returns the module to the width its domain ships, which is the only width certain to be
 * true — and anything that is not the shape this version writes is read as nothing at all.
 *
 * The declaration is the authority. This is a preference being checked against it.
 */
export const reconcileWorkspaceLayout = (
  modules: readonly WorkspaceModuleSummary[],
  stored: unknown
): WorkspaceLayoutState => {
  if (!isRecord(stored) || stored.version !== WORKSPACE_LAYOUT_VERSION) return defaultsOf(modules)

  const declared = new Map(modules.map(module => [module.id, module]))
  const order = reconcileOrder(modules, stringsIn(stored.order))

  const hidden = new Set(
    stringsIn(stored.hidden).filter(id => {
      const found = declared.get(id)

      return found !== undefined && !found.required
    })
  )

  const sizes = new Map<string, ModuleSize>()

  if (isRecord(stored.sizes)) {
    for (const [id, size] of Object.entries(stored.sizes)) {
      const found = declared.get(id)

      if (!found) continue
      if (typeof size !== 'string' || !(size in MODULE_SPAN)) continue
      if (!found.sizes.includes(size as ModuleSize)) continue

      // A module already at its declared width is not carrying an override, and storing one would
      // put a second answer next to the declaration for it to disagree with later.
      if (size === found.defaultSize) continue

      sizes.set(id, size as ModuleSize)
    }
  }

  return { order, hidden, sizes }
}

/** The engine's state as the seam stores it. */
export const workspaceLayoutOf = (state: WorkspaceLayoutState): WorkspaceLayout => ({
  version: WORKSPACE_LAYOUT_VERSION,
  order: [...state.order],
  hidden: [...state.hidden],
  sizes: Object.fromEntries(state.sizes)
})
