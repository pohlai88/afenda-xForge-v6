'use client'

// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type {
  Attachment,
  ChatTab,
  ChatUser,
  Conversation,
  Message,
  MessageType,
  OwnProfileUpdate
} from '@/types/apps/chat-types'

// Data Imports
import { db } from '@/fake-db/apps/chat'

/**
 * ! If you're using a database, you can uncomment the line below and use the server action to fetch the data
 * ! import { getChatData } from '@/app/server/actions'
 */

const DELIVERY_DELAY_MS = 800
const TYPING_START_DELAY_MS = 1500
const AUTO_REPLY_DELAY_MS = 3000

type ChatStoreData = {
  currentUser: ChatUser
  contacts: ChatUser[]
  conversations: Conversation[]
  activeConversationId: string | null
  searchQuery: string
  activeTab: ChatTab
  profileSheetUserId: string | null
  replyToMessageId: string | null
  isTyping: boolean
}

type ChatStoreActions = {
  initialize: (options?: { currentUser?: ChatUser; contacts?: ChatUser[]; conversations?: Conversation[] }) => void
  sendMessage: (
    conversationId: string,
    content: string,
    type?: MessageType,
    replyToId?: string,
    attachments?: Attachment[]
  ) => void
  addAutoReply: (conversationId: string, content: string) => void
  clearChat: (conversationId: string) => void
  deleteContact: (contactId: string) => void
  togglePinConversation: (id: string) => void
  toggleMuteConversation: (id: string) => void
  toggleFavouriteConversation: (id: string) => void
  toggleBlockContact: (contactId: string) => void
  markConversationAsRead: (id: string) => void
  setActiveConversationId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setActiveTab: (tab: ChatTab) => void
  setProfileSheetUserId: (userId: string | null) => void
  setReplyToMessageId: (messageId: string | null) => void
  setIsTyping: (isTyping: boolean) => void
  updateOwnProfile: (updates: OwnProfileUpdate) => void
}

export type ChatStore = ChatStoreData & ChatStoreActions

const getAutoReplySenderId = (conversation: Conversation, currentUserId: string): string => {
  if (conversation.type === 'direct' && conversation.contactId) {
    return conversation.contactId
  }

  const memberId = conversation.memberIds?.find(id => id !== currentUserId)

  return memberId ?? currentUserId
}

type ChatSetFn = (partial: Partial<ChatStore> | ((state: ChatStore) => Partial<ChatStore>)) => void
type ChatGetFn = () => ChatStore

function scheduleMessageDelivery(conversationId: string, messageId: string, set: ChatSetFn): void {
  setTimeout(() => {
    set(state => ({
      conversations: state.conversations.map(conversation =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: conversation.messages.map(message =>
                message.id === messageId ? { ...message, status: 'delivered' } : message
              )
            }
          : conversation
      )
    }))
  }, DELIVERY_DELAY_MS)
}

function scheduleAutoReply(conversationId: string, get: ChatGetFn): void {
  setTimeout(() => {
    get().setIsTyping(true)
  }, TYPING_START_DELAY_MS)

  setTimeout(() => {
    const state = get()
    const conversation = state.conversations.find(item => item.id === conversationId)

    if (!conversation || conversation.autoReplies.length === 0) {
      state.setIsTyping(false)

      return
    }

    const randomReply = conversation.autoReplies[Math.floor(Math.random() * conversation.autoReplies.length)]

    state.setIsTyping(false)
    state.addAutoReply(conversationId, randomReply)
  }, AUTO_REPLY_DELAY_MS)
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentUser: db.currentUser,
  contacts: db.contacts,
  conversations: db.conversations,
  activeConversationId: null,
  searchQuery: '',
  activeTab: 'all',
  profileSheetUserId: null,
  replyToMessageId: null,
  isTyping: false,

  initialize: ({ currentUser, contacts, conversations } = {}) => {
    const updates: Partial<ChatStoreData> = {}

    if (currentUser && currentUser !== get().currentUser) {
      updates.currentUser = currentUser
    }

    if (contacts && contacts !== get().contacts) {
      updates.contacts = contacts
    }

    if (conversations && conversations !== get().conversations) {
      updates.conversations = conversations
    }

    if (Object.keys(updates).length > 0) {
      set(updates)
    }
  },

  sendMessage: (conversationId, content, type = 'text', replyToId, attachments) => {
    const trimmedContent = content.trim()

    if (!trimmedContent && !attachments?.length) {
      return
    }

    const messageId = Date.now().toString()
    const { currentUser } = get()

    const newMessage: Message = {
      id: messageId,
      senderId: currentUser.id,
      content: trimmedContent,
      type,
      timestamp: new Date().toISOString(),
      status: 'sent',
      replyToId,
      attachments
    }

    set(state => ({
      conversations: state.conversations.map(conversation =>
        conversation.id === conversationId
          ? { ...conversation, messages: [...conversation.messages, newMessage], unreadCount: 0 }
          : conversation
      ),
      replyToMessageId: null
    }))

    scheduleMessageDelivery(conversationId, messageId, set)
    scheduleAutoReply(conversationId, get)
  },

  addAutoReply: (conversationId, content) => {
    const { currentUser } = get()
    const conversation = get().conversations.find(item => item.id === conversationId)

    if (!conversation) {
      return
    }

    const senderId = getAutoReplySenderId(conversation, currentUser.id)

    const newMessage: Message = {
      id: `${Date.now()}-reply`,
      senderId,
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
      status: 'read'
    }

    set(state => ({
      conversations: state.conversations.map(item =>
        item.id === conversationId
          ? {
              ...item,
              messages: [...item.messages, newMessage],
              unreadCount: item.id === state.activeConversationId ? 0 : item.unreadCount + 1
            }
          : item
      )
    }))
  },

  clearChat: conversationId =>
    set(state => ({
      conversations: state.conversations.map(conversation =>
        conversation.id === conversationId ? { ...conversation, messages: [], unreadCount: 0 } : conversation
      )
    })),

  deleteContact: contactId =>
    set(state => ({
      contacts: state.contacts.filter(contact => contact.id !== contactId),
      conversations: state.conversations.filter(
        conversation => !(conversation.type === 'direct' && conversation.contactId === contactId)
      )
    })),

  togglePinConversation: id =>
    set(state => ({
      conversations: state.conversations.map(conversation =>
        conversation.id === id ? { ...conversation, isPinned: !conversation.isPinned } : conversation
      )
    })),

  toggleMuteConversation: id =>
    set(state => ({
      conversations: state.conversations.map(conversation =>
        conversation.id === id ? { ...conversation, isMuted: !conversation.isMuted } : conversation
      )
    })),

  toggleFavouriteConversation: id =>
    set(state => ({
      conversations: state.conversations.map(conversation =>
        conversation.id === id ? { ...conversation, isFavourite: !conversation.isFavourite } : conversation
      )
    })),

  toggleBlockContact: contactId =>
    set(state => ({
      contacts: state.contacts.map(contact =>
        contact.id === contactId ? { ...contact, isBlocked: !contact.isBlocked } : contact
      )
    })),

  markConversationAsRead: id =>
    set(state => ({
      conversations: state.conversations.map(conversation =>
        conversation.id === id ? { ...conversation, unreadCount: 0 } : conversation
      )
    })),

  setActiveConversationId: activeConversationId => set({ activeConversationId }),
  setSearchQuery: searchQuery => set({ searchQuery }),
  setActiveTab: activeTab => set({ activeTab }),
  setProfileSheetUserId: profileSheetUserId => set({ profileSheetUserId }),
  setReplyToMessageId: replyToMessageId => set({ replyToMessageId }),
  setIsTyping: isTyping => set({ isTyping }),

  updateOwnProfile: updates =>
    set(state => ({
      currentUser: {
        ...state.currentUser,
        ...updates
      }
    }))
}))
