// Next Imports
import Link from 'next/link'

// Third-party Imports
import { BanknoteIcon, FileTextIcon, ScissorsIcon } from 'lucide-react'

// Type Imports
import type { TimelineEvent } from '@/utils/payroll-group-attention'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/format-datetime'

type Props = {
  events: TimelineEvent[]
  className?: string
}

const KIND_ICONS = {
  cutoff: ScissorsIcon,
  payday: BanknoteIcon,
  statutory: FileTextIcon
} as const

/** Within this many days is close enough to colour. Matches the run queue's own threshold. */
const SOON = 3

/**
 * The next few dates, as a rail rather than a calendar.
 *
 * A month grid would spend most of its area on days when nothing happens, and the question is not
 * what the month looks like — it is what happens next. Six entries, chronological, forward only.
 *
 * Three kinds of date, which is every kind this domain can prove: an input cut-off and a pay date
 * from the payroll calendar, and a statutory due date from a filing. The source specification also
 * asked for approval, funding and close deadlines. Those are recorded as contract gap P01-GAP-002
 * rather than derived from the two dates that do exist — a deadline someone could miss is the last
 * thing to invent.
 */
const GroupTimeline = ({ events, className }: Props) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
        What happens next
      </CardTitle>
      <CardDescription>Cut-offs, paydays and statutory due dates ahead</CardDescription>
    </CardHeader>

    <CardContent className='flex flex-1 flex-col gap-4'>
      {events.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          No cut-off, payday or filing falls after today. Every dated obligation this period has passed.
        </p>
      ) : (
        <ol className='flex flex-col'>
          {events.map(event => {
            const Icon = KIND_ICONS[event.kind]
            const urgent = event.days <= SOON

            return (
              <li key={event.id}>
                {/* The whole row is the control, not the label inside it. A 20px inline link is
                    below the 24px pointer minimum, and the row is what a reader is aiming at
                    anyway — the same shape Next actions uses, so the two lists behave alike. */}
                <Button
                  variant='ghost'
                  render={<Link href={event.href} />}
                  nativeButton={false}
                  className='h-auto w-full items-start justify-start gap-3 px-2 py-2.5 text-left font-normal'
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md',
                      urgent ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className='size-4' aria-hidden='true' />
                  </span>

                  <span className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate text-sm font-medium'>{event.label}</span>
                    <span className='text-muted-foreground truncate text-xs'>{event.scope}</span>
                  </span>

                  <span className='flex shrink-0 flex-col items-end'>
                    <span className='text-sm tabular-nums'>{formatDate(event.date)}</span>
                    <span className={cn('text-xs tabular-nums', urgent ? 'text-warning' : 'text-muted-foreground')}>
                      {event.days === 0 ? 'today' : `in ${event.days} ${event.days === 1 ? 'day' : 'days'}`}
                    </span>
                  </span>
                </Button>
              </li>
            )
          })}
        </ol>
      )}

      <p className='text-muted-foreground mt-auto text-xs'>
        Approval, funding and close deadlines are not stored by the payroll calendar, so they are not shown.
      </p>
    </CardContent>
  </Card>
)

export default GroupTimeline
