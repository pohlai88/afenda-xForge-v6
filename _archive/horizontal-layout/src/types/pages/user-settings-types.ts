export type UserRole = 'Admin' | 'Contributor' | 'Viewer' | 'Member' | 'No Access'

export type Member = {
  id: number
  name: string
  email: string
  avatar: string
  role: UserRole
}

export type PendingInvite = {
  id: string
  name: string
  email: string
  avatar: string
  role: UserRole
}

export type MembersData = {
  members: Member[]
  pending: PendingInvite[]
}

export type Session = {
  id: string
  date: string
  time: string
  ip: string
  browser: string
  isMobile?: boolean
  os: string
  location: string
}

export type IntegrationApp = {
  name: string
  description: string
  image: string
  bgColor: string
  link: string
}

export type IntegrationsData = {
  communication: IntegrationApp[]
  planning: IntegrationApp[]
  tools: IntegrationApp[]
}

export type UserSettingsData = {
  members: Member[]
  pending: PendingInvite[]
  sessions: Session[]
  integrations: IntegrationsData
}
