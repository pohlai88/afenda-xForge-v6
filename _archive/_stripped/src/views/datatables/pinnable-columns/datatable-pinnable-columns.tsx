'use client'

// React Imports
import { useState } from 'react'
import type { CSSProperties } from 'react'

// Third-party Imports

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import {
  ArrowLeftFromLineIcon,
  ArrowRightFromLineIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  EllipsisVerticalIcon,
  PinOffIcon
} from 'lucide-react'

// Type Imports
import type { Column, ColumnDef, ColumnPinningState, PaginationState, SortingState } from '@tanstack/react-table'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

export type Item = {
  id: string
  avatar: string
  fallback: string
  name: string
  email: string
  department: 'engineering' | 'design' | 'marketing' | 'sales' | 'hr'
  role: string
  status: 'active' | 'on leave' | 'inactive'
}

const getPinningStyles = (column: Column<Item>): CSSProperties => {
  const isPinned = column.getIsPinned()

  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    zIndex: isPinned ? 1 : 0
  }
}

const columns: ColumnDef<Item>[] = [
  {
    accessorKey: 'name',
    header: 'Employee',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Avatar className='size-9'>
          <AvatarImage src={row.original.avatar} alt={row.getValue('name')} />
          <AvatarFallback className='text-xs'>{row.original.fallback}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col text-sm'>
          <span className='text-card-foreground font-medium'>{row.getValue('name')}</span>
          <span className='text-muted-foreground'>{row.original.email}</span>
        </div>
      </div>
    )
  },
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ row }) => <span className='capitalize'>{row.getValue('department')}</span>
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <span className='text-muted-foreground'>{row.getValue('role')}</span>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Item['status']

      const styles = {
        active: 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
        'on leave': 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
        inactive: 'bg-destructive/10 text-destructive'
      }[status]

      return <Badge className={cn('h-auto rounded-sm border-none capitalize', styles)}>{status}</Badge>
    }
  },
  {
    id: 'actions',
    header: () => 'Actions',
    cell: () => <RowActions />,
    enableHiding: false
  }
]

const PinnableColumnsDatatable = ({ data }: { data: Item[] }) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({})

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnPinningChange: setColumnPinning,
    onPaginationChange: setPagination,
    enableSortingRemoval: false,
    state: {
      sorting,
      columnPinning,
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
      <div className='overflow-x-auto border-b'>
        <Table className='[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_tfoot_td]:border-t [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b'>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const { column } = header
                  const isPinned = column.getIsPinned()
                  const isLastLeftPinned = isPinned === 'left' && column.getIsLastColumn('left')
                  const isFirstRightPinned = isPinned === 'right' && column.getIsFirstColumn('right')

                  return (
                    <TableHead
                      key={header.id}
                      className='text-muted-foreground data-pinned:bg-muted/90 relative h-14 truncate first:pl-4 data-pinned:backdrop-blur-xs [&:not([data-pinned]):has(+[data-pinned])_div.cursor-col-resize:last-child]:opacity-0 [&[data-last-col=left]_div.cursor-col-resize:last-child]:opacity-0 [&[data-pinned=right]:last-child_div.cursor-col-resize:last-child]:opacity-0'
                      colSpan={header.colSpan}
                      style={{ ...getPinningStyles(column) }}
                      data-pinned={isPinned || undefined}
                      data-last-col={isLastLeftPinned ? 'left' : isFirstRightPinned ? 'right' : undefined}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <span className='truncate'>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </span>

                        {!header.isPlaceholder &&
                          header.column.getCanPin() &&
                          (header.column.getIsPinned() ? (
                            <Button
                              size='icon'
                              variant='ghost'
                              className='-mr-1 size-7 shrink-0'
                              onClick={() => header.column.pin(false)}
                              aria-label={`Unpin ${header.column.columnDef.header as string} column`}
                              title={`Unpin ${header.column.columnDef.header as string} column`}
                            >
                              <PinOffIcon className='opacity-60' aria-hidden='true' />
                            </Button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    size='icon'
                                    variant='ghost'
                                    className='-mr-1 size-7 shrink-0'
                                    aria-label={`Pin options for ${header.column.columnDef.header as string} column`}
                                    title={`Pin options for ${header.column.columnDef.header as string} column`}
                                  >
                                    <EllipsisIcon className='opacity-60' aria-hidden='true' />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align='end' className='w-35'>
                                <DropdownMenuItem onClick={() => header.column.pin('left')}>
                                  <ArrowLeftFromLineIcon size={16} className='opacity-60' aria-hidden='true' />
                                  Stick to left
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => header.column.pin('right')}>
                                  <ArrowRightFromLineIcon size={16} className='opacity-60' aria-hidden='true' />
                                  Stick to right
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ))}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => {
                    const { column } = cell
                    const isPinned = column.getIsPinned()
                    const isLastLeftPinned = isPinned === 'left' && column.getIsLastColumn('left')
                    const isFirstRightPinned = isPinned === 'right' && column.getIsFirstColumn('right')

                    return (
                      <TableCell
                        key={cell.id}
                        className='truncate first:pl-4 data-pinned:backdrop-blur-xs'
                        style={{ ...getPinningStyles(column) }}
                        data-pinned={isPinned || undefined}
                        data-last-col={isLastLeftPinned ? 'left' : isFirstRightPinned ? 'right' : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
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

export default PinnableColumnsDatatable

function RowActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size='icon' variant='ghost' aria-label='Edit item' />}>
        <EllipsisVerticalIcon className='size-5' aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-35'>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <span>View profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem variant='destructive'>
            <span>Deactivate</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
