// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { ChevronDownIcon, ChevronUpIcon, MinusIcon } from 'lucide-react'

// Component Imports
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'

/**
 * Whether a rise in this metric is good news.
 *
 * The generic statistics card colours nothing, because in the abstract a rising number is
 * neither good nor bad. On a payroll run it usually is: employer cost climbing 8% is a
 * question someone has to answer, while net pay climbing 8% alongside headcount is just
 * what a bigger team costs. Encoding that here keeps the judgement next to the metric
 * instead of leaving every reader to supply it.
 */
export type Polarity = 'higher-is-worse' | 'higher-is-better' | 'neutral'

type Props = {
  icon: ReactNode
  value: string
  title: string

  /** Percentage change vs the previous run; null when there is no run to compare against. */
  change: number | null
  polarity: Polarity
  caption: string

  /** Optional history, oldest first, for the sparkline. Omitted when no series exists. */
  series?: number[]
  className?: string
  iconClassName?: string
}

/**
 * A sparkline drawn as plain SVG rather than through the chart library.
 *
 * This card renders on the server. Recharts would force a client boundary, and measuring
 * anything against the viewport risks a server/client mismatch of exactly the kind
 * `formatMoney` exists to avoid. A polyline over a fixed viewBox is deterministic, scales
 * with CSS, and costs no JavaScript.
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
      className={cn('h-6 w-20', className)}
      aria-hidden='true'
      focusable='false'
    >
      <polyline points={points} fill='none' stroke='currentColor' strokeWidth={1.5} vectorEffect='non-scaling-stroke' />
    </svg>
  )
}

const PayrollStatCard = ({
  icon,
  value,
  title,
  change,
  polarity,
  caption,
  series,
  className,
  iconClassName
}: Props) => {
  const rising = change !== null && change > 0
  const flat = change === null || change === 0

  // Direction is what the number did; tone is whether that is good. They are not the same axis.
  const tone =
    flat || polarity === 'neutral' ? 'neutral' : rising === (polarity === 'higher-is-better') ? 'good' : 'bad'

  const toneClass = {
    good: 'text-success',
    bad: 'text-destructive',
    neutral: 'text-muted-foreground'
  }[tone]

  const DirectionIcon = flat ? MinusIcon : rising ? ChevronUpIcon : ChevronDownIcon

  return (
    <Card className={className}>
      <CardHeader>
        <span
          className={cn(
            'bg-primary/10 text-primary flex size-9.5 shrink-0 items-center justify-center rounded-sm [&>svg]:size-4.75',
            iconClassName
          )}
        >
          {icon}
        </span>
        {series && series.length > 1 && (
          <CardAction>
            <Sparkline series={series} className={toneClass} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className='flex flex-1 flex-col justify-between gap-4'>
        <p className='flex flex-col gap-1'>
          <span className='text-lg font-semibold'>{value}</span>
          <span className='text-muted-foreground text-sm'>{title}</span>
        </p>
        <p className='flex items-center gap-1.5 text-sm'>
          <span className={cn('flex items-center gap-0.5 font-medium', toneClass)}>
            <DirectionIcon className='size-4' aria-hidden='true' />
            {change === null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`}
          </span>
          <span className='text-muted-foreground'>{caption}</span>
        </p>
      </CardContent>
    </Card>
  )
}

export default PayrollStatCard
