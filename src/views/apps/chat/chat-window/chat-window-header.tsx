'use client'

// Third-party Imports
import { ChevronLeftIcon, MoreVerticalIcon, PhoneIcon, VideoIcon } from 'lucide-react'

// Type Imports
import type { ChatUser, ChatUserStatus, Conversation } from '@/types/apps/chat-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Config Imports
import { getInitialsFromName } from '@/configs/mailConfig'

// Util Imports
import { cn } from '@/lib/utils'

export type ChatWindowHeaderProps = {
  activeContact: ChatUser | null
  activeConversation: Conversation
  onBack?: () => void
  onOpenProfile: (userId: string) => void
  onMuteConversation: (id: string) => void
  onPinConversation: (id: string) => void
  onFavouriteConversation: (id: string) => void
  onClearChat: (conversationId: string) => void
  onBlockContact: (contactId: string) => void
  onDeleteContact: (contactId: string) => void
}

const STATUS_DOT_CLASSES: Record<ChatUserStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-muted-foreground'
}

const ChatWindowHeader = (props: ChatWindowHeaderProps) => {
  // Props
  const {
    activeContact,
    activeConversation,
    onBack,
    onOpenProfile,
    onMuteConversation,
    onPinConversation,
    onFavouriteConversation,
    onClearChat,
    onBlockContact,
    onDeleteContact
  } = props

  // Vars
  const isDirect = activeConversation.type === 'direct'
  const displayName = isDirect ? (activeContact?.name ?? 'Unknown') : (activeConversation.groupName ?? 'Group')
  const displayAvatar = isDirect ? activeContact?.avatar : activeConversation.groupAvatar
  const displayStatus = isDirect ? (activeContact?.status ?? 'offline') : 'online'

  const subtitle = isDirect ? displayStatus : `${activeConversation.memberIds?.length ?? 0} members`

  const contactId = activeConversation.contactId

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-4 px-2 pt-3'>
        <div className='flex min-w-0 items-center gap-3'>
          {onBack && (
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              className='md:hidden'
              aria-label='Back to conversations'
              onClick={onBack}
            >
              <ChevronLeftIcon className='size-4' />
            </Button>
          )}

          <button
            type='button'
            onClick={() => {
              if (isDirect && contactId) {
                onOpenProfile(contactId)
              }
            }}
            disabled={!isDirect || !contactId}
            className={cn(
              'ring-offset-background relative shrink-0 rounded-full transition-opacity',
              isDirect && contactId && 'hover:opacity-80'
            )}
            title={isDirect && contactId ? 'View profile' : undefined}
          >
            <Avatar>
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback>{getInitialsFromName(displayName)}</AvatarFallback>
            </Avatar>
            {isDirect && (
              <span
                className={cn(
                  'ring-background absolute right-0 bottom-0 size-2.5 rounded-full ring-2',
                  STATUS_DOT_CLASSES[displayStatus]
                )}
              />
            )}
          </button>

          <div className='min-w-0'>
            <p className='truncate text-sm font-medium'>{displayName}</p>
            <p className='text-muted-foreground truncate text-xs leading-3'>{subtitle}</p>
          </div>
        </div>

        <div className='flex items-center gap-1'>
          <Tooltip>
            <TooltipTrigger render={<Button variant='ghost' size='icon-sm' aria-label='Call' />}>
              <PhoneIcon className='size-4' />
            </TooltipTrigger>
            <TooltipContent>Call</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<Button variant='ghost' size='icon-sm' aria-label='Video call' />}>
              <VideoIcon className='size-4' />
            </TooltipTrigger>
            <TooltipContent>Video call</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='ghost' size='icon-sm' aria-label='More actions' />}>
              <MoreVerticalIcon className='size-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              {isDirect && contactId && (
                <DropdownMenuItem onClick={() => onOpenProfile(contactId)}>View profile</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onMuteConversation(activeConversation.id)}>
                {activeConversation.isMuted ? 'Unmute' : 'Mute notifications'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onPinConversation(activeConversation.id)}>
                {activeConversation.isPinned ? 'Unpin' : 'Pin to top'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFavouriteConversation(activeConversation.id)}>
                {activeConversation.isFavourite ? 'Remove favourite' : 'Add to favourites'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onClearChat(activeConversation.id)}>Clear chat</DropdownMenuItem>
              {isDirect && contactId && (
                <>
                  <DropdownMenuItem variant='destructive' onClick={() => onBlockContact(contactId)}>
                    Block contact
                  </DropdownMenuItem>
                  <DropdownMenuItem variant='destructive' onClick={() => onDeleteContact(contactId)}>
                    Delete contact
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />
    </div>
  )
}

export default ChatWindowHeader
