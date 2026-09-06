'use client'

// React Imports
import { useMemo, useState } from 'react'

// Third-party Imports
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, SearchIcon, XIcon } from 'lucide-react'

// Type Imports
import type { EmployeePaymentStatus } from '@/types/payroll/run-workspace-types'
import type { SettlementRow } from '@/utils/payroll-payments'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  formatDate,
  formatInstant,
  initials
} from '@/utils/payroll-workspace'
import { ariaSortFor } from '@/utils/table-utils'

const STATUSES = Object.keys(PAYMENT_STATUS_LABELS) as EmployeePaymentStatus[]

const RIGHT_ALIGNED = new Set(['amount'])

export const SettlementStatusBadge = ({ status, className }: { status: EmployeePaymentStatus; className?: string }) => (
  <Badge className={cn('h-auto rounded-sm px-1.5 py-0.5 text-xs', PAYMENT_STATUS_STYLES[status], className)}>
    {PAYMENT_STATUS_LABELS[status]}
  </Badge>
)

const buildColumns = (onSelect: (row: SettlementRow) => void): ColumnDef<SettlementRow>[] => [
  {
    id: 'employee',
    header: 'Employee',
    accessorKey: 'employeeName',
    cell: ({ row }) => (
      <div className='flex items-center gap-2.5'>
        <Avatar className='size-7'>
          {row.original.avatar && <AvatarImage src={row.original.avatar} alt='' />}
          <AvatarFallback className='text-[10px]'>{initials(row.original.employeeName)}</AvatarFallback>
        </Avatar>
        <div className='flex min-w-0 flex-col'>
          <Button
            variant='link'
            className='h-auto justify-start p-0 text-sm font-medium'
            onClick={() => onSelect(row.original)}
          >
            <span className='truncate'>{row.original.employeeName}</span>
          </Button>
          <span className='text-muted-foreground truncate text-xs'>
            {row.original.employeeNumber} · {row.original.departmentName}
          </span>
        </div>
      </div>
    ),
    size: 260
  },
  {
    id: 'run',
    header: 'Run',
    accessorKey: 'payRunId',
    filterFn: 'equalsString',
    cell: ({ row }) => (
      <span className='flex flex-col'>
        <span>{row.original.runReference}</span>
        <span className='text-muted-foreground text-xs'>Payday {formatDate(row.original.payDate)}</span>
      </span>
    )
  },
  {
    id: 'amount',
    header: 'Amount',
    accessorFn: row => row.amount.amount,
    cell: ({ row }) => (
      <span className='block text-right font-medium tabular-nums'>{formatMoney(row.original.amount)}</span>
    )
  },
  {
    id: 'account',
    header: 'Account',
    accessorKey: 'accountLast4',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.method !== 'bank_transfer' ? (
        <span className='text-muted-foreground capitalize'>{row.original.method}</span>
      ) : row.original.accountLast4 ? (
        <span className='text-muted-foreground tabular-nums'>···· {row.original.accountLast4}</span>
      ) : (
        <span className='text-destructive text-xs'>No account on file</span>
      )
  },
  {
    id: 'reference',
    header: 'Bank reference',
    accessorKey: 'reference',
    enableSorting: false,
    cell: ({ row }) => <span className='text-muted-foreground font-mono text-xs'>{row.original.reference ?? '—'}</span>
  },
  {
    id: 'settled',
    header: 'Settled',
    accessorFn: row => row.settledAt ?? row.returnedAt ?? row.failedAt ?? '',
    cell: ({ row }) => {
      const at = row.original.settledAt ?? row.original.returnedAt ?? row.original.failedAt

      return <span className='text-muted-foreground text-xs'>{at ? formatInstant(at) : '—'}</span>
    }
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    filterFn: 'equalsString',
    cell: ({ row }) => (
      <span className='flex items-center gap-1.5'>
        <SettlementStatusBadge status={row.original.status} />
        {row.original.superseded && <span className='text-muted-foreground text-xs'>re-issued</span>}
        {row.original.retryOfId && <span className='text-muted-foreground text-xs'>re-issue</span>}
      </span>
    )
  }
]

type Props = {
  rows: SettlementRow[]
  runs: { id: string; reference: string }[]
  selectedId: string | null
  onSelect: (row: SettlementRow) => void

  /** Pre-applied status filter, e.g. from clicking a count chip. */
  initialStatus?: EmployeePaymentStatus | null
  className?: string
}

/**
 * Every payment, every run. Same TanStack rendering as the run workspace table; filters are a
 * run select and a status select because both lists are short and fixed.
 */
const SettlementTable = ({ rows, runs, selectedId, onSelect, initialStatus = null, className }: Props) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialStatus ? [{ id: 'status', value: initialStatus }] : []
  )

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  const columns = useMemo(() => buildColumns(onSelect), [onSelect])

  // Same opt-out the other datatables in this repo carry: useReactTable returns functions the
  // React Compiler cannot memoize, so it declines to compile the component rather than risk
  // stale UI.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter, columnFilters, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getRowId: row => row.id,
    enableSortingRemoval: false,
    globalFilterFn: (row, _id, value: string) => {
      const needle = value.trim().toLowerCase()

      if (!needle) return true

      return [row.original.employeeName, row.original.employeeNumber, row.original.reference ?? ''].some(field =>
        field.toLowerCase().includes(needle)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const runFilter = (table.getColumn('run')?.getFilterValue() as string | undefined) ?? 'all'
  const statusFilter = (table.getColumn('status')?.getFilterValue() as string | undefined) ?? 'all'
  const filtered = globalFilter.length > 0 || columnFilters.length > 0
  const total = table.getFilteredRowModel().rows.length
  const { pageIndex, pageSize } = table.getState().pagination

  return (
    <div className={cn('bg-card flex flex-col overflow-hidden rounded-lg border', className)}>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-2'>
        <div className='w-full sm:w-60'>
          <Label htmlFor='settlement-search' className='sr-only'>
            Search payments
          </Label>
          <InputGroup className='h-8'>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              id='settlement-search'
              value={globalFilter}
              onChange={event => setGlobalFilter(event.target.value)}
              placeholder='Search name, number, reference'
            />
          </InputGroup>
        </div>

        <Select
          value={runFilter}
          onValueChange={value => table.getColumn('run')?.setFilterValue(value === 'all' || !value ? undefined : value)}
        >
          <SelectTrigger size='sm' className='w-40' aria-label='Filter by run'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All runs</SelectItem>
            {runs.map(run => (
              <SelectItem key={run.id} value={run.id}>
                {run.reference}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={value =>
            table.getColumn('status')?.setFilterValue(value === 'all' || !value ? undefined : value)
          }
        >
          <SelectTrigger size='sm' className='w-44' aria-label='Filter by status'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            {STATUSES.map(status => (
              <SelectItem key={status} value={status}>
                {PAYMENT_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtered && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              table.resetColumnFilters()
              setGlobalFilter('')
            }}
          >
            Reset
            <XIcon />
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} className='h-10'>
              {headerGroup.headers.map(header => {
                const alignRight = RIGHT_ALIGNED.has(header.column.id)
                const sorted = header.column.getIsSorted()

                return (
                  <TableHead
                    key={header.id}
                    aria-sort={ariaSortFor(header.column)}
                    className={cn('text-muted-foreground text-xs first:pl-4 last:pr-4', alignRight && 'text-right')}
                  >
                    {header.column.getCanSort() ? (
                      <span
                        role='button'
                        tabIndex={0}
                        className={cn(
                          'flex cursor-pointer items-center gap-1 select-none',
                          alignRight && 'justify-end'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            header.column.getToggleSortingHandler()?.(event)
                          }
                        }}
                        aria-label={`Sort by ${String(header.column.columnDef.header)}`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === 'asc' && (
                          <ChevronUpIcon className='size-3.5 shrink-0 opacity-60' aria-hidden='true' />
                        )}
                        {sorted === 'desc' && (
                          <ChevronDownIcon className='size-3.5 shrink-0 opacity-60' aria-hidden='true' />
                        )}
                      </span>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className='text-muted-foreground h-32 text-center text-sm'>
                {globalFilter ? `No payments match “${globalFilter}”.` : 'No payments match these filters.'}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map(row => {
              const inspected = row.original.id === selectedId

              return (
                <TableRow
                  key={row.id}
                  aria-current={inspected ? 'true' : undefined}
                  className={cn('h-11 cursor-pointer', inspected && 'bg-primary/5 hover:bg-primary/5')}
                  onClick={event => {
                    if ((event.target as HTMLElement).closest('button, a')) return

                    onSelect(row.original)
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className='py-1.5 first:pl-4 last:pr-4'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <div className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2'>
        <p className='text-muted-foreground text-xs tabular-nums' aria-live='polite'>
          {total === 0
            ? 'No payments'
            : `Showing ${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, total)} of ${total}`}
        </p>
        <div className='flex items-center gap-3'>
          <span className='text-muted-foreground text-xs tabular-nums'>
            Page {table.getPageCount() === 0 ? 0 : pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='icon-sm'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label='Previous page'
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant='outline'
              size='icon-sm'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label='Next page'
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettlementTable
