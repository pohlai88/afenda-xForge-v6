// Third-party Imports
import { ChevronDownIcon, MessageSquareIcon } from 'lucide-react'

// Type Imports
import type { ChatTab, ChatUser, Conversation } from '@/types/apps/chat-types'

// Component Imports
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import ChatListItem from './chat-list-item'

export type ChatListProps = {
  pinnedConversations: Conversation[]
  unpinnedConversations: Conversation[]
  contacts: ChatUser[]
  currentUser: ChatUser
  activeConversationId: string | null
  activeTab: ChatTab
  onSelectConversation: (id: string) => void
}

const SECTION_LABELS: Record<ChatTab, string> = {
  all: 'Recent',
  unread: 'Unread',
  groups: 'Groups',
  favourites: 'Favourites'
}

const ChatList = (props: ChatListProps) => {
  // Props
  const {
    pinnedConversations,
    unpinnedConversations,
    contacts,
    currentUser,
    activeConversationId,
    activeTab,
    onSelectConversation
  } = props

  // Vars
  const sectionLabel = SECTION_LABELS[activeTab]
  const isEmpty = pinnedConversations.length === 0 && unpinnedConversations.length === 0

  const resolveContact = (conversation: Conversation) => {
    if (conversation.type === 'direct' && conversation.contactId) {
      return contacts.find(contact => contact.id === conversation.contactId)
    }

    return undefined
  }

  if (isEmpty) {
    return (
      <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-10 text-center'>
        <MessageSquareIcon className='text-muted-foreground/40 size-9' />
        <p className='text-foreground text-sm font-medium'>No conversations</p>
      </div>
    )
  }

  const renderSection = (title: string, items: Conversation[]) => (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className='text-muted-foreground hover:text-foreground flex w-full items-center justify-between gap-1 px-3 pb-2 text-xs font-medium [&[data-panel-open]>svg]:rotate-180'>
        {title}
        <ChevronDownIcon className='size-3 transition-transform' />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='flex flex-col gap-1 px-2'>
          {items.map(conversation => (
            <ChatListItem
              key={conversation.id}
              conversation={conversation}
              contact={resolveContact(conversation)}
              currentUser={currentUser}
              isActive={activeConversationId === conversation.id}
              onSelect={onSelectConversation}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )

  return (
    <ScrollArea className='h-full min-h-0 [&_[data-orientation=vertical][data-slot=scroll-area-scrollbar]]:w-1.5'>
      <div className='flex flex-col gap-3'>
        {pinnedConversations.length > 0 && renderSection('Pinned', pinnedConversations)}
        {unpinnedConversations.length > 0 && renderSection(sectionLabel, unpinnedConversations)}
      </div>
    </ScrollArea>
  )
}

export default ChatList
