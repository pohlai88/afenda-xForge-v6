'use client'

// React Imports
import { useMemo, useState } from 'react'

// Third-party Imports
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { SearchIcon, XIcon } from 'lucide-react'

// Type Imports
import type { FilingRow } from '@/types/payroll/compliance-types'
import type { TableColumn, TableDefinition } from '@/types/common/table-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { TableCell, TableFooter, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import DataTable from '@/components/shared/DataTable'
import { filingCommands, filingObject } from '@/views/payroll/payroll-objects'
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

const BUCKETS: FilingBucket[] = ['action', 'awaiting', 'accepted']

/**
 * What each column means.
 *
 * `status` is a `signal` rather than a `status`: the accessor is `FILING_STATUS_ORDER`, a rank
 * that puts a rejection above a acceptance because a rejection is what needs working. The stored
 * value is therefore an order and not the status itself, which is exactly the case the semantic
 * exists to describe — it sorts by that rank, it is never summed, and any filter over it would
 * have to come from the domain's vocabulary rather than from the column's own values.
 *
 * `submitter` is a `relation` — a pointer to the person who filed it — so it never becomes free
 * text a search can rummage through.
 */
const FILING_COLUMNS: TableColumn[] = [
  { id: 'kind', label: 'Filing', semantic: 'identity', isAnchor: true },
  { id: 'period', label: 'Period', semantic: 'date' },
  { id: 'dueDate', label: 'Due', semantic: 'date' },
  { id: 'employeeCount', label: 'Employees', semantic: 'quantity' },
  { id: 'amount', label: 'Amount', semantic: 'money' },
  { id: 'submitter', label: 'Submitted by', semantic: 'relation' },
  { id: 'status', label: 'Status', semantic: 'signal' }
]

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
 *
 * Those chips stay here rather than becoming an engine filter, because "needs action" is a
 * judgement `bucketOf` makes about a lifecycle, not a value any column holds.
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
    getRowId: row => row.id,
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
  const filtered = bucket !== 'all' || globalFilter.length > 0

  const total = {
    amount: filteredRows.reduce((sum, row) => sum + row.amount.amount, 0),
    currency: rows[0]?.amount.currency ?? 'SGD'
  }

  const resetFilters = () => {
    setBucket('all')
    setGlobalFilter('')
  }

  // Built eagerly for the definition, so every branch has to hold on its own — including a
  // company with no filings at all, which the old chain reported as "No filings accepted yet"
  // because `accepted` was its fallback rather than a case it had tested for.
  const emptyMessage =
    rows.length === 0
      ? 'No filings are due for this company.'
      : globalFilter
        ? `No filings match “${globalFilter}”.`
        : bucket === 'action'
          ? 'Nothing needs action.'
          : bucket === 'awaiting'
            ? 'Nothing is awaiting a response.'
            : bucket === 'accepted'
              ? 'No filings accepted yet.'
              : 'No filings match.'

  const footer = (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={3} className='pl-6 font-medium'>
          {filteredRows.length} filings
        </TableCell>
        <TableCell />
        <TableCell className='text-right font-medium tabular-nums'>{formatMoney(total)}</TableCell>
        <TableCell colSpan={2} />
      </TableRow>
    </TableFooter>
  )

  const definition: TableDefinition<FilingRow> = {
    id: 'payroll-filings',
    getRowId: row => row.id,
    columns: FILING_COLUMNS,
    mode: 'client',
    noun: { one: 'filing', many: 'filings' },
    getObject: filingObject,
    getCommands: row => filingCommands(row, { onOpen }),

    // Named, not inferred: opening the filing is what a row means, wherever it sits in the menu.
    getDefaultCommandId: () => 'open',

    // The filing the inspector is currently showing, so the row it came from stays findable
    // behind the sheet. The engine decides what that emphasis looks like.
    getRowState: row => (row.id === selectedId ? 'emphasis' : 'default'),

    // Sorting and per-row commands are the whole of this surface's job. It is a full list read
    // top to bottom, so it asks for no pagination even though the engine can page.
    task: ['sort', 'rowCommands'],
    emptyState: {
      message: emptyMessage,
      onClear: filtered ? resetFilters : undefined
    },
    footer: filteredRows.length > 1 ? footer : undefined
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
        <DataTable definition={definition} table={table} caption='Every statutory filing' />
      </CardContent>
    </Card>
  )
}

export default FilingsTable
