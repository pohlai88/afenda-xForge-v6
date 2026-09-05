'use client'

// React Imports
import { useRef, useState } from 'react'

// Third-party Imports
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { differenceInDays } from 'date-fns'

// Type Imports
import type { CalendarEvent } from '@/types/apps/calendar-types'

// Component Imports
import { useCalendarDnd } from './calendar-dnd-context'
import { EventItem } from './event-item'

interface DraggableEventProps {
  event: CalendarEvent
  view: 'month' | 'week' | 'day'
  showTime?: boolean
  onClick?: (e: React.MouseEvent) => void
  height?: number
  isMultiDay?: boolean
  multiDayWidth?: number
  isFirstDay?: boolean
  isLastDay?: boolean
  spansLeft?: boolean
  spansRight?: boolean
  'aria-hidden'?: boolean | 'true' | 'false'
}

export function DraggableEvent({
  event,
  view,
  showTime,
  onClick,
  height,
  isMultiDay,
  multiDayWidth,
  isFirstDay = true,
  isLastDay = true,
  spansLeft = false,
  spansRight = false,
  'aria-hidden': ariaHidden
}: DraggableEventProps) {
  const { activeId } = useCalendarDnd()
  const elementRef = useRef<HTMLDivElement>(null)

  const [dragHandlePosition, setDragHandlePosition] = useState<{
    x: number
    y: number
  } | null>(null)

  // Check if this is a multi-day event
  const eventStart = new Date(event.start)
  const eventEnd = new Date(event.end)

  const isMultiDayEvent = isMultiDay || event.allDay || differenceInDays(eventEnd, eventStart) >= 1

  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${event.id}-${view}`,
    data: {
      event,
      view,
      height: height ?? measuredHeight,
      isMultiDay: isMultiDayEvent,
      multiDayWidth: multiDayWidth,
      dragHandlePosition,
      isFirstDay,
      isLastDay
    }
  })

  const updateMeasuredHeight = (element: HTMLDivElement) => {
    if (height == null) {
      const nextHeight = element.offsetHeight

      setMeasuredHeight(prev => (prev === nextHeight ? prev : nextHeight))
    }
  }

  // Handle mouse down to track where on the event the user clicked
  const handleMouseDown = (e: React.MouseEvent) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect()

      updateMeasuredHeight(elementRef.current)

      setDragHandlePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  // Don't render if this event is being dragged
  if (isDragging || activeId === `${event.id}-${view}`) {
    return <div ref={setNodeRef} className='opacity-0' style={{ height: height || 'auto' }} />
  }

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        height: height || 'auto',
        width: isMultiDayEvent && multiDayWidth ? `${multiDayWidth}%` : undefined
      }
    : {
        height: height || 'auto',
        width: isMultiDayEvent && multiDayWidth ? `${multiDayWidth}%` : undefined
      }

  // Handle touch start to track where on the event the user touched
  const handleTouchStart = (e: React.TouchEvent) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect()
      const touch = e.touches[0]

      updateMeasuredHeight(elementRef.current)

      if (touch) {
        setDragHandlePosition({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        })
      }
    }
  }

  return (
    <div
      ref={node => {
        setNodeRef(node)
        elementRef.current = node

        if (node) {
          updateMeasuredHeight(node)
        }
      }}
      style={style}
      className='w-full touch-none'
    >
      <EventItem
        event={event}
        view={view}
        showTime={showTime}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        spansLeft={spansLeft}
        spansRight={spansRight}
        isDragging={isDragging}
        onClick={onClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        dndListeners={listeners}
        dndAttributes={attributes}
        aria-hidden={ariaHidden}
      />
    </div>
  )
}
