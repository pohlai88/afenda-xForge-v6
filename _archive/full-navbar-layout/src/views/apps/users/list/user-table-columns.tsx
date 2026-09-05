'use client'

// React Imports
import { useState, type ReactNode } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import type { ColumnDef, RowData } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  BrushIcon,
  CrownIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  PencilLineIcon,
  PencilRulerIcon,
  Trash2Icon,
  UserCheckIcon,
  UserRoundIcon,
  UserXIcon
} from 'lucide-react'

// Type Imports
import type { AppUser, UserBilling, UserRole, UserStatus } from '@/types/apps/user-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Config Imports
import { getInitialsFromName } from '@/configs/mailConfig'

// Util Imports
import { cn } from '@/lib/utils'

const ROLE_ICONS: Record<UserRole, ReactNode> = {
  Admin: <UserRoundIcon className='size-4 text-green-600 dark:text-green-400' />,
  Editor: <BrushIcon className='text-chart-2 size-4' />,
  Subscriber: <CrownIcon className='text-chart-5 size-4' />,
  Maintainer: <PencilRulerIcon className='text-chart-3 size-4' />,
  Guest: <PencilLineIcon className='text-chart-1 size-4' />
}

const STATUS_STYLES: Record<UserStatus, string> = {
  Active:
    'bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5',
  Pending:
    'bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 [a&]:hover:bg-amber-600/5 dark:[a&]:hover:bg-amber-400/5',
  Suspended:
    'bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive',
  Inactive:
    'bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive'
}

const formatBilling = (billing: UserBilling): string => {
  if (billing === 'Auto Debit') {
    return 'Auto debit'
  }

  if (billing === 'Credit Card') {
    return 'Credit Card'
  }

  return 'Manual - PayPal'
}

interface UserRowActionsProps {
  user: AppUser
  onEditUser: (id: string) => void
  onDeleteUser: (id: string) => void
  onStatusChange: (id: string, status: UserStatus) => void
}

function UserRowActions({ user, onEditUser, onDeleteUser, onStatusChange }: UserRowActionsProps) {
  // States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleConfirmDelete = () => {
    onDeleteUser(user.id)
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <div className='flex items-center gap-1'>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='ghost'
                size='icon'
                aria-label='View user'
                render={<Link href={`/apps/users/view/${user.id}`} />}
                nativeButton={false}
              />
            }
          >
            <EyeIcon className='size-4.5' />
          </TooltipTrigger>
          <TooltipContent>
            <p>View</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='ghost'
                size='icon'
                aria-label='Delete user'
                onClick={() => setIsDeleteDialogOpen(true)}
              />
            }
          >
            <Trash2Icon className='size-4.5' />
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size='icon' variant='ghost' aria-label='Open actions' />}>
            <EllipsisVerticalIcon className='size-4.5' aria-hidden='true' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onEditUser(user.id)}>
                <PencilIcon className='size-4' />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.status !== 'Suspended' ? (
                <DropdownMenuItem onClick={() => onStatusChange(user.id, 'Suspended')}>
                  <UserXIcon className='size-4' />
                  Suspend
                </DropdownMenuItem>
              ) : null}
              {user.status !== 'Active' ? (
                <DropdownMenuItem onClick={() => onStatusChange(user.id, 'Active')}>
                  <UserCheckIcon className='size-4' />
                  Activate
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant='destructive' onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2Icon className='size-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently remove {user.name}. This action cannot be undone.
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

export const userTableColumns: ColumnDef<AppUser>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    size: 50,
    enableSorting: false
  },
  {
    id: 'user',
    header: 'User',
    accessorKey: 'name',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Avatar className='size-9'>
          {row.original.avatar ? <AvatarImage src={row.original.avatar} alt={row.original.name} /> : null}
          <AvatarFallback className='text-xs'>{getInitialsFromName(row.original.name)}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col'>
          <span className='font-medium'>{row.original.name}</span>
          <span className='text-muted-foreground'>{row.original.email}</span>
        </div>
      </div>
    ),
    size: 360,
    enableSorting: true
  },
  {
    id: 'role',
    header: 'Role',
    accessorKey: 'role',
    cell: ({ row }) => {
      const role = row.original.role

      return (
        <div className='flex items-center gap-2'>
          {ROLE_ICONS[role]}
          <span className='capitalize'>{role}</span>
        </div>
      )
    },
    enableSorting: true
  },
  {
    id: 'plan',
    header: 'Plan',
    accessorKey: 'plan',
    cell: ({ row }) => <span className='text-muted-foreground'>{row.original.plan}</span>,
    enableSorting: true
  },
  {
    id: 'billing',
    header: 'Billing',
    accessorKey: 'billing',
    cell: ({ row }) => <span className='text-muted-foreground'>{formatBilling(row.original.billing)}</span>,
    enableSorting: true
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.original.status

      return (
        <Badge
          className={cn('h-auto rounded-sm border-none capitalize focus-visible:outline-none', STATUS_STYLES[status])}
        >
          {status}
        </Badge>
      )
    },
    enableSorting: true
  },
  {
    id: 'joinedDate',
    header: 'Joined Date',
    accessorKey: 'joinedDate',
    cell: ({ row }) => <span>{format(new Date(row.original.joinedDate), 'dd MMM yyyy')}</span>,
    enableSorting: true
  },
  {
    id: 'actions',
    header: () => 'Actions',
    cell: ({ row, table }) => {
      const meta = table.options.meta

      return (
        <UserRowActions
          user={row.original}
          onEditUser={meta?.onEditUser ?? (() => undefined)}
          onDeleteUser={meta?.onDeleteUser ?? (() => undefined)}
          onStatusChange={meta?.onStatusChange ?? (() => undefined)}
        />
      )
    },
    enableHiding: false,
    enableSorting: false
  }
]

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    onEditUser: (id: string) => void
    onDeleteUser: (id: string) => void
    onStatusChange: (id: string, status: UserStatus) => void
  }
}
