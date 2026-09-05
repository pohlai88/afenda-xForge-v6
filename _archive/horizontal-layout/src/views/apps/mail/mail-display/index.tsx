'use client'

// Type Imports
import type { Email, EmailLabel } from '@/types/apps/mail-types'

// Component Imports
import { MailDisplayContent } from './mail-display-content'

export interface MailDisplayProps {
  email: Email | null
  onToggleStar: (id: string) => void
  onMarkRead: (id: string, isRead: boolean) => void
  onArchive: (id: string) => void
  onMoveToTrash: (id: string) => void
  onMoveToSpam: (id: string) => void
  onMarkNotSpam: (id: string) => void
  onRestoreToInbox: (id: string) => void
  onPermanentDelete: (id: string) => void
  onSendDraft: (id: string, body?: string) => void
  onToggleLabel: (id: string, label: EmailLabel) => void
  onSendReply: (id: string, body: string) => void
}

export const MailDisplay = ({
  email,
  onToggleStar,
  onMarkRead,
  onArchive,
  onMoveToTrash,
  onMoveToSpam,
  onMarkNotSpam,
  onRestoreToInbox,
  onPermanentDelete,
  onSendDraft,
  onToggleLabel,
  onSendReply
}: MailDisplayProps) => {
  // Props

  if (!email) {
    return (
      <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-10 text-center'>
        <p className='text-foreground text-sm font-medium'>No message selected</p>
        <p className='text-xs'>Choose an email from the list to read it here.</p>
      </div>
    )
  }

  return (
    <MailDisplayContent
      key={email.id}
      email={email}
      onToggleStar={onToggleStar}
      onMarkRead={onMarkRead}
      onArchive={onArchive}
      onMoveToTrash={onMoveToTrash}
      onMoveToSpam={onMoveToSpam}
      onMarkNotSpam={onMarkNotSpam}
      onRestoreToInbox={onRestoreToInbox}
      onPermanentDelete={onPermanentDelete}
      onSendDraft={onSendDraft}
      onToggleLabel={onToggleLabel}
      onSendReply={onSendReply}
    />
  )
}

export default MailDisplay
