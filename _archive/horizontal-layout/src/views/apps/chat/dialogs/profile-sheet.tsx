'use client'

// Type Imports
import type { ChatUser, Conversation, OwnProfileUpdate } from '@/types/apps/chat-types'

// Component Imports
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import ProfileContent from './profile-content'

export type ProfileSheetProps = {
  user: ChatUser | null
  open: boolean
  onClose: () => void
  isOwnProfile: boolean
  contactConversation: Conversation | null
  onMuteConversation: (id: string) => void
  onPinConversation: (id: string) => void
  onFavouriteConversation: (id: string) => void
  onClearChat: (conversationId: string) => void
  onBlockContact: (contactId: string) => void
  onDeleteContact: (contactId: string) => void
  onUpdateOwnProfile: (updates: OwnProfileUpdate) => void
  variant?: 'sheet' | 'panel'
}

const ProfileSheet = (props: ProfileSheetProps) => {
  // Props
  const { user, open, onClose, variant = 'sheet', ...contentProps } = props

  if (!user) {
    return null
  }

  if (variant === 'panel') {
    return <ProfileContent user={user} onClose={onClose} {...contentProps} />
  }

  return (
    <Sheet open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
      <SheetContent side='right' className='w-80 p-0' showCloseButton={false}>
        <SheetTitle className='sr-only'>{contentProps.isOwnProfile ? 'My profile' : `${user.name} profile`}</SheetTitle>
        <SheetDescription className='sr-only'>View profile details and manage conversation options</SheetDescription>
        <ProfileContent user={user} onClose={onClose} {...contentProps} />
      </SheetContent>
    </Sheet>
  )
}

export default ProfileSheet
