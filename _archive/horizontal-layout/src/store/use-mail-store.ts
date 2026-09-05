'use client'

// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { Email, EmailLabel, EmailStatus, MailFilterTab, MailNavType, MailSortOrder } from '@/types/apps/mail-types'

// Data Imports
import { db } from '@/fake-db/apps/mail'

/**
 * ! If you're using a database, you can uncomment the line below and use the server action to fetch the data
 * ! import { getMailData } from '@/app/server/actions'
 */

type MailStoreData = {
  emails: Email[]
  selectedEmailId: string | null
  searchQuery: string
  activeStatus: EmailStatus
  activeLabel: EmailLabel | null
  activeNavType: MailNavType
  filterTab: MailFilterTab
  sortOrder: MailSortOrder
  isComposeOpen: boolean
}

type MailStoreActions = {
  initialize: (options?: { emails?: Email[] }) => void
  updateEmail: (id: string, updater: (email: Email) => Email) => void
  addEmail: (email: Email) => void
  removeEmail: (id: string) => void
  setSelectedEmailId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setActiveStatus: (status: EmailStatus) => void
  setActiveLabel: (label: EmailLabel | null) => void
  setActiveNavType: (type: MailNavType) => void
  setFilterTab: (tab: MailFilterTab) => void
  setSortOrder: (order: MailSortOrder) => void
  setIsComposeOpen: (open: boolean) => void
}

export type MailStore = MailStoreData & MailStoreActions

export const useMailStore = create<MailStore>((set, get) => ({
  emails: db,
  selectedEmailId: null,
  searchQuery: '',
  activeStatus: 'inbox',
  activeLabel: null,
  activeNavType: 'status',
  filterTab: 'all',
  sortOrder: 'default',
  isComposeOpen: false,

  initialize: ({ emails } = {}) => {
    const updates: Partial<MailStoreData> = {}

    if (emails && emails !== get().emails) {
      updates.emails = emails
    }

    if (Object.keys(updates).length > 0) {
      set(updates)
    }
  },

  updateEmail: (id, updater) =>
    set(state => ({
      emails: state.emails.map(email => (email.id === id ? updater(email) : email))
    })),

  addEmail: email => set(state => ({ emails: [email, ...state.emails] })),

  removeEmail: id =>
    set(state => ({
      emails: state.emails.filter(email => email.id !== id),
      selectedEmailId: state.selectedEmailId === id ? null : state.selectedEmailId
    })),

  setSelectedEmailId: selectedEmailId => set({ selectedEmailId }),
  setSearchQuery: searchQuery => set({ searchQuery }),
  setActiveStatus: activeStatus => set({ activeStatus }),
  setActiveLabel: activeLabel => set({ activeLabel }),
  setActiveNavType: activeNavType => set({ activeNavType }),
  setFilterTab: filterTab => set({ filterTab }),
  setSortOrder: sortOrder => set({ sortOrder }),
  setIsComposeOpen: isComposeOpen => set({ isComposeOpen })
}))
