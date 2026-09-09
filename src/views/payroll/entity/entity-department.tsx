// Next Imports
import Link from 'next/link'

// Type Imports
import type { DepartmentCost } from '@/utils/payroll-metrics'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'

/** A department plus the name of whoever runs it, resolved by the caller. */
export type DepartmentRow = DepartmentCost & {
  headName?: string
  headAvatar?: string

  /** Percentage-point change in cost share vs the previous run. Null when there is none. */
  shareDelta: number | null
}

/** 'Priya Raman' -> 'PR'. A department with no head on record falls back to a glyph. */
const initials = (name?: string) =>
  name
    ?.split(' ')
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() ?? '—'

const deltaLabel = (delta: number | null) =>
  delta === null ? 'first run on record' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp vs last run`

type Props = {
  departments: DepartmentRow[]

  /** Reference of the run currently shown, so the filter chips keep it in the URL. */
  runReference: string

  /** Department the attention surface is filtered to, set by a chip. */
  selectedDepartmentId?: string

  /** Which page a chip links to. The entity page passes its own path. */
  basePath: string
  className?: string
}

/**
 * Where this run's cost sits, and the filter into the work underneath it.
 *
 * This was a Recharts bar chart. It was `aria-hidden` with tooltip-only interaction, sitting on
 * top of a text summary that already stated every department's share, cost, headcount, head and
 * movement — so the chart carried no fact the page did not otherwise have, and no action. The
 * ranking survives as rows, which state the exact figures a chart hid.
 *
 * The chips are the interaction. Selecting one sets `?dept=` and scopes the attention surface,
 * which is what earns this section its place: it is a control into work, not analysis. The rows
 * are not a second way to do the same thing.
 */
const EntityDepartment = ({ departments, runReference, selectedDepartmentId, basePath, className }: Props) => {
  const hrefFor = (departmentId: string | null) =>
    `${basePath}?run=${encodeURIComponent(runReference)}${departmentId ? `&dept=${encodeURIComponent(departmentId)}` : ''}`

  const leader = departments[0]?.share ?? 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
          Cost by department
        </CardTitle>
        <CardDescription>Employer cost, this run · select one to scope what needs attention</CardDescription>
        <CardAction className='text-muted-foreground text-sm'>{departments.length} departments</CardAction>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-4'>
        <div className='flex flex-wrap gap-2'>
          {departments.map(department => {
            const active = department.departmentId === selectedDepartmentId

            return (
              <Link
                key={department.departmentId}
                href={hrefFor(active ? null : department.departmentId)}
                scroll={false}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  buttonVariants({ variant: active ? 'secondary' : 'outline', size: 'sm' }),
                  'h-8 gap-1.5 rounded-full pr-3 pl-1'
                )}
              >
                <Avatar className='size-5.5'>
                  {department.headAvatar && <AvatarImage src={department.headAvatar} alt='' />}
                  <AvatarFallback className='text-[9px]'>{initials(department.headName)}</AvatarFallback>
                </Avatar>
                {department.name}
              </Link>
            )
          })}
        </div>

        {/* The ranking, as exact values. The bar is proportional to the leader rather than to
            100%, so six small departments are still distinguishable from each other. */}
        <ul className='flex flex-col gap-2.5'>
          {departments.map((department, index) => (
            <li key={department.departmentId} className='flex flex-col gap-1'>
              <div className='flex items-baseline justify-between gap-3 text-sm'>
                <span className='truncate font-medium'>{department.name}</span>
                <span className='shrink-0 tabular-nums'>{formatMoney(department.cost)}</span>
              </div>
              <div className='flex items-center gap-3'>
                <span className='bg-muted h-1.5 flex-1 overflow-hidden rounded-full'>
                  <span
                    className='block h-full rounded-full'
                    style={{
                      width: `${leader > 0 ? Math.max(2, (department.share / leader) * 100) : 0}%`,
                      backgroundColor: `var(--chart-${(index % 5) + 1})`
                    }}
                  />
                </span>
                <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                  {department.share.toFixed(1)}% · {department.employees}{' '}
                  {department.employees === 1 ? 'person' : 'people'} · {deltaLabel(department.shareDelta)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default EntityDepartment
