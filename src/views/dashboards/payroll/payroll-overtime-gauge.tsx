'use client'

// Third-party Imports
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'

// Component Imports
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { cn } from '@/lib/utils'

const chartConfig = { share: { label: 'Overtime share' } } satisfies ChartConfig

type Props = {

  /** Overtime as a percentage of gross pay for this run. */
  shareOfGross: number

  /** The share the business is willing to absorb before overtime is a staffing question. */
  threshold: number
  hours: number
  cost: string

  /** Percentage change in overtime cost vs the previous run; null when there is none. */
  change: number | null
  className?: string
}

/**
 * Overtime as a gauge rather than another bar.
 *
 * Two reasons this is a radial and not a bar. It is the only figure on this dashboard that is a
 * proportion of a whole measured against a limit, which is the shape a gauge reads best; and every
 * other chart here is bar-derived — the waterfall and the cost/headcount overlay — so a third bar
 * would leave the page with one visual idea repeated three times.
 *
 * Deliberately not a pie: cost by department has six categories, and a pie past five is unreadable,
 * so that one stays a ranked list.
 */
const PayrollOvertimeGauge = ({ shareOfGross, threshold, hours, cost, change, className }: Props) => {
  const over = shareOfGross > threshold

  // The arc is scaled against twice the threshold, so the limit sits at the halfway mark and a
  // run creeping toward it is legible before it crosses.
  const scaleMax = threshold * 2

  const data = [
    { name: 'share', share: Math.min(shareOfGross, scaleMax), fill: `var(--${over ? 'warning' : 'success'})` }
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Overtime</CardTitle>
        <CardDescription>Share of gross pay</CardDescription>
        <CardAction>
          <Badge className={cn(over ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success')}>
            {over ? 'Above target' : 'Within target'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col justify-between gap-4'>
        {/* The gauge is decorative once the figures below state the same thing in words. */}
        <ChartContainer config={chartConfig} className='mx-auto aspect-square max-h-44 w-full' aria-hidden='true'>
          <RadialBarChart data={data} startAngle={210} endAngle={-30} innerRadius='72%' outerRadius='100%'>
            <PolarAngleAxis type='number' domain={[0, scaleMax]} tick={false} axisLine={false} />
            <RadialBar background dataKey='share' cornerRadius={8} />
          </RadialBarChart>
        </ChartContainer>

        <div className='-mt-24 flex flex-col items-center gap-0.5'>
          <span className='text-2xl font-semibold'>{shareOfGross.toFixed(1)}%</span>
          <span className='text-muted-foreground text-xs'>target {threshold.toFixed(1)}%</span>
        </div>

        <Separator />

        <div className='grid grid-cols-2 gap-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-xs tracking-wide uppercase'>Hours</span>
            <span className='font-semibold'>{hours}</span>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-xs tracking-wide uppercase'>Cost</span>
            <span className='font-semibold'>{cost}</span>
            <span className={cn('text-xs font-medium', (change ?? 0) > 0 ? 'text-destructive' : 'text-success')}>
              {change === null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs last run`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PayrollOvertimeGauge
