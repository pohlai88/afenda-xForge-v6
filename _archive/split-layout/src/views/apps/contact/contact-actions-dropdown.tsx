'use client'

// Third-party imports
import {
  BanIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  StarIcon,
  TrashIcon
} from 'lucide-react'

// Type imports
import type { Contact } from '@/types/apps/contact-types'

// Component imports
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Store imports
import { useContactStore } from '@/store/use-contact-store'

// Utils imports
import { cn } from '@/lib/utils'
import { getContactDropdownActions } from '@/utils/contact-utils'

type ContactActionsDropdownProps = {
  contact: Contact
  triggerClassName?: string
  triggerVariant?: 'ghost' | 'outline'
  onEdit?: () => void
  onAction?: () => void
}

const ContactActionsDropdown = ({
  contact,
  triggerClassName,
  triggerVariant = 'ghost',
  onEdit,
  onAction
}: ContactActionsDropdownProps) => {
  const openEditContact = useContactStore(state => state.openEditContact)
  const toggleFavourite = useContactStore(state => state.toggleFavourite)
  const toggleSpam = useContactStore(state => state.toggleSpam)
  const toggleBlocked = useContactStore(state => state.toggleBlocked)
  const deleteContact = useContactStore(state => state.deleteContact)

  const { showEditAction, showDeleteAction, showFavouriteAction, showSpamAction, showNotSpamAction, showBlockAction } =
    getContactDropdownActions(contact)

  const handleEdit = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    // Run after the parent row click from menu dismiss, which would reset isEditingContact.
    queueMicrotask(() => {
      openEditContact(contact.phone)
      onEdit?.()
    })
  }

  const runAction = (event: React.MouseEvent, action: () => void) => {
    event.preventDefault()
    event.stopPropagation()
    action()
    onAction?.()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={triggerVariant}
            size='icon-sm'
            className={triggerClassName}
            onClick={triggerVariant === 'ghost' ? event => event.stopPropagation() : undefined}
          />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {showEditAction && (
          <DropdownMenuItem onMouseDown={event => event.preventDefault()} onClick={handleEdit}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
        )}
        {showFavouriteAction && (
          <DropdownMenuItem
            onMouseDown={event => event.preventDefault()}
            onClick={event => runAction(event, () => toggleFavourite(contact.phone))}
          >
            <StarIcon className={cn(contact.isFavourite && 'fill-primary text-primary')} />
            {contact.isFavourite ? 'Unfavourite' : 'Favourite'}
          </DropdownMenuItem>
        )}
        {showSpamAction && (
          <DropdownMenuItem
            onMouseDown={event => event.preventDefault()}
            onClick={event => runAction(event, () => toggleSpam(contact.phone))}
          >
            <ShieldAlertIcon />
            Spam
          </DropdownMenuItem>
        )}
        {showNotSpamAction && (
          <DropdownMenuItem
            onMouseDown={event => event.preventDefault()}
            onClick={event => runAction(event, () => toggleSpam(contact.phone))}
          >
            <ShieldCheckIcon />
            Not spam
          </DropdownMenuItem>
        )}
        {showBlockAction && (
          <DropdownMenuItem
            onMouseDown={event => event.preventDefault()}
            onClick={event => runAction(event, () => toggleBlocked(contact.phone))}
          >
            <BanIcon />
            {contact.isBlocked ? 'Unblock' : 'Block'}
          </DropdownMenuItem>
        )}
        {showDeleteAction && (
          <DropdownMenuItem
            variant='destructive'
            onMouseDown={event => event.preventDefault()}
            onClick={event => runAction(event, () => deleteContact(contact.phone))}
          >
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ContactActionsDropdown
