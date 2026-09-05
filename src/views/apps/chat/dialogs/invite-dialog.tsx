'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// Third-party Imports
import { CheckIcon, CopyIcon, Link2Icon } from 'lucide-react'

// Type Imports
import type { ChatUser } from '@/types/apps/chat-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

// Config Imports
import { getInitialsFromName } from '@/configs/mailConfig'

export type InviteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: ChatUser[]
}

const SHARE_LINK = 'https://app.example.com/chat/invite'
const COPY_RESET_DELAY_MS = 2000

const InviteDialog = (props: InviteDialogProps) => {
  // Props
  const { open, onOpenChange, contacts } = props

  // States
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)

  // Hooks
  const filteredContacts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return contacts
    }

    return contacts.filter(contact => {
      const name = contact.name.toLowerCase()
      const email = contact.email?.toLowerCase() ?? ''

      return name.includes(normalizedQuery) || email.includes(normalizedQuery)
    })
  }, [contacts, searchQuery])

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), COPY_RESET_DELAY_MS)

    return () => clearTimeout(id)
  }, [copied])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearchQuery('')
      setCopied(false)
    }

    onOpenChange(nextOpen)
  }

  const handleInvite = () => {
    handleOpenChange(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(SHARE_LINK)
    setCopied(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='gap-4 sm:max-w-md' showCloseButton>
        <DialogHeader>
          <DialogTitle>Invite</DialogTitle>
        </DialogHeader>

        <div className='border-border mx-0 flex items-center gap-2 rounded-lg border px-3 py-1'>
          <span className='text-muted-foreground shrink-0 text-sm'>To:</span>
          <Input
            placeholder='Search people or emails...'
            className='flex-1 border-0 px-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent'
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
          <Button type='button' size='sm' disabled={!searchQuery.trim()} onClick={handleInvite}>
            Invite
          </Button>
        </div>

        <div>
          <p className='text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wider uppercase'>
            Suggested contacts
          </p>

          <div className='max-h-52 overflow-y-auto'>
            {filteredContacts.length === 0 ? (
              <p className='text-muted-foreground py-4 text-center text-sm'>No contacts found</p>
            ) : (
              <div className='flex flex-col gap-0.5'>
                {filteredContacts.map(contact => (
                  <button
                    key={contact.id}
                    type='button'
                    className='hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors'
                    onClick={() => {
                      setSearchQuery(contact.email ?? contact.name)
                    }}
                  >
                    <Avatar className='size-9 shrink-0'>
                      <AvatarImage src={contact.avatar} alt={contact.name} />
                      <AvatarFallback>{getInitialsFromName(contact.name)}</AvatarFallback>
                    </Avatar>
                    <div className='min-w-0'>
                      <p className='text-foreground text-sm font-medium'>{contact.name}</p>
                      {contact.email && <p className='text-muted-foreground text-xs'>{contact.email}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='border-border border-t pt-4'>
          <div className='border-border bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2'>
            <Link2Icon className='text-muted-foreground size-4 shrink-0' />
            <span className='text-muted-foreground flex-1 truncate text-xs'>{SHARE_LINK}</span>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={copied ? 'Copied' : 'Copy invite link'}
              onClick={handleCopy}
            >
              {copied ? <CheckIcon className='size-3.5' /> : <CopyIcon className='size-3.5' />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default InviteDialog
