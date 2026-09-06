'use client'

// React Imports
import { Fragment, useSyncExternalStore } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Component Imports
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

// Store Imports
import {
  getObjectContextServerSnapshot,
  getObjectContextSnapshot,
  subscribeObjectContext
} from '@/lib/object-context-store'

/**
 * Segments whose title-cased form would read wrongly or abbreviate badly. Everything else is
 * derived from the URL, so a new route gets a sensible crumb without being registered here.
 */
const SEGMENT_LABELS: Record<string, string> = {
  apps: 'Apps',
  compliance: 'Compliance',
  dashboard: 'Dashboard',
  entities: 'Entities',
  hrm: 'HRM',
  kanban: 'Kanban',
  pages: 'Pages',
  payroll: 'Payroll',
  runs: 'Runs',
  ui: 'UI'
}

function labelForSegment(segment: string) {
  const decoded = decodeURIComponent(segment)

  return SEGMENT_LABELS[decoded] ?? decoded.replace(/-/g, ' ').replace(/\b\w/g, character => character.toUpperCase())
}

type Crumb = {
  href: string
  label: string
}

/**
 * The app-shell breadcrumb: location and hierarchy for every route.
 *
 * Ancestor labels come from the URL, which is the real hierarchy. The leaf comes from the
 * object the page published, so a run reads as 'PR-SG-2026-09' rather than as its id.
 *
 * Long trails collapse in the middle. That is visual compression only — doctrine
 * `layout_grammar` forbids a breadcrumb turning into tabs, a select or pagination at narrow
 * widths, so the semantics are identical at every size.
 */
const Breadcrumbs = () => {
  const pathname = usePathname()

  const subject = useSyncExternalStore(subscribeObjectContext, getObjectContextSnapshot, getObjectContextServerSnapshot)

  const segments = pathname.split('/').filter(Boolean)

  const crumbs: Crumb[] = [
    { href: '/', label: 'Home' },
    ...segments.map((segment, index) => ({
      href: `/${segments.slice(0, index + 1).join('/')}`,
      label: labelForSegment(segment)
    }))
  ]

  if (subject && crumbs.length > 1) {
    crumbs[crumbs.length - 1] = { ...crumbs[crumbs.length - 1], label: subject.label }
  }

  const collapsed = crumbs.length > 4
  const visible = collapsed ? [crumbs[0], ...crumbs.slice(-2)] : crumbs

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {visible.map((crumb, index) => {
          const isLast = index === visible.length - 1
          const showEllipsis = collapsed && index === 1

          return (
            <Fragment key={crumb.href}>
              {showEllipsis ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              ) : null}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default Breadcrumbs
