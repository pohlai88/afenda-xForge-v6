'use client'

// React Imports
import { useCallback, useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState
} from '@tanstack/react-table'
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, MinusIcon, ScrollTextIcon } from 'lucide-react'

// Type Imports
import type { Consolidation, EntityPayrollState, EntityRow } from '@/types/payroll/group-types'
import type { TableColumn, TableDefinition, TableFooterRow } from '@/types/common/table-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import DataTable from '@/components/shared/DataTable'
import { ExceptionBadge } from '@/views/payroll/run/exception-badge'
import { entityPeriodCommands, entityPeriodObject } from '@/views/payroll/payroll-objects'
import LineageDrawer from './lineage-drawer'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { formatDate } from '@/utils/payroll-workspace'
import { countExceptions } from '@/utils/payroll-metrics'
import { ENTITY_STATE_LABELS, ENTITY_STATE_ORDER, ENTITY_STATE_STYLES, COUNTRY_LABELS } from '@/utils/payroll-group'

type Props = {
  consolidation: Consolidation

  /**
   * The group view to come back to, already encoded.
   *
   * A string rather than a callback: a server component cannot hand a function across the
   * client boundary, and the same constraint is why the run history table names its link target
   * instead of taking one.
   */
  returnTo: string
  className?: string
}

const Dash = ({ label }: { label: string }) => (
  <>
    <span aria-hidden='true'>—</span>
    <span className='sr-only'>{label}</span>
  </>
)

/**
 * What each column means.
 *
 * `coverage` and `state` are both `signal`, and for the same reason: each stores a rank rather than
 * the word a person reads. Coverage sorts the companies missing from the total to one end; state
 * sorts by how much attention it deserves, which is why `blocked` ranks above `closed`. Neither is
 * a figure, so neither is right-aligned, and neither can be faceted — the ranks are not the option
 * values.
 *
 * `change` is `money` even though the cell often shows a percentage instead. What is stored and
 * sorted is the movement in the reporting currency; the percentage is how the domain chooses to
 * say it when a comparison exists.
 */
const ENTITY_COLUMNS: TableColumn[] = [
  { id: 'entity', label: 'Company', semantic: 'identity', isAnchor: true, pinned: true },
  { id: 'employees', label: 'People', semantic: 'quantity' },
  { id: 'ready', label: 'Ready', semantic: 'quantity' },
  { id: 'issues', label: 'Issues', semantic: 'signal' },
  { id: 'payday', label: 'Payday', semantic: 'date' },
  { id: 'netPay', label: 'Net pay', semantic: 'money' },
  { id: 'state', label: 'State', semantic: 'signal' },

  // The reconciliation three. Present, sortable and totalled exactly as before, but off by
  // default: they answer what the group costs, which is the question the zone below this table
  // exists for. The column menu turns them back on without leaving the page or the sort.
  { id: 'coverage', label: 'In the total', semantic: 'signal', hideable: true },
  { id: 'employerCost', label: 'Employer cost', semantic: 'money', hideable: true },
  { id: 'change', label: 'Change', semantic: 'money', hideable: true },
  { id: 'open', label: 'Open', semantic: 'text', capabilities: { sortable: false, filter: 'none', searchable: false } }
]

/** Reconciliation columns start hidden; the column menu is how they come back. */
const OPERATIONAL_VIEW: VisibilityState = { coverage: false, employerCost: false, change: false }

/** Worst first, and the same order the run queue lists them in. */
const SEVERITIES = ['blocking', 'error', 'warning', 'info'] as const

/**
 * People this company can pay, of the people it has.
 *
 * Null rather than a number when the count cannot be stated, which is two cases and both matter.
 * With no run there is no population to count. And an open blocker that names a department rather
 * than a person affects an unknown number of people — the type allows it even though today's data
 * has none — so subtracting only the named ones would report more people ready than the run can
 * prove. A dash is the honest answer; an optimistic count on a payroll screen is not.
 */
const readyOf = (row: EntityRow): number | null => {
  if (!row.run) return null

  const stopping = row.run.exceptions.filter(
    item => !item.resolvedAt && (item.severity === 'blocking' || item.severity === 'error')
  )

  if (stopping.some(item => !item.employeeId)) return null

  return Math.max(row.employees - new Set(stopping.map(item => item.employeeId)).size, 0)
}

/** Open exceptions, worst first. A rank, not a figure — which is why the column is a `signal`. */
const issueRank = (row: EntityRow): number => {
  if (!row.run) return -1

  const counts = countExceptions(row.run.exceptions)

  return counts.blocking * 10_000 + counts.error * 100 + counts.warning
}

const buildColumns = (hrefFor: (entityId: string) => string): ColumnDef<EntityRow>[] => [
  {
    id: 'entity',
    header: 'Company',
    accessorFn: row => row.entity.name,
    cell: ({ row }) => (
      <span className='flex min-w-0 flex-col'>
        <Link
          href={hrefFor(row.original.entity.id)}
          className='truncate py-0.5 font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
        >
          {row.original.entity.name}
        </Link>
        <span className='text-muted-foreground truncate text-xs'>
          {COUNTRY_LABELS[row.original.entity.countryCode]} · {row.original.entity.currency}
        </span>
      </span>
    ),

    // A pinned column renders at exactly the width its sticky offsets were summed from, so the
    // size has to be declared or a long name overflows into the next cell — "Afenda Manufacturing
    // Sdn. Bhd." did. Same 260 and the same min-w-0/truncate pair the run register's pinned
    // identity column already uses.
    size: 260
  },
  {
    id: 'coverage',
    header: 'In the total',
    accessorFn: row => (row.included ? 1 : 0),

    // Deliberately not a badge. State already wears one, and a row with four saturated badges is
    // unreadable; a mark of a different kind is how the eye tells two facts apart.
    cell: ({ row }) => (
      <span className='flex flex-col gap-0.5 text-xs'>
        <span className={row.original.included ? 'text-foreground' : 'text-warning'}>
          {row.original.included ? 'Included' : 'Missing'}
        </span>
        {row.original.included && (
          <span className='text-muted-foreground'>{row.original.finality === 'final' ? 'Final' : 'Provisional'}</span>
        )}
      </span>
    )
  },
  {
    id: 'employees',
    header: 'People',
    accessorFn: row => row.employees,
    cell: ({ row }) => (row.original.included ? row.original.employees : <Dash label='No calculation' />)
  },
  {
    id: 'ready',
    header: 'Ready',
    accessorFn: row => readyOf(row) ?? -1,
    cell: ({ row }) => {
      const ready = readyOf(row.original)

      if (ready === null) {
        return <Dash label={row.original.run ? 'A blocker names a department, so this cannot be counted' : 'No run'} />
      }

      const short = row.original.employees - ready

      // Not coloured. `--warning` measures 2.28:1 as text on a light background, below even the
      // 3:1 large-text floor, and the count does not need it: the sub-line names the shortfall and
      // the Issues column beside it is already the alarm.
      return (
        <span className='flex flex-col items-end'>
          <span className='font-medium'>{ready}</span>
          {short > 0 && <span className='text-muted-foreground text-xs'>{short} blocked</span>}
        </span>
      )
    }
  },
  {
    id: 'issues',
    header: 'Issues',
    accessorFn: issueRank,
    cell: ({ row }) => {
      if (!row.original.run) return <Dash label='No run' />

      const counts = countExceptions(row.original.run.exceptions)

      if (counts.open === 0) return <span className='text-muted-foreground text-xs'>None open</span>

      return (
        <span className='flex flex-wrap items-center gap-1'>
          {SEVERITIES.map(
            severity =>
              counts[severity] > 0 && <ExceptionBadge key={severity} severity={severity} count={counts[severity]} />
          )}
        </span>
      )
    }
  },
  {
    id: 'payday',
    header: 'Payday',
    accessorFn: row => row.run?.payDate ?? '',
    cell: ({ row }) => (row.original.run ? formatDate(row.original.run.payDate) : <Dash label='No run, so no payday' />)
  },
  {
    id: 'netPay',
    header: 'Net pay',
    accessorFn: row => row.reporting?.netPay.amount ?? -1,
    cell: ({ row }) =>
      row.original.reporting && row.original.local ? (
        <span className='flex flex-col items-end'>
          <span className='font-medium'>{formatMoney(row.original.reporting.netPay)}</span>
          <span className='text-muted-foreground text-xs'>{formatMoney(row.original.local.netPay)}</span>
        </span>
      ) : (
        <Dash label='No calculation' />
      )
  },
  {
    id: 'employerCost',
    header: 'Employer cost',
    accessorFn: row => row.reporting?.employerCost.amount ?? -1,
    cell: ({ row }) =>
      row.original.reporting && row.original.local ? (
        <span className='flex flex-col items-end'>
          <span className='font-medium'>{formatMoney(row.original.reporting.employerCost)}</span>
          <span className='text-muted-foreground text-xs'>{formatMoney(row.original.local.employerCost)}</span>
        </span>
      ) : (
        <Dash label='No calculation' />
      )
  },
  {
    id: 'change',
    header: 'Change',
    accessorFn: row => row.change?.amount ?? 0,
    cell: ({ row }) => {
      const change = row.original.change

      if (!change) return <Dash label='No comparison' />

      const flat = change.amount === 0
      const Icon = flat ? MinusIcon : change.amount > 0 ? ChevronUpIcon : ChevronDownIcon

      return (
        <span className='text-muted-foreground flex items-center justify-end gap-1'>
          <Icon className='size-3.5' aria-hidden='true' />
          {row.original.changePercent === null ? formatMoney(change) : `${row.original.changePercent!.toFixed(1)}%`}
        </span>
      )
    }
  },
  {
    id: 'state',
    header: 'State',
    accessorFn: row => ENTITY_STATE_ORDER[row.state],
    cell: ({ row }) => (
      <span className='flex flex-col gap-0.5'>
        <Badge className={cn('w-fit whitespace-nowrap', ENTITY_STATE_STYLES[row.original.state])}>
          {ENTITY_STATE_LABELS[row.original.state]}
        </Badge>
        <span className='text-muted-foreground text-xs'>{row.original.detail}</span>
      </span>
    )
  },
  {
    id: 'open',
    header: () => <span className='sr-only'>Open</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <Button
        variant='ghost'
        size='icon-sm'
        render={<Link href={hrefFor(row.original.entity.id)} />}
        nativeButton={false}
        aria-label={`Open ${row.original.entity.name}`}
      >
        <ChevronRightIcon />
      </Button>
    )
  }
]

/**
 * The working centre of the page.
 *
 * Not a summary table under a dashboard — this is where someone answers which company, how much,
 * what changed, whether it is in the number and whether it can proceed, all at once. Hence the
 * selection, and the two status columns: coverage and state are different questions and a single
 * column answering both would have to lie about one of them.
 *
 * The state chips stay here rather than becoming an engine filter. Their counts come from
 * `coverage.byState`, which counts every company in the group; a faceted count over a `signal`
 * column would have to be derived from a rank, which is the one thing the engine refuses to guess.
 */
const EntityControlMatrix = ({ consolidation, returnTo, className }: Props) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [stateFilter, setStateFilter] = useState<EntityPayrollState | 'all'>('all')
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(OPERATIONAL_VIEW)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const reporting = consolidation.reportingCurrency

  const hrefFor = useCallback(
    (entityId: string) => `/payroll/entities/${entityId}?return=${encodeURIComponent(returnTo)}`,
    [returnTo]
  )

  const filtered = useMemo(
    () =>
      stateFilter === 'all' ? consolidation.entities : consolidation.entities.filter(row => row.state === stateFilter),
    [consolidation.entities, stateFilter]
  )

  const columns = useMemo(() => buildColumns(hrefFor), [hrefFor])

  // Same opt-out the other datatables in this repo carry: useReactTable returns functions the
  // React Compiler cannot memoize, so it declines to compile the component rather than risk it.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: row => row.entity.id,
    enableRowSelection: true,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const rows = table.getRowModel().rows
  const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id])
  const selectedRows = consolidation.entities.filter(row => selectedIds.includes(row.entity.id))
  const selectedIncluded = selectedRows.filter(row => row.included && row.reporting)
  const selectedMissing = selectedRows.filter(row => !row.included)

  const selectedTotal = {
    amount: selectedIncluded.reduce((sum, row) => sum + row.reporting!.employerCost.amount, 0),
    currency: reporting
  }

  const states = (Object.keys(ENTITY_STATE_LABELS) as EntityPayrollState[])
    .filter(state => consolidation.entities.some(row => row.state === state))
    .sort((a, b) => ENTITY_STATE_ORDER[a] - ENTITY_STATE_ORDER[b])

  // Footer money is only meaningful because every row is already in the reporting currency. The
  // local column is not totalled for exactly the opposite reason.
  const visibleTotal = {
    amount: rows.reduce((sum, row) => sum + (row.original.reporting?.employerCost.amount ?? 0), 0),
    currency: reporting
  }

  const visibleNetTotal = {
    amount: rows.reduce((sum, row) => sum + (row.original.reporting?.netPay.amount ?? 0), 0),
    currency: reporting
  }

  const visibleIncluded = rows.filter(row => row.original.included).length

  const footer: TableFooterRow = {
    label: (
      <span className='font-medium'>
        {visibleIncluded} of {rows.length} included
        {visibleIncluded < rows.length && <span className='text-warning'> · incomplete</span>}
      </span>
    ),
    cells: [
      {
        columnId: 'employees',

        // Unique headcount is a group figure: one person on two payrolls is one person. It cannot
        // be restated over a subset, so a filtered view says so rather than showing the sum.
        content:
          stateFilter === 'all' ? (
            consolidation.headcount.unique
          ) : (
            <Dash label='Unique headcount is only meaningful across every company' />
          )
      },
      { columnId: 'netPay', content: <span className='font-semibold'>{formatMoney(visibleNetTotal)}</span> },

      // Rendered only while the column is on. The engine builds the footer from the visible
      // sequence, so a hidden column takes its total with it rather than leaving a stray figure
      // under the wrong heading.
      { columnId: 'employerCost', content: <span className='font-semibold'>{formatMoney(visibleTotal)}</span> }
    ]
  }

  const definition: TableDefinition<EntityRow> = {
    id: 'payroll-group-entities',
    getRowId: row => row.entity.id,
    columns: ENTITY_COLUMNS,
    mode: 'client',
    noun: { one: 'company', many: 'companies' },
    getObject: entityPeriodObject,
    getCommands: row => entityPeriodCommands(row, hrefFor),

    // Named, not inferred: opening the company is what a row means.
    getDefaultCommandId: () => 'open',

    // Selection exists because a subset of companies is a question someone asks of the total. The
    // engine owns the checkbox, the count and clearing; explaining the subset is the one command.
    selection: {
      bulkActions: () => [
        {
          id: 'explain-selection',
          label: 'Explain selection',
          family: 'read',
          icon: ScrollTextIcon,
          onSelect: () => setDrawerOpen(true)
        }
      ]
    },

    // The whole group fits on one screen, so this table sorts, selects and commands and asks for
    // no paging even though the engine can page.
    task: ['sort', 'select', 'bulk', 'rowCommands', 'columnVisibility'],
    emptyState: {
      message:
        consolidation.entities.length === 0
          ? 'This group has no companies.'
          : `No company is ${ENTITY_STATE_LABELS[stateFilter as EntityPayrollState]?.toLowerCase() ?? 'in that state'} this period.`,
      onClear: stateFilter === 'all' ? undefined : () => setStateFilter('all')
    },
    footer: rows.length > 1 ? footer : undefined
  }

  return (
    <>
      <Card className={cn('gap-0 py-0', className)}>
        <CardHeader className='py-6'>
          <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
            Companies
          </CardTitle>
          <CardDescription>
            Who needs action, and when. Net pay in {reporting}, with each company&apos;s own currency beneath it; cost
            and coverage are in the column menu
          </CardDescription>
          <CardAction>
            <ToggleGroup
              variant='outline'
              size='sm'
              spacing={0}
              value={[stateFilter]}
              onValueChange={value => setStateFilter((value[0] as EntityPayrollState | 'all') ?? 'all')}
              aria-label='Filter companies by state'
              className='flex-wrap'
            >
              <ToggleGroupItem value='all'>
                All
                <span className='text-muted-foreground tabular-nums'>{consolidation.entities.length}</span>
              </ToggleGroupItem>
              {states.map(state => (
                <ToggleGroupItem key={state} value={state}>
                  {ENTITY_STATE_LABELS[state]}
                  <span className='text-muted-foreground tabular-nums'>{consolidation.coverage.byState[state]}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </CardAction>
        </CardHeader>

        <CardContent className='border-t px-0 pb-0'>
          <DataTable definition={definition} table={table} caption='Every company in the group, this period' />
        </CardContent>
      </Card>

      {/* What the selection is worth, which the engine's selection bar states the mechanics of but
          cannot state the meaning of. Never a bare count and a figure: a selection total obeys the
          page's rules about coverage and currency exactly as the headline does. */}
      {selectedRows.length > 0 && (
        <div
          role='status'
          className='bg-card sticky bottom-4 z-10 col-span-full flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border px-5 py-3 shadow-lg'
        >
          <span className='flex flex-col'>
            <span className='text-muted-foreground text-xs'>Employer cost</span>
            <span className='font-semibold tabular-nums'>{formatMoney(selectedTotal)}</span>
          </span>

          <span className='flex flex-col'>
            <span className='text-muted-foreground text-xs'>Coverage</span>
            <span className='text-sm tabular-nums'>
              {selectedIncluded.length} of {selectedRows.length} included
            </span>
          </span>

          <span className='flex flex-col'>
            <span className='text-muted-foreground text-xs'>Currency</span>
            <span className='text-sm'>converted to {reporting}</span>
          </span>

          {selectedMissing.length > 0 && (
            <span className='text-warning text-sm'>
              {selectedMissing.map(row => row.entity.name).join(', ')} has no calculation. Selection total is
              incomplete.
            </span>
          )}
        </div>
      )}

      <LineageDrawer
        consolidation={consolidation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entityIds={selectedIds}
        title={`${selectedRows.length} selected ${selectedRows.length === 1 ? 'company' : 'companies'}`}
      />
    </>
  )
}

export default EntityControlMatrix
