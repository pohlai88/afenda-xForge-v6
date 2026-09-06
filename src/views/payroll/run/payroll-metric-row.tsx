// React Imports
import type { ReactNode } from 'react'

// Component Imports
import { Button } from '@/components/ui/button'

// Util Imports
import { cn } from '@/lib/utils'

export type PayrollMetric = {
  key: string
  label: string
  value: string

  /** A short qualifier under the value: the delta, a count, a caption. */
  detail?: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'destructive'

  /** Makes the metric a control — used to jump to the exceptions view from the open count. */
  onClick?: () => void
}

type Props = {
  metrics: PayrollMetric[]
  className?: string
}

const TONE_STYLES: Record<NonNullable<PayrollMetric['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive'
}

/**
 * One row of figures separated by rules. Not six cards: an approver reads these against each
 * other, and a row keeps them on one baseline where a grid of tiles would scatter them.
 */
const PayrollMetricRow = ({ metrics, className }: Props) => (
  <dl
    className={cn(
      'bg-card grid grid-cols-2 divide-y rounded-lg border sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6',
      '*:border-b sm:*:border-b-0 sm:*:not-last:border-r lg:*:not-last:border-r',
      className
    )}
  >
    {metrics.map(metric => {
      const body = (
        <>
          <dt className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{metric.label}</dt>
          <dd className={cn('mt-1 text-xl font-semibold tabular-nums', TONE_STYLES[metric.tone ?? 'default'])}>
            {metric.value}
          </dd>
          {metric.detail && <dd className='text-muted-foreground mt-0.5 text-xs tabular-nums'>{metric.detail}</dd>}
        </>
      )

      return metric.onClick ? (
        <div key={metric.key} className='flex flex-col'>
          <Button
            variant='ghost'
            onClick={metric.onClick}
            className='h-auto flex-1 flex-col items-start justify-start rounded-md px-4 py-3 text-left font-normal whitespace-normal'
          >
            {body}
          </Button>
        </div>
      ) : (
        <div key={metric.key} className='flex flex-col px-4 py-3'>
          {body}
        </div>
      )
    })}
  </dl>
)

export default PayrollMetricRow
