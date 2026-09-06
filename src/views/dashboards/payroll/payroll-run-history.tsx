'use client'

// React Imports
import { useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, SearchIcon } from 'lucide-react'

// Type Imports
import type { PayRun, PayRunStatus } from '@/types/payroll/pay-run-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { PAY_RUN_STATUS_LABELS } from '@/utils/payroll-metrics'
import { ariaSortFor } from '@/utils/table-utils'

const STATUS_STYLES: Partial<Record<PayRunStatus, string>> = {
  pending_approval: 'bg-chart-5/15 text-chart-5',
  approved: 'bg-chart-2/15 text-chart-2',
  paid: 'bg-primary/10 text-primary',
  closed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  failed: 'bg-destructive/10 text-destructive'
}

/** Numeric columns, right-aligned so digits line up under one another. */
const RIGHT_ALIGNED = new Set(['employeeCount', 'gross', 'net', 'employerCost'])

/**
 * Money columns sort on the raw minor-unit amount and format only at render.
 *
 * Sorting the formatted string would order 'S$9,120.00' above 'S$84,300.00', which is the
 * kind of bug that looks like a display glitch and is actually wrong data.
 */
const columns: ColumnDef<PayRun>[] = [
  {
    header: 'Run',
    accessorKey: 'reference',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/payroll?run=${encodeURIComponent(row.original.reference)}`}
        scroll={false}
        className='font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
      >
        {row.original.reference}
      </Link>
    )
  },
  {
    header: 'Period',
    accessorKey: 'periodStart',
    cell: ({ row }) => (
      <span className='text-muted-foreground whitespace-nowrap'>
        {row.original.periodStart} – {row.original.periodEnd}
      </span>
    )
  },
  {
    header: 'Pay date',
    accessorKey: 'payDate',
    cell: ({ row }) => <span className='text-muted-foreground'>{row.original.payDate}</span>
  },
  {
    header: 'Employees',
    accessorKey: 'employeeCount',
    cell: ({ row }) => <span className='block text-right'>{row.original.employeeCount}</span>
  },
  {
    id: 'gross',
    header: 'Gross',
    accessorFn: row => row.totals.grossPay.amount,
    cell: ({ row }) => <span className='block text-right'>{formatMoney(row.original.totals.grossPay)}</span>
  },
  {
    id: 'net',
    header: 'Net',
    accessorFn: row => row.totals.netPay.amount,
    cell: ({ row }) => <span className='block text-right'>{formatMoney(row.original.totals.netPay)}</span>
  },
  {
    id: 'employerCost',
    header: 'Employer cost',
    accessorFn: row => row.totals.employerCost.amount,
    cell: ({ row }) => (
      <span className='block text-right font-medium'>{formatMoney(row.original.totals.employerCost)}</span>
    )
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => (
      <Badge className={cn('text-xs whitespace-nowrap', STATUS_STYLES[row.original.status])}>
        {PAY_RUN_STATUS_LABELS[row.original.status]}
      </Badge>
    )
  }
]

type Props = {
  runs: PayRun[]

  /** Reference of the run the dashboard is currently showing, highlighted in the table. */
  selectedReference?: string
  className?: string
}

const PayrollRunHistory = ({ runs, selectedReference, className }: Props) => {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 })

  const data = useMemo(() => runs, [runs])

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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const pageCount = table.getPageCount()

  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className='py-6'>
        <CardTitle className='text-lg font-semibold'>Run history</CardTitle>
        <CardDescription>
          {table.getFilteredRowModel().rows.length} of {runs.length} runs
        </CardDescription>
        <CardAction className='w-full sm:w-64'>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon className='size-4' />
            </InputGroupAddon>
            <InputGroupInput
              value={globalFilter}
              onChange={event => setGlobalFilter(event.target.value)}
              placeholder='Search runs'
              aria-label='Search runs'
            />
          </InputGroup>
        </CardAction>
      </CardHeader>

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
                        className={cn(alignRight && 'text-right')}
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
                            {sorted === 'asc' && <ChevronUpIcon className='size-4 shrink-0 opacity-60' />}
                            {sorted === 'desc' && <ChevronDownIcon className='size-4 shrink-0 opacity-60' />}
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
                  <TableCell colSpan={columns.length} className='text-muted-foreground h-24 text-center'>
                    No runs match “{globalFilter}”.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map(row => {
                  const selected = row.original.reference === selectedReference

                  return (
                    <TableRow
                      key={row.id}
                      data-state={selected ? 'selected' : undefined}
                      aria-current={selected ? 'true' : undefined}
                      className='hover:bg-muted/50 cursor-pointer'

                      // Mouse convenience only. The reference cell holds the real link, so
                      // keyboard and assistive-tech users never depend on this handler.
                      onClick={() =>
                        router.push(`/dashboard/payroll?run=${encodeURIComponent(row.original.reference)}`, {
                          scroll: false
                        })
                      }
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className='flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4'>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>Rows per page</span>
            <Select value={String(pagination.pageSize)} onValueChange={value => table.setPageSize(Number(value))}>
              <SelectTrigger className='w-18' aria-label='Rows per page'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 25].map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center gap-3'>
            <span className='text-muted-foreground text-sm'>
              Page {pageCount === 0 ? 0 : pagination.pageIndex + 1} of {pageCount}
            </span>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='icon'
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label='Previous page'
              >
                <ChevronLeftIcon className='size-4' />
              </Button>
              <Button
                variant='outline'
                size='icon'
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label='Next page'
              >
                <ChevronRightIcon className='size-4' />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PayrollRunHistory
