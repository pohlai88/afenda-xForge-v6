// Type Imports
import type { AuditEvent } from '@/types/payroll/run-workspace-types'

// Component Imports
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine
} from '@/components/ui/timeline'

// Util Imports
import { cn } from '@/lib/utils'
import { formatInstant } from '@/utils/payroll-workspace'

type Props = {
  events: AuditEvent[]
  emptyMessage?: string
  className?: string
}

const DOT_STATUS: Record<AuditEvent['kind'], 'done' | 'current' | 'error' | 'default'> = {
  approval: 'done',
  user: 'current',
  exception: 'error',
  system: 'default'
}

/**
 * Who did what, when — newest first. The same Timeline the user profile uses, so an auditor
 * moving between the two reads one convention.
 */
const PayrollAuditTimeline = ({ events, emptyMessage = 'Nothing has happened on this run yet.', className }: Props) => {
  if (events.length === 0) {
    return <p className={cn('text-muted-foreground py-6 text-center text-sm', className)}>{emptyMessage}</p>
  }

  return (
    <Timeline className={cn('text-sm', className)}>
      {events.map((event, index) => (
        <TimelineItem key={event.id} status={event.kind === 'approval' ? 'done' : 'default'}>
          <TimelineHeading side='right' variant='primary' className='text-foreground text-sm'>
            {event.action}
          </TimelineHeading>
          <TimelineDot status={DOT_STATUS[event.kind]} />
          {index < events.length - 1 && <TimelineLine done={event.kind === 'approval'} className='min-h-8' />}
          <TimelineContent side='right' className='pb-5'>
            <p className='text-muted-foreground text-xs'>
              {event.actor} · {formatInstant(event.at)}
            </p>
            {event.detail && <p className='text-muted-foreground mt-0.5 text-xs'>{event.detail}</p>}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

export default PayrollAuditTimeline
