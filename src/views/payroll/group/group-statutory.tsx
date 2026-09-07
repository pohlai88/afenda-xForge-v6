// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon } from 'lucide-react'

// Type Imports
import type { StatutorySnapshot } from '@/utils/payroll-group-attention'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/format-datetime'

type Props = {
  snapshot: StatutorySnapshot
  className?: string
}

/**
 * Whether statutory obligations are threatening payroll delivery. Nothing more than that.
 *
 * The Compliance workspace owns filing work, and duplicating its registry here is an anti-pattern
 * the page contract names. So this is two counts, an overdue count, and the single nearest date.
 *
 * A company counts as ready when nothing it owes is overdue or rejected — not when it has filed
 * everything. A filing that is not yet due is not a problem, and treating it as one would put
 * every company into review for most of the month and teach the reader to ignore the number.
 */
const GroupStatutory = ({ snapshot, className }: Props) => {
  const { ready, review, overdue, outstanding, next } = snapshot

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
          Statutory readiness
        </CardTitle>
        <CardDescription>
          {outstanding === 0
            ? 'Nothing outstanding with any authority'
            : `${outstanding} ${outstanding === 1 ? 'filing' : 'filings'} not yet accepted`}
        </CardDescription>
        <CardAction>
          <Button variant='ghost' size='sm' render={<Link href='/payroll/compliance' />} nativeButton={false}>
            Compliance
            <ArrowRightIcon />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-5'>
        <dl className='grid gap-3 sm:grid-cols-3'>
          <div className='bg-muted/50 flex flex-col gap-1 rounded-lg px-4 py-3'>
            <dt className='text-muted-foreground text-sm'>Ready</dt>
            <dd className='text-xl font-semibold tabular-nums'>{ready}</dd>
            <dd className='text-muted-foreground text-xs'>nothing overdue or rejected</dd>
          </div>
          <div className={cn('flex flex-col gap-1 rounded-lg px-4 py-3', review > 0 ? 'bg-warning/10' : 'bg-muted/50')}>
            <dt className='text-muted-foreground text-sm'>Needs review</dt>
            <dd className='text-xl font-semibold tabular-nums'>{review}</dd>
            <dd className='text-muted-foreground text-xs'>companies</dd>
          </div>
          <div
            className={cn('flex flex-col gap-1 rounded-lg px-4 py-3', overdue > 0 ? 'bg-destructive/5' : 'bg-muted/50')}
          >
            <dt className='text-muted-foreground text-sm'>Overdue</dt>
            <dd className='text-xl font-semibold tabular-nums'>{overdue}</dd>
            <dd className='text-muted-foreground text-xs'>filings past their due date</dd>
          </div>
        </dl>

        <div className='mt-auto'>
          {next ? (
            <p className='text-sm'>
              <span className='text-muted-foreground'>Nearest deadline · </span>
              <Link
                href={next.href}
                className='inline-block py-1 font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
              >
                {next.label}
              </Link>
              <span className='text-muted-foreground'>
                {' '}
                for {next.scope}, {formatDate(next.date)}
                {next.days < 0
                  ? ` — ${Math.abs(next.days)} ${Math.abs(next.days) === 1 ? 'day' : 'days'} overdue`
                  : next.days === 0
                    ? ' — today'
                    : ` — in ${next.days} ${next.days === 1 ? 'day' : 'days'}`}
              </span>
            </p>
          ) : (
            <p className='text-muted-foreground text-sm'>
              No filing is outstanding, so there is no statutory deadline to state.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default GroupStatutory
