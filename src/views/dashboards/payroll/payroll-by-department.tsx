'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from 'recharts'

// Type Imports
import type { DepartmentCost } from '@/utils/payroll-metrics'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney, formatMoneyCompact } from '@/utils/money'

/** A department plus the name of whoever runs it, resolved by the caller. */
export type DepartmentRow = DepartmentCost & {
  headName?: string
  headAvatar?: string

  /** Percentage-point change in cost share vs the previous run. Null when there is none. */
  shareDelta: number | null
}

const chartConfig = { share: { label: 'Share of cost' } } satisfies ChartConfig

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

  /** Reference of the run currently shown, so the filter chips can keep it in the URL. */
  runReference: string

  /** Department the exception queue is filtered to, set by a chip below the chart. */
  selectedDepartmentId?: string
  className?: string
}

/**
 * Cost by department as a horizontal ranked bar, with a chip row underneath that filters the
 * Exceptions card to one department.
 *
 * The chart answers "which department costs the most and is that changing" — the bar is the
 * ranking, the trailing amount is the figure someone reconciling the run actually needs, and the
 * tooltip's "vs last run" answers whether that ranking is new or a trend. The chips answer the
 * question a ranking always raises next: "does the department at the top have anything wrong
 * with it right now" — clicking one re-scopes the Exceptions card instead of leaving that as a
 * second, disconnected lookup. Chips rather than a chart click because a chart click has no
 * keyboard or screen-reader path; a `<Link>` does.
 *
 * Not a pie: six categories is past the point one can be read, and the question here is a
 * ranking, not a composition.
 */
const PayrollByDepartment = ({ departments, runReference, selectedDepartmentId, className }: Props) => {
  const data = departments.map((department, index) => ({
    ...department,

    // chart-1..5 is the categorical palette; a sixth department wraps rather than reaching for
    // a status colour, which would imply a meaning these categories do not carry.
    fill: `var(--chart-${(index % 5) + 1})`,
    costLabel: formatMoneyCompact(department.cost)
  }))

  const hrefFor = (departmentId: string | null) =>
    `/dashboard/payroll?run=${encodeURIComponent(runReference)}${departmentId ? `&dept=${encodeURIComponent(departmentId)}` : ''}`

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Cost by department</CardTitle>
        <CardDescription>Employer cost, this run</CardDescription>
        <CardAction className='text-muted-foreground text-sm'>{departments.length} departments</CardAction>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        <p className='sr-only'>
          Employer cost by department for this run.{' '}
          {departments
            .map(
              department =>
                `${department.name}: ${department.share.toFixed(1)}% of cost (${formatMoney(department.cost)}) across ` +
                `${department.employees} ${department.employees === 1 ? 'person' : 'people'}` +
                `${department.headName ? `, led by ${department.headName}` : ''}, ${deltaLabel(department.shareDelta)}.`
            )
            .join(' ')}
        </p>

        <ChartContainer config={chartConfig} className='min-h-64 w-full flex-1' aria-hidden='true'>
          <BarChart accessibilityLayer data={data} layout='vertical' barSize={26} margin={{ left: -28, right: 44 }}>
            <XAxis
              type='number'
              dataKey='share'
              tickFormatter={value => `${value}%`}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            />
            <YAxis dataKey='name' type='category' hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => {
                    const row = item?.payload as (typeof data)[number] | undefined

                    if (!row) return null

                    return `${row.name}: ${formatMoney(row.cost)} (${Number(value).toFixed(1)}%, ${deltaLabel(row.shareDelta)})`
                  }}
                />
              }
            />
            <Bar dataKey='share' radius={[0, 8, 8, 0]}>
              {data.map(department => (
                <Cell key={department.departmentId} fill={department.fill} />
              ))}
              <LabelList
                dataKey='name'
                position='insideLeft'
                offset={12}
                className='fill-background text-xs font-medium'
              />
              <LabelList
                dataKey='costLabel'
                position='right'
                offset={8}
                className='fill-foreground text-xs font-medium'
              />
            </Bar>
          </BarChart>
        </ChartContainer>

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
      </CardContent>
    </Card>
  )
}

export default PayrollByDepartment
