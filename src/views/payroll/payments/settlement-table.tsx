'use client'

// React Imports
import { useMemo, useState } from 'react'

// Third-party Imports
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

// Type Imports
import type { EmployeePaymentStatus } from '@/types/payroll/run-workspace-types'
import type { SettlementRow } from '@/utils/payroll-payments'
import type { TableColumn, TableDefinition } from '@/types/common/table-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import DataTable from '@/components/shared/DataTable'
import { settlementCommands, settlementObject } from '@/views/payroll/payroll-objects'
import SettlementStatusBadge from './settlement-status-badge'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { PAYMENT_STATUS_LABELS, formatDate, formatInstant, initials } from '@/utils/payroll-workspace'
import { inSet } from '@/utils/table-utils'

const STATUSES = Object.keys(PAYMENT_STATUS_LABELS) as EmployeePaymentStatus[]

/**
 * What each column means.
 *
 * `status` is a `status` and not a `signal`, which is the distinction the two semantics exist to
 * make: the accessor holds the payment state itself, so the filter's options *are* the column's
 * values and its counts are real. A filing's status column looks identical on screen and is a
 * `signal`, because its accessor holds a rank instead. The semantic follows the accessor, not the
 * badge.
 *
 * `account` says where the money goes — a masked account, or the method when there is no account
 * to mask. It is neither sorted nor searched: a last-four is an ending, so ordering by it is
 * meaningless and matching a typed fragment against it would return strangers.
 */
const SETTLEMENT_COLUMNS: TableColumn[] = [
  { id: 'employee', label: 'Employee', semantic: 'identity', isAnchor: true },
  { id: 'run', label: 'Run', semantic: 'relation' },
  { id: 'amount', label: 'Amount', semantic: 'money' },
  { id: 'account', label: 'Account', semantic: 'text', capabilities: { sortable: false, searchable: false } },
  { id: 'reference', label: 'Bank reference', semantic: 'identifier', capabilities: { sortable: false } },
  { id: 'settled', label: 'Settled', semantic: 'datetime' },
  { id: 'status', label: 'Status', semantic: 'status' }
]

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
    filterFn: inSet<SettlementRow>(),
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
    filterFn: inSet<SettlementRow>(),
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
 * Every payment, every run — described for the table engine rather than rendered by hand.
 *
 * Run and status are the two dimensions a person narrows by, and both are genuinely faceted: the
 * column stores the run id and the payment state themselves, so the counts beside each option are
 * the rows actually behind it. The engine owns the controls, the counts, reset and the collapse
 * into one popover when this box is narrow.
 */
const SettlementTable = ({ rows, runs, selectedId, onSelect, initialStatus = null, className }: Props) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialStatus ? [{ id: 'status', value: [initialStatus] }] : []
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

      // What the identity column shows, plus the reference that has a column of its own. The
      // department is shown too but is not matched here: it is a `relation`, and answering a
      // structured question with a substring is what the narrowing exists to prevent.
      return [row.original.employeeName, row.original.employeeNumber, row.original.reference ?? ''].some(field =>
        field.toLowerCase().includes(needle)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const filtered = globalFilter.length > 0 || columnFilters.length > 0

  // Built eagerly, so the branch for a company that has never paid anyone is a case rather than a
  // fallback — the same defect the filings empty state had.
  const emptyMessage =
    rows.length === 0
      ? 'No payments have been made for this company.'
      : globalFilter
        ? `No payments match “${globalFilter}”.`
        : 'No payments match these filters.'

  const definition: TableDefinition<SettlementRow> = {
    id: 'payroll-settlements',
    getRowId: row => row.id,
    columns: SETTLEMENT_COLUMNS,
    mode: 'client',
    noun: { one: 'payment', many: 'payments' },
    density: 'compact',
    getObject: settlementObject,
    getCommands: row => settlementCommands(row, { onOpen: onSelect }),

    // Named, not inferred: opening the payment is what a row means, wherever it sits in the menu.
    getDefaultCommandId: () => 'open',

    // The payment the inspector is currently showing, so the row it came from stays findable
    // behind the sheet, and announced as the current row rather than only tinted.
    getRowState: row => (row.id === selectedId ? 'current' : 'default'),

    // Reconciling a bank statement is done a page at a time, so this one offers to widen the page
    // rather than making a person move through a long list twenty-five rows at a time.
    pageSizes: [25, 50, 100],
    task: ['sort', 'filter', 'search', 'paginate', 'rowCommands'],
    filters: [
      {
        columnId: 'run',
        label: 'Run',
        options: runs.map(run => ({ value: run.id, label: run.reference }))
      },
      {
        columnId: 'status',
        label: 'Status',
        options: STATUSES.map(status => ({ value: status, label: PAYMENT_STATUS_LABELS[status] }))
      }
    ],
    emptyState: {
      message: emptyMessage,
      onClear: filtered
        ? () => {
            table.resetColumnFilters()
            setGlobalFilter('')
          }
        : undefined
    }
  }

  // An `@container`, because the toolbar's collapse is decided by this box rather than the window:
  // the payments page puts it at full width, and a narrower host would still get the right form.
  return (
    <div className={cn('bg-card @container flex flex-col overflow-hidden rounded-lg border', className)}>
      <DataTable
        definition={definition}
        table={table}
        caption='Every payment, every run'
        search={globalFilter}
        onSearchChange={setGlobalFilter}
      />
    </div>
  )
}

export default SettlementTable
