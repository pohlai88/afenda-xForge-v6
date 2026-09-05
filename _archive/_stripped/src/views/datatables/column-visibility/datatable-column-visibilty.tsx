'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import {
  BrushIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns3Icon,
  CrownIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilLineIcon,
  PencilRulerIcon,
  RefreshCcwIcon,
  SearchIcon,
  Trash2Icon,
  UserRoundIcon
} from 'lucide-react'

// Type Imports
import type { ColumnDef, PaginationState, VisibilityState } from '@tanstack/react-table'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Hook Imports
import { usePagination } from '@/hooks/use-pagination'

// Util Imports
import { cn } from '@/lib/utils'

export type Item = {
  id: string
  avatar: string
  fallback: string
  user: string
  email: string
  role: 'admin' | 'author' | 'editor' | 'maintainer' | 'subscriber'
  plan: 'basic' | 'company' | 'enterprise' | 'team'
  billing: 'auto-debit' | 'manual-cash' | 'manual-paypal'
  status: 'active' | 'inactive' | 'pending'
}

const columns: ColumnDef<Item>[] = [
  {
    header: 'User',
    accessorKey: 'user',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Avatar className='size-9'>
          <AvatarImage src={row.original.avatar} alt={row.getValue('user')} />
          <AvatarFallback className='text-xs'>{row.original.fallback}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col'>
          <span className='font-medium'>{row.getValue('user')}</span>
          <span className='text-muted-foreground'>{row.original.email}</span>
        </div>
      </div>
    )
  },
  {
    header: 'Role',
    accessorKey: 'role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string

      const roles = {
        admin: <UserRoundIcon className='size-4 text-green-600 dark:text-green-400' />,
        author: <PencilLineIcon className='text-chart-1 size-4' />,
        editor: <BrushIcon className='text-chart-2 size-4' />,
        maintainer: <PencilRulerIcon className='text-chart-3 size-4' />,
        subscriber: <CrownIcon className='text-chart-5 size-4' />
      }[role]

      return (
        <div className='flex items-center gap-2'>
          {roles}
          <span className='capitalize'>{role}</span>
        </div>
      )
    }
  },
  {
    header: 'Plan',
    accessorKey: 'plan',
    cell: ({ row }) => <span className='text-muted-foreground capitalize'>{row.getValue('plan')}</span>
  },
  {
    header: 'Billing',
    accessorKey: 'billing',
    cell: ({ row }) => (
      <span className='text-muted-foreground'>
        {row.getValue('billing') === 'auto-debit'
          ? 'Auto debit'
          : row.getValue('billing') === 'manual-cash'
            ? 'Manual - cash'
            : 'Manual - PayPal'}
      </span>
    )
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string

      const styles = {
        active:
          'bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5',
        inactive:
          'bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive',
        pending:
          'bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 [a&]:hover:bg-amber-600/5 dark:[a&]:hover:bg-amber-400/5'
      }[status]

      return (
        <Badge className={cn('h-auto rounded-sm border-none capitalize focus-visible:outline-none', styles)}>
          {row.getValue('status')}
        </Badge>
      )
    }
  },
  {
    id: 'actions',
    header: () => 'Actions',
    cell: () => (
      <div className='flex items-center gap-1'>
        <Tooltip>
          <TooltipTrigger render={<Button variant='ghost' size='icon' aria-label='Delete item' />}>
            <Trash2Icon className='size-4.5' />
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant='ghost' size='icon' aria-label='View item' />}>
            <EyeIcon className='size-4.5' />
          </TooltipTrigger>
          <TooltipContent>
            <p>View</p>
          </TooltipContent>
        </Tooltip>
        <RowActions />
      </div>
    ),
    enableHiding: false
  }
]

const ColumnVisibilityDatatable = ({ data }: { data: Item[] }) => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      pagination,
      columnVisibility
    }
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2
  })

  return (
    <div className='w-full'>
      <div className='flex min-h-17 flex-wrap items-center gap-3 border-b px-6 py-3'>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant='outline' className='max-w-3xs justify-between'>
                <span className='flex items-center gap-2'>
                  <Columns3Icon />
                  Columns
                </span>
                <ChevronDownIcon className='ml-3' />
              </Button>
            }
          />
          <DropdownMenuContent align='end' className='w-56'>
            <div className='relative'>
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-8'
                placeholder='Search'
                onKeyDown={e => e.stopPropagation()}
              />
              <SearchIcon className='absolute inset-y-0 left-2 my-auto size-4' />
            </div>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter(column => column.getCanHide() && column.id !== 'user')
              .map(column => {
                const columnLabel = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id

                if (searchQuery && !columnLabel.toLowerCase().includes(searchQuery.toLowerCase())) {
                  return null
                }

                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                    onSelect={e => e.preventDefault()}
                  >
                    {columnLabel}
                  </DropdownMenuCheckboxItem>
                )
              })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                table.resetColumnVisibility()
                setSearchQuery('')
              }}
            >
              <RefreshCcwIcon /> Reset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='border-b'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id} className='text-muted-foreground h-14 first:pl-4 last:text-center'>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className='first:pl-4 last:w-29'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between gap-3 px-6 py-4 max-sm:flex-col md:max-lg:flex-col'>
        <p className='text-muted-foreground text-sm whitespace-nowrap' aria-live='polite'>
          Showing{' '}
          <span>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              Math.max(
                table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                  table.getState().pagination.pageSize,
                0
              ),
              table.getRowCount()
            )}
          </span>{' '}
          of <span>{table.getRowCount().toString()} entries</span>
        </p>

        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  className='disabled:pointer-events-none disabled:opacity-50'
                  variant='ghost'
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label='Go to previous page'
                >
                  <ChevronLeftIcon aria-hidden='true' />
                  Previous
                </Button>
              </PaginationItem>

              {showLeftEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {pages.map(page => {
                const isActive = page === table.getState().pagination.pageIndex + 1

                return (
                  <PaginationItem key={page}>
                    <Button
                      size='icon'
                      className={`${!isActive && 'bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40'}`}
                      onClick={() => table.setPageIndex(page - 1)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                )
              })}

              {showRightEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <Button
                  className='disabled:pointer-events-none disabled:opacity-50'
                  variant='ghost'
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label='Go to next page'
                >
                  Next
                  <ChevronRightIcon aria-hidden='true' />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}

export default ColumnVisibilityDatatable

function RowActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size='icon' variant='ghost' aria-label='Edit item' />}>
        <EllipsisVerticalIcon className='size-4.5' aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Duplicate</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
