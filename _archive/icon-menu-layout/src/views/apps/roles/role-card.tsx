'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { MoreVertical, PencilIcon, Trash2Icon } from 'lucide-react'

// Type Imports
import type { AppRoleWithUsers } from '@/types/apps/role-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

// -------------------------------------------------------------------------------------------------

interface RoleCardProps {
  role: AppRoleWithUsers
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const PERM_KEYS = [
  { label: 'Read', key: 'read' as const },
  { label: 'Write', key: 'write' as const },
  { label: 'Create', key: 'create' as const },
  { label: 'Delete', key: 'delete' as const }
]

export function RoleCard({ role, onEdit, onDelete }: RoleCardProps) {
  // States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Vars
  const total = role.permissions.length

  const permCounts = PERM_KEYS.map(({ label, key }) => ({
    label,
    count: role.permissions.filter(p => p[key]).length
  }))

  // Handlers
  const handleConfirmDelete = () => {
    onDelete(role.id)
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <Card>
        <CardContent className='flex flex-col gap-3'>
          <div className='flex justify-between gap-2'>
            <div className='min-w-0'>
              <h4 className='text-base leading-tight font-medium'>{role.name}</h4>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {role.users.length} {role.users.length === 1 ? 'user' : 'users'}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant='ghost' size='icon-sm' />}>
                <MoreVertical className='size-4' />
                <span className='sr-only'>More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onEdit(role.id)}>
                  <PencilIcon className='size-4' />
                  Edit Role
                </DropdownMenuItem>
                <DropdownMenuItem variant='destructive' onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2Icon className='size-4' />
                  Delete Role
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className='bg-muted/50 flex items-center justify-between rounded-md px-3 py-2'>
            {permCounts.map(({ label, count }) => (
              <div key={label} className='flex flex-col items-center gap-0.5'>
                <span className='text-foreground text-sm font-semibold'>{count}</span>
                <span className='text-muted-foreground text-[10px]'>{label}</span>
              </div>
            ))}
            <div className='bg-border h-6 w-px' />
            <div className='flex flex-col items-center gap-0.5'>
              <span className='text-foreground text-sm font-semibold'>{total}</span>
              <span className='text-muted-foreground text-[10px]'>Total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the <strong>{role.name}</strong> role? This action cannot be undone.
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
