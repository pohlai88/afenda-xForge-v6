'use client'

// React Imports
import { useCallback, useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, ChevronsUpDownIcon, MinusIcon } from 'lucide-react'

// Type Imports
import type { Consolidation, EntityPayrollState, EntityRow } from '@/types/payroll/group-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import LineageDrawer from './lineage-drawer'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { ENTITY_STATE_LABELS, ENTITY_STATE_ORDER, ENTITY_STATE_STYLES, COUNTRY_LABELS } from '@/utils/payroll-group'
import { ariaSortFor } from '@/utils/table-utils'

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

const RIGHT_ALIGNED = new Set(['employees', 'employerCost', 'change'])

const Dash = ({ label }: { label: string }) => (
  <>
    <span aria-hidden='true'>—</span>
    <span className='sr-only'>{label}</span>
  </>
)

const buildColumns = (hrefFor: (entityId: string) => string): ColumnDef<EntityRow>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
        onCheckedChange={value => table.toggleAllRowsSelected(Boolean(value))}
        aria-label='Select every company'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(Boolean(value))}
        onClick={event => event.stopPropagation()}
        aria-label={`Select ${row.original.entity.name}`}
      />
    ),
    enableSorting: false
  },
  {
    id: 'entity',
    header: 'Company',
    accessorFn: row => row.entity.name,
    cell: ({ row }) => (
      <span className='flex flex-col'>
        <Link
          href={hrefFor(row.original.entity.id)}
          onClick={event => event.stopPropagation()}
          className='font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
        >
          {row.original.entity.name}
        </Link>
        <span className='text-muted-foreground text-xs'>
          {COUNTRY_LABELS[row.original.entity.countryCode]} · {row.original.entity.currency}
        </span>
      </span>
    )
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
    header: 'Employees',
    accessorFn: row => row.employees,
    cell: ({ row }) =>
      row.original.included ? (
        <span className='tabular-nums'>{row.original.employees}</span>
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
          <span className='font-medium tabular-nums'>{formatMoney(row.original.reporting.employerCost)}</span>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {formatMoney(row.original.local.employerCost)}
          </span>
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

      const rising = change.amount > 0
      const flat = change.amount === 0
      const Icon = flat ? MinusIcon : rising ? ChevronUpIcon : ChevronDownIcon

      return (
        <span
          className={cn(
            'flex items-center justify-end gap-1 tabular-nums',
            flat ? 'text-muted-foreground' : rising ? 'text-destructive' : 'text-success'
          )}
        >
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
    cell: ({ row }) => (
      <Button
        variant='ghost'
        size='icon-sm'
        render={<Link href={hrefFor(row.original.entity.id)} />}
        nativeButton={false}
        aria-label={`Open ${row.original.entity.name}`}
        onClick={event => event.stopPropagation()}
      >
        <ChevronRightIcon />
      </Button>
    ),
    enableSorting: false
  }
]

/**
 * The working centre of the page.
 *
 * Not a summary table under a dashboard — this is where someone answers which company, how much,
 * what changed, whether it is in the number and whether it can proceed, all at once. Hence the
 * density, the selection, and the two status columns: coverage and state are different questions
 * and a single column answering both would have to lie about one of them.
 */
const EntityControlMatrix = ({ consolidation, returnTo, className }: Props) => {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [stateFilter, setStateFilter] = useState<EntityPayrollState | 'all'>('all')
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
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
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: row => row.entity.id,
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

  const visibleIncluded = rows.filter(row => row.original.included).length

  return (
    <>
      <Card className={cn('gap-0 py-0', className)}>
        <CardHeader className='py-6'>
          <CardTitle className='text-lg font-semibold'>Companies</CardTitle>
          <CardDescription>
            Employer cost in {reporting}, with each company&apos;s own currency beneath it
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

        <div className='overflow-x-auto border-t'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const alignRight = RIGHT_ALIGNED.has(header.column.id)
                    const canSort = header.column.getCanSort()

                    return (
                      <TableHead
                        key={header.id}
                        aria-sort={ariaSortFor(header.column)}
                        className={cn('first:pl-6 last:pr-6', alignRight && 'text-right')}
                      >
                        {canSort ? (
                          <span
                            role='button'
                            tabIndex={0}
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={event => {
                              if (event.key !== 'Enter' && event.key !== ' ') return
                              event.preventDefault()
                              header.column.getToggleSortingHandler()?.(event)
                            }}
                            aria-label={`Sort by ${String(header.column.columnDef.header)}`}
                            className={cn(
                              'inline-flex cursor-pointer items-center gap-1 select-none',
                              alignRight && 'flex-row-reverse'
                            )}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUpIcon className='size-3.5' />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDownIcon className='size-3.5' />
                            ) : (
                              <ChevronsUpDownIcon className='size-3.5 opacity-40' />
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
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    <p className='text-muted-foreground text-sm'>
                      No company is {ENTITY_STATE_LABELS[stateFilter as EntityPayrollState]?.toLowerCase()} this period.
                    </p>
                    <Button variant='link' size='sm' onClick={() => setStateFilter('all')}>
                      Show every company
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(row => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className='hover:bg-muted/50 cursor-pointer'

                    // Mouse convenience only. The company name holds the real link, so keyboard
                    // and assistive-tech users never depend on this handler.
                    onClick={() => router.push(hrefFor(row.original.entity.id))}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        className={cn('py-3 first:pl-6 last:pr-6', RIGHT_ALIGNED.has(cell.column.id) && 'text-right')}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>

            {rows.length > 1 && (
              <TableFooter>
                <TableRow>
                  <TableCell className='pl-6' />
                  <TableCell className='font-medium'>
                    {visibleIncluded} of {rows.length} included
                    {visibleIncluded < rows.length && <span className='text-warning'> · incomplete</span>}
                  </TableCell>
                  <TableCell />
                  <TableCell className='text-right tabular-nums'>
                    {stateFilter === 'all' ? (
                      consolidation.headcount.unique
                    ) : (
                      <Dash label='Unique headcount is only meaningful across every company' />
                    )}
                  </TableCell>
                  <TableCell className='text-right font-semibold tabular-nums'>{formatMoney(visibleTotal)}</TableCell>
                  <TableCell />
                  <TableCell className='pr-6' />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </Card>

      {/* The selection bar states the same truths as the headline, for the subset. Never a bare
          count and a figure: a selection total obeys the page's rules too. */}
      {selectedRows.length > 0 && (
        <div
          role='status'
          className='bg-card sticky bottom-4 z-10 col-span-full flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border px-5 py-3 shadow-lg'
        >
          <span className='text-sm font-medium'>
            {selectedRows.length} {selectedRows.length === 1 ? 'company' : 'companies'} selected
          </span>

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

          <span className='ml-auto flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={() => setDrawerOpen(true)}>
              Explain selection
            </Button>
            <Button variant='ghost' size='sm' onClick={() => setRowSelection({})}>
              Clear
            </Button>
          </span>
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
