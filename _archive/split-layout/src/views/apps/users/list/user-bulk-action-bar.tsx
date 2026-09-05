'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { Trash2Icon } from 'lucide-react'

// Type Imports
import type { UserStatus } from '@/types/apps/user-types'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STATUSES: UserStatus[] = ['Active', 'Pending', 'Suspended', 'Inactive']

export interface UserBulkActionBarProps {
  selectedCount: number
  onBulkDelete: () => void
  onBulkStatusChange: (status: UserStatus) => void
  onClearSelection: () => void
}

export function UserBulkActionBar({
  selectedCount,
  onBulkDelete,
  onBulkStatusChange,
  onClearSelection
}: UserBulkActionBarProps) {
  // States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleConfirmDelete = () => {
    onBulkDelete()
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <div className='flex flex-wrap items-center gap-3 border-t px-6 py-3'>
        <span className='text-sm font-medium'>
          {selectedCount} user{selectedCount === 1 ? '' : 's'} selected
        </span>

        <Button variant='destructive' size='sm' onClick={() => setIsDeleteDialogOpen(true)}>
          <Trash2Icon className='size-4' />
          Delete Selected
        </Button>

        <Select
          onValueChange={(value: string | null) => {
            if (value) {
              onBulkStatusChange(value as UserStatus)
            }
          }}
        >
          <SelectTrigger className='w-44' size='sm'>
            <SelectValue placeholder='Change Status' />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              {STATUSES.map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button variant='ghost' size='sm' onClick={onClearSelection}>
          Clear selection
        </Button>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected users?</DialogTitle>
            <DialogDescription>
              This will permanently remove {selectedCount} user{selectedCount === 1 ? '' : 's'}. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
