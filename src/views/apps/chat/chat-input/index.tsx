'use client'

// React Imports
import { useCallback, useEffect, useRef, useState } from 'react'

// Third-party Imports
import { toast } from 'sonner'

// Type Imports
import type {
  Attachment,
  ComposerMode,
  Conversation,
  Message,
  MessageType,
  PendingAttachment
} from '@/types/apps/chat-types'

// Component Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ComposerBody from './composer-body'
import ReplyBanner from './reply-banner'

// Util Imports
import {
  applyBoldFormat,
  applyLinkFormat,
  buildAttachmentFromFile,
  fileToDataUrl,
  formatFileSize,
  getMessageTypeFromAttachments,
  insertAtCursor,
  revokeAttachmentUrls
} from './composer-utils'

export type ChatInputProps = {
  activeConversation: Conversation
  replyToMessage: Message | null
  onSendMessage: (content: string, type?: MessageType, attachments?: Attachment[]) => void
  onClearReplyTo: () => void
  onQuickReply?: (text: string) => void
}

const ChatInput = (props: ChatInputProps) => {
  // Props
  const { activeConversation, replyToMessage, onSendMessage, onClearReplyTo, onQuickReply } = props

  // States
  const [inputValue, setInputValue] = useState('')
  const [composerMode, setComposerMode] = useState<ComposerMode>('reply')
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([])

  // Vars
  const canSend = inputValue.trim().length > 0 || pendingAttachments.length > 0

  const getTextareaSelection = () => {
    const textarea = textareaRef.current

    if (!textarea) {
      return null
    }

    return {
      textarea,
      inputValue,
      setInputValue
    }
  }

  const clearPendingAttachments = useCallback(() => {
    revokeAttachmentUrls(pendingAttachmentsRef.current)
    pendingAttachmentsRef.current = []
    setPendingAttachments([])
  }, [])

  const handleAddFiles = (files: File[]) => {
    const nextAttachments = files.map(buildAttachmentFromFile)

    pendingAttachmentsRef.current = [...pendingAttachmentsRef.current, ...nextAttachments]
    setPendingAttachments(pendingAttachmentsRef.current)
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    const removed = pendingAttachmentsRef.current.find(attachment => attachment.id === attachmentId)

    if (removed) {
      URL.revokeObjectURL(removed.previewUrl)
    }

    pendingAttachmentsRef.current = pendingAttachmentsRef.current.filter(attachment => attachment.id !== attachmentId)
    setPendingAttachments(pendingAttachmentsRef.current)
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleInsertEmoji = (emoji: string) => {
    const selection = getTextareaSelection()

    if (selection) {
      insertAtCursor(selection, emoji)
    } else {
      setInputValue(current => `${current}${emoji}`)
    }

    setIsEmojiOpen(false)
  }

  const handleInsertLink = () => {
    const selection = getTextareaSelection()

    if (!selection) {
      return
    }

    const urlInput = window.prompt('Enter link URL')

    if (!urlInput?.trim()) {
      return
    }

    applyLinkFormat(selection, urlInput)
  }

  const handleFormatBold = () => {
    const selection = getTextareaSelection()

    if (!selection) {
      return
    }

    applyBoldFormat(selection)
  }

  const handleSend = async () => {
    if (composerMode === 'note') {
      toast.info('Internal notes are saved locally in this demo and are not sent to the thread.')
      setInputValue('')
      clearPendingAttachments()

      return
    }

    if (!canSend) {
      return
    }

    const attachments: Attachment[] = await Promise.all(
      pendingAttachments.map(async attachment => ({
        id: attachment.id,
        name: attachment.file.name,
        size: formatFileSize(attachment.file.size),
        type: attachment.type,
        url: await fileToDataUrl(attachment.file)
      }))
    )

    const messageType = getMessageTypeFromAttachments(pendingAttachments)

    revokeAttachmentUrls(pendingAttachmentsRef.current)
    pendingAttachmentsRef.current = []
    setPendingAttachments([])

    onSendMessage(inputValue.trim(), messageType, attachments.length > 0 ? attachments : undefined)
    setInputValue('')
  }

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments
  }, [pendingAttachments])

  useEffect(() => {
    return () => {
      revokeAttachmentUrls(pendingAttachmentsRef.current)
    }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      setInputValue('')
      clearPendingAttachments()
      setComposerMode('reply')
    }, 0)
  }, [activeConversation.id, clearPendingAttachments])

  const composerBodyProps = {
    inputValue,
    pendingAttachments,
    canSend,
    isEmojiOpen,
    textareaRef,
    onInputChange: setInputValue,
    onSend: handleSend,
    onRemoveAttachment: handleRemoveAttachment,
    onEmojiOpenChange: setIsEmojiOpen,
    onInsertEmoji: handleInsertEmoji,
    onInsertLink: handleInsertLink,
    onFormatBold: handleFormatBold,
    onAttachClick: handleAttachClick
  }

  return (
    <div className='flex flex-col gap-2 px-2 pb-3'>
      {activeConversation.suggestions.length > 0 && !inputValue && pendingAttachments.length === 0 && (
        <div className='flex flex-wrap gap-1.5 px-1'>
          {activeConversation.suggestions.map(suggestion => (
            <button
              key={suggestion}
              type='button'
              onClick={() => (onQuickReply ? onQuickReply(suggestion) : setInputValue(suggestion))}
              className='border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground rounded-full border px-3 py-1 text-xs transition-colors'
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <Tabs
        value={composerMode}
        onValueChange={value => setComposerMode(value as ComposerMode)}
        className='border-border rounded-md border'
      >
        <TabsList
          variant='line'
          className='w-full justify-start gap-2 border-b px-3 group-data-horizontal/tabs:h-10 **:data-[slot=tabs-trigger]:border-x-0 **:data-[slot=tabs-trigger]:px-6'
        >
          <TabsTrigger value='reply' className='flex-none px-1'>
            Reply
          </TabsTrigger>
          <TabsTrigger value='note' className='flex-none px-1'>
            Internal note
          </TabsTrigger>
        </TabsList>

        <TabsContent value='reply' className='m-0'>
          {replyToMessage && composerMode === 'reply' && (
            <div className='px-3 pt-3'>
              <ReplyBanner replyToMessage={replyToMessage} onClearReplyTo={onClearReplyTo} />
            </div>
          )}
          <ComposerBody placeholder='Type your message...' {...composerBodyProps} />
        </TabsContent>

        <TabsContent value='note' className='m-0'>
          <ComposerBody placeholder='Write an internal note...' {...composerBodyProps} />
        </TabsContent>
      </Tabs>

      <input
        ref={fileInputRef}
        type='file'
        multiple
        accept='image/*,.pdf,.doc,.docx,.txt,.zip'
        className='sr-only'
        tabIndex={-1}
        aria-hidden
        onChange={event => {
          const files = Array.from(event.target.files ?? [])

          if (files.length > 0) {
            handleAddFiles(files)
          }

          event.target.value = ''
        }}
      />
    </div>
  )
}

export default ChatInput
