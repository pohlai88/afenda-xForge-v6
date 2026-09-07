'use client'

/**
 * The sources Find asks, and the order results are shown in.
 *
 * Every source answers the same contract, so `CommandMenu` renders a run and a route through one
 * code path and neither knows the other exists. Routes stay exactly what they were — the static
 * index that has always backed the palette — demoted from *the* search to *a* source.
 */

import { FileTextIcon, type LucideIcon } from 'lucide-react'

import { findEmployees, findPayRuns } from '@/app/server/find-actions'
import { searchData } from '@/assets/data/search'
import { findObjectType } from '@/lib/find/find-object-adapter'
import type { FindObjectHit, FindResult, FindSource } from '@/types/common/find-types'

/**
 * A server hit becomes a result.
 *
 * The icon is added here rather than sent over the wire — a React component does not serialize —
 * and a hit whose type this build cannot address is dropped rather than listed, because a result
 * that does nothing when chosen is worse than one that is absent.
 */
const asResults = (hits: FindObjectHit[], fallbackIcon: LucideIcon): FindResult[] =>
  hits.flatMap(hit => {
    const type = findObjectType(hit.object.type)

    if (!type || !type.href(hit.object)) return []

    return [
      {
        target: { kind: 'object' as const, type: hit.object.type, id: hit.object.id },
        object: hit.object,
        label: hit.object.label,
        sublabel: hit.sublabel,
        icon: type.icon ?? fallbackIcon,
        keywords: hit.keywords
      }
    ]
  })

/**
 * Routes, from the index that has always backed the palette.
 *
 * Deliberately not a new route-name map. `searchData` is the route descriptor this app already
 * maintains, and the breadcrumb keeps its own segment labels because hierarchy and index read
 * differently on purpose — a third vocabulary would be the one that drifts.
 */
const routeSource: FindSource = {
  id: 'routes',
  kind: 'route',
  heading: 'Pages',
  search: async () =>
    searchData.flatMap(group =>
      group.data.map(item => ({
        target: { kind: 'route' as const, path: item.href },
        label: item.name,
        icon: item.icon,

        // No sublabel. The obvious one is the group a route sits under, and those groups are
        // currently wrong for payroll — its pages are filed under 'Dashboard' — so showing it would
        // publish an error the list had been hiding. A route's name is already its own description.
        keywords: item.tags
      }))
    )
}

const payRunSource: FindSource = {
  id: 'pay-runs',
  kind: 'object',
  heading: 'Pay runs',
  minQueryLength: 2,
  search: async query => asResults(await findPayRuns(query), FileTextIcon)
}

const employeeSource: FindSource = {
  id: 'employees',
  kind: 'object',
  heading: 'People',
  minQueryLength: 2,
  search: async query => asResults(await findEmployees(query), FileTextIcon)
}

/**
 * Objects before routes.
 *
 * Someone typing `PR-SG` or `Anh` is naming a thing, not a page, and the thing should come first.
 * Ranking within a group is still cmdk's — the existing name-then-tag scorer is preserved untouched
 * — so this is the only ordering decision Find adds, and it is one rule rather than a table of
 * constants nobody can predict.
 */
export const FIND_SOURCES: readonly FindSource[] = [payRunSource, employeeSource, routeSource]
