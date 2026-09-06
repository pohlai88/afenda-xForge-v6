// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { ChevronDownIcon, ChevronUpIcon, MinusIcon } from 'lucide-react'

// Component Imports
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { cn } from '@/lib/utils'
import type { Polarity } from '@/views/dashboards/payroll/payroll-stat-card'

export type KpiMetric = {
  key: string
  icon: ReactNode
  value: string
  title: string

  /** Percentage change vs the previous run; null when there is nothing to compare against. */
  change: number | null
  polarity: Polarity

  /** Optional history, oldest first. Metrics without a series simply show no sparkline. */
  series?: number[]
  iconClassName?: string
}

type Props = {
  metrics: KpiMetric[]
  caption: string
  className?: string
}

/**
 * A sparkline as plain SVG rather than through the chart library.
 *
 * This card renders on the server. Recharts would force a client boundary for something that is
 * three dozen bytes of path data, and measuring against the viewport risks the server/client
 * mismatch `formatMoney` exists to avoid. A polyline over a fixed viewBox is deterministic.
 */
const Sparkline = ({ series, className }: { series: number[]; className?: string }) => {
  if (series.length < 2) return null

  const min = Math.min(...series)
  const max = Math.max(...series)

  // A flat series would divide by zero; draw it down the middle instead.
  const span = max - min || 1

  const points = series
    .map((point, index) => {
      const x = (index / (series.length - 1)) * 100
      const y = 24 - ((point - min) / span) * 24

      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg
      viewBox='0 0 100 24'
      preserveAspectRatio='none'
      className={cn('h-6 w-full', className)}
      aria-hidden='true'
      focusable='false'
    >
      <polyline points={points} fill='none' stroke='currentColor' strokeWidth={1.5} vectorEffect='non-scaling-stroke' />
    </svg>
  )
}

/**
 * The run's headline numbers as one block rather than one card per metric.
 *
 * Three separate cards of the same component was the only repeated block on any dashboard in this
 * app — every other one composes from distinct pieces. Grouping them also lets the figures be
 * compared against each other, which is the point of putting them side by side, and gives the
 * divider rhythm the rest of the dashboards use.
 */
const PayrollKpiStrip = ({ metrics, caption, className }: Props) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>This run at a glance</CardTitle>
        <CardDescription>{caption}</CardDescription>
        <CardAction className='text-muted-foreground text-sm'>{metrics.length} measures</CardAction>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-0 sm:flex-row'>
        {metrics.map((metric, index) => {
          const rising = metric.change !== null && metric.change > 0
          const flat = metric.change === null || metric.change === 0

          // Direction is what the number did; tone is whether that is welcome. Different axes.
          const tone =
            flat || metric.polarity === 'neutral'
              ? 'neutral'
              : rising === (metric.polarity === 'higher-is-better')
                ? 'good'
                : 'bad'

          const toneClass = { good: 'text-success', bad: 'text-destructive', neutral: 'text-muted-foreground' }[tone]
          const DirectionIcon = flat ? MinusIcon : rising ? ChevronUpIcon : ChevronDownIcon

          return (
            <div key={metric.key} className='flex flex-1 items-stretch gap-4'>
              {index > 0 && <Separator orientation='vertical' className='mr-4 hidden sm:block' />}
              {index > 0 && <Separator className='my-4 sm:hidden' />}
              <div className='flex flex-1 flex-col gap-3'>
                <div className='flex items-center justify-between gap-2'>
                  <span
                    className={cn(
                      'bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-sm [&>svg]:size-4.5',
                      metric.iconClassName
                    )}
                  >
                    {metric.icon}
                  </span>
                  {metric.series && metric.series.length > 1 && (
                    <span className={cn('w-16 shrink-0', toneClass)}>
                      <Sparkline series={metric.series} />
                    </span>
                  )}
                </div>
                <div className='flex flex-col gap-1'>
                  <span className='text-lg font-semibold'>{metric.value}</span>
                  <span className='text-muted-foreground text-sm'>{metric.title}</span>
                </div>
                <p className='mt-auto flex items-center gap-1.5 text-sm'>
                  <span className={cn('flex items-center gap-0.5 font-medium', toneClass)}>
                    <DirectionIcon className='size-4' aria-hidden='true' />
                    {metric.change === null ? '—' : `${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(1)}%`}
                  </span>
                  <span className='text-muted-foreground'>vs last run</span>
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default PayrollKpiStrip
