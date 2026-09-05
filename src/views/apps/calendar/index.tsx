'use client'

// React Imports
import { useEffect, useMemo } from 'react'

// Third-party Imports
import { addDays, endOfWeek, format, isBefore, isSameMonth, startOfDay, startOfWeek } from 'date-fns'
import { CalendarCheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, MenuIcon, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { CalendarEvent, CalendarView, events } from '@/types/apps/calendar-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AgendaView } from './agenda-view'
import { CalendarDndProvider } from './calendar-dnd-context'
import { DayView } from './day-view'
import { EventDialog } from './event-dialog'
import { MonthView } from './month-view'
import { SecondaryCalendarDayButton } from './secondary-calendar-day-button'
import { WeekView } from './week-view'

// Store Imports
import {
  useCalendarEvents,
  useCalendarFilters,
  useCalendarNavigation,
  useCalendarStore,
  useEventDialog,
  useFilteredEvents,
  useSecondaryCalendar
} from '@/store/use-calendar-store'

// Util Imports
import { cn } from '@/lib/utils'
import { normalizeEventType } from '@/utils/calendar-utils'

// Data Imports
import { AgendaDaysToShow, EventGap, EventHeight, WeekCellsHeight } from '@/assets/data/constants'
import { EVENT_TYPE_OPTIONS } from '@/assets/data/event-type-options'

export interface EventCalendarProps {
  className?: string
  initialView?: CalendarView
}

export function EventCalendar({ className, initialView = 'month' }: EventCalendarProps) {
  const { currentDate, view, setView, goToPrevious, goToNext, goToToday } = useCalendarNavigation()
  const { showAllTypes, selectedTypes, setShowAllTypes, toggleTypeFilter } = useCalendarFilters()

  const { secondarySelectedDate, secondaryMonth, selectSecondaryDate, setSecondaryMonth } = useSecondaryCalendar()

  const {
    isEventDialogOpen,
    selectedEvent,
    openNewEventDialog,
    openEventDialog,
    closeEventDialog,
    createEventFromSlot
  } = useEventDialog()

  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents()
  const filteredEvents = useFilteredEvents()

  const initialize = useCalendarStore(state => state.initialize)

  useEffect(() => {
    initialize({ initialView })
  }, [initialize, initialView])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, events[]>()

    for (const event of filteredEvents) {
      const eventType = normalizeEventType(event.color)
      let day = startOfDay(new Date(event.start))
      const lastDay = startOfDay(new Date(event.end))

      while (!isBefore(lastDay, day)) {
        const key = format(day, 'yyyy-MM-dd')

        map.set(key, [...(map.get(key) ?? []), eventType])
        day = addDays(day, 1)
      }
    }

    return map
  }, [filteredEvents])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isEventDialogOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'm':
          setView('month')
          break
        case 'w':
          setView('week')
          break
        case 'd':
          setView('day')
          break
        case 'a':
          setView('agenda')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEventDialogOpen, setView])

  const handleEventSave = (event: CalendarEvent) => {
    if (event.id) {
      updateEvent(event)

      toast(`Event "${event.title}" updated`, {
        description: format(new Date(event.start), 'MMM d, yyyy'),
        position: 'bottom-right'
      })
    } else {
      addEvent({
        ...event,
        id: Math.random().toString(36).substring(2, 11)
      })

      toast(`Event "${event.title}" added`, {
        description: format(new Date(event.start), 'MMM d, yyyy'),
        position: 'bottom-right'
      })
    }

    closeEventDialog()
  }

  const handleEventDelete = (eventId: string) => {
    const deletedEvent = events.find(e => e.id === eventId)

    deleteEvent(eventId)
    closeEventDialog()

    if (deletedEvent) {
      toast(`Event "${deletedEvent.title}" deleted`, {
        description: format(new Date(deletedEvent.start), 'MMM d, yyyy'),
        position: 'bottom-left'
      })
    }
  }

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    updateEvent(updatedEvent)

    toast(`Event "${updatedEvent.title}" moved`, {
      description: format(new Date(updatedEvent.start), 'MMM d, yyyy'),
      position: 'bottom-left'
    })
  }

  const viewTitle = useMemo(() => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy')
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })

      if (isSameMonth(start, end)) {
        return format(start, 'MMMM yyyy')
      } else {
        return `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`
      }
    } else if (view === 'day') {
      return (
        <>
          <span className='min-[480px]:hidden' aria-hidden='true'>
            {format(currentDate, 'MMM d, yyyy')}
          </span>
          <span className='max-[479px]:hidden md:hidden' aria-hidden='true'>
            {format(currentDate, 'MMMM d, yyyy')}
          </span>
          <span className='max-md:hidden'>{format(currentDate, 'EEE MMMM d, yyyy')}</span>
        </>
      )
    } else if (view === 'agenda') {
      const start = currentDate
      const end = addDays(currentDate, AgendaDaysToShow - 1)

      if (isSameMonth(start, end)) {
        return format(start, 'MMMM yyyy')
      } else {
        return `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`
      }
    } else {
      return format(currentDate, 'MMMM yyyy')
    }
  }, [currentDate, view])

  return (
    <div className='bg-card grid grid-cols-9 rounded-lg border'>
      <CalendarDndProvider onEventUpdate={handleEventUpdate}>
        <div className='col-span-2 divide-y border-r max-lg:hidden lg:max-2xl:col-span-3'>
          <div className='p-4'>
            <Button className='w-full' onClick={openNewEventDialog}>
              <PlusIcon size={16} aria-hidden='true' />
              <span>New event</span>
            </Button>
          </div>

          <div>
            <Calendar
              mode='single'
              className='w-full p-2 [--cell-size:--spacing(8)]'
              classNames={{
                root: 'w-full',
                month: 'flex w-full flex-col gap-2',
                weekdays: 'flex w-full',
                weekday: 'flex-1 min-w-0 text-center text-[0.8rem] font-normal text-muted-foreground select-none',
                week: 'mt-1 flex w-full',
                day: 'group/day relative flex min-w-0 flex-1 basis-0 flex-col items-stretch p-0 text-center select-none',
                today:
                  'rounded-(--cell-radius) bg-muted data-[selected=true]:bg-transparent data-[selected=true]:rounded-(--cell-radius)'
              }}
              selected={secondarySelectedDate}
              onSelect={selectSecondaryDate}
              month={secondaryMonth}
              onMonthChange={setSecondaryMonth}
              components={{
                DayButton: props => <SecondaryCalendarDayButton {...props} eventsByDay={eventsByDay} />
              }}
            />
          </div>

          <div className='flex flex-col gap-4 p-4'>
            <span className='text-lg font-semibold'>Event filters</span>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='filter-all'
                  checked={showAllTypes}
                  onCheckedChange={checked => setShowAllTypes(checked === true)}
                />
                <Label htmlFor='filter-all' className='cursor-pointer font-normal'>
                  All
                </Label>
              </div>
              {EVENT_TYPE_OPTIONS.map(option => {
                const isChecked = showAllTypes || selectedTypes.includes(option.value)

                return (
                  <div key={option.value} className='flex items-center gap-2'>
                    <Checkbox
                      id={`filter-${option.value}`}
                      checked={isChecked}
                      onCheckedChange={checked => toggleTypeFilter(option.value, checked === true)}
                      aria-label={option.label}
                      className={cn(
                        'data-checked:text-primary-foreground size-4 border-2 shadow-none',
                        option.bgClass,
                        option.borderClass
                      )}
                    />
                    <Label htmlFor={`filter-${option.value}`} className='cursor-pointer text-base font-normal'>
                      {option.label}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>

          <EventDialog
            event={selectedEvent}
            isOpen={isEventDialogOpen}
            onClose={closeEventDialog}
            onSave={handleEventSave}
            onDelete={handleEventDelete}
          />
        </div>

        <div
          className='col-span-7 flex flex-col has-data-[slot=month-view]:flex-1 max-lg:col-span-full lg:max-2xl:col-span-6'
          style={
            {
              '--event-height': `${EventHeight}px`,
              '--event-gap': `${EventGap}px`,
              '--week-cells-height': `${WeekCellsHeight}px`
            } as React.CSSProperties
          }
        >
          <div className={cn('flex items-center justify-between gap-1 p-2 sm:p-4', className)}>
            <div className='flex items-center gap-1 max-sm:justify-between sm:gap-4'>
              <div className='flex items-center gap-1'>
                <Sheet>
                  <SheetTrigger render={<Button variant='outline' size='icon-sm' />} className='lg:hidden'>
                    <MenuIcon />
                  </SheetTrigger>
                  <SheetContent side='left' className='max-w-80! divide-y border-r'>
                    <div className='p-4'>
                      <Button className='w-full' onClick={openNewEventDialog}>
                        <PlusIcon size={16} aria-hidden='true' />
                        <span>New event</span>
                      </Button>
                    </div>

                    <div className='p-1'>
                      <Calendar
                        mode='single'
                        className='w-full p-2 [--cell-size:--spacing(8)]'
                        classNames={{
                          root: 'w-full',
                          month: 'flex w-full flex-col gap-2',
                          weekdays: 'flex w-full',
                          weekday:
                            'flex-1 min-w-0 text-center text-[0.8rem] font-normal text-muted-foreground select-none',
                          week: 'mt-1 flex w-full',
                          day: 'group/day relative flex min-w-0 flex-1 basis-0 flex-col items-stretch p-0 text-center select-none',
                          today:
                            'rounded-(--cell-radius) bg-muted data-[selected=true]:bg-transparent data-[selected=true]:rounded-(--cell-radius)'
                        }}
                        selected={secondarySelectedDate}
                        onSelect={selectSecondaryDate}
                        month={secondaryMonth}
                        onMonthChange={setSecondaryMonth}
                        components={{
                          DayButton: props => <SecondaryCalendarDayButton {...props} eventsByDay={eventsByDay} />
                        }}
                      />
                    </div>
                    <div className='flex flex-col gap-4 p-4'>
                      <span className='text-lg font-semibold'>Event filters</span>
                      <div className='flex flex-col gap-3'>
                        <div className='flex items-center gap-2'>
                          <Checkbox
                            id='filter-all'
                            checked={showAllTypes}
                            onCheckedChange={checked => setShowAllTypes(checked === true)}
                          />
                          <Label htmlFor='filter-all' className='cursor-pointer font-normal'>
                            All
                          </Label>
                        </div>
                        {EVENT_TYPE_OPTIONS.map(option => {
                          const isChecked = showAllTypes || selectedTypes.includes(option.value)

                          return (
                            <div key={option.value} className='flex items-center gap-2'>
                              <Checkbox
                                id={`filter-${option.value}`}
                                checked={isChecked}
                                onCheckedChange={checked => toggleTypeFilter(option.value, checked === true)}
                                aria-label={option.label}
                                className={cn(
                                  'data-checked:text-primary-foreground size-4 border-2 shadow-none',
                                  option.bgClass,
                                  option.borderClass
                                )}
                              />
                              <Label
                                htmlFor={`filter-${option.value}`}
                                className='cursor-pointer text-base font-normal'
                              >
                                {option.label}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <EventDialog
                      event={selectedEvent}
                      isOpen={isEventDialogOpen}
                      onClose={closeEventDialog}
                      onSave={handleEventSave}
                      onDelete={handleEventDelete}
                    />
                  </SheetContent>
                </Sheet>
                <Button variant='outline' className='max-sm:hidden md:max-lg:h-8' onClick={goToToday}>
                  <CalendarCheckIcon size={16} aria-hidden='true' />
                  <span>Today</span>
                </Button>
                <Button variant='outline' size='icon-sm' className='sm:hidden' onClick={goToToday}>
                  <CalendarCheckIcon size={16} aria-hidden='true' />
                </Button>
              </div>
            </div>
            <div className='flex items-center gap-1'>
              <Button variant='ghost' size='icon-sm' onClick={goToPrevious} aria-label='Previous'>
                <ChevronLeftIcon size={16} aria-hidden='true' />
              </Button>
              <h2 className='text-sm font-semibold sm:text-lg md:text-xl'>{viewTitle}</h2>
              <Button variant='ghost' size='icon-sm' onClick={goToNext} aria-label='Next'>
                <ChevronRightIcon size={16} aria-hidden='true' />
              </Button>
            </div>
            <div className='flex items-center gap-2'>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant='outline' className='max-sm:h-8!' />}>
                  <span>
                    <span className='sm:hidden' aria-hidden='true'>
                      {view.charAt(0).toUpperCase()}
                    </span>
                    <span className='max-sm:sr-only'>{view.charAt(0).toUpperCase() + view.slice(1)}</span>
                  </span>
                  <ChevronDownIcon className='-me-1 opacity-60' size={16} aria-hidden='true' />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='min-w-32'>
                  <DropdownMenuItem onClick={() => setView('month')}>
                    Month <DropdownMenuShortcut>M</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('week')}>
                    Week <DropdownMenuShortcut>W</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('day')}>
                    Day <DropdownMenuShortcut>D</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('agenda')}>
                    Agenda <DropdownMenuShortcut>A</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className='flex flex-1 flex-col'>
            {view === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={filteredEvents}
                onEventSelect={openEventDialog}
                onEventCreate={createEventFromSlot}
              />
            )}
            {view === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={filteredEvents}
                onEventSelect={openEventDialog}
                onEventCreate={createEventFromSlot}
              />
            )}
            {view === 'day' && (
              <DayView
                currentDate={currentDate}
                events={filteredEvents}
                onEventSelect={openEventDialog}
                onEventCreate={createEventFromSlot}
              />
            )}
            {view === 'agenda' && (
              <AgendaView currentDate={currentDate} events={filteredEvents} onEventSelect={openEventDialog} />
            )}
          </div>
        </div>
      </CalendarDndProvider>
    </div>
  )
}
