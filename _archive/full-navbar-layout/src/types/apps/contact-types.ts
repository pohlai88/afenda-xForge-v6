export type Label = 'lead' | 'partner' | 'customer' | 'vip' | 'freelancer' | 'supplier'

export const CONTACT_LABELS: Label[] = ['lead', 'partner', 'customer', 'vip', 'freelancer', 'supplier']

export const CONTACT_LABEL_STYLES: Record<Label, string> = {
  lead: 'bg-blue-500',
  partner: 'bg-purple-500',
  customer: 'bg-emerald-500',
  vip: 'bg-amber-500',
  freelancer: 'bg-orange-500',
  supplier: 'bg-pink-500'
}

export type ContactNavItem = 'all' | 'favourites' | 'spam' | 'blocked'

export type ContactView = 'grid' | 'list'

export type CreateContactInput = {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  notes: string
  labels: Label[]
  image?: string
}

export interface Contact {
  firstName: string
  lastName: string
  image?: string
  email?: string
  phone: number
  city?: string
  notes?: string
  addedDate: Date
  labels: Label[]
  status?: 'active' | 'inactive' | 'prospect'
  isFavourite: boolean
  isRecent: boolean
  isBlocked: boolean
  isSpam: boolean
}
