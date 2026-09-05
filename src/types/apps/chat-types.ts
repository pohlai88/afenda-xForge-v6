export type ChatUserStatus = 'online' | 'away' | 'busy' | 'offline'

export type ChatSocialPlatform = 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'website'

export type ChatSocialLink = {
  platform: ChatSocialPlatform
  url: string
}

export type MessageType = 'text' | 'image' | 'file'

export type MessageStatus = 'sent' | 'delivered' | 'read'

export type ConversationType = 'direct' | 'group'

export type ChatTab = 'all' | 'unread' | 'groups' | 'favourites'

export type ChatUser = {
  id: string
  name: string
  avatar?: string
  role?: string
  status: ChatUserStatus
  about?: string
  email?: string
  phone?: string
  company?: string
  country?: string
  website?: string
  timezone?: string
  location?: string
  availability?: string
  tags?: string[]
  socialLinks?: ChatSocialLink[]
  isBlocked?: boolean
}

export type OwnProfileUpdate = Partial<Omit<ChatUser, 'id' | 'isBlocked'>>

export type Attachment = {
  id: string
  name: string
  size: string
  type: 'image' | 'file'
  url?: string
}

export type Message = {
  id: string
  senderId: string
  content: string
  type: MessageType
  timestamp: string
  status: MessageStatus
  replyToId?: string
  attachments?: Attachment[]
}

export type Conversation = {
  id: string
  type: ConversationType
  contactId?: string
  groupName?: string
  groupAvatar?: string
  memberIds?: string[]
  messages: Message[]
  isPinned: boolean
  isMuted: boolean
  isFavourite: boolean
  unreadCount: number
  suggestions: string[]
  autoReplies: string[]
}

export type ChatData = {
  currentUser: ChatUser
  contacts: ChatUser[]
  conversations: Conversation[]
}

export type ChatTabCounts = {
  all: number
  unread: number
  groups: number
  favourites: number
}

export type ComposerMode = 'reply' | 'note'

export type PendingAttachment = {
  id: string
  file: File
  previewUrl: string
  type: 'image' | 'file'
}

export type OwnProfileFormState = {
  name: string
  role: string
  avatar: string
  status: ChatUserStatus
  about: string
  email: string
  phone: string
  company: string
  country: string
  website: string
  timezone: string
  location: string
  availability: string
}
