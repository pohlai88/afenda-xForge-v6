'use client'

// Component imports
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import ContactActionsDropdown from '@/views/apps/contact/contact-actions-dropdown'
import ContactAvatar from '@/views/apps/contact/contact-avatar'

// Store imports
import { useContactStore } from '@/store/use-contact-store'

// Type imports
import type { Contact } from '@/types/apps/contact-types'
import { CONTACT_LABEL_STYLES } from '@/types/apps/contact-types'

// Utils imports
import { cn } from '@/lib/utils'

type GridViewProps = {
  contacts: Contact[]
}

const GridView = ({ contacts }: GridViewProps) => {
  const selectedContactPhone = useContactStore(state => state.selectedContactPhone)
  const selectContact = useContactStore(state => state.selectContact)
  const isSelectionMode = useContactStore(state => state.isSelectionMode)
  const checkedContactPhones = useContactStore(state => state.checkedContactPhones)
  const toggleCheckContact = useContactStore(state => state.toggleCheckContact)

  return (
    <div className='hidden sm:block'>
      <div className='grid grid-cols-2 gap-4'>
        {contacts.map(contact => (
          <div
            key={contact.phone}
            className={cn(
              'group hover:border-primary/50 relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
              selectedContactPhone === contact.phone && 'border-primary bg-accent/50 hover:border-primary'
            )}
            onClick={() => (isSelectionMode ? toggleCheckContact(contact.phone) : selectContact(contact.phone))}
          >
            {/* Base UI renders the hidden input as a SIBLING of the checkbox and re-dispatches the click from
                there — only a wrapper around both can stop it reaching the card's onClick. */}
            {isSelectionMode ? (
              <span className='absolute top-2 left-2 z-1 flex items-center' onClick={event => event.stopPropagation()}>
                <Checkbox
                  checked={checkedContactPhones.includes(contact.phone)}
                  onCheckedChange={() => toggleCheckContact(contact.phone)}
                  aria-label={`Select ${contact.firstName} ${contact.lastName}`}
                />
              </span>
            ) : (
              <ContactActionsDropdown
                contact={contact}
                triggerClassName='absolute top-2 right-2 hover:bg-primary/10! rounded-full'
              />
            )}
            <ContactAvatar contact={contact} />
            <div className='flex max-w-50 flex-col truncate'>
              <span className='self-center truncate font-medium'>
                {contact.firstName} {contact.lastName}
              </span>
              <span className='truncate text-sm text-gray-500'>{contact.email}</span>
            </div>
            <div className='flex flex-wrap gap-1'>
              {/* sm–md: 2 badges | md–lg: 1 badge | lg+: 2 badges */}
              {contact.labels.slice(0, 2).map(label => (
                <Badge key={label} variant='outline' className='flex capitalize md:hidden lg:flex'>
                  <span className={cn('size-1.5 shrink-0 rounded-full', CONTACT_LABEL_STYLES[label])} />
                  {label}
                </Badge>
              ))}
              {contact.labels.slice(0, 1).map(label => (
                <Badge key={label} variant='outline' className='hidden capitalize md:flex lg:hidden'>
                  <span className={cn('size-1.5 shrink-0 rounded-full', CONTACT_LABEL_STYLES[label])} />
                  {label}
                </Badge>
              ))}
              {/* overflow: sm–md counts from 2, md–lg counts from 1, lg+ counts from 2 */}
              {contact.labels.length > 2 && (
                <Badge variant='outline' className='flex md:hidden lg:flex'>
                  +{contact.labels.length - 2}
                </Badge>
              )}
              {contact.labels.length > 1 && (
                <Badge variant='outline' className='hidden md:flex lg:hidden'>
                  +{contact.labels.length - 1}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GridView
