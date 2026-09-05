// Third-party imports
import { create } from 'zustand'

// Type imports
import type { Contact, ContactNavItem, ContactView, CreateContactInput, Label } from '@/types/apps/contact-types'

// Utils imports
import { parsePhoneNumber } from '@/utils/contact-utils'

// Data imports
import { db } from '@/fake-db/apps/contact'

/**
 * ! If you're using a database, you can uncomment the line below and use the server action to fetch the data
 * ! import { getContactData } from '@/app/server/actions'
 */

type ContactStatusFilter = 'all' | Contact['status']

const removePhonesFromChecked = (checkedContactPhones: number[], phones: number[]): number[] => {
  const phoneSet = new Set(phones)

  return checkedContactPhones.filter(phone => !phoneSet.has(phone))
}

interface ContactState {
  contacts: Contact[]
  activeNav: ContactNavItem
  activeLabel: Label | null
  statusFilter: ContactStatusFilter
  view: ContactView
  selectedContactPhone: number | null
  isCreatingContact: boolean
  isEditingContact: boolean
  isSelectionMode: boolean
  checkedContactPhones: number[]
  setActiveNav: (nav: ContactNavItem) => void
  setActiveLabel: (label: Label | null) => void
  setStatusFilter: (filter: ContactStatusFilter) => void
  setView: (view: ContactView) => void
  selectContact: (phone: number) => void
  clearSelectedContact: () => void
  openCreateContact: () => void
  closeCreateContact: () => void
  openEditContact: (phone: number) => void
  closeEditContact: () => void
  addContact: (input: CreateContactInput) => number | null
  updateContact: (phone: number, input: CreateContactInput) => number | null
  toggleFavourite: (phone: number) => void
  toggleSpam: (phone: number) => void
  toggleBlocked: (phone: number) => void
  deleteContact: (phone: number) => void
  enterSelectionMode: () => void
  exitSelectionMode: () => void
  toggleCheckContact: (phone: number) => void
  toggleCheckAll: (phones: number[]) => void
  clearCheckedContacts: () => void
  deleteContacts: (phones: number[]) => void
}

export const useContactStore = create<ContactState>()((set, get) => ({
  contacts: db,
  activeNav: 'all',
  activeLabel: null,
  statusFilter: 'all',
  view: 'list',
  selectedContactPhone: null,
  isCreatingContact: false,
  isEditingContact: false,
  isSelectionMode: false,
  checkedContactPhones: [],

  setActiveNav: nav => set({ activeNav: nav, activeLabel: null, statusFilter: 'all', checkedContactPhones: [] }),

  setActiveLabel: label =>
    set({
      activeLabel: label,
      statusFilter: 'all',
      selectedContactPhone: null,
      isCreatingContact: false,
      isEditingContact: false,
      checkedContactPhones: []
    }),

  setStatusFilter: filter => set({ statusFilter: filter, checkedContactPhones: [] }),

  setView: view => set({ view }),

  /**
   * ! Selection mode and the detail panel are mutually exclusive — opening one always closes the other.
   * ! Without this, entering selection mode would strand a detail panel that row clicks can no longer navigate.
   */
  selectContact: phone =>
    set({
      selectedContactPhone: phone,
      isCreatingContact: false,
      isEditingContact: false,
      isSelectionMode: false,
      checkedContactPhones: []
    }),

  clearSelectedContact: () => set({ selectedContactPhone: null, isCreatingContact: false, isEditingContact: false }),

  openCreateContact: () =>
    set({
      isCreatingContact: true,
      selectedContactPhone: null,
      isEditingContact: false,
      isSelectionMode: false,
      checkedContactPhones: []
    }),

  closeCreateContact: () => set({ isCreatingContact: false }),

  openEditContact: phone =>
    set({
      selectedContactPhone: phone,
      isCreatingContact: false,
      isEditingContact: true,
      isSelectionMode: false,
      checkedContactPhones: []
    }),

  closeEditContact: () => set({ isEditingContact: false }),

  addContact: input => {
    const trimmedFirstName = input.firstName.trim()
    const trimmedLastName = input.lastName.trim()

    if (!trimmedFirstName || !trimmedLastName) return null

    const phone = parsePhoneNumber(input.phone)

    if (phone === null) return null

    const { contacts } = useContactStore.getState()

    if (contacts.some(contact => contact.phone === phone)) return null

    const newContact: Contact = {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: input.email.trim() || undefined,
      phone,
      city: input.city.trim() || undefined,
      notes: input.notes.trim() || undefined,
      image: input.image,
      addedDate: new Date(),
      labels: input.labels,
      status: 'active',
      isFavourite: false,
      isRecent: true,
      isBlocked: false,
      isSpam: false
    }

    set({
      contacts: [...contacts, newContact],
      isCreatingContact: false,
      selectedContactPhone: phone
    })

    return phone
  },

  updateContact: (originalPhone, input) => {
    const trimmedFirstName = input.firstName.trim()
    const trimmedLastName = input.lastName.trim()

    if (!trimmedFirstName || !trimmedLastName) return null

    const newPhone = parsePhoneNumber(input.phone)

    if (newPhone === null) return null

    const { contacts, checkedContactPhones } = useContactStore.getState()
    const contactIndex = contacts.findIndex(contact => contact.phone === originalPhone)

    if (contactIndex === -1) return null

    if (newPhone !== originalPhone && contacts.some(contact => contact.phone === newPhone)) return null

    const existingContact = contacts[contactIndex]

    const updatedContact: Contact = {
      ...existingContact,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: input.email.trim() || undefined,
      phone: newPhone,
      city: input.city.trim() || undefined,
      notes: input.notes.trim() || undefined,
      labels: input.labels,
      image: input.image
    }

    const newContacts = [...contacts]

    newContacts[contactIndex] = updatedContact

    set({
      contacts: newContacts,
      isEditingContact: false,
      selectedContactPhone: newPhone,

      // Phone is the primary key, so a phone edit has to carry the checked entry across with it
      checkedContactPhones:
        newPhone === originalPhone
          ? checkedContactPhones
          : checkedContactPhones.map(phone => (phone === originalPhone ? newPhone : phone))
    })

    return newPhone
  },

  toggleFavourite: phone =>
    set(state => ({
      contacts: state.contacts.map(contact =>
        contact.phone === phone && !contact.isBlocked && !contact.isSpam
          ? { ...contact, isFavourite: !contact.isFavourite }
          : contact
      )
    })),

  toggleSpam: phone =>
    set(state => ({
      contacts: state.contacts.map(contact => {
        if (contact.phone !== phone) return contact

        const isSpam = !contact.isSpam

        return {
          ...contact,
          isSpam,
          isFavourite: isSpam ? false : contact.isFavourite
        }
      })
    })),

  toggleBlocked: phone =>
    set(state => ({
      contacts: state.contacts.map(contact => {
        if (contact.phone !== phone) return contact

        const isBlocked = !contact.isBlocked

        return {
          ...contact,
          isBlocked,
          isFavourite: isBlocked ? false : contact.isFavourite,
          isSpam: isBlocked ? false : contact.isSpam
        }
      })
    })),

  deleteContact: phone =>
    set(state => {
      const isSelectedDeleted = state.selectedContactPhone === phone

      return {
        contacts: state.contacts.filter(contact => contact.phone !== phone),
        checkedContactPhones: removePhonesFromChecked(state.checkedContactPhones, [phone]),
        selectedContactPhone: isSelectedDeleted ? null : state.selectedContactPhone,
        isEditingContact: isSelectedDeleted ? false : state.isEditingContact
      }
    }),

  enterSelectionMode: () =>
    set({
      isSelectionMode: true,
      selectedContactPhone: null,
      isCreatingContact: false,
      isEditingContact: false
    }),

  exitSelectionMode: () => set({ isSelectionMode: false, checkedContactPhones: [] }),

  toggleCheckContact: phone =>
    set(state => ({
      checkedContactPhones: state.checkedContactPhones.includes(phone)
        ? state.checkedContactPhones.filter(checkedPhone => checkedPhone !== phone)
        : [...state.checkedContactPhones, phone]
    })),

  toggleCheckAll: phones => {
    const { checkedContactPhones } = get()
    const allChecked = phones.length > 0 && phones.every(phone => checkedContactPhones.includes(phone))

    if (allChecked) {
      set({ checkedContactPhones: removePhonesFromChecked(checkedContactPhones, phones) })

      return
    }

    set({ checkedContactPhones: [...new Set([...checkedContactPhones, ...phones])] })
  },

  // Returning the untouched state makes Zustand skip the notify, so calling this per keystroke is free
  clearCheckedContacts: () =>
    set(state => (state.checkedContactPhones.length === 0 ? state : { checkedContactPhones: [] })),

  deleteContacts: phones =>
    set(state => {
      const phoneSet = new Set(phones)
      const isSelectedDeleted = state.selectedContactPhone !== null && phoneSet.has(state.selectedContactPhone)

      return {
        contacts: state.contacts.filter(contact => !phoneSet.has(contact.phone)),
        checkedContactPhones: removePhonesFromChecked(state.checkedContactPhones, phones),
        selectedContactPhone: isSelectedDeleted ? null : state.selectedContactPhone,
        isEditingContact: isSelectedDeleted ? false : state.isEditingContact
      }
    })
}))
