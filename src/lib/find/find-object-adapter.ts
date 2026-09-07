/**
 * The Find object adapter: UI capability glue for object types Find can return.
 *
 * It is deliberately small and deliberately not a registry of business objects. It knows four
 * things about a type — what to call a group of them, what icon to draw, how to turn a target back
 * into an address, and which command list they answer to — and nothing else. There is no schema
 * here, no calculation, no lifecycle rule and no authorization; every one of those already has an
 * owner, and copying any of them here would create a second, quieter version that drifts.
 *
 * Naming matters: this is an *adapter*, not an entity registry. Adding a type to it must never be
 * how a business object comes into existence — the object exists in the domain first, and this only
 * teaches Find how to present and reopen one.
 */

import { BanknoteIcon, UserIcon, type LucideIcon } from 'lucide-react'

import type { FindTarget } from '@/types/common/find-types'
import type { ObjectCommand, ObjectContext } from '@/types/common/object-context-types'

import { payRunCommands } from '@/views/payroll/payroll-objects'

type FindObjectType = {
  /** Group heading in the result list. Plural, because it heads a group. */
  heading: string
  icon: LucideIcon

  /**
   * Where this object is read.
   *
   * Taken from the identity the source already resolved rather than rebuilt from the id, because
   * only the source knew the context — which run an employee's payroll belongs to, which group view
   * a company was reached from. An object that cannot be addressed returns null and is not offered,
   * which is honest: Find must not list something it cannot open.
   */
  href: (object: ObjectContext) => string | null

  /**
   * The domain's own command list, or none.
   *
   * A resolver, never a stored array. Commands are resolved at the moment they are shown, from the
   * one definition the tables and context menus already use, so Find can never drift into a second
   * command vocabulary for the same object.
   */
  commands?: (object: ObjectContext) => ObjectCommand[]
}

const FIND_OBJECT_TYPES: Record<string, FindObjectType> = {
  payroll_run: {
    heading: 'Pay runs',
    icon: BanknoteIcon,
    href: object => object.href ?? null,
    commands: object => payRunCommands({ id: object.id, reference: object.label })
  },

  // An employee is read on the run workspace its payroll belongs to, so the source resolves the
  // address and this only passes it through. No command list: the employee commands a table offers
  // close over a run row this adapter does not have, and inventing a second, thinner list for Find
  // is exactly the duplication the object contract exists to prevent.
  employee: {
    heading: 'People',
    icon: UserIcon,
    href: object => object.href ?? null
  }
}

export const findObjectType = (type: string): FindObjectType | undefined => FIND_OBJECT_TYPES[type]

/** The address a target opens at, or null when the app cannot open it. */
export const hrefForObject = (object: ObjectContext): string | null => findObjectType(object.type)?.href(object) ?? null

/** Identity as a storable target — what Recent and Favourites will keep. */
export const targetForObject = (object: ObjectContext): Extract<FindTarget, { kind: 'object' }> => ({
  kind: 'object',
  type: object.type,
  id: object.id
})
