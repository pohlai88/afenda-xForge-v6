'use client'

// Third-party imports
import { CalendarIcon, MailIcon, MapPinIcon, MessageSquareIcon, PhoneIcon, XIcon } from 'lucide-react'

// Type imports
import type { Contact } from '@/types/apps/contact-types'

// Component imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import ContactActionsDropdown from '@/views/apps/contact/contact-actions-dropdown'
import ContactAvatar from '@/views/apps/contact/contact-avatar'

// Store imports
import { useContactStore } from '@/store/use-contact-store'

type ContactDetailsProps = {
  contact: Contact
}

const ContactDetails = ({ contact }: ContactDetailsProps) => {
  const clearSelectedContact = useContactStore(state => state.clearSelectedContact)

  return (
    <div className='flex h-full min-h-0 flex-col gap-4 pb-4'>
      <div className='relative flex h-60 items-center justify-center gap-2 p-4'>
        <img
          src='/images/contacts/contact-details-bg.webp'
          alt='Contact Details Background'
          className='absolute top-0 left-0 h-full w-full object-cover dark:invert'
        />
        <Button
          variant='outline'
          size='icon-xs'
          className='absolute top-4 left-4 z-1 rounded-full'
          onClick={clearSelectedContact}
        >
          <XIcon />
        </Button>
        <div className='flex items-center gap-2'>
          <ContactAvatar
            contact={contact}
            className='after:border-primary/20 size-25 [&>[data-slot=avatar-fallback]]:text-xl'
          />
          <div className='z-1 flex flex-col gap-0.5'>
            <h2 className='max-w-50 truncate text-lg font-bold'>
              {contact.firstName} {contact.lastName}
            </h2>
            <span className='text-muted-foreground max-w-50 truncate text-sm'>{contact.email}</span>
            <div className='flex items-center gap-2'>
              {!contact.isBlocked && (
                <Button variant='outline' size='icon-sm'>
                  <PhoneIcon />
                </Button>
              )}
              <Button variant='outline' size='icon-sm'>
                <MailIcon />
              </Button>
              {!contact.isBlocked && (
                <Button variant='outline' size='icon-sm'>
                  <MessageSquareIcon />
                </Button>
              )}
              <ContactActionsDropdown contact={contact} triggerVariant='outline' />
            </div>
          </div>
        </div>
      </div>
      <ScrollArea className='min-h-0 flex-1'>
        <div className='flex flex-col gap-4 px-4'>
          <div className='flex flex-col gap-3'>
            <h3 className='font-semibold'>Contact Info</h3>
            <div className='grid gap-3 lg:grid-cols-2'>
              <div className='text-muted-foreground bg-muted flex items-center gap-2 rounded-md p-3 text-sm'>
                <PhoneIcon className='size-4 shrink-0' />
                <span>{contact.phone}</span>
              </div>
              <div className='text-muted-foreground bg-muted flex items-center gap-2 truncate rounded-md p-3 text-sm'>
                <MailIcon className='size-4 shrink-0' />
                <span>{contact.email}</span>
              </div>
              <div className='text-muted-foreground bg-muted flex items-center gap-2 rounded-md p-3 text-sm'>
                <MapPinIcon className='size-4 shrink-0' />
                <span>{contact.city}</span>
              </div>
              <div className='text-muted-foreground bg-muted flex items-center gap-2 rounded-md p-3 text-sm'>
                <CalendarIcon className='size-4 shrink-0' />
                <span>
                  Added on{' '}
                  {contact.addedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          <Separator />
          <div className='flex flex-col gap-3'>
            <h3 className='font-semibold'>Note</h3>
            <div className='text-muted-foreground bg-muted flex items-center gap-2 rounded-md p-3 text-sm text-wrap'>
              <span>{contact.notes}</span>
            </div>
          </div>
          <Separator />
          <div className='flex flex-col gap-3'>
            <h3 className='font-semibold'>Labels</h3>
            <div className='flex items-center gap-2'>
              {contact.labels.map(label => (
                <Badge key={label} variant='outline' className='capitalize'>
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default ContactDetails
