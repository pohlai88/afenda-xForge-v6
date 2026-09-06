'use client'

// React Imports
import { useMemo, useState } from 'react'

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
import { ArrowRightIcon, DownloadIcon, SearchIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { PayRunQueueRow, RunLifecycle } from '@/types/payroll/run-queue-types'
import type { TableColumn, TableDefinition, TableFooterRow } from '@/types/common/table-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import DataTable from '@/components/shared/DataTable'
import PropertiesSheet from '@/components/shared/PropertiesSheet'
import { ExceptionBadge } from '@/views/payroll/run/exception-badge'
import { payRunCommands, payRunObject, payRunQueueProperties } from '@/views/payroll/payroll-objects'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { PAY_RUN_STATUS_LABELS, PAY_RUN_STATUS_STYLES } from '@/utils/payroll-metrics'
import { RUN_LIFECYCLE_LABELS, exportRunQueueToCsv } from '@/utils/payroll-queue'
import { formatDate, formatPeriod, formatSignedPercent, initials } from '@/utils/payroll-workspace'

const LIFECYCLES: RunLifecycle[] = ['open', 'done', 'exited']

const SEVERITIES = ['blocking', 'error', 'warning', 'info'] as const

const hrefFor = (row: PayRunQueueRow) => `/payroll/runs/${row.id}`

/** Stands in for a total that cannot honestly be produced, and says why to a screen reader. */
const NoTotal = () => (
  <>
    <span aria-hidden='true' className='text-muted-foreground'>
      —
    </span>
    <span className='sr-only'>Not totalled: these runs are in different currencies</span>
  </>
)

/**
 * Money columns sort on the raw minor-unit amount and format only at render. Sorting the
 * formatted string would order 'S$9,120.00' above 'S$84,300.00'.
 */
const columns: ColumnDef<PayRunQueueRow>[] = [
  {
    id: 'reference',
    header: 'Run',
    accessorKey: 'reference',
    cell: ({ row }) => (
      <span className='flex flex-col'>
        <Link
          href={hrefFor(row.original)}
          className='font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
        >
          {row.original.reference}
        </Link>
        <span className='text-muted-foreground text-xs whitespace-nowrap'>
          {formatPeriod(row.original.periodStart, row.original.periodEnd)}
        </span>
      </span>
    )
  },
  {
    id: 'entity',
    header: 'Company',
    accessorKey: 'entityName',
    cell: ({ row }) => (
      <span className='flex flex-col'>
        <span className='whitespace-nowrap'>{row.original.entityName}</span>
        <span className='text-muted-foreground text-xs'>
          {row.original.countryCode} · {row.original.payGroup}
        </span>
      </span>
    )
  },
  {
    id: 'payDate',
    header: 'Payday',
    accessorKey: 'payDate',
    cell: ({ row }) => {
      const days = row.original.daysToPayday

      return (
        <span className='flex flex-col whitespace-nowrap'>
          <span>{formatDate(row.original.payDate)}</span>
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
    id: 'gross',
    header: 'Gross',
    accessorFn: row => row.gross.amount,
    cell: ({ row }) => <span className='block text-right tabular-nums'>{formatMoney(row.original.gross)}</span>
  },
  {
    id: 'net',
    header: 'Net',
    accessorFn: row => row.net.amount,

    // The delta sits under the figure rather than in its own column: it qualifies the number
    // beside it, and a twelfth column pushed Status off a 1440px screen.
    cell: ({ row }) => {
      const change = row.original.netChangePercent

      return (
        <span className='flex flex-col items-end tabular-nums'>
          <span>{formatMoney(row.original.net)}</span>
          <span
            className={cn(
              'text-xs',
              change === null || change === 0
                ? 'text-muted-foreground'
                : change > 0
                  ? 'text-success'
                  : 'text-destructive'
            )}
          >
            {change === null ? 'First run' : `${formatSignedPercent(change)} vs prior`}
          </span>
        </span>
      )
    }
  },
  {
    id: 'employerCost',
    header: 'Employer cost',
    accessorFn: row => row.employerCost.amount,
    cell: ({ row }) => (
      <span className='block text-right font-medium tabular-nums'>{formatMoney(row.original.employerCost)}</span>
    )
  },
  {
    id: 'exceptions',
    header: 'Exceptions',
    accessorFn: row => row.counts.open,
    cell: ({ row }) => {
      const { counts } = row.original

      if (counts.open === 0) {
        return (
          <span className='text-muted-foreground'>
            —<span className='sr-only'>No open exceptions</span>
          </span>
        )
      }

      return (
        <span className='flex gap-1 whitespace-nowrap'>
          {SEVERITIES.map(
            severity =>
              counts[severity] > 0 && <ExceptionBadge key={severity} severity={severity} count={counts[severity]} />
          )}
        </span>
      )
    }
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',

    // Who signed the run off belongs with its status: "Closed" and the approver's face are one
    // fact about the run, and a person scanning for their own sign-offs finds them by the face.
    cell: ({ row }) => {
      const { status, approver } = row.original

      return (
        <span className='flex flex-col items-start gap-1'>
          <Badge className={cn('whitespace-nowrap', PAY_RUN_STATUS_STYLES[status])}>
            {PAY_RUN_STATUS_LABELS[status]}
          </Badge>
          {approver && (
            <span className='text-muted-foreground flex items-center gap-1.5 text-xs whitespace-nowrap'>
              <Avatar className='size-5'>
                {approver.avatar && <AvatarImage src={approver.avatar} alt='' />}
                <AvatarFallback className='text-[8px]'>{initials(approver.name)}</AvatarFallback>
              </Avatar>
              {approver.name}
            </span>
          )}
        </span>
      )
    }
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
        render={<Link href={hrefFor(row.original)} />}
        nativeButton={false}
        aria-label={`Open ${row.original.reference}`}
      >
        <ArrowRightIcon />
      </Button>
    )
  }
]

/**
 * What each column means. The engine reads these to decide alignment, sorting, filter kind and
 * whether a column's values can honestly drive a faceted count — none of which the table has to
 * restate for itself.
 */
const RUN_QUEUE_COLUMNS: TableColumn[] = [
  { id: 'reference', label: 'Run', semantic: 'identity', isAnchor: true },
  { id: 'entity', label: 'Company', semantic: 'relation' },
  { id: 'payDate', label: 'Payday', semantic: 'date' },
  { id: 'employeeCount', label: 'Employees', semantic: 'quantity' },
  { id: 'gross', label: 'Gross', semantic: 'money' },
  { id: 'net', label: 'Net', semantic: 'money' },
  { id: 'employerCost', label: 'Employer cost', semantic: 'money' },
  { id: 'exceptions', label: 'Exceptions', semantic: 'quantity' },
  { id: 'status', label: 'Status', semantic: 'status' },
  { id: 'open', label: 'Open', semantic: 'text', capabilities: { sortable: false, filter: 'none', searchable: false } }
]

type Props = {
  /** Newest first, as `buildRunQueue` returns them. */
  rows: PayRunQueueRow[]
  pageSize?: number
  className?: string
}

/**
 * Every run, with what each one needs. The lifecycle chips above the table are the filter most
 * people want — "what is still open" — and carry their counts so a collapsed list still says how
 * many runs are behind it. Pagination appears only once there is a second page to go to.
 */
const RunQueueTable = ({ rows, pageSize = 12, className }: Props) => {
  const [lifecycle, setLifecycle] = useState<RunLifecycle | 'all'>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })
  const [propertiesRow, setPropertiesRow] = useState<PayRunQueueRow | null>(null)

  const countsByLifecycle = useMemo(
    () =>
      LIFECYCLES.reduce(
        (counts, key) => ({ ...counts, [key]: rows.filter(row => row.lifecycle === key).length }),
        {} as Record<RunLifecycle, number>
      ),
    [rows]
  )

  const data = useMemo(
    () =>
      rows.filter(
        row =>
          (lifecycle === 'all' || row.lifecycle === lifecycle) &&
          (entityFilter === 'all' || row.entityId === entityFilter)
      ),
    [rows, lifecycle, entityFilter]
  )

  // Same opt-out the other datatables in this repo carry: useReactTable returns functions the
  // React Compiler cannot memoize, so it declines to compile the component rather than risk
  // stale UI.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    enableSortingRemoval: false,
    globalFilterFn: (row, _columnId, value: string) => {
      const needle = value.trim().toLowerCase()

      if (!needle) return true

      const { reference, payGroup, periodStart, periodEnd, status } = row.original

      return [reference, payGroup, formatPeriod(periodStart, periodEnd), PAY_RUN_STATUS_LABELS[status]].some(field =>
        field.toLowerCase().includes(needle)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const filteredRows = table.getFilteredRowModel().rows.map(row => row.original)
  const filtered = lifecycle !== 'all' || entityFilter !== 'all' || globalFilter.length > 0

  const totals = filteredRows.reduce(
    (sum, row) => ({
      employees: sum.employees + row.employeeCount,
      gross: sum.gross + row.gross.amount,
      net: sum.net + row.net.amount,
      employerCost: sum.employerCost + row.employerCost.amount
    }),
    { employees: 0, gross: 0, net: 0, employerCost: 0 }
  )

  // A total is only meaningful when every row shares a currency. With companies paying in
  // dollars, ringgit and dong in one table, adding the columns and stamping the first row's
  // currency on the result produces a figure that looks precise and means nothing. Filter to
  // one company, or read the consolidated number on Group payroll where the exchange rate
  // basis is stated.
  const currencies = [...new Set(filteredRows.map(row => row.gross.currency))]
  const currency = currencies.length === 1 ? currencies[0] : null

  const entityOptions = [...new Map(rows.map(row => [row.entityId, row.entityName])).entries()]

  const resetFilters = () => {
    setLifecycle('all')
    setEntityFilter('all')
    setGlobalFilter('')
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }

  // Built eagerly for the definition, so it must hold for every lifecycle — including 'all',
  // which has no label. The old inline version only ran inside the empty branch and would have
  // thrown the day a filter-free queue came back empty.
  const emptyMessage = globalFilter
    ? `No runs match “${globalFilter}”.`
    : lifecycle === 'all'
      ? 'No runs yet.'
      : `No runs are ${RUN_LIFECYCLE_LABELS[lifecycle].toLowerCase()}.`

  // A total is only meaningful when every row shares a currency, so when they do not, each money
  // column says so rather than showing a figure. Which columns those are is stated here; where
  // they land is the engine's, because this table must not know how many columns it renders.
  const money = (amount: number) => (currency ? formatMoney({ amount, currency }) : <NoTotal />)

  const footer: TableFooterRow = {
    label: (
      <>
        {filteredRows.length} runs
        {!currency && (
          <span className='text-muted-foreground ml-2 font-normal'>
            · {currencies.length} currencies · filter by company to total
          </span>
        )}
      </>
    ),
    cells: [
      { columnId: 'employeeCount', content: totals.employees },
      { columnId: 'gross', content: money(totals.gross) },
      { columnId: 'net', content: money(totals.net) },
      { columnId: 'employerCost', content: money(totals.employerCost) }
    ]
  }

  const definition: TableDefinition<PayRunQueueRow> = {
    id: 'payroll-run-queue',
    getRowId: row => row.id,
    columns: RUN_QUEUE_COLUMNS,
    mode: 'client',
    getObject: payRunObject,
    getCommands: row => payRunCommands(row),

    // Named, not inferred: 'open' is the run's activation regardless of where it sits in the menu.
    getDefaultCommandId: () => 'open',
    onOpenProperties: setPropertiesRow,

    // The run still needing work is the one worth finding first; the engine decides what
    // emphasis looks like so it means the same thing in every table.
    getRowState: row => (row.lifecycle === 'open' ? 'emphasis' : 'default'),
    emptyState: {
      message: emptyMessage,
      onClear: filtered ? resetFilters : undefined
    },
    footer: filteredRows.length > 1 ? footer : undefined
  }

  const handleExport = () => {
    exportRunQueueToCsv(filteredRows)
    toast.success('Export created', {
      description: `${filteredRows.length} ${filteredRows.length === 1 ? 'run' : 'runs'} · payroll-runs.csv`
    })
  }

  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className='py-6'>
        <CardTitle className='text-lg font-semibold'>All runs</CardTitle>
        <CardDescription>
          {filteredRows.length} of {rows.length} runs
        </CardDescription>
        <CardAction className='w-full sm:w-64'>
          <Label htmlFor='run-queue-search' className='sr-only'>
            Search runs
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon className='size-4' />
            </InputGroupAddon>
            <InputGroupInput
              id='run-queue-search'
              value={globalFilter}
              onChange={event => {
                setGlobalFilter(event.target.value)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
              placeholder='Search run, period, status'
            />
          </InputGroup>
        </CardAction>
      </CardHeader>

      <div className='flex flex-wrap items-center gap-2 border-y px-6 py-3'>
        <ToggleGroup
          variant='outline'
          size='sm'
          spacing={0}
          value={[lifecycle]}
          onValueChange={value => {
            // Single-select: pressing the active chip again would empty the group, which
            // means "show everything" here rather than "show nothing".
            setLifecycle((value[0] as RunLifecycle | 'all' | undefined) ?? 'all')
            setPagination(p => ({ ...p, pageIndex: 0 }))
          }}
          aria-label='Filter runs by lifecycle'
        >
          <ToggleGroupItem value='all'>
            All
            <span className='text-muted-foreground tabular-nums'>{rows.length}</span>
          </ToggleGroupItem>
          {LIFECYCLES.map(
            key =>
              countsByLifecycle[key] > 0 && (
                <ToggleGroupItem key={key} value={key}>
                  {RUN_LIFECYCLE_LABELS[key]}
                  <span className='text-muted-foreground tabular-nums'>{countsByLifecycle[key]}</span>
                </ToggleGroupItem>
              )
          )}
        </ToggleGroup>

        {entityOptions.length > 1 && (
          <Select
            value={entityFilter}
            onValueChange={value => {
              if (!value) return
              setEntityFilter(value)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            items={[
              { value: 'all', label: 'All companies' },
              ...entityOptions.map(([id, name]) => ({ value: id, label: name }))
            ]}
          >
            <SelectTrigger size='sm' className='w-56' aria-label='Filter runs by company'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All companies</SelectItem>
              {entityOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filtered && (
          <Button variant='ghost' size='sm' onClick={resetFilters}>
            Reset
            <XIcon />
          </Button>
        )}

        <Button variant='outline' size='sm' className='ml-auto' onClick={handleExport}>
          <DownloadIcon />
          <span className='max-md:hidden'>Export runs</span>
        </Button>
      </div>

      <CardContent className='px-0 pb-0'>
        <DataTable definition={definition} table={table} caption='Every payroll run' />

        <PropertiesSheet
          object={propertiesRow ? payRunObject(propertiesRow) : null}
          typeLabel='Pay run'
          sections={propertiesRow ? payRunQueueProperties(propertiesRow) : []}
          open={propertiesRow !== null}
          onOpenChange={open => {
            if (!open) setPropertiesRow(null)
          }}
        />
      </CardContent>
    </Card>
  )
}

export default RunQueueTable
