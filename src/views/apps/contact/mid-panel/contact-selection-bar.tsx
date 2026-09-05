'use client'

// React imports
import { useState } from 'react'

// Third-party imports
import { TrashIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

// Component imports
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

// Store imports
import { useContactStore } from '@/store/use-contact-store'

type ContactSelectionBarProps = {
  visiblePhones: number[]
}

const pluralizeContacts = (count: number) => `${count} contact${count === 1 ? '' : 's'}`

const ContactSelectionBar = ({ visiblePhones }: ContactSelectionBarProps) => {
  const checkedContactPhones = useContactStore(state => state.checkedContactPhones)
  const toggleCheckAll = useContactStore(state => state.toggleCheckAll)
  const exitSelectionMode = useContactStore(state => state.exitSelectionMode)
  const deleteContacts = useContactStore(state => state.deleteContacts)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const checkedCount = checkedContactPhones.length
  const hasChecked = checkedCount > 0
  const isAllChecked = visiblePhones.length > 0 && visiblePhones.every(phone => checkedContactPhones.includes(phone))
  const isIndeterminate = visiblePhones.some(phone => checkedContactPhones.includes(phone)) && !isAllChecked

  const handleConfirmDelete = () => {
    const message = `${pluralizeContacts(checkedCount)} deleted`

    setIsDeleteDialogOpen(false)
    deleteContacts(checkedContactPhones)
    exitSelectionMode()
    toast(message, { position: 'bottom-right' })
  }

  return (
    <>
      <div className='flex flex-wrap items-center gap-2 px-4'>
        <Checkbox
          checked={isAllChecked}
          indeterminate={isIndeterminate}
          onCheckedChange={() => toggleCheckAll(visiblePhones)}
          aria-label={isAllChecked ? 'Deselect all contacts' : 'Select all contacts'}
        />
        {hasChecked ? (
          <span className='text-sm font-medium'>{checkedCount} selected</span>
        ) : (
          <span className='text-muted-foreground text-sm'>Select all</span>
        )}

        <div className='ml-auto flex items-center gap-2'>
          <Button variant='destructive' size='sm' disabled={!hasChecked} onClick={() => setIsDeleteDialogOpen(true)}>
            <TrashIcon />
            Delete
          </Button>

          <Button variant='ghost' size='icon-sm' aria-label='Exit selection' onClick={exitSelectionMode}>
            <XIcon />
          </Button>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {pluralizeContacts(checkedCount)}?</DialogTitle>
            <DialogDescription>
              This will permanently remove {pluralizeContacts(checkedCount)} from your list. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant='outline' />}>Cancel</DialogClose>
            <Button variant='destructive' onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ContactSelectionBar
