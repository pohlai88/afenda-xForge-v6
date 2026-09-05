'use client'

// React Imports
import { useRef } from 'react'

// Third-party Imports
import { format } from 'date-fns'
import { CheckIcon, CheckCheckIcon, FileIcon } from 'lucide-react'

// Type Imports
import type { Message } from '@/types/apps/chat-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import MessageContent from '@/views/apps/chat/chat-window/message-content'

// Config Imports
import { getInitialsFromName } from '@/configs/mailConfig'

// Util Imports
import { cn } from '@/lib/utils'
import { getMessagePreview } from '@/utils/chat-utils'

export type ChatMessageProps = {
  message: Message
  isFromMe: boolean
  senderAvatar?: string
  senderName: string
  allMessages: Message[]
  referencedSenderName?: string
  showSenderName?: boolean
  showAvatar?: boolean
  isGroupedWithPrevious?: boolean
  onReply?: (messageId: string) => void
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return timestamp
  }

  return format(date, 'h:mm a')
}

const ChatMessage = (props: ChatMessageProps) => {
  // Props
  const {
    message,
    isFromMe,
    senderAvatar,
    senderName,
    allMessages,
    referencedSenderName,
    showSenderName = false,
    showAvatar = true,
    isGroupedWithPrevious = false,
    onReply
  } = props

  // Refs
  const lastTapRef = useRef(0)

  // Vars
  const referencedMessage = message.replyToId ? allMessages.find(item => item.id === message.replyToId) : undefined
  const imageAttachments = message.attachments?.filter(attachment => attachment.type === 'image') ?? []
  const fileAttachments = message.attachments?.filter(attachment => attachment.type === 'file') ?? []
  const hasImageAttachments = imageAttachments.length > 0

  return (
    <div
      className={cn(
        'flex items-end gap-2 px-2',
        isFromMe && 'flex-row-reverse',
        isGroupedWithPrevious ? 'mt-1' : 'mt-4 first:mt-0'
      )}
    >
      {showAvatar ? (
        <Avatar className='size-8 shrink-0'>
          <AvatarImage src={senderAvatar} alt={senderName} />
          <AvatarFallback
            className={cn('text-xs', isFromMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}
          >
            {getInitialsFromName(senderName)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className='size-8 shrink-0' aria-hidden />
      )}

      <div className={cn('flex max-w-sm flex-col gap-1', isFromMe && 'items-end')}>
        {showSenderName && !isFromMe && <p className='text-muted-foreground px-1 text-xs font-medium'>{senderName}</p>}

        <div
          role={onReply ? 'button' : undefined}
          tabIndex={onReply ? 0 : undefined}
          onDoubleClick={() => onReply?.(message.id)}
          onTouchEnd={event => {
            if (!onReply) return

            const now = Date.now()

            if (now - lastTapRef.current < 300) {
              event.preventDefault()
              onReply(message.id)
              lastTapRef.current = 0
            } else {
              lastTapRef.current = now
            }
          }}
          onKeyDown={event => {
            if (onReply && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault()
              onReply(message.id)
            }
          }}
          className={cn(
            'flex w-full flex-col overflow-hidden rounded-xl text-sm',
            hasImageAttachments ? 'gap-0' : 'gap-2 px-3 py-2',
            isFromMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
            onReply && 'cursor-pointer'
          )}
        >
          {referencedMessage && (
            <div
              className={cn(
                'rounded-lg border-l-2 px-2.5 py-1.5 text-xs',
                hasImageAttachments ? 'mx-3 mt-2' : 'mb-0.5',
                isFromMe
                  ? 'border-primary-foreground/50 bg-primary-foreground/15 text-primary-foreground'
                  : 'border-primary/70 bg-background text-foreground'
              )}
            >
              <p className={cn('font-semibold', isFromMe ? 'text-primary-foreground' : 'text-primary')}>
                {referencedSenderName ?? 'Unknown'}
              </p>
              <p className='opacity-80'>{getMessagePreview(referencedMessage)}</p>
            </div>
          )}

          {imageAttachments.map(attachment => (
            <img
              key={attachment.id}
              src={attachment.url}
              alt={attachment.name}
              className='max-h-56 w-full object-cover'
            />
          ))}

          {(fileAttachments.length > 0 || message.content) && (
            <div className={cn('flex flex-col gap-2', hasImageAttachments && 'px-3 py-2')}>
              {fileAttachments.map(attachment => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  download={attachment.name}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
                    isFromMe
                      ? 'border-primary-foreground/20 bg-primary-foreground/10 hover:bg-primary-foreground/15'
                      : 'border-border bg-background hover:bg-background/80'
                  )}
                >
                  <FileIcon className='size-4 shrink-0' />
                  <div className='min-w-0'>
                    <p className='truncate text-xs font-medium'>{attachment.name}</p>
                    <p className='text-[10px] opacity-70'>{attachment.size}</p>
                  </div>
                </a>
              ))}

              {message.content && (
                <p className='space-x-1 leading-relaxed'>
                  <MessageContent content={message.content} isFromMe={isFromMe} />
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px]',
                      isFromMe ? 'text-primary-foreground/75 justify-end' : 'text-muted-foreground/75'
                    )}
                  >
                    <span>{formatTimestamp(message.timestamp)}</span>
                    {isFromMe &&
                      (message.status === 'read' ? (
                        <CheckCheckIcon className='size-3' />
                      ) : message.status === 'delivered' ? (
                        <CheckCheckIcon className='size-3 opacity-70' />
                      ) : (
                        <CheckIcon className='size-3 opacity-70' />
                      ))}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
