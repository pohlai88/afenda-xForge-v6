'use client'

// React Imports
import { Fragment, useState } from 'react'

// Third-party Imports
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, EllipsisVerticalIcon } from 'lucide-react'

// Type Imports
import type { ColumnDef, PaginationState, RowSelectionState } from '@tanstack/react-table'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Hook Imports
import { usePagination } from '@/hooks/use-pagination'

// Util Imports
import { cn } from '@/lib/utils'

export type LaunchTask = {
  id: string
  avatar: string
  fallback: string
  assignee: string
  task: string
  dueDate: string
  status: 'complete' | 'in progress' | 'blocked' | 'pending'
}

export type Item = {
  id: string
  name: string
  avatar: string
  fallback: string
  lead: string
  email: string
  market: string
  launchDate: string
  status: 'on track' | 'at risk' | 'delayed' | 'launched'
  tasks: LaunchTask[]
}

const columns: ColumnDef<Item>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) =>
      row.getCanExpand() ? (
        <Button
          className='text-muted-foreground size-7'
          onClick={row.getToggleExpandedHandler()}
          aria-expanded={row.getIsExpanded()}
          aria-label={
            row.getIsExpanded()
              ? `Collapse details for ${row.original.name}`
              : `Expand details for ${row.original.name}`
          }
          size='icon'
          variant='ghost'
        >
          {row.getIsExpanded() ? (
            <ChevronUpIcon className='opacity-60' aria-hidden='true' />
          ) : (
            <ChevronDownIcon className='opacity-60' aria-hidden='true' />
          )}
        </Button>
      ) : undefined
  },
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
    )
  },
  {
    accessorKey: 'name',
    header: 'Launch',
    cell: ({ row }) => (
      <div className='flex flex-col text-sm'>
        <span className='text-card-foreground font-medium'>{row.getValue('name')}</span>
        <span className='text-muted-foreground'>{row.original.id}</span>
      </div>
    )
  },
  {
    accessorKey: 'lead',
    header: 'Lead',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Avatar className='size-9'>
          <AvatarImage src={row.original.avatar} alt={row.getValue('lead')} />
          <AvatarFallback className='text-xs'>{row.original.fallback}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col text-sm'>
          <span className='text-card-foreground font-medium'>{row.getValue('lead')}</span>
          <span className='text-muted-foreground'>{row.original.email}</span>
        </div>
      </div>
    )
  },
  {
    accessorKey: 'market',
    header: 'Market',
    cell: ({ row }) => <span className='text-muted-foreground capitalize'>{row.getValue('market')}</span>
  },
  {
    accessorKey: 'launchDate',
    header: 'Launch Date',
    cell: ({ row }) => <span className='text-muted-foreground'>{row.getValue('launchDate')}</span>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Item['status']

      const styles = {
        'on track': 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
        'at risk': 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
        delayed: 'bg-destructive/10 text-destructive',
        launched: 'bg-primary/10 text-primary'
      }[status]

      return <Badge className={cn('h-auto rounded-sm border-none capitalize', styles)}>{status}</Badge>
    }
  },
  {
    id: 'actions',
    header: () => 'Actions',
    cell: () => <RowActions />
  }
]

const ExpandableRowsDatatable = ({ data }: { data: Item[] }) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getRowCanExpand: row => Boolean(row.original.tasks.length),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      rowSelection,
      pagination
    }
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2
  })

  return (
    <div className='w-full'>
      <div className='border-b'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className='text-muted-foreground h-14 first:pl-4 last:pr-4 last:text-center'
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        className='first:pl-4 [&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:py-0'
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell colSpan={row.getVisibleCells().length} className='p-0'>
                        <Table>
                          <TableHeader className='border-b'>
                            <TableRow className='hover:bg-muted/30!'>
                              <TableHead className='w-23.5' />
                              <TableHead className='text-muted-foreground'>Assignee</TableHead>
                              <TableHead className='text-muted-foreground'>Task</TableHead>
                              <TableHead className='text-muted-foreground'>Due Date</TableHead>
                              <TableHead className='text-muted-foreground'>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {row.original.tasks.map(task => {
                              const taskStyles = {
                                complete: 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
                                'in progress': 'bg-primary/10 text-primary',
                                blocked: 'bg-destructive/10 text-destructive',
                                pending: 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'
                              }[task.status]

                              return (
                                <TableRow key={task.id} className='hover:bg-muted/20'>
                                  <TableCell />
                                  <TableCell>
                                    <div className='flex items-center gap-2'>
                                      <Avatar className='size-8'>
                                        <AvatarImage src={task.avatar} alt={task.assignee} />
                                        <AvatarFallback className='text-xs'>{task.fallback}</AvatarFallback>
                                      </Avatar>
                                      <span className='text-sm font-medium'>{task.assignee}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className='flex flex-col text-sm'>
                                      <span className='font-medium'>{task.task}</span>
                                      <span className='text-muted-foreground'>{task.id}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className='text-muted-foreground text-sm'>{task.dueDate}</TableCell>
                                  <TableCell>
                                    <Badge className={cn('h-auto rounded-sm border-none capitalize', taskStyles)}>
                                      {task.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
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

export default ExpandableRowsDatatable

function RowActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size='icon' variant='ghost' aria-label='Edit item' />}>
        <EllipsisVerticalIcon className='size-5' aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <span>View launch plan</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Update timeline</span>
          </DropdownMenuItem>
          <DropdownMenuItem variant='destructive'>
            <span>Archive launch</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
