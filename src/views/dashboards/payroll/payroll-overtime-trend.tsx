'use client'

// Third-party Imports
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from 'recharts'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { cn } from '@/lib/utils'

export type OvertimePoint = {
  reference: string

  /** Overtime as a share of gross for that run. */
  share: number

  /** share - target. Positive is over the line, negative is headroom. */
  variance: number
  hours: number
}

const chartConfig = {
  variance: { label: 'vs target' }
} satisfies ChartConfig

type Props = {
  points: OvertimePoint[]
  target: number
  currentHours: number
  currentCost: string
  className?: string
}

/**
 * Overtime against its target, run by run.
 *
 * A diverging bar rather than a gauge. A gauge states one run's share and nothing else, and the
 * question overtime actually raises is whether it is creeping — a run at 1.7% is unremarkable
 * until you see it is the fourth rise in a row. Zero is the target here rather than the axis
 * floor, so a bar above the line is a run that overspent and its height is by how much.
 */
const PayrollOvertimeTrend = ({ points, target, currentHours, currentCost, className }: Props) => {
  const latest = points.at(-1)
  const over = (latest?.variance ?? 0) > 0
  const breaches = points.filter(point => point.variance > 0).length

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Overtime vs target</CardTitle>
        <CardDescription>Share of gross, target {target.toFixed(1)}%</CardDescription>
        <CardAction>
          <Badge className={cn(over ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success')}>
            {over ? 'Above target' : 'Within target'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        {/* Stated in text below, so the bars are decoration to a screen reader. */}
        <p className='sr-only'>
          Overtime against a {target.toFixed(1)}% target across the last {points.length} runs.{' '}
          {points
            .map(
              point =>
                `Run ${point.reference}: ${point.share.toFixed(1)}% of gross, ` +
                `${point.variance >= 0 ? 'over' : 'under'} target by ${Math.abs(point.variance).toFixed(1)} points.`
            )
            .join(' ')}
        </p>

        <ChartContainer config={chartConfig} className='max-h-52 min-h-40 w-full' aria-hidden='true'>
          <BarChart data={points} stackOffset='sign' barSize={18} margin={{ top: 8, right: 8, left: -20 }}>
            <CartesianGrid vertical={false} strokeDasharray='4' stroke='var(--border)' />
            <XAxis dataKey='reference' tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => `${value}pp`} />
            <ReferenceLine y={0} stroke='var(--border)' />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={value => `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(1)}pp vs target`}
                />
              }
            />
            {/* Cell per bar, not a nested Bar: a run over target is warning, under is success. */}
            <Bar dataKey='variance' radius={4}>
              {points.map(point => (
                <Cell key={point.reference} fill={`var(--${point.variance > 0 ? 'warning' : 'success'})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        <Separator />

        <div className='grid grid-cols-3 gap-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-xs tracking-wide uppercase'>Hours</span>
            <span className='font-semibold'>{currentHours}</span>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-xs tracking-wide uppercase'>Cost</span>
            <span className='font-semibold'>{currentCost}</span>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-xs tracking-wide uppercase'>Over target</span>
            <span className='font-semibold'>
              {breaches} of {points.length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PayrollOvertimeTrend
