'use client'

// React imports
import { useMemo } from 'react'

// Third-party imports
import { PlusIcon } from 'lucide-react'

// Component imports
import { Button } from '@/components/ui/button'
import ContactDetails from './contact-details'
import CreateContactForm from './create-contact-form'
import EditContactForm from './edit-contact-form'

// Store imports
import { useContactStore } from '@/store/use-contact-store'

// SVGs imports
import AddNewContactSVG from '@/assets/svg/apps/contact/add-new'

const RightPanel = () => {
  const contacts = useContactStore(state => state.contacts)
  const selectedContactPhone = useContactStore(state => state.selectedContactPhone)
  const isCreatingContact = useContactStore(state => state.isCreatingContact)
  const isEditingContact = useContactStore(state => state.isEditingContact)
  const openCreateContact = useContactStore(state => state.openCreateContact)

  const selectedContact = useMemo(
    () => contacts.find(contact => contact.phone === selectedContactPhone) ?? null,
    [contacts, selectedContactPhone]
  )

  if (isCreatingContact) {
    return <CreateContactForm />
  }

  if (isEditingContact && selectedContact) {
    return <EditContactForm contact={selectedContact} />
  }

  if (!selectedContact) {
    return (
      <div className='mx-auto flex h-full max-w-md flex-col items-center justify-center gap-10 p-4'>
        <div className='flex flex-col items-center gap-4'>
          <h2 className='text-2xl font-bold'>Welcome to the Contacts App</h2>
          <p className='text-muted-foreground text-center'>
            It&apos;s time to expand our contacts. Kickstart your contacts growth by adding a your next contact.
          </p>
          <Button onClick={openCreateContact}>
            <PlusIcon />
            New Contact
          </Button>
        </div>
        <AddNewContactSVG className='ml-12 size-70' />
      </div>
    )
  }

  return <ContactDetails contact={selectedContact} />
}

export default RightPanel
