'use client'

// React Imports
import { useEffect, useMemo, useRef } from 'react'

// Third-party Imports
import { format, isToday, isYesterday } from 'date-fns'

// Type Imports
import type { ChatUser, Message } from '@/types/apps/chat-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import ChatMessage from './chat-message'

// Config Imports
import { getInitialsFromName } from '@/configs/mailConfig'

// Util Imports
import { isSameMessageSender } from '@/utils/chat-utils'

export type ChatMessagesProps = {
  messages: Message[]
  currentUserId: string
  contacts: ChatUser[]
  currentUser: ChatUser
  isTyping: boolean
  typingContact?: ChatUser
  isGroupChat?: boolean
  onReplyToMessage?: (messageId: string) => void
}

const getDateLabel = (timestamp: string) => {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return timestamp
  }

  if (isToday(date)) {
    return 'Today'
  }

  if (isYesterday(date)) {
    return 'Yesterday'
  }

  return format(date, 'MMM d')
}

const ChatMessages = (props: ChatMessagesProps) => {
  // Props
  const {
    messages,
    currentUserId,
    contacts,
    currentUser,
    isTyping,
    typingContact,
    isGroupChat = false,
    onReplyToMessage
  } = props

  // Refs
  const bottomRef = useRef<HTMLDivElement>(null)

  const getSenderInfo = (message: Message) => {
    if (message.senderId === currentUserId) {
      return {
        name: currentUser.name,
        avatar: currentUser.avatar
      }
    }

    const contact = contacts.find(item => item.id === message.senderId)

    return {
      name: contact?.name ?? 'Unknown',
      avatar: contact?.avatar
    }
  }

  const getReferencedSenderName = (referencedMessage: Message) => {
    if (referencedMessage.senderId === currentUserId) {
      return currentUser.name
    }

    return contacts.find(item => item.id === referencedMessage.senderId)?.name ?? 'Unknown'
  }

  // Hooks
  const messageGroups = useMemo(() => {
    const groups: { dateKey: string; label: string; messages: Message[] }[] = []

    for (const message of messages) {
      const messageDate = new Date(message.timestamp)
      const dateKey = Number.isNaN(messageDate.getTime()) ? message.timestamp : format(messageDate, 'yyyy-MM-dd')
      const existingGroup = groups.find(group => group.dateKey === dateKey)

      if (existingGroup) {
        existingGroup.messages.push(message)
      } else {
        groups.push({
          dateKey,
          label: getDateLabel(message.timestamp),
          messages: [message]
        })
      }
    }

    return groups
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <ScrollArea className='min-h-0 flex-1 [&_[data-orientation=vertical][data-slot=scroll-area-scrollbar]]:w-1.5'>
      <div className='flex flex-col gap-6 px-2 py-8'>
        {messageGroups.map(group => (
          <div key={group.dateKey} className='flex flex-col'>
            <div className='text-center'>
              <Badge variant='ghost' className='text-muted-foreground font-normal hover:bg-transparent'>
                {group.label}
              </Badge>
            </div>

            {group.messages.map((message, messageIndex) => {
              const sender = getSenderInfo(message)
              const previousMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : undefined
              const isGroupedWithPrevious = isSameMessageSender(previousMessage, message)

              const referencedMessage = message.replyToId
                ? messages.find(item => item.id === message.replyToId)
                : undefined

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isFromMe={message.senderId === currentUserId}
                  senderAvatar={sender.avatar}
                  senderName={sender.name}
                  allMessages={messages}
                  referencedSenderName={referencedMessage ? getReferencedSenderName(referencedMessage) : undefined}
                  showSenderName={isGroupChat && !isGroupedWithPrevious}
                  showAvatar={!isGroupedWithPrevious}
                  isGroupedWithPrevious={isGroupedWithPrevious}
                  onReply={onReplyToMessage}
                />
              )
            })}
          </div>
        ))}

        {isTyping && typingContact && (
          <div className='flex items-end gap-2 px-2'>
            <Avatar className='size-8 shrink-0'>
              <AvatarImage src={typingContact.avatar} alt={typingContact.name} />
              <AvatarFallback className='text-xs'>{getInitialsFromName(typingContact.name)}</AvatarFallback>
            </Avatar>
            <div className='bg-muted rounded-xl px-4 py-3'>
              <div className='flex items-center gap-1'>
                <span className='bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:0ms]' />
                <span className='bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:150ms]' />
                <span className='bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:300ms]' />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}

export default ChatMessages
