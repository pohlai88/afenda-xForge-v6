import type { Contact, ContactNavItem, Label as ContactLabel } from '@/types/apps/contact-types'

export const PHONE_NUMBER_LENGTH = 10

export function sanitizePhoneInput(value: string) {
  return value.replace(/\D/g, '').slice(0, PHONE_NUMBER_LENGTH)
}

export function validatePhoneNumber(phone: string) {
  const digits = phone.trim()

  if (!digits) {
    return 'Phone number is required.'
  }

  if (!/^\d{10}$/.test(digits)) {
    return 'Phone number must be exactly 10 digits.'
  }

  return null
}

export function validateEmail(email: string) {
  const trimmed = email.trim()

  if (!trimmed) return null

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Please enter a valid email address.'
  }

  return null
}

export function parsePhoneNumber(phone: string) {
  const digits = sanitizePhoneInput(phone.trim())

  if (!/^\d{10}$/.test(digits)) return null

  return Number(digits)
}

export function getContactInitials(firstName: string, lastName: string) {
  const firstInitial = firstName.trim().charAt(0)
  const lastInitial = lastName.trim().charAt(0)

  if (!firstInitial && !lastInitial) return '?'

  return `${firstInitial}${lastInitial}`.toUpperCase()
}

export type ContactDropdownActions = {
  showEditAction: boolean
  showDeleteAction: boolean
  showFavouriteAction: boolean
  showSpamAction: boolean
  showNotSpamAction: boolean
  showBlockAction: boolean
}

export function getContactDropdownActions(
  contact: Pick<Contact, 'isBlocked' | 'isSpam' | 'isFavourite'>
): ContactDropdownActions {
  if (contact.isBlocked) {
    return {
      showEditAction: false,
      showDeleteAction: false,
      showFavouriteAction: false,
      showSpamAction: false,
      showNotSpamAction: false,
      showBlockAction: true
    }
  }

  if (contact.isSpam) {
    return {
      showEditAction: true,
      showDeleteAction: true,
      showFavouriteAction: false,
      showSpamAction: false,
      showNotSpamAction: true,
      showBlockAction: true
    }
  }

  if (contact.isFavourite) {
    return {
      showEditAction: true,
      showDeleteAction: true,
      showFavouriteAction: true,
      showSpamAction: false,
      showNotSpamAction: false,
      showBlockAction: true
    }
  }

  return {
    showEditAction: true,
    showDeleteAction: true,
    showFavouriteAction: true,
    showSpamAction: true,
    showNotSpamAction: false,
    showBlockAction: true
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)

        return
      }

      reject(new Error('Failed to convert file to data URL'))
    }

    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export type ContactSortOrder = 'asc' | 'desc'
export type ContactFilter = 'all' | Contact['status']

function getContactName(contact: Contact) {
  return `${contact.firstName} ${contact.lastName}`
}

function matchesNavFilter(contact: Contact, activeNav: ContactNavItem) {
  switch (activeNav) {
    case 'all':
      return !contact.isBlocked && !contact.isSpam
    case 'favourites':
      return contact.isFavourite && !contact.isBlocked && !contact.isSpam
    case 'spam':
      return contact.isSpam
    case 'blocked':
      return contact.isBlocked
  }
}

function matchesLabelFilter(contact: Contact, activeLabel: ContactLabel | null) {
  if (!activeLabel) return true

  return contact.labels.includes(activeLabel) && !contact.isBlocked && !contact.isSpam
}

function matchesStatusFilter(contact: Contact, filter: ContactFilter) {
  if (filter === 'all') return true

  return contact.status === filter
}

function matchesSearchQuery(contact: Contact, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) return true

  const searchableFields = [
    contact.firstName,
    contact.lastName,
    `${contact.firstName} ${contact.lastName}`,
    contact.email,
    String(contact.phone),
    ...contact.labels
  ]

  return searchableFields.some(field => field?.toLowerCase().includes(normalizedQuery))
}

export function sortContacts(contacts: Contact[], sortOrder: ContactSortOrder) {
  return [...contacts].sort((a, b) => {
    const comparison = getContactName(a).localeCompare(getContactName(b))

    return sortOrder === 'asc' ? comparison : -comparison
  })
}

export function getVisibleContacts(
  contacts: Contact[],
  activeNav: ContactNavItem,
  activeLabel: ContactLabel | null,
  statusFilter: ContactFilter,
  searchQuery: string
) {
  return contacts
    .filter(contact => (activeLabel ? matchesLabelFilter(contact, activeLabel) : matchesNavFilter(contact, activeNav)))
    .filter(contact => matchesStatusFilter(contact, statusFilter))
    .filter(contact => matchesSearchQuery(contact, searchQuery))
}

export function groupContactsByLetter(contacts: Contact[], sortOrder: ContactSortOrder) {
  const sortedContacts = sortContacts(contacts, sortOrder)

  const groups = new Map<string, Contact[]>()

  for (const contact of sortedContacts) {
    const letter = contact.firstName.charAt(0).toUpperCase()
    const letterContacts = groups.get(letter) ?? []

    groups.set(letter, [...letterContacts, contact])
  }

  return Array.from(groups.entries()).sort(([letterA], [letterB]) =>
    sortOrder === 'asc' ? letterA.localeCompare(letterB) : letterB.localeCompare(letterA)
  )
}
