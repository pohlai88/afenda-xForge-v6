/**
 * The UI interaction contract for "what object is the user acting on?".
 *
 * This is deliberately not a domain model. It carries identity only — enough for a context
 * menu to title itself, for a breadcrumb to name its leaf, and for a command to resolve
 * against something. Business data, permissions and status stay in the domain types under
 * `src/types/payroll` and `src/types/hrm`, because the moment this grows a status field it
 * becomes a second entity registry that drifts from the first.
 *
 * Doctrine: `business_objects` (D09) in `.architecture/ux/afenda-ui-ux-doctrine.yaml`.
 */

import type { LucideIcon } from 'lucide-react'

/**
 * A business object as the interface refers to it.
 *
 * `href` is optional on purpose. A pay run has a canonical route; an employee within a run
 * does not — it is reached through `?employee=` on the run workspace. An object without a
 * route is still a first-class object, so the contract must not require one.
 */
export type ObjectContext = {
  /** Doctrine vocabulary, snake_case: 'payroll_run', 'employee'. */
  type: string

  /** Stable identity. Commands resolve against this, never against the label. */
  id: string

  /** Human-readable name. Menu heading, breadcrumb leaf, accessible name. */
  label: string

  /** Canonical location, where one exists. */
  href?: string
}

/**
 * CRUD-SAP, the command taxonomy from doctrine `command_grammar` (D06).
 *
 * CRUD executes the business; SAP understands it. This is semantics, not layout — the
 * doctrine is explicit that the seven families MUST NOT become seven permanently visible
 * buttons. It exists so a command declares what kind of operation it is, and the command
 * surface derives a stable presentation order from that rather than from the order a
 * domain happened to list them in.
 */
export type CommandFamily = 'create' | 'read' | 'update' | 'delete' | 'search' | 'audit' | 'predict'

/**
 * One command a domain offers for an object.
 *
 * Domains own this entirely: which commands exist, whether the user may run them, and what
 * they do. The shared surface only renders what it is given, which is why there is no
 * `disabled` here — doctrine `context_menu` requires irrelevant commands to be omitted, not
 * shown greyed out, so a command the user cannot run simply is not in the array.
 */
export type ObjectCommand = {
  id: string
  label: string
  family: CommandFamily
  icon?: LucideIcon

  /** Renders the command as a link. Mutually exclusive with `onSelect` in practice. */
  href?: string
  onSelect?: () => void
  destructive?: boolean
}

const FAMILY_ORDER: Record<CommandFamily, number> = {
  read: 0,
  create: 1,
  update: 1,
  delete: 1,
  predict: 1,
  search: 2,
  audit: 3
}

/**
 * Group commands into the stable menu grammar from the phase brief §6:
 * default action → object actions → output and transfer → audit and source.
 *
 * Properties is not in this list. It is owned by the command surface itself and always
 * renders last, because doctrine `context_menu` pins `properties_position: last` and a
 * domain should not be able to move it.
 *
 * Empty groups collapse — a group is never rendered just because the grammar defines it.
 */
export function groupCommands(commands: readonly ObjectCommand[]): ObjectCommand[][] {
  const groups: ObjectCommand[][] = [[], [], [], []]

  for (const command of commands) {
    groups[FAMILY_ORDER[command.family]].push(command)
  }

  return groups.filter(group => group.length > 0)
}
