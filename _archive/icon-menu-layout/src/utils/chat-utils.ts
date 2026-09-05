// Type Imports
import type { Message } from '@/types/apps/chat-types'

export const getMessagePreview = (message: Message) => {
  if (message.type === 'image') {
    return 'Photo'
  }

  if (message.type === 'file') {
    return message.attachments?.[0]?.name ?? 'File'
  }

  return message.content
}

export const isSameMessageSender = (previousMessage: Message | undefined, message: Message) => {
  return previousMessage?.senderId === message.senderId
}
