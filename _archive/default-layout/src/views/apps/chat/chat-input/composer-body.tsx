// React Imports
import type React from 'react'

// Type Imports
import type { PendingAttachment } from '@/types/apps/chat-types'

// Component Imports
import { Textarea } from '@/components/ui/textarea'
import ComposerToolbar from './composer-toolbar'
import PendingAttachmentsPreview from './pending-attachments-preview'

export type ComposerBodyProps = {
  placeholder: string
  inputValue: string
  pendingAttachments: PendingAttachment[]
  canSend: boolean
  isEmojiOpen: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onInputChange: (value: string) => void
  onSend: () => void
  onRemoveAttachment: (attachmentId: string) => void
  onEmojiOpenChange: (open: boolean) => void
  onInsertEmoji: (emoji: string) => void
  onInsertLink: () => void
  onFormatBold: () => void
  onAttachClick: () => void
}

const ComposerBody = (props: ComposerBodyProps) => {
  // Props
  const {
    placeholder,
    inputValue,
    pendingAttachments,
    canSend,
    isEmojiOpen,
    textareaRef,
    onInputChange,
    onSend,
    onRemoveAttachment,
    onEmojiOpenChange,
    onInsertEmoji,
    onInsertLink,
    onFormatBold,
    onAttachClick
  } = props

  return (
    <div className='flex flex-col gap-3 px-3 pb-2'>
      <PendingAttachmentsPreview attachments={pendingAttachments} onRemove={onRemoveAttachment} />

      <Textarea
        ref={textareaRef}
        placeholder={placeholder}
        className='max-h-32 min-h-10 resize-none border-0 px-0 py-2 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent'
        value={inputValue}
        onChange={event => onInputChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            onSend()
          }
        }}
        rows={1}
      />

      <ComposerToolbar
        canSend={canSend}
        isEmojiOpen={isEmojiOpen}
        onEmojiOpenChange={onEmojiOpenChange}
        onInsertEmoji={onInsertEmoji}
        onFormatBold={onFormatBold}
        onInsertLink={onInsertLink}
        onAttachClick={onAttachClick}
        onSend={onSend}
      />
    </div>
  )
}

export default ComposerBody
