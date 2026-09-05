'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { UserPlusIcon } from 'lucide-react'

// Type Imports
import type { ChatUser, ChatUserStatus } from '@/types/apps/chat-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import InviteDialog from '@/views/apps/chat/dialogs/invite-dialog'

// Config Imports
import { getInitialsFromName } from '@/configs/mailConfig'

// Util Imports
import { cn } from '@/lib/utils'

export type ChatSidebarHeaderProps = {
  currentUser: ChatUser
  contacts: ChatUser[]
  onOpenOwnProfile: () => void
}

const STATUS_DOT_CLASSES: Record<ChatUserStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-muted-foreground'
}

const ChatSidebarHeader = (props: ChatSidebarHeaderProps) => {
  // Props
  const { currentUser, contacts, onOpenOwnProfile } = props

  // States
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  return (
    <>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <button
            type='button'
            onClick={onOpenOwnProfile}
            className='ring-offset-background relative shrink-0 rounded-full transition-opacity hover:opacity-80'
            title='My profile'
          >
            <Avatar className='size-8'>
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback className='text-xs'>{getInitialsFromName(currentUser.name)}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'ring-background absolute right-0 bottom-0 size-2.5 rounded-full ring-2',
                STATUS_DOT_CLASSES[currentUser.status]
              )}
            />
          </button>

          <h2 className='truncate text-lg font-semibold'>Chats</h2>
        </div>

        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Invite to chat'
          onClick={() => setIsInviteDialogOpen(true)}
        >
          <UserPlusIcon className='size-4' />
        </Button>
      </div>

      <InviteDialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} contacts={contacts} />
    </>
  )
}

export default ChatSidebarHeader
