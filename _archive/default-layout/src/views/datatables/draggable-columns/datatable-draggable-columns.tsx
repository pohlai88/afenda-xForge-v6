'use client'

// React Imports
import { useId, useState } from 'react'
import type { CSSProperties } from 'react'

// Third-party Imports
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
  GripVerticalIcon
} from 'lucide-react'

// Type Imports
import type { Cell, ColumnDef, Header, PaginationState, SortingState } from '@tanstack/react-table'

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
  vendor: string
  contact: string
  category: string
  renewsOn: string
  annualCost: number
  status: 'active' | 'review due' | 'expired' | 'negotiating'
}

const columns: ColumnDef<Item>[] = [
  {
    id: 'vendor',
    accessorKey: 'vendor',
    header: 'Vendor',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Avatar className='size-9'>
          <AvatarImage src={row.original.avatar} alt={row.getValue('vendor')} />
          <AvatarFallback className='text-xs'>{row.original.fallback}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col text-sm'>
          <span className='text-card-foreground font-medium'>{row.getValue('vendor')}</span>
          <span className='text-muted-foreground'>{row.original.contact}</span>
        </div>
      </div>
    ),
    sortUndefined: 'last',
    sortDescFirst: false
  },
  {
    id: 'id',
    accessorKey: 'id',
    header: 'Contract ID',
    cell: ({ row }) => <span className='font-medium'>{row.getValue('id')}</span>
  },
  {
    id: 'category',
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => <span className='text-muted-foreground capitalize'>{row.getValue('category')}</span>
  },
  {
    id: 'renewsOn',
    accessorKey: 'renewsOn',
    header: 'Renews On',
    cell: ({ row }) => <span className='text-muted-foreground'>{row.getValue('renewsOn')}</span>
  },
  {
    id: 'annualCost',
    accessorKey: 'annualCost',
    header: 'Annual Cost',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('annualCost'))

      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)

      return <span className='font-medium'>{formatted}</span>
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Item['status']

      const styles = {
        active: 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
        'review due': 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
        expired: 'bg-destructive/10 text-destructive',
        negotiating: 'bg-primary/10 text-primary'
      }[status]

      return <Badge className={cn('h-auto rounded-sm border-none capitalize', styles)}>{status}</Badge>
    }
  },
  {
    id: 'actions',
    header: () => 'Actions',
    cell: () => <RowActions />,
    enableSorting: false
  }
]

const DraggableColumnsDatatable = ({ data }: { data: Item[] }) => {
  const dndId = useId()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map(column => column.id as string))

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
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    enableSortingRemoval: false,
    state: {
      sorting,
      columnOrder,
      pagination
    }
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active && over && active.id !== over.id) {
      setColumnOrder(columnOrder => {
        const oldIndex = columnOrder.indexOf(active.id as string)
        const newIndex = columnOrder.indexOf(over.id as string)

        return arrayMove(columnOrder, oldIndex, newIndex)
      })
    }
  }

  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))

  return (
    <div className='w-full'>
      <div className='border-b'>
        <DndContext
          id={dndId}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className='bg-muted/50 [&>th]:border-t-0'>
                  <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                    {headerGroup.headers.map(header => (
                      <DraggableTableHeader key={header.id} header={header} />
                    ))}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map(cell => (
                      <SortableContext key={cell.id} items={columnOrder} strategy={horizontalListSortingStrategy}>
                        <DragAlongCell key={cell.id} cell={cell} />
                      </SortableContext>
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
        </DndContext>
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

export default DraggableColumnsDatatable

function DraggableTableHeader({ header }: { header: Header<Item, unknown> }) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: header.column.id
  })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition,
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0
  }

  return (
    <TableHead
      ref={setNodeRef}
      className='before:bg-border relative h-14 border-t before:absolute before:inset-y-0 before:left-0 before:w-px first:before:bg-transparent'
      style={style}
      aria-sort={
        header.column.getIsSorted() === 'asc'
          ? 'ascending'
          : header.column.getIsSorted() === 'desc'
            ? 'descending'
            : 'none'
      }
    >
      <div className='flex items-center justify-start gap-0.5'>
        <Button
          size='icon'
          variant='ghost'
          className='-ml-1 size-7'
          {...attributes}
          {...listeners}
          aria-label='Drag to reorder'
        >
          <GripVerticalIcon className='opacity-60' aria-hidden='true' />
        </Button>
        <span className='grow truncate'>
          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
        </span>
        {header.column.getCanSort() && (
          <Button
            size='icon'
            variant='ghost'
            className='group -mr-1 size-7'
            onClick={header.column.getToggleSortingHandler()}
            onKeyDown={e => {
              if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                header.column.getToggleSortingHandler()?.(e)
              }
            }}
            aria-label='Toggle sorting'
          >
            {{
              asc: <ChevronUpIcon className='shrink-0 opacity-60' size={16} aria-hidden='true' />,
              desc: <ChevronDownIcon className='shrink-0 opacity-60' size={16} aria-hidden='true' />
            }[header.column.getIsSorted() as string] ?? (
              <ChevronUpIcon className='shrink-0 opacity-0 group-hover:opacity-60' size={16} aria-hidden='true' />
            )}
          </Button>
        )}
      </div>
    </TableHead>
  )
}

function DragAlongCell({ cell }: { cell: Cell<Item, unknown> }) {
  const { isDragging, setNodeRef, transform, transition } = useSortable({
    id: cell.column.id
  })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition,
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0
  }

  return (
    <TableCell ref={setNodeRef} className='truncate first:pl-4' style={style}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  )
}

function RowActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size='icon' variant='ghost' aria-label='Edit item' />}>
        <EllipsisVerticalIcon className='size-5' aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <span>View contract</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Schedule review</span>
          </DropdownMenuItem>
          <DropdownMenuItem variant='destructive'>
            <span>Terminate contract</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
