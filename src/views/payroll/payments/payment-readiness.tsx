// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon, CheckIcon, CircleIcon } from 'lucide-react'

// Type Imports
import type { ReadinessCheck } from '@/utils/payroll-payments'

// Component Imports
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack } from '@/components/ui/progress'

// Util Imports
import { cn } from '@/lib/utils'

type Props = {
  percent: number
  checks: ReadinessCheck[]
  className?: string
}

/**
 * Can this run be paid, and if not, what is in the way. Each gate that is not yet cleared links
 * to where it gets cleared — a readiness number nobody can act on is decoration.
 */
const PaymentReadiness = ({ percent, checks, className }: Props) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle className='text-lg font-semibold'>Payment readiness</CardTitle>
      <CardDescription>Every gate has to clear before a payment file can be released.</CardDescription>
      <CardAction>
        <span
          className={cn('text-2xl font-semibold tabular-nums', percent === 100 ? 'text-success-strong' : 'text-foreground')}
        >
          {percent}%
        </span>
      </CardAction>
    </CardHeader>
    <CardContent className='flex flex-col gap-4'>
      <Progress value={percent} aria-label={`Payment readiness ${percent}%`} className='flex-col gap-1.5'>
        <ProgressLabel className='text-muted-foreground w-full text-xs font-normal'>
          {checks.filter(c => c.done).length} of {checks.length} gates cleared
        </ProgressLabel>
        <ProgressTrack className='h-2'>
          <ProgressIndicator className={percent === 100 ? 'bg-success' : undefined} />
        </ProgressTrack>
      </Progress>

      <ol className='divide-y'>
        {checks.map(check => (
          <li key={check.key} className='flex items-start gap-3 py-2.5'>
            <span
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                check.done ? 'bg-success/15 border-success/40 text-success-strong' : 'border-border text-muted-foreground'
              )}
              aria-hidden='true'
            >
              {check.done ? <CheckIcon className='size-3' /> : <CircleIcon className='size-2 fill-current' />}
            </span>
            <span className='flex min-w-0 flex-1 flex-col'>
              <span className='text-sm font-medium'>
                {check.label}
                <span className='sr-only'>{check.done ? ' — done' : ' — outstanding'}</span>
              </span>
              <span className={cn('text-xs', check.done ? 'text-muted-foreground' : 'text-warning-strong')}>
                {check.detail}
              </span>
            </span>
            {!check.done && check.href && (
              <Link
                href={check.href}
                className='text-primary flex shrink-0 items-center gap-1 text-xs underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
              >
                Fix
                <ArrowRightIcon className='size-3' />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </CardContent>
  </Card>
)

export default PaymentReadiness
