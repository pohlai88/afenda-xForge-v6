'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// Third-party Imports
import { format, isBefore } from 'date-fns'
import { CalendarIcon, Trash2Icon } from 'lucide-react'

// Type Imports
import type { CalendarEvent, events } from '@/types/apps/calendar-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Util Imports
import { cn } from '@/lib/utils'

// Data Imports
import { DefaultEndHour, DefaultStartHour, EndHour, StartHour } from '@/assets/data/constants'
import { EVENT_TYPE_OPTIONS } from '@/assets/data/event-type-options'

interface EventDialogProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onSave: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
}

const formatTimeForInput = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = Math.floor(date.getMinutes() / 15) * 15

  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

export function EventDialog({ event, isOpen, onClose, onSave, onDelete }: EventDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`)
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`)
  const [allDay, setAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [eventType, setEventType] = useState<events>('etc')
  const [error, setError] = useState<string | null>(null)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStartDate(new Date())
    setEndDate(new Date())
    setStartTime(`${DefaultStartHour}:00`)
    setEndTime(`${DefaultEndHour}:00`)
    setAllDay(false)
    setLocation('')
    setEventType('etc')
    setError(null)
    setStartDateOpen(false)
    setEndDateOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return

    if (event) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(event.title || '')
      setDescription(event.description || '')

      const start = new Date(event.start)
      const end = new Date(event.end)

      setStartDate(start)
      setEndDate(end)
      setStartTime(formatTimeForInput(start))
      setEndTime(formatTimeForInput(end))
      setAllDay(event.allDay || false)
      setLocation(event.location || '')
      setEventType(event.color || 'etc')
      setError(null)
    } else {
      resetForm()
    }
  }, [event, isOpen])

  // Memoize time options so they're only calculated once
  const timeOptions = useMemo(() => {
    const options = []

    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0')
        const formattedMinute = minute.toString().padStart(2, '0')
        const value = `${formattedHour}:${formattedMinute}`

        // Use a fixed date to avoid unnecessary date object creations
        const date = new Date(2000, 0, 1, hour, minute)
        const label = format(date, 'h:mm a')

        options.push({ value, label })
      }
    }

    return options
  }, []) // Empty dependency array ensures this only runs once

  const handleSave = () => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime.split(':').map(Number)

      const [endHours = 0, endMinutes = 0] = endTime.split(':').map(Number)

      if (startHours < StartHour || startHours > EndHour || endHours < StartHour || endHours > EndHour) {
        setError(`Selected time must be between ${StartHour}:00 and ${EndHour}:00`)

        return
      }

      start.setHours(startHours, startMinutes, 0)
      end.setHours(endHours, endMinutes, 0)
    } else {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    }

    // Validate that end date is not before start date
    if (isBefore(end, start)) {
      setError('End date cannot be before start date')

      return
    }

    // Use generic title if empty
    const eventTitle = title.trim() ? title : '(no title)'

    onSave({
      id: event?.id || '',
      title: eventTitle,
      description,
      start,
      end,
      allDay,
      location,
      color: eventType
    })

    if (!event?.id) {
      resetForm()
    }
  }

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-106.25'>
        <DialogHeader>
          <DialogTitle>{event?.id ? 'Edit Event' : 'Create Event'}</DialogTitle>
          <DialogDescription className='sr-only'>
            {event?.id ? 'Edit the details of this event' : 'Add a new event to your calendar'}
          </DialogDescription>
        </DialogHeader>
        <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain'>
          {error && <div className='bg-destructive/15 text-destructive mb-4 rounded-md px-3 py-2 text-sm'>{error}</div>}
          <div className='grid gap-4'>
            <div className='*:not-first:mt-1.5'>
              <Label htmlFor='title'>Title</Label>
              <Input id='title' value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className='*:not-first:mt-1.5'>
              <Label htmlFor='description'>Description</Label>
              <Textarea id='description' value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>

            <div className='flex gap-4'>
              <div className='flex-1 *:not-first:mt-1.5'>
                <Label htmlFor='start-date'>Start Date</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        id='start-date'
                        variant={'outline'}
                        className={cn(
                          'group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]',
                          !startDate && 'text-muted-foreground'
                        )}
                      />
                    }
                  >
                    <span className={cn('truncate', !startDate && 'text-muted-foreground')}>
                      {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                    </span>
                    <CalendarIcon size={16} className='text-muted-foreground/80 shrink-0' aria-hidden='true' />
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={startDate}
                      defaultMonth={startDate}
                      onSelect={date => {
                        if (date) {
                          setStartDate(date)

                          // If end date is before the new start date, update it to match the start date
                          if (isBefore(endDate, date)) {
                            setEndDate(date)
                          }

                          setError(null)
                          setStartDateOpen(false)
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!allDay && (
                <div className='min-w-28 *:not-first:mt-1.5'>
                  <Label htmlFor='start-time'>Start Time</Label>
                  <Select value={startTime} onValueChange={value => setStartTime(value || '')}>
                    <SelectTrigger id='start-time' className='w-full'>
                      <SelectValue placeholder='Select time' />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className='p-1'>
                      {timeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className='flex gap-4'>
              <div className='flex-1 *:not-first:mt-1.5'>
                <Label htmlFor='end-date'>End Date</Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        id='end-date'
                        variant={'outline'}
                        className={cn(
                          'group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]',
                          !endDate && 'text-muted-foreground'
                        )}
                      />
                    }
                  >
                    <span className={cn('truncate', !endDate && 'text-muted-foreground')}>
                      {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                    </span>
                    <CalendarIcon size={16} className='text-muted-foreground/80 shrink-0' aria-hidden='true' />
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={endDate}
                      defaultMonth={endDate}
                      disabled={{ before: startDate }}
                      onSelect={date => {
                        if (date) {
                          setEndDate(date)
                          setError(null)
                          setEndDateOpen(false)
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!allDay && (
                <div className='min-w-28 *:not-first:mt-1.5'>
                  <Label htmlFor='end-time'>End Time</Label>
                  <Select value={endTime} onValueChange={value => setEndTime(value || '')}>
                    <SelectTrigger id='end-time' className='w-full'>
                      <SelectValue placeholder='Select time' />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className='p-1'>
                      {timeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <Checkbox id='all-day' checked={allDay} onCheckedChange={checked => setAllDay(checked === true)} />
              <Label htmlFor='all-day'>All day</Label>
            </div>

            <div className='*:not-first:mt-1.5'>
              <Label htmlFor='location'>Location</Label>
              <Input id='location' value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            <div className='*:not-first:mt-1.5'>
              <Label htmlFor='event-type'>Event</Label>
              <Select
                items={EVENT_TYPE_OPTIONS}
                value={eventType}
                onValueChange={(value: events | null) => setEventType(value as events)}
              >
                <SelectTrigger id='event-type' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} side='top' className='p-1'>
                  {EVENT_TYPE_OPTIONS.map(colorOption => (
                    <SelectItem key={colorOption.value} value={colorOption.value}>
                      {colorOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className='shrink-0 flex-row sm:justify-between'>
          {event?.id && (
            <Button variant='destructive' size='icon' onClick={handleDelete} aria-label='Delete event'>
              <Trash2Icon size={16} aria-hidden='true' />
            </Button>
          )}
          <div className='flex flex-1 justify-end gap-2'>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
