'use client'

// React Imports
import { useMemo } from 'react'

// Third-party Imports
import { addDays, addHours, addMonths, addWeeks, subMonths, subWeeks } from 'date-fns'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

// Type Imports
import type { CalendarEvent, CalendarView, events } from '@/types/apps/calendar-types'
import { normalizeEventType } from '@/utils/calendar-utils'

// Data Imports
import { AgendaDaysToShow } from '@/assets/data/constants'
import { ALL_EVENT_TYPES } from '@/assets/data/event-type-options'
import { db } from '@/fake-db/apps/calendar'

/**
 * ! If you're using a database, you can uncomment the line below and use the server action to fetch the data
 * ! import { getCalendarData } from '@/app/server/actions'
 */

type CalendarData = {
  events: CalendarEvent[]
  currentDate: Date
  view: CalendarView
  isEventDialogOpen: boolean
  selectedEvent: CalendarEvent | null
  secondarySelectedDate: Date | undefined
  secondaryMonth: Date
  showAllTypes: boolean
  selectedTypes: events[]
}

type CalendarActions = {
  initialize: (options?: { initialView?: CalendarView; events?: CalendarEvent[] }) => void
  setView: (view: CalendarView) => void
  goToPrevious: () => void
  goToNext: () => void
  goToToday: () => void
  selectSecondaryDate: (date: Date | undefined) => void
  setSecondaryMonth: (month: Date) => void
  setShowAllTypes: (checked: boolean) => void
  toggleTypeFilter: (type: events, checked: boolean) => void
  openNewEventDialog: () => void
  openEventDialog: (event: CalendarEvent) => void
  closeEventDialog: () => void
  createEventFromSlot: (startTime: Date) => void
  addEvent: (event: CalendarEvent) => void
  updateEvent: (event: CalendarEvent) => void
  deleteEvent: (eventId: string) => void
}

export type CalendarStore = CalendarData & CalendarActions

function snapToFifteenMinutes(startTime: Date) {
  const minutes = startTime.getMinutes()
  const remainder = minutes % 15

  if (remainder !== 0) {
    if (remainder < 7.5) {
      startTime.setMinutes(minutes - remainder)
    } else {
      startTime.setMinutes(minutes + (15 - remainder))
    }

    startTime.setSeconds(0)
    startTime.setMilliseconds(0)
  }
}

function hasSameTypeSelection(current: events[], next: events[]) {
  if (current.length !== next.length) return false

  return current.every(type => next.includes(type))
}

function getActiveTypes(showAllTypes: boolean, selectedTypes: events[]) {
  return showAllTypes ? ALL_EVENT_TYPES : selectedTypes
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  // Initial state
  events: db,
  currentDate: new Date(),
  view: 'month',
  isEventDialogOpen: false,
  selectedEvent: null,
  secondarySelectedDate: new Date(),
  secondaryMonth: new Date(),
  showAllTypes: true,
  selectedTypes: [...ALL_EVENT_TYPES],

  initialize: ({ initialView, events } = {}) => {
    const updates: Partial<CalendarData> = {}

    if (initialView && get().view !== initialView) {
      updates.view = initialView
    }

    if (events && events !== get().events) {
      updates.events = events
    }

    if (Object.keys(updates).length > 0) {
      set(updates)
    }
  },

  setView: view => {
    if (get().view === view) return

    set({ view })
  },

  goToPrevious: () => {
    const { view, currentDate } = get()

    if (view === 'month') {
      set({ currentDate: subMonths(currentDate, 1) })
    } else if (view === 'week') {
      set({ currentDate: subWeeks(currentDate, 1) })
    } else if (view === 'day') {
      set({ currentDate: addDays(currentDate, -1) })
    } else if (view === 'agenda') {
      set({ currentDate: addDays(currentDate, -AgendaDaysToShow) })
    }
  },

  goToNext: () => {
    const { view, currentDate } = get()

    if (view === 'month') {
      set({ currentDate: addMonths(currentDate, 1) })
    } else if (view === 'week') {
      set({ currentDate: addWeeks(currentDate, 1) })
    } else if (view === 'day') {
      set({ currentDate: addDays(currentDate, 1) })
    } else if (view === 'agenda') {
      set({ currentDate: addDays(currentDate, AgendaDaysToShow) })
    }
  },

  goToToday: () => set({ currentDate: new Date() }),

  // Secondary (sidebar) calendar
  selectSecondaryDate: date => {
    if (!date) return

    set({ secondarySelectedDate: date, currentDate: date })
  },

  setSecondaryMonth: month => set({ secondaryMonth: month }),

  // Event type filters
  setShowAllTypes: checked => {
    const { showAllTypes, selectedTypes } = get()

    if (checked) {
      if (showAllTypes && hasSameTypeSelection(selectedTypes, ALL_EVENT_TYPES)) return

      set({ showAllTypes: true, selectedTypes: [...ALL_EVENT_TYPES] })
    } else {
      if (!showAllTypes && selectedTypes.length === 0) return

      set({ showAllTypes: false, selectedTypes: [] })
    }
  },

  toggleTypeFilter: (type, checked) => {
    const { showAllTypes, selectedTypes } = get()
    const activeTypes = getActiveTypes(showAllTypes, selectedTypes)

    const next = checked ? [...new Set([...activeTypes, type])] : activeTypes.filter(item => item !== type)

    if (next.length === ALL_EVENT_TYPES.length) {
      if (showAllTypes && hasSameTypeSelection(selectedTypes, ALL_EVENT_TYPES)) return

      set({ showAllTypes: true, selectedTypes: [...ALL_EVENT_TYPES] })
    } else {
      if (!showAllTypes && hasSameTypeSelection(selectedTypes, next)) return

      set({ showAllTypes: false, selectedTypes: next })
    }
  },

  // Event dialog
  openNewEventDialog: () => set({ selectedEvent: null, isEventDialogOpen: true }),

  openEventDialog: event => set({ selectedEvent: event, isEventDialogOpen: true }),

  closeEventDialog: () => set({ isEventDialogOpen: false, selectedEvent: null }),

  createEventFromSlot: startTime => {
    snapToFifteenMinutes(startTime)

    set({
      selectedEvent: {
        id: '',
        title: '',
        start: startTime,
        end: addHours(startTime, 1),
        allDay: false
      },
      isEventDialogOpen: true
    })
  },

  // Event CRUD
  addEvent: event => set(state => ({ events: [...state.events, event] })),

  updateEvent: event =>
    set(state => ({
      events: state.events.map(item => (item.id === event.id ? event : item))
    })),

  deleteEvent: eventId =>
    set(state => ({
      events: state.events.filter(item => item.id !== eventId)
    }))
}))

// Selector hooks (avoid unstable derived snapshots)

/** Events after applying sidebar type filters — memoized to prevent render loops */
export function useFilteredEvents() {
  const events = useCalendarStore(state => state.events)
  const showAllTypes = useCalendarStore(state => state.showAllTypes)
  const selectedTypes = useCalendarStore(state => state.selectedTypes)

  return useMemo(() => {
    if (showAllTypes) return events

    return events.filter(event => selectedTypes.includes(normalizeEventType(event.color)))
  }, [events, showAllTypes, selectedTypes])
}

export function useCalendarNavigation() {
  return useCalendarStore(
    useShallow(state => ({
      currentDate: state.currentDate,
      view: state.view,
      setView: state.setView,
      goToPrevious: state.goToPrevious,
      goToNext: state.goToNext,
      goToToday: state.goToToday
    }))
  )
}

export function useCalendarFilters() {
  return useCalendarStore(
    useShallow(state => ({
      showAllTypes: state.showAllTypes,
      selectedTypes: state.selectedTypes,
      setShowAllTypes: state.setShowAllTypes,
      toggleTypeFilter: state.toggleTypeFilter
    }))
  )
}

export function useSecondaryCalendar() {
  return useCalendarStore(
    useShallow(state => ({
      secondarySelectedDate: state.secondarySelectedDate,
      secondaryMonth: state.secondaryMonth,
      selectSecondaryDate: state.selectSecondaryDate,
      setSecondaryMonth: state.setSecondaryMonth
    }))
  )
}

export function useEventDialog() {
  return useCalendarStore(
    useShallow(state => ({
      isEventDialogOpen: state.isEventDialogOpen,
      selectedEvent: state.selectedEvent,
      openNewEventDialog: state.openNewEventDialog,
      openEventDialog: state.openEventDialog,
      closeEventDialog: state.closeEventDialog,
      createEventFromSlot: state.createEventFromSlot
    }))
  )
}

export function useCalendarEvents() {
  return useCalendarStore(
    useShallow(state => ({
      events: state.events,
      addEvent: state.addEvent,
      updateEvent: state.updateEvent,
      deleteEvent: state.deleteEvent
    }))
  )
}
