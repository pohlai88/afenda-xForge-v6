'use client'

// React Imports
import { useCallback, useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'
import type { TableColumn, TableDefinition } from '@/types/common/table-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DataTable from '@/components/shared/DataTable'
import { payRunCommands, payRunObject } from '@/views/payroll/payroll-objects'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { PAY_RUN_STATUS_LABELS, PAY_RUN_STATUS_STYLES } from '@/utils/payroll-metrics'

/**
 * Where a run row leads. A name rather than a function because this is a client component and
 * server pages cannot hand it a callback; the dashboard re-scopes itself, the runs page opens
 * the workspace.
 */
export type RunLinkTarget = 'dashboard' | 'workspace'

const HREF_FOR: Record<RunLinkTarget, (run: PayRun, basePath: string) => string> = {
  dashboard: (run, basePath) => `${basePath}?run=${encodeURIComponent(run.reference)}`,
  workspace: run => `/payroll/runs/${run.id}`
}

/**
 * What each column means.
 *
 * Money columns sort on the raw minor-unit amount and format only at render, which is why each
 * declares `money` rather than `text`: sorting the formatted string would order 'S$9,120.00' above
 * 'S$84,300.00', the kind of bug that looks like a display glitch and is actually wrong data. The
 * engine reads the same declaration to right-align them.
 *
 * Only `reference` is searchable. Period and pay date are dates, the figures are figures, and
 * status is a closed vocabulary — matching a typed fragment against any of them is the
 * indiscriminate string search this vocabulary exists to replace. Nothing is lost: a reference
 * carries its own period, so `2026-08` still finds the August run.
 */
const RUN_COLUMNS: TableColumn[] = [
  { id: 'reference', label: 'Run', semantic: 'identity', isAnchor: true },
  { id: 'period', label: 'Period', semantic: 'date' },
  { id: 'payDate', label: 'Pay date', semantic: 'date' },
  { id: 'employeeCount', label: 'Employees', semantic: 'quantity' },
  { id: 'gross', label: 'Gross', semantic: 'money' },
  { id: 'net', label: 'Net', semantic: 'money' },
  { id: 'employerCost', label: 'Employer cost', semantic: 'money' },
  { id: 'calculationVersion', label: 'Calculation', semantic: 'quantity' },
  { id: 'status', label: 'Status', semantic: 'status' }
]

const buildColumns = (hrefFor: (run: PayRun) => string): ColumnDef<PayRun>[] => [
  {
    id: 'reference',
    header: 'Run',
    accessorKey: 'reference',
    cell: ({ row }) => (
      <Link
        href={hrefFor(row.original)}
        scroll={false}
        className='font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
      >
        {row.original.reference}
      </Link>
    )
  },
  {
    id: 'period',
    header: 'Period',
    accessorKey: 'periodStart',
    cell: ({ row }) => (
      <span className='text-muted-foreground whitespace-nowrap'>
        {row.original.periodStart} – {row.original.periodEnd}
      </span>
    )
  },
  {
    id: 'payDate',
    header: 'Pay date',
    accessorKey: 'payDate',
    cell: ({ row }) => <span className='text-muted-foreground'>{row.original.payDate}</span>
  },
  {
    id: 'employeeCount',
    header: 'Employees',
    accessorKey: 'employeeCount'
  },
  {
    id: 'gross',
    header: 'Gross',
    accessorFn: row => row.totals.grossPay.amount,
    cell: ({ row }) => formatMoney(row.original.totals.grossPay)
  },
  {
    id: 'net',
    header: 'Net',
    accessorFn: row => row.totals.netPay.amount,
    cell: ({ row }) => formatMoney(row.original.totals.netPay)
  },
  {
    id: 'employerCost',
    header: 'Employer cost',
    accessorFn: row => row.totals.employerCost.amount,
    cell: ({ row }) => <span className='font-medium'>{formatMoney(row.original.totals.employerCost)}</span>
  },
  {
    /* The calculation a row's figures came from. Approval is of a specific version, so a ledger
       that states cost without stating which calculation produced it cannot be reconciled. */
    id: 'calculationVersion',
    header: 'Calculation',
    accessorKey: 'calculationVersion',
    cell: ({ row }) => <span className='text-muted-foreground tabular-nums'>#{row.original.calculationVersion}</span>
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => (
      <Badge className={cn('text-xs whitespace-nowrap', PAY_RUN_STATUS_STYLES[row.original.status])}>
        {PAY_RUN_STATUS_LABELS[row.original.status]}
      </Badge>
    )
  }
]

type Props = {
  runs: PayRun[]

  /** Reference of the run the dashboard is currently showing, highlighted in the table. */
  selectedReference?: string
  title?: string

  linkTo?: RunLinkTarget

  /**
   * Which page a row link goes to. Defaults to the group route; the entity page passes its own
   * path so a click stays inside the company being looked at.
   */
  basePath?: string
  pageSize?: number
  className?: string
}

/**
 * Every run this company has had, newest first — a list to read and step back through rather than
 * a place to work.
 *
 * It offers no filters and no selection. Seven runs of one company do not make a status filter
 * meaningful, and there is nothing to do with several runs at once; the status column sorts, which
 * is the affordance that fits the size. Sorting, searching, paging and the commands are all the
 * engine's.
 */
const EntityRunHistory = ({
  runs,
  selectedReference,
  title = 'Run history',
  linkTo = 'dashboard',
  basePath = '/payroll',
  pageSize = 5,
  className
}: Props) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })

  const data = useMemo(() => runs, [runs])
  const hrefFor = useCallback((run: PayRun) => HREF_FOR[linkTo](run, basePath), [linkTo, basePath])
  const columns = useMemo(() => buildColumns(hrefFor), [hrefFor])

  // Same opt-out the other datatables in this repo carry: useReactTable returns functions the
  // React Compiler cannot memoize, so it declines to compile the component rather than risk
  // stale UI.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    getRowId: row => row.id,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, value: string) => {
      const needle = value.trim().toLowerCase()

      return !needle || row.original.reference.toLowerCase().includes(needle)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const shown = table.getFilteredRowModel().rows.length

  // The run the page is already showing. Not an inspector's selection — the hero above the table
  // is that run, so the mark is checkable against something on screen.
  const isCurrent = (run: PayRun) => run.reference === selectedReference

  const definition: TableDefinition<PayRun> = {
    id: 'payroll-run-history',
    getRowId: row => row.id,
    columns: RUN_COLUMNS,
    mode: 'client',
    noun: { one: 'run', many: 'runs' },
    getObject: payRunObject,
    getCommands: run => payRunCommands(run, { isCurrent: isCurrent(run), href: hrefFor(run) }),

    // The run on screen has no Open, so it has nothing to activate to. The engine renders it
    // without the pointer affordance rather than pretending a click would do something.
    getDefaultCommandId: run => (isCurrent(run) ? undefined : 'open'),
    getRowState: run => (isCurrent(run) ? 'current' : 'default'),
    pageSizes: [...new Set([5, 10, 25, pageSize])].sort((a, b) => a - b),
    task: ['sort', 'search', 'paginate', 'rowCommands'],
    emptyState: {
      message: runs.length === 0 ? 'This company has no runs yet.' : `No runs match “${globalFilter}”.`,
      onClear: globalFilter ? () => setGlobalFilter('') : undefined
    }
  }

  // An `@container`, because the engine sizes its own controls against this card rather than the
  // window: the entity page gives it the full width, a narrower host would get the compact form.
  return (
    <Card className={cn('@container gap-0 py-0', className)}>
      <CardHeader className='py-6'>
        <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
          {title}
        </CardTitle>
        <CardDescription>
          {shown} of {runs.length} runs
        </CardDescription>
      </CardHeader>

      <CardContent className='px-0 pb-0'>
        <DataTable
          definition={definition}
          table={table}
          caption='Every run this company has had'
          search={globalFilter}
          onSearchChange={setGlobalFilter}
        />
      </CardContent>
    </Card>
  )
}

export default EntityRunHistory
