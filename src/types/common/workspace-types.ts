/**
 * Workspace Grid: the contract for "which modules make up this workspace, and what may a person do
 * with them?".
 *
 * The split it exists to hold is the same one the table engine and 360 Query already hold. A domain
 * says what its workspace is made of and what would be true or untrue to do with each part; the
 * shared renderer says how that becomes a layout. Nothing here knows what a pay run is, and nothing
 * in a domain declaration knows what a CSS column is.
 *
 * There are no coordinates. A module has a width chosen from four names and a height it decides for
 * itself, because every module in this product already sizes to its own content — a chart, a status
 * card and a table each know how tall they should be, and a layout that overrode them would be
 * inventing a fact none of them holds.
 *
 * Doctrine: `workspace_grid` (D08) in `.architecture/ux/afenda-ui-ux-doctrine.yaml`.
 */

import type { ReactElement } from 'react'

/**
 * The four widths, as fractions of a six-column workspace.
 *
 * Not a general vocabulary — these are the widths this product already uses, counted across every
 * payroll surface: `col-span-full`, `lg:col-span-2`, `lg:col-span-3` and `lg:col-span-4` and
 * nothing else. Naming them after the fraction rather than the column count is what lets the
 * renderer change the column count one day without every domain having to be rewritten.
 */
export type ModuleSize = 'one-third' | 'half' | 'two-thirds' | 'full'

/**
 * A width, as the six-column grid expresses it — the one conversion from a name to a layout.
 *
 * Every module is full width below `lg` and its declared width above, which is what every payroll
 * workspace was already hand-writing on every card. Keeping the collapse here rather than in the
 * declaration is what makes "one stored width, rendered as a column when there is no room for
 * columns" true by construction: a domain never gets to say what happens on a phone, so it can
 * never say something different there.
 */
export const MODULE_SPAN: Record<ModuleSize, string> = {
  'one-third': 'col-span-full lg:col-span-2',
  half: 'col-span-full lg:col-span-3',
  'two-thirds': 'col-span-full lg:col-span-4',
  full: 'col-span-full'
}

/** What a person is offered when choosing a width. Named for how it reads, not for the fraction. */
export const MODULE_SIZE_LABEL: Record<ModuleSize, string> = {
  'one-third': 'Small',
  half: 'Half',
  'two-thirds': 'Wide',
  full: 'Full width'
}

export type WorkspaceModule = {
  /** Stable within its workspace, and only there. Not a business object and not a global widget. */
  id: string

  /**
   * What a person would call this module.
   *
   * The domain's word for it, not the card's own heading — the heading answers "what am I looking
   * at" in place, this answers "which one is that" in a list. Nothing renders it yet.
   */
  title: string

  /**
   * The module itself, as an element the renderer may give a width to.
   *
   * Typed as accepting a `className` on purpose: it is the whole of what the grid needs from a
   * module, and a component that cannot take one cannot be laid out by anything. The alternative —
   * a render callback handed a class string — would make every domain responsible for applying the
   * grid's own decision, which is the point at which layout stops having one owner.
   */
  content: ReactElement<{ className?: string }>

  /** The domain says this module may not be hidden, because hiding it would mislead. */
  required?: boolean

  /**
   * The domain says this module's position carries meaning. Defaults to movable.
   *
   * Stronger than "offer no Move command". An immovable module is an anchor: it holds its place in
   * its band, and a movable one may not cross it. That is what makes a band a sequence of segments
   * rather than a free list, and it is the only way a domain can say "these three may be shuffled,
   * but not past that" without the renderer knowing what any of them are.
   */
  movable?: boolean

  /**
   * The widths that stay truthful for this module.
   *
   * Declared per module rather than derived from a kind, because the question is never "is this a
   * chart" but "is this chart still readable at that width". A table narrowed to a third is not a
   * smaller table, it is a worse one.
   */
  allowedSizes: readonly ModuleSize[]

  /** The width this module has in the workspace the domain ships. Must be in `allowedSizes`. */
  defaultSize: ModuleSize
}

/**
 * A band of the workspace, and the boundary a module may not cross.
 *
 * First-class because the pilot workspace already had one: its modules divide into what needs
 * acting on now and what is there to be looked at, with a rule written above the second group
 * saying nothing in it needs action today. A reorder that let a trend chart rise above the
 * exception queue would make that sentence false, so the boundary is data rather than a heading.
 */
export type WorkspaceZone = {
  id: string

  /** Rendered as the band's heading. Absent for a band that needs no introduction. */
  title?: string
  description?: string
  modules: readonly WorkspaceModule[]
}

export type WorkspaceDefinition = {
  /** Names the workspace, for the layout a person will later be able to keep. */
  id: string
  zones: readonly WorkspaceZone[]
}

/**
 * A module as everything except the renderer sees it.
 *
 * The declaration carries an element, and an element cannot cross into the part of the app that
 * knows what a person has hidden or moved. So customisation is given the facts it is entitled to —
 * which module, what to call it in a list, which band owns it, whether hiding it would mislead and
 * whether its position carries meaning — and nothing that would let it decide how wide a module is
 * or what it renders. Those stay the declaration's.
 *
 * `zone` is an identity, not a meaning. Nothing outside the domain file knows what "control" is;
 * the shared code knows only that two modules carrying the same string may be reordered against
 * each other and two carrying different ones may not.
 */
export type WorkspaceModuleSummary = {
  id: string
  title: string
  zone: string
  required: boolean
  movable: boolean

  /** The widths this module may legally take. Customisation offers these and refuses anything else. */
  sizes: readonly ModuleSize[]
  defaultSize: ModuleSize
}

/** The declaration, flattened for the parts of the app that must not hold its elements. */
export const workspaceModules = (definition: WorkspaceDefinition): WorkspaceModuleSummary[] =>
  definition.zones.flatMap(zone =>
    zone.modules.map(module => ({
      id: module.id,
      title: module.title,
      zone: zone.id,
      required: module.required === true,
      movable: module.movable !== false,
      sizes: module.allowedSizes,
      defaultSize: module.defaultSize
    }))
  )

/**
 * A band, cut into the runs of modules that may be shuffled against each other.
 *
 * An immovable module is not a member of any run — it is the cut. That is the whole of the anchor
 * rule, and it is written here rather than anywhere a zone or a module is named: two modules may
 * be arranged against each other only if they turn up in the same returned run, so a movable
 * module cannot pass a fixed one and a lone module between two fixed ones has nobody to swap with.
 *
 * The live workspace and the reconciliation of a stored layout both read the law from here, so a
 * stored order cannot express an arrangement the live one would refuse.
 */
export const segmentsOf = (ids: readonly string[], movable: (id: string) => boolean): string[][] => {
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
