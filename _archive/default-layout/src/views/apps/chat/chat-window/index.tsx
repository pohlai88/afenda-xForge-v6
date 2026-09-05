'use client'

// Third-party Imports
import { MessageSquareIcon } from 'lucide-react'

// Type Imports
import type { Attachment, ChatUser, Conversation, Message, MessageType } from '@/types/apps/chat-types'

// Component Imports
import ChatInput from '@/views/apps/chat/chat-input'
import ChatMessages from './chat-messages'
import ChatWindowHeader from './chat-window-header'

export type ChatWindowProps = {
  currentUser: ChatUser
  conversation: Conversation | null
  activeDirectContact: ChatUser | null
  contacts: ChatUser[]
  replyToMessage: Message | null
  isTyping: boolean
  typingContact: ChatUser | null
  onSendMessage: (content: string, type?: MessageType, attachments?: Attachment[]) => void
  onSetReplyTo: (messageId: string) => void
  onClearReplyTo: () => void
  onQuickReply: (text: string) => void
  onPinConversation: (id: string) => void
  onMuteConversation: (id: string) => void
  onFavouriteConversation: (id: string) => void
  onClearChat: (conversationId: string) => void
  onOpenProfile: (userId: string) => void
  onBlockContact: (contactId: string) => void
  onDeleteContact: (contactId: string) => void
  onBack?: () => void
}

const ChatWindow = (props: ChatWindowProps) => {
  // Props
  const {
    currentUser,
    conversation,
    activeDirectContact,
    contacts,
    replyToMessage,
    isTyping,
    typingContact,
    onSendMessage,
    onSetReplyTo,
    onClearReplyTo,
    onQuickReply,
    onPinConversation,
    onMuteConversation,
    onFavouriteConversation,
    onClearChat,
    onOpenProfile,
    onBlockContact,
    onDeleteContact,
    onBack
  } = props

  if (!conversation) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-3'>
        <MessageSquareIcon className='text-muted-foreground/30 size-12' />
        <p className='text-muted-foreground text-sm font-medium'>Select a conversation</p>
        <p className='text-muted-foreground/70 text-xs'>Choose from your existing conversations</p>
      </div>
    )
  }

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <ChatWindowHeader
        activeContact={activeDirectContact}
        activeConversation={conversation}
        onBack={onBack}
        onOpenProfile={onOpenProfile}
        onMuteConversation={onMuteConversation}
        onPinConversation={onPinConversation}
        onFavouriteConversation={onFavouriteConversation}
        onClearChat={onClearChat}
        onBlockContact={onBlockContact}
        onDeleteContact={onDeleteContact}
      />

      <ChatMessages
        messages={conversation.messages}
        currentUserId={currentUser.id}
        contacts={contacts}
        currentUser={currentUser}
        isTyping={isTyping}
        typingContact={typingContact ?? undefined}
        isGroupChat={conversation.type === 'group'}
        onReplyToMessage={onSetReplyTo}
      />

      <ChatInput
        activeConversation={conversation}
        replyToMessage={replyToMessage}
        onSendMessage={onSendMessage}
        onClearReplyTo={onClearReplyTo}
        onQuickReply={onQuickReply}
      />
    </div>
  )
}

export default ChatWindow
