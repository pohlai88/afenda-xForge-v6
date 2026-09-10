'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { ArrowRightIcon } from 'lucide-react'

// Type Imports
import type { DepartmentNode, LocationRow, PositionRow, ReportingGroup } from '@/utils/hrm-org'
import type { PeopleRow } from '@/types/hrm/people-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Util Imports
import { cn } from '@/lib/utils'

const TABS = ['departments', 'positions', 'locations', 'reporting'] as const

type Props = {
  tree: DepartmentNode[]
  positions: PositionRow[]
  locations: LocationRow[]
  reporting: { groups: ReportingGroup[]; unreported: PeopleRow[] }
}

/**
 * A count that goes somewhere.
 *
 * `anti_patterns` forbids a dead summary card — a figure with no drill-down when an explanation
 * exists. Every headcount on this page is a link into People with the matching filter applied, so
 * "23 in Engineering" is answerable rather than merely true.
 */
const CountLink = ({ href, count, label }: { href: string; count: number; label: string }) => (
  <Button
    variant='ghost'
    size='sm'
    className='text-muted-foreground -mr-2 gap-1.5'
    render={<Link href={href} />}
    nativeButton={false}
    aria-label={`${count} ${label}`}
  >
    <span className='tabular-nums'>{count}</span>
    <ArrowRightIcon />
  </Button>
)

/**
 * Four views of one structure, in one route.
 *
 * Not four routes: `domain_page_budget` requires proof of an independent work context before a new
 * route, and departments, positions, locations and reporting share one — understanding the shape
 * of the organisation. The reference product splits these across three routes and gains nothing.
 */
const OrganisationWorkspace = ({ tree, positions, locations, reporting }: Props) => {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TABS).withDefault('departments').withOptions({ history: 'push', clearOnDefault: false })
  )

  return (
    <Tabs value={tab} onValueChange={value => void setTab(value as (typeof TABS)[number])} className='gap-6'>
      <TabsList>
        <TabsTrigger value='departments'>Departments</TabsTrigger>
        <TabsTrigger value='positions'>Positions</TabsTrigger>
        <TabsTrigger value='locations'>Locations</TabsTrigger>
        <TabsTrigger value='reporting'>Reporting</TabsTrigger>
      </TabsList>

      <TabsContent value='departments'>
        <Card className='max-w-3xl'>
          <CardHeader>
            <CardTitle role='heading' aria-level={2}>
              Departments
            </CardTitle>
            <CardDescription>Counts include sub-departments and exclude people who have left</CardDescription>
          </CardHeader>

          <CardContent>
            <ul className='flex flex-col'>
              {tree.map((node, index) => (
                <li
                  key={node.department.id}
                  className={cn('flex items-center gap-3 py-3', index > 0 && 'border-t')}
                  style={{ paddingLeft: `${node.depth * 20}px` }}
                >
                  <span className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate text-sm font-medium'>{node.department.name}</span>
                    <span className='text-muted-foreground truncate text-xs'>
                      {node.department.code && <span className='font-mono'>{node.department.code}</span>}
                      {node.headName ? ` · Led by ${node.headName}` : ' · No head recorded'}
                      {node.children.length > 0 && ` · ${node.own} directly`}
                    </span>
                  </span>

                  <CountLink
                    href={`/hrm?department=${encodeURIComponent(node.department.id)}`}
                    count={node.total}
                    label={`people in ${node.department.name}`}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='positions'>
        <Card className='max-w-3xl'>
          <CardHeader>
            <CardTitle role='heading' aria-level={2}>
              Positions
            </CardTitle>
            <CardDescription>Jobs the organisation defines, and how many people hold each</CardDescription>
            <CardAction>
              <span className='text-muted-foreground text-sm tabular-nums'>{positions.length}</span>
            </CardAction>
          </CardHeader>

          <CardContent>
            <ul className='flex flex-col'>
              {positions.map((row, index) => (
                <li key={row.position.id} className={cn('flex items-center gap-3 py-3', index > 0 && 'border-t')}>
                  <span className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate text-sm font-medium'>{row.position.title}</span>
                    <span className='text-muted-foreground truncate text-xs'>
                      {row.position.code && <span className='font-mono'>{row.position.code}</span>} ·{' '}
                      {row.departmentName}
                    </span>
                  </span>

                  <CountLink
                    href={`/hrm?department=${encodeURIComponent(row.position.departmentId)}&q=${encodeURIComponent(row.position.title)}`}
                    count={row.headcount}
                    label={`people holding ${row.position.title}`}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='locations'>
        <Card className='max-w-3xl'>
          <CardHeader>
            <CardTitle role='heading' aria-level={2}>
              Work locations
            </CardTitle>
            <CardDescription>Where people sit. A location is not a legal employer.</CardDescription>
          </CardHeader>

          <CardContent className='flex flex-col gap-4'>
            <ul className='flex flex-col'>
              {locations.map((row, index) => (
                <li key={row.location.id} className={cn('flex items-center gap-3 py-3', index > 0 && 'border-t')}>
                  <span className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate text-sm font-medium'>{row.location.name}</span>
                    <span className='text-muted-foreground truncate text-xs'>
                      {row.location.country}
                      {row.location.timezone ? ` · ${row.location.timezone}` : ''}
                      {row.entityNames.length > 0 && ` · ${row.entityNames.join(', ')}`}
                    </span>
                  </span>

                  <CountLink
                    href={`/hrm?location=${encodeURIComponent(row.location.id)}`}
                    count={row.headcount}
                    label={`people at ${row.location.name}`}
                  />
                </li>
              ))}
            </ul>

            {/*
              Said once, where the two could be confused. Somebody can work in Kuala Lumpur while
              employed, paid and taxed by the Singapore company — payroll and statutory liability
              follow the employer, desks and time zones follow the location.
            */}
            <p className='text-muted-foreground border-t pt-4 text-xs'>
              Several employers can share one location. Payroll and statutory liability follow the legal employer, not
              the desk.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='reporting'>
        <div className='flex max-w-3xl flex-col gap-6'>
          <Card>
            <CardHeader>
              <CardTitle role='heading' aria-level={2}>
                Reporting lines
              </CardTitle>
              <CardDescription>Built from recorded managers only</CardDescription>
            </CardHeader>

            <CardContent>
              <ul className='flex flex-col'>
                {reporting.groups.map((group, index) => (
                  <li key={group.managerId} className={cn('flex items-center gap-3 py-3', index > 0 && 'border-t')}>
                    <span className='flex min-w-0 flex-1 flex-col'>
                      <span className='truncate text-sm font-medium'>{group.managerName}</span>
                      <span className='text-muted-foreground truncate text-xs'>{group.managerPosition}</span>
                    </span>

                    <Badge className='bg-muted text-muted-foreground whitespace-nowrap'>
                      {group.reports.length} {group.reports.length === 1 ? 'report' : 'reports'}
                    </Badge>

                    <Button
                      variant='ghost'
                      size='icon-sm'
                      className='text-muted-foreground shrink-0'
                      render={<Link href={`/hrm/people/${group.managerId}`} />}
                      nativeButton={false}
                      aria-label={`Open ${group.managerName}`}
                    >
                      <ArrowRightIcon />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/*
            Named honestly rather than rooted under whoever sits at the top. Both a genuine
            top-of-org and a record whose manager was never filled in have no managerId, and the
            page cannot tell them apart — so it says what it knows instead of picking a reading.
          */}
          {reporting.unreported.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle role='heading' aria-level={2}>
                  No manager recorded
                </CardTitle>
                <CardDescription>
                  {reporting.unreported.length} people. This may be the top of the organisation, or a gap in the record
                  — these are the same thing to the data.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className='flex flex-col'>
                  {reporting.unreported.slice(0, 12).map((person, index) => (
                    <li key={person.id} className={cn('flex items-center gap-3 py-3', index > 0 && 'border-t')}>
                      <span className='flex min-w-0 flex-1 flex-col'>
                        <span className='truncate text-sm font-medium'>{person.name}</span>
                        <span className='text-muted-foreground truncate text-xs'>
                          {person.positionTitle} · {person.departmentName}
                        </span>
                      </span>

                      <Button
                        variant='ghost'
                        size='icon-sm'
                        className='text-muted-foreground shrink-0'
                        render={<Link href={`/hrm/people/${person.id}`} />}
                        nativeButton={false}
                        aria-label={`Open ${person.name}`}
                      >
                        <ArrowRightIcon />
                      </Button>
                    </li>
                  ))}
                </ul>

                {reporting.unreported.length > 12 && (
                  <p className='text-muted-foreground pt-3 text-xs'>Showing 12 of {reporting.unreported.length}.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}

export default OrganisationWorkspace
