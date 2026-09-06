'use client'

// React Imports
import { useMemo, useState } from 'react'

// Third-party Imports
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { ArrowRightIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon, XIcon } from 'lucide-react'

// Type Imports
import type { FilingRow } from '@/types/payroll/compliance-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import FilingStatusBadge from './filing-status-badge'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import {
  FILING_AUTHORITIES,
  FILING_BUCKET_LABELS,
  FILING_KIND_LABELS,
  FILING_STATUS_LABELS,
  FILING_STATUS_ORDER,
  bucketOf,
  type FilingBucket
} from '@/utils/payroll-compliance'
import { formatDate, formatPeriod, initials } from '@/utils/payroll-workspace'
import { ariaSortFor } from '@/utils/table-utils'

const BUCKETS: FilingBucket[] = ['action', 'awaiting', 'accepted']

const RIGHT_ALIGNED = new Set(['employeeCount', 'amount'])

const buildColumns = (onOpen: (id: string) => void): ColumnDef<FilingRow>[] => [
  {
    id: 'kind',
    header: 'Filing',
    accessorFn: row => FILING_KIND_LABELS[row.kind],
    cell: ({ row }) => (
      <span className='flex flex-col'>
        <Button
          variant='link'
          className='h-auto justify-start p-0 font-medium whitespace-nowrap'
          onClick={() => onOpen(row.original.id)}
        >
          {FILING_KIND_LABELS[row.original.kind]}
        </Button>
        <span className='text-muted-foreground text-xs'>{FILING_AUTHORITIES[row.original.kind]}</span>
      </span>
    )
  },
  {
    id: 'period',
    header: 'Period',
    accessorKey: 'periodStart',
    cell: ({ row }) => (
      <span className='flex flex-col whitespace-nowrap'>
        <span>{formatPeriod(row.original.periodStart, row.original.periodEnd)}</span>
        {row.original.runReference && (
          <span className='text-muted-foreground text-xs'>{row.original.runReference}</span>
        )}
      </span>
    )
  },
  {
    id: 'dueDate',
    header: 'Due',
    accessorKey: 'dueDate',
    cell: ({ row }) => {
      const days = row.original.daysToDue

      return (
        <span className='flex flex-col whitespace-nowrap'>
          <span>{formatDate(row.original.dueDate)}</span>
          {days !== null && (
            <span className={cn('text-xs', days < 0 ? 'text-destructive' : 'text-muted-foreground')}>
              {days === 0
                ? 'today'
                : days < 0
                  ? `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} overdue`
                  : `in ${days} ${days === 1 ? 'day' : 'days'}`}
            </span>
          )}
        </span>
      )
    }
  },
  {
    id: 'employeeCount',
    header: 'Employees',
    accessorKey: 'employeeCount',
    cell: ({ row }) => <span className='block text-right tabular-nums'>{row.original.employeeCount}</span>
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
    id: 'submitter',
    header: 'Submitted by',
    accessorFn: row => row.submitter?.name ?? '',
    cell: ({ row }) => {
      const { submitter, reference } = row.original

      if (!submitter) {
        return (
          <span className='text-muted-foreground'>
            —<span className='sr-only'>Not yet submitted</span>
          </span>
        )
      }

      return (
        <span className='flex items-center gap-2 whitespace-nowrap'>
          <Avatar className='size-7'>
            {submitter.avatar && <AvatarImage src={submitter.avatar} alt='' />}
            <AvatarFallback className='text-[10px]'>{initials(submitter.name)}</AvatarFallback>
          </Avatar>
          <span className='flex flex-col'>
            <span>{submitter.name}</span>
            {reference && <span className='text-muted-foreground text-xs tabular-nums'>{reference}</span>}
          </span>
        </span>
      )
    }
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: row => FILING_STATUS_ORDER[row.status],
    cell: ({ row }) => <FilingStatusBadge status={row.original.status} />
  },
  {
    id: 'open',
    header: () => <span className='sr-only'>Open</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <Button
        variant='ghost'
        size='icon-sm'
        className='text-muted-foreground'
        onClick={() => onOpen(row.original.id)}
        aria-label={`Open ${FILING_KIND_LABELS[row.original.kind]} for ${formatPeriod(row.original.periodStart, row.original.periodEnd)}`}
      >
        <ArrowRightIcon />
      </Button>
    )
  }
]

type Props = {

  /** Soonest due first, as `buildFilingRows` returns them. */
  rows: FilingRow[]
  selectedId: string | null
  onOpen: (id: string) => void
  className?: string
}

/**
 * Every filing, with what each one needs. The chips above the table group the five statuses into
 * the three questions a person asks: what do I have to do, what am I waiting on, what is done.
 */
const FilingsTable = ({ rows, selectedId, onOpen, className }: Props) => {
  const [bucket, setBucket] = useState<FilingBucket | 'all'>('all')
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const countsByBucket = useMemo(
    () =>
      BUCKETS.reduce(
        (counts, key) => ({ ...counts, [key]: rows.filter(row => bucketOf(row.status) === key).length }),
        {} as Record<FilingBucket, number>
      ),
    [rows]
  )

  const data = useMemo(
    () => (bucket === 'all' ? rows : rows.filter(row => bucketOf(row.status) === bucket)),
    [rows, bucket]
  )

  const columns = useMemo(() => buildColumns(onOpen), [onOpen])

  // Same opt-out the other datatables in this repo carry: useReactTable returns functions the
  // React Compiler cannot memoize, so it declines to compile the component rather than risk
  // stale UI.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    enableSortingRemoval: false,
    globalFilterFn: (row, _columnId, value: string) => {
      const needle = value.trim().toLowerCase()

      if (!needle) return true

      const { kind, runReference, periodStart, periodEnd, status, reference } = row.original

      return [
        FILING_KIND_LABELS[kind],
        FILING_AUTHORITIES[kind],
        runReference ?? '',
        formatPeriod(periodStart, periodEnd),
        FILING_STATUS_LABELS[status],
        reference ?? ''
      ].some(field => field.toLowerCase().includes(needle))
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  const filteredRows = table.getFilteredRowModel().rows.map(row => row.original)
  const visibleRows = table.getRowModel().rows
  const filtered = bucket !== 'all' || globalFilter.length > 0

  const total = {
    amount: filteredRows.reduce((sum, row) => sum + row.amount.amount, 0),
    currency: rows[0]?.amount.currency ?? 'SGD'
  }

  const resetFilters = () => {
    setBucket('all')
    setGlobalFilter('')
  }

  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className='py-6'>
        <CardTitle className='text-lg font-semibold'>All filings</CardTitle>
        <CardDescription>
          {filteredRows.length} of {rows.length} filings
        </CardDescription>
        <CardAction className='w-full sm:w-64'>
          <Label htmlFor='filings-search' className='sr-only'>
            Search filings
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon className='size-4' />
            </InputGroupAddon>
            <InputGroupInput
              id='filings-search'
              value={globalFilter}
              onChange={event => setGlobalFilter(event.target.value)}
              placeholder='Search filing, run, reference'
            />
          </InputGroup>
        </CardAction>
      </CardHeader>

      <div className='flex flex-wrap items-center gap-2 border-y px-6 py-3'>
        <ToggleGroup
          variant='outline'
          size='sm'
          spacing={0}
          value={[bucket]}
          onValueChange={value => setBucket((value[0] as FilingBucket | 'all' | undefined) ?? 'all')}
          aria-label='Filter filings by what they need'
        >
          <ToggleGroupItem value='all'>
            All
            <span className='text-muted-foreground tabular-nums'>{rows.length}</span>
          </ToggleGroupItem>
          {BUCKETS.map(
            key =>
              countsByBucket[key] > 0 && (
                <ToggleGroupItem key={key} value={key}>
                  {FILING_BUCKET_LABELS[key]}
                  <span className='text-muted-foreground tabular-nums'>{countsByBucket[key]}</span>
                </ToggleGroupItem>
              )
          )}
        </ToggleGroup>

        {filtered && (
          <Button variant='ghost' size='sm' onClick={resetFilters}>
            Reset
            <XIcon />
          </Button>
        )}
      </div>

      <CardContent className='px-0 pb-0'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const alignRight = RIGHT_ALIGNED.has(header.column.id)
                    const sorted = header.column.getIsSorted()

                    return (
                      <TableHead
                        key={header.id}
                        className={cn('first:pl-6 last:pr-6', alignRight && 'text-right')}
                        aria-sort={ariaSortFor(header.column)}
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
                              <ChevronUpIcon className='size-4 shrink-0 opacity-60' aria-hidden='true' />
                            )}
                            {sorted === 'desc' && (
                              <ChevronDownIcon className='size-4 shrink-0 opacity-60' aria-hidden='true' />
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
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-32 text-center'>
                    <div className='text-muted-foreground flex flex-col items-center gap-2 text-sm'>
                      <span>
                        {globalFilter
                          ? `No filings match “${globalFilter}”.`
                          : bucket === 'action'
                            ? 'Nothing needs action.'
                            : bucket === 'awaiting'
                              ? 'Nothing is awaiting a response.'
                              : 'No filings accepted yet.'}
                      </span>
                      <Button variant='link' size='sm' onClick={resetFilters}>
                        Show all filings
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map(row => (
                  <TableRow
                    key={row.id}
                    data-state={row.original.id === selectedId ? 'selected' : undefined}
                    className='hover:bg-muted/50 cursor-pointer'

                    // Mouse convenience only. The filing name is the real control, so keyboard
                    // and assistive-tech users never depend on this handler.
                    onClick={() => onOpen(row.original.id)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className='first:pl-6 last:pr-6'>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>

            {filteredRows.length > 1 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className='pl-6 font-medium'>
                    {filteredRows.length} filings
                  </TableCell>
                  <TableCell />
                  <TableCell className='text-right font-medium tabular-nums'>{formatMoney(total)}</TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default FilingsTable
