'use client'

// Type imports
import type { Contact } from '@/types/apps/contact-types'
import { CONTACT_LABEL_STYLES } from '@/types/apps/contact-types'

// Component imports
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import ContactActionsDropdown from '@/views/apps/contact/contact-actions-dropdown'
import ContactAvatar from '@/views/apps/contact/contact-avatar'

// Store imports
import { useContactStore } from '@/store/use-contact-store'

// Utils imports
import { cn } from '@/lib/utils'

type GroupedContacts = [string, Contact[]][]

type ListViewProps = {
  groupedContacts: GroupedContacts
  className?: string
}

const ListView = ({ groupedContacts, className }: ListViewProps) => {
  const selectedContactPhone = useContactStore(state => state.selectedContactPhone)
  const selectContact = useContactStore(state => state.selectContact)
  const isSelectionMode = useContactStore(state => state.isSelectionMode)
  const checkedContactPhones = useContactStore(state => state.checkedContactPhones)
  const toggleCheckContact = useContactStore(state => state.toggleCheckContact)

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {groupedContacts.map(([letter, letterContacts]) => (
        <div key={letter} className='flex flex-col gap-1.5'>
          <div className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-sm font-medium'>{letter}</span>
            <Separator />
          </div>
          <div className='flex flex-col gap-3'>
            {letterContacts.map(contact => (
              <div
                key={contact.phone}
                className={cn(
                  'hover:bg-accent flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors',
                  selectedContactPhone === contact.phone && 'bg-accent'
                )}
                onClick={() => (isSelectionMode ? toggleCheckContact(contact.phone) : selectContact(contact.phone))}
              >
                <div className='flex items-center gap-2'>
                  {/* Base UI renders the hidden input as a SIBLING of the checkbox and re-dispatches the click from
                      there — only a wrapper around both can stop it reaching the row's onClick. */}
                  {isSelectionMode && (
                    <span className='flex shrink-0 items-center' onClick={event => event.stopPropagation()}>
                      <Checkbox
                        checked={checkedContactPhones.includes(contact.phone)}
                        onCheckedChange={() => toggleCheckContact(contact.phone)}
                        aria-label={`Select ${contact.firstName} ${contact.lastName}`}
                      />
                    </span>
                  )}
                  <ContactAvatar contact={contact} />
                  <div className='flex max-w-50 flex-col truncate'>
                    <span className='font-medium'>
                      {contact.firstName} {contact.lastName}
                    </span>
                    <span className='truncate text-sm text-gray-500'>{contact.email}</span>
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  {/* sm–md: hidden | md–lg: 1 badge | lg+: 2 badges */}
                  {contact.labels.slice(0, 1).map(label => (
                    <Badge key={label} variant='outline' className='hidden capitalize md:flex lg:hidden'>
                      <span className={cn('size-1.5 shrink-0 rounded-full', CONTACT_LABEL_STYLES[label])} />
                      {label}
                    </Badge>
                  ))}
                  {contact.labels.slice(0, 2).map(label => (
                    <Badge key={label} variant='outline' className='hidden capitalize lg:flex'>
                      <span className={cn('size-1.5 shrink-0 rounded-full', CONTACT_LABEL_STYLES[label])} />
                      {label}
                    </Badge>
                  ))}
                  {/* overflow badge: md–lg counts from 1, lg+ counts from 2 */}
                  {contact.labels.length > 1 && (
                    <Badge variant='outline' className='hidden md:flex lg:hidden'>
                      +{contact.labels.length - 1}
                    </Badge>
                  )}
                  {contact.labels.length > 2 && (
                    <Badge variant='outline' className='hidden lg:flex'>
                      +{contact.labels.length - 2}
                    </Badge>
                  )}
                  {!isSelectionMode && (
                    <ContactActionsDropdown contact={contact} triggerClassName='hover:bg-primary/10! rounded-full' />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ListView
