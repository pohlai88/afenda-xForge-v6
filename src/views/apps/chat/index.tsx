'use client'

// React Imports
import { type CSSProperties, useState } from 'react'

// Component Imports
import ChatSidebar from './chat-sidebar'
import ChatWindow from './chat-window'
import ProfileSheet from './dialogs/profile-sheet'

// Hook Imports
import { useChatApp } from '@/hooks/use-chat-app'
import { useIsMobile } from '@/hooks/use-mobile'

// Util Imports
import { cn } from '@/lib/utils'

const ChatApp = () => {
  // States
  const [showThread, setShowThread] = useState(false)

  // Hooks
  const isMobile = useIsMobile()

  const {
    currentUser,
    contacts,
    activeConversationId,
    activeConversation,
    pinnedConversations,
    unpinnedConversations,
    tabCounts,
    replyToMessage,
    searchQuery,
    activeTab,
    profileSheetUser,
    profileSheetUserId,
    profileConversation,
    activeDirectContact,
    typingContact,
    isTyping,
    handleSearchQueryChange,
    handleActiveTabChange,
    handleSelectConversation,
    handleSendMessage,
    handleSetReplyTo,
    handleClearReplyTo,
    handlePinConversation,
    handleMuteConversation,
    handleFavouriteConversation,
    handleBlockContact,
    handleClearChat,
    handleDeleteContact,
    handleOpenProfile,
    handleCloseProfile,
    handleUpdateOwnProfile,
    handleQuickReply
  } = useChatApp()

  // Vars
  const showProfile = Boolean(profileSheetUser)
  const isOwnProfile = profileSheetUserId === currentUser.id

  const profileSheetProps = {
    user: profileSheetUser,
    open: showProfile,
    onClose: handleCloseProfile,
    isOwnProfile,
    contactConversation: profileConversation,
    onMuteConversation: handleMuteConversation,
    onPinConversation: handlePinConversation,
    onFavouriteConversation: handleFavouriteConversation,
    onClearChat: handleClearChat,
    onBlockContact: handleBlockContact,
    onDeleteContact: handleDeleteContact,
    onUpdateOwnProfile: handleUpdateOwnProfile
  }

  const handleConversationSelect = (id: string) => {
    handleSelectConversation(id)
    setShowThread(true)
  }

  const handleBackToList = () => {
    setShowThread(false)
  }

  return (
    <>
      <div className='flex h-[calc(100dvh-12rem)] flex-col lg:h-[calc(100dvh-11rem)] lg:min-h-130'>
        <div
          className='bg-background grid h-full min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden rounded-lg border transition-[grid-template-columns] duration-300 ease-out *:min-h-0 *:min-w-0 md:grid-cols-[19rem_minmax(0,1fr)] md:*:first:border-r lg:grid-cols-[22.5rem_minmax(0,1fr)_var(--profile-width)]'
          onClick={showProfile && !isMobile ? handleCloseProfile : undefined}
          style={
            {
              '--profile-width': showProfile && !isMobile ? '20rem' : '0rem'
            } as CSSProperties
          }
        >
          <div
            className={cn(
              'bg-card transition-transform duration-300 ease-out will-change-transform max-md:col-start-1 max-md:row-start-1',
              showThread && 'max-md:pointer-events-none max-md:-translate-x-full'
            )}
          >
            <ChatSidebar
              currentUser={currentUser}
              pinnedConversations={pinnedConversations}
              unpinnedConversations={unpinnedConversations}
              tabCounts={tabCounts}
              contacts={contacts}
              activeConversationId={activeConversationId}
              searchQuery={searchQuery}
              activeTab={activeTab}
              onSearchQueryChange={handleSearchQueryChange}
              onActiveTabChange={handleActiveTabChange}
              onSelectConversation={handleConversationSelect}
              onOpenOwnProfile={() => handleOpenProfile(currentUser.id)}
            />
          </div>

          <div
            className={cn(
              'bg-background flex min-h-0 flex-col transition-transform duration-300 ease-out will-change-transform max-md:col-start-1 max-md:row-start-1',
              showThread ? 'max-md:translate-x-0' : 'max-md:pointer-events-none max-md:translate-x-full'
            )}
          >
            <ChatWindow
              currentUser={currentUser}
              conversation={activeConversation}
              activeDirectContact={activeDirectContact}
              contacts={contacts}
              replyToMessage={replyToMessage}
              isTyping={isTyping}
              typingContact={typingContact}
              onSendMessage={handleSendMessage}
              onSetReplyTo={handleSetReplyTo}
              onClearReplyTo={handleClearReplyTo}
              onQuickReply={handleQuickReply}
              onPinConversation={handlePinConversation}
              onMuteConversation={handleMuteConversation}
              onFavouriteConversation={handleFavouriteConversation}
              onClearChat={handleClearChat}
              onOpenProfile={handleOpenProfile}
              onBlockContact={handleBlockContact}
              onDeleteContact={handleDeleteContact}
              onBack={isMobile ? handleBackToList : undefined}
            />
          </div>

          <div
            aria-hidden={!showProfile}
            onClick={e => e.stopPropagation()}
            className={cn(
              'hidden overflow-hidden border-l transition-colors duration-300 lg:block',
              !showProfile && 'pointer-events-none border-l-transparent'
            )}
          >
            <div
              className={cn(
                'h-full w-80 transition-[opacity,transform] duration-300 ease-out',
                showProfile ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
              )}
            >
              {profileSheetUser && <ProfileSheet {...profileSheetProps} variant='panel' />}
            </div>
          </div>
        </div>
      </div>

      {isMobile && <ProfileSheet {...profileSheetProps} />}
    </>
  )
}

export default ChatApp
