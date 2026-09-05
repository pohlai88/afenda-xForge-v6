// Type imports
import type { Contact } from '@/types/apps/contact-types'

// Component imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Utils imports
import { cn } from '@/lib/utils'
import { getContactInitials } from '@/utils/contact-utils'

type ContactAvatarProps = {
  contact: Pick<Contact, 'firstName' | 'lastName' | 'image'>
  className?: string
}

const ContactAvatar = ({ contact, className }: ContactAvatarProps) => {
  return (
    <Avatar className={cn('size-10 shrink-0', className)}>
      {contact.image && <AvatarImage src={contact.image} alt={`${contact.firstName} ${contact.lastName}`} />}
      <AvatarFallback>{getContactInitials(contact.firstName, contact.lastName)}</AvatarFallback>
    </Avatar>
  )
}

export default ContactAvatar
