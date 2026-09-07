'use client'

/**
 * The sources Find asks, and the order results are shown in.
 *
 * Every source answers the same contract, so `CommandMenu` renders a run and a route through one
 * code path and neither knows the other exists. Routes stay exactly what they were — the static
 * index that has always backed the palette — demoted from *the* search to *a* source.
 */

import { FileSpreadsheetIcon, FileTextIcon, type LucideIcon } from 'lucide-react'

import { findEmployees, findPayRuns, resolveObjectTargets } from '@/app/server/find-actions'
import { searchData } from '@/assets/data/search'
import { findObjectType } from '@/lib/find/find-object-adapter'
import type { FindObjectHit, FindResult, FindSource, FindTarget } from '@/types/common/find-types'
import { REPORTS } from '@/utils/payroll-reports'

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
/**
 * A route key resolved to where that destination lives today.
 *
 * The one place a key becomes a path, so a route that moves is corrected here and every stored
 * favourite pointing at it follows without being touched.
 */
const routeByKey = (key: string) => searchData.flatMap(group => group.data).find(item => item.key === key)

const routeSource: FindSource = {
  id: 'routes',
  kind: 'route',
  heading: 'Pages',
  search: async () =>
    searchData.flatMap(group =>
      group.data.map(item => ({
        target: { kind: 'route' as const, key: item.key },
        label: item.name,
        icon: item.icon,

        // No sublabel. The obvious one is the group a route sits under, and those groups are
        // currently wrong for payroll — its pages are filed under 'Dashboard' — so showing it would
        // publish an error the list had been hiding. A route's name is already its own description.
        keywords: item.tags
      }))
    )
}

/**
 * The report catalogue, which is small, fixed and already written down.
 *
 * A report is a question somebody asks repeatedly, which makes it worth pinning — so it is a find
 * target as much as a run is. `purpose` is already one line explaining what each answers, so the
 * catalogue supplies the sublabel and nothing new has to be authored.
 */
const reportSource: FindSource = {
  id: 'reports',
  kind: 'report',
  heading: 'Reports',
  search: async () =>
    REPORTS.map(report => ({
      target: { kind: 'report' as const, key: report.key },
      label: report.name,
      sublabel: report.purpose,
      icon: FileSpreadsheetIcon,
      keywords: [report.group, report.key.replace(/_/g, ' ')]
    }))
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
export const FIND_SOURCES: readonly FindSource[] = [payRunSource, employeeSource, reportSource, routeSource]

/**
 * Turn stored targets back into results, forgetting nothing and trusting nothing.
 *
 * Presentation is rebuilt every time rather than stored, which is the reason a pinned run shows
 * today's status and a pinned employee shows the title they hold now. Routes and reports resolve
 * from the registries that define them; objects go to the server, where the actor is applied.
 *
 * Order is the caller's — most recent first, or the order things were pinned — so this preserves
 * the order it was given rather than the order results happened to come back in.
 */
export const resolveTargets = async (
  targets: readonly FindTarget[]
): Promise<{ results: FindResult[]; unresolved: FindTarget[] }> => {
  const objectTargets = targets.filter((target): target is Extract<FindTarget, { kind: 'object' }> => target.kind === 'object')

  const hits = objectTargets.length > 0 ? await resolveObjectTargets(objectTargets) : []
  const byId = new Map(hits.map(hit => [`${hit.object.type}:${hit.object.id}`, hit]))

  const results: FindResult[] = []
  const unresolved: FindTarget[] = []

  for (const target of targets) {
    if (target.kind === 'object') {
      const hit = byId.get(`${target.type}:${target.id}`)
      const [built] = hit ? asResults([hit], FileTextIcon) : []

      if (built) results.push(built)
      else unresolved.push(target)

      continue
    }

    if (target.kind === 'route') {
      const item = routeByKey(target.key)

      if (item) results.push({ target, label: item.name, icon: item.icon, keywords: item.tags })
      else unresolved.push(target)

      continue
    }

    if (target.kind === 'report') {
      const report = REPORTS.find(candidate => candidate.key === target.key)

      if (report)
        results.push({ target, label: report.name, sublabel: report.purpose, icon: FileSpreadsheetIcon })
      else unresolved.push(target)

      continue
    }

    unresolved.push(target)
  }

  return { results, unresolved }
}

/** Where a non-object target opens. Objects carry their own resolved address. */
export const hrefForTarget = (result: FindResult): string | null => {
  if (result.object) return result.object.href ?? null
  if (result.target.kind === 'route') return routeByKey(result.target.key)?.href ?? null
  if (result.target.kind === 'report') return `/payroll/reports?report=${encodeURIComponent(result.target.key)}`

  return null
}
