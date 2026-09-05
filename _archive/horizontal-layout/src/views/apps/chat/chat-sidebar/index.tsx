'use client'

// Third-party Imports
import { SearchIcon } from 'lucide-react'

// Type Imports
import type { ChatTab, ChatTabCounts, ChatUser, Conversation } from '@/types/apps/chat-types'

// Component Imports
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ChatList from './chat-list'
import ChatSidebarHeader from './chat-sidebar-header'

export type ChatSidebarProps = {
  currentUser: ChatUser
  pinnedConversations: Conversation[]
  unpinnedConversations: Conversation[]
  tabCounts: ChatTabCounts
  contacts: ChatUser[]
  activeConversationId: string | null
  searchQuery: string
  activeTab: ChatTab
  onSearchQueryChange: (query: string) => void
  onActiveTabChange: (tab: ChatTab) => void
  onSelectConversation: (id: string) => void
  onOpenOwnProfile: () => void
}

const TAB_ITEMS: { value: ChatTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'groups', label: 'Groups' },
  { value: 'favourites', label: 'Favourites' }
]

const ChatSidebar = (props: ChatSidebarProps) => {
  // Props
  const {
    currentUser,
    pinnedConversations,
    unpinnedConversations,
    tabCounts,
    contacts,
    activeConversationId,
    searchQuery,
    activeTab,
    onSearchQueryChange,
    onActiveTabChange,
    onSelectConversation,
    onOpenOwnProfile
  } = props

  return (
    <div className='flex h-full flex-col gap-3 py-3'>
      <div className='px-3'>
        <ChatSidebarHeader currentUser={currentUser} contacts={contacts} onOpenOwnProfile={onOpenOwnProfile} />
      </div>

      <Separator />

      <div className='px-3'>
        <InputGroup className='h-9'>
          <InputGroupAddon>
            <SearchIcon className='size-4' />
          </InputGroupAddon>
          <InputGroupInput
            placeholder='Search conversations...'
            value={searchQuery}
            onChange={event => onSearchQueryChange(event.target.value)}
          />
        </InputGroup>
      </div>

      <Tabs value={activeTab} onValueChange={value => onActiveTabChange(value as ChatTab)}>
        <TabsList variant='line' className='w-full border-b **:data-[slot=tabs-trigger]:border-x-0'>
          {TAB_ITEMS.map(tab => {
            const count = tabCounts[tab.value]

            return (
              <TabsTrigger key={tab.value} value={tab.value} className='gap-1 text-xs font-normal'>
                {tab.label}
                {count > 0 && <span className='text-muted-foreground text-xs'>({count})</span>}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      <div className='min-h-0 flex-1 overflow-hidden'>
        <ChatList
          pinnedConversations={pinnedConversations}
          unpinnedConversations={unpinnedConversations}
          contacts={contacts}
          currentUser={currentUser}
          activeConversationId={activeConversationId}
          activeTab={activeTab}
          onSelectConversation={onSelectConversation}
        />
      </div>
    </div>
  )
}

export default ChatSidebar
