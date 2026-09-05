/**
 * ! The server actions below are used to fetch the static data from the fake-db. If you're using an ORM
 * ! (Object-Relational Mapping) or a database, you can swap the code below with your own database queries.
 */
'use server'

// Data Imports
import { db as calendarDb } from '@/fake-db/apps/calendar'
import { initialColumns, teamMembers } from '@/fake-db/apps/kanban'
import { db as mailDb } from '@/fake-db/apps/mail'
import { db as faqDb } from '@/fake-db/pages/faq'
import { db as pricingDb } from '@/fake-db/pages/pricing'
import { db as userSettingsDb } from '@/fake-db/pages/user-settings'
import { db as userProfileDb } from '@/fake-db/pages/user-profile'

// Calendar App Actions
export const getCalendarData = async () => {
  return calendarDb
}

// Kanban App Actions
export const getKanbanData = async () => {
  return { columns: initialColumns, teamMembers: teamMembers }
}

// Mail App Actions
export const getMailData = async () => {
  return mailDb
}

// User Settings Actions
export const getMembersData = async () => ({
  members: userSettingsDb.members,
  pending: userSettingsDb.pending
})

export const getSessionsData = async () => userSettingsDb.sessions

export const getIntegrationsData = async () => userSettingsDb.integrations

// User Profile Actions
export const getProfileData = async () => userProfileDb

// Pricing Actions
export const getPricingData = async () => {
  return pricingDb
}

// FAQ Actions
export const getFaqData = async () => {
  return faqDb
}
