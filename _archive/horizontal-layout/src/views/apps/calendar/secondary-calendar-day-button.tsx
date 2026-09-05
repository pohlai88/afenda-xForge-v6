'use client'

// Third-party Imports
import { format } from 'date-fns'
import type { DayButton } from 'react-day-picker'

// Type Imports
import type { events } from '@/types/apps/calendar-types'

// Component Imports
import { CalendarDayButton } from '@/components/ui/calendar'

// Util Imports
import { cn } from '@/lib/utils'

// Data Imports
import { EVENT_TYPE_DOT_CLASSES } from '@/assets/data/event-type-options'

const MAX_VISIBLE_DOTS = 2

interface SecondaryCalendarDayButtonProps extends React.ComponentProps<typeof DayButton> {
  eventsByDay: Map<string, events[]>
}

export function SecondaryCalendarDayButton({
  day,
  eventsByDay,
  className,
  modifiers,
  ...props
}: SecondaryCalendarDayButtonProps) {
  const dayKey = format(day.date, 'yyyy-MM-dd')
  const dayEventTypes = eventsByDay.get(dayKey) ?? []
  const visibleDots = dayEventTypes.slice(0, MAX_VISIBLE_DOTS)
  const overflowCount = dayEventTypes.length - visibleDots.length

  return (
    <CalendarDayButton
      day={day}
      modifiers={modifiers}
      className={cn(
        'size-auto! h-auto! w-full min-w-0 justify-between gap-0.5 rounded-(--cell-radius) px-0 py-2',
        'text-muted-foreground data-[selected-single=true]:text-primary-foreground',
        'data-[selected-single=true]:rounded-(--cell-radius)',
        '[&>span]:opacity-100',
        className
      )}
      {...props}
    >
      <span className='text-xs leading-none'>{day.date.getDate()}</span>
      {dayEventTypes.length > 0 && (
        <span className='mt-0.5 flex min-h-2 w-full max-w-full items-center justify-center gap-px overflow-hidden'>
          {visibleDots.map((eventType, index) => (
            <span
              key={`${dayKey}-${eventType}-${index}`}
              className={cn('size-1 shrink-0 rounded-full', EVENT_TYPE_DOT_CLASSES[eventType])}
              aria-hidden='true'
            />
          ))}
          {overflowCount > 0 && <span className='text-[9px] leading-none font-medium'>+{overflowCount}</span>}
        </span>
      )}
    </CalendarDayButton>
  )
}
