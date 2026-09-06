'use client'

// React Imports
import type { CSSProperties } from 'react'

// Third-party Imports
import type { Column, ColumnDef, FilterFn, Table as TanstackTable } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from 'lucide-react'

// Type Imports
import type { PayRunExceptionSeverity } from '@/types/payroll/pay-run-types'
import type { PayrollRunRow } from '@/types/payroll/run-workspace-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExceptionBadge } from './exception-badge'
import VarianceValue from '@/views/payroll/variance-value'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { EXCEPTION_SEVERITY_ORDER } from '@/utils/payroll-metrics'
import {
  EMPLOYEE_PAYROLL_STATUS_LABELS,
  EMPLOYEE_PAYROLL_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  initials
} from '@/utils/payroll-workspace'
import { ariaSortFor } from '@/utils/table-utils'

/* -------------------------------------------------------------------------------------------- */
/* Filters                                                                                      */
/* -------------------------------------------------------------------------------------------- */

/** Multi-select on a scalar column: keep the row when its value is one of the chosen ones. */
export const inSet: FilterFn<PayrollRunRow> = (row, columnId, filterValue: string[]) =>
  !filterValue || filterValue.length === 0 || filterValue.includes(String(row.getValue(columnId)))

/**
 * Multi-select on the exceptions column. Values are severities, plus 'none' for "clean rows only".
 * Resolved exceptions do not count — the filter is about what still needs attention.
 */
export const EXCEPTION_FILTER_NONE = 'none'

export const hasOpenException: FilterFn<PayrollRunRow> = (row, _columnId, filterValue: string[]) => {
  if (!filterValue || filterValue.length === 0) return true

  const open = row.original.exceptions.filter(e => !e.resolvedAt)

  if (filterValue.includes(EXCEPTION_FILTER_NONE) && open.length === 0) return true

  return open.some(e => filterValue.includes(e.severity))
}

/* -------------------------------------------------------------------------------------------- */
/* Pinning                                                                                      */
/* -------------------------------------------------------------------------------------------- */

/**
 * The identity block — checkbox and employee — stays put while the money columns scroll. Nine
 * columns of payslip do not fit at 1280 with the sidebar open, and a figure whose row you can no
 * longer name is not checkable.
 *
 * `getStart('left')` sums the *declared* sizes of the columns before this one, so a pinned column
 * only lands in the right place if it also renders at its declared width — hence the width triple
 * rather than the header's usual size hint.
 */
export const PINNED_COLUMNS = ['select', 'employee']

const pinnedStyle = (column: Column<PayrollRunRow, unknown>): CSSProperties | undefined => {
  if (!column.getIsPinned()) return undefined

  const width = column.getSize()

  return { left: `${column.getStart('left')}px`, width, minWidth: width, maxWidth: width }
}

/**
 * `bg-inherit` takes the row's own background, so a pinned cell keeps the hover, selected and
 * inspected tints instead of punching an untinted hole in the row. Those tints are translucent,
 * which would let the scrolling columns show through, so an opaque card layer sits behind them.
 * The seam border only appears on the last pinned column, and only once there is something to
 * the right of it.
 */
const pinnedClass = (column: Column<PayrollRunRow, unknown>, header?: boolean) =>
  column.getIsPinned() &&
  cn(
    'sticky bg-inherit before:bg-card before:absolute before:inset-0 before:-z-10',
    header ? 'z-30' : 'z-10',
    column.getIsLastColumn('left') &&
      'after:border-border after:absolute after:inset-y-0 after:-right-px after:border-r'
  )

/* -------------------------------------------------------------------------------------------- */
/* Columns                                                                                      */
/* -------------------------------------------------------------------------------------------- */

const RIGHT_ALIGNED = new Set(['gross', 'net', 'variance'])

const moneyCell = (value: PayrollRunRow['gross'], emphasis?: boolean) => (
  <span className={cn('block text-right tabular-nums', emphasis && 'font-medium')}>{formatMoney(value)}</span>
)

/**
 * Column definitions take the select handler as an argument rather than reading it from table
 * meta: `TableMeta` is augmented elsewhere in this app with the users table's callbacks, and
 * satisfying that shape here would mean passing no-op user handlers to a payroll table.
 */
export const buildPayrollColumns = (onSelectEmployee: (employeeId: string) => void): ColumnDef<PayrollRunRow>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all employees on this page'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label={`Select ${row.original.name}`}
      />
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false
  },
  {
    id: 'employee',
    header: 'Employee',
    accessorKey: 'name',
    cell: ({ row }) => (
      <div className='flex items-center gap-2.5'>
        <Avatar className='size-7'>
          {row.original.avatar && <AvatarImage src={row.original.avatar} alt='' />}
          <AvatarFallback className='text-[10px]'>{initials(row.original.name)}</AvatarFallback>
        </Avatar>
        <div className='flex min-w-0 flex-col'>
          <Button
            variant='link'
            className='h-auto justify-start p-0 text-sm font-medium'
            onClick={() => onSelectEmployee(row.original.employeeId)}
          >
            <span className='truncate'>{row.original.name}</span>
          </Button>
          <span className='text-muted-foreground truncate text-xs'>
            {row.original.employeeNumber} · {row.original.positionTitle}
          </span>
        </div>
      </div>
    ),
    size: 260,
    enableHiding: false
  },
  {
    id: 'department',
    header: 'Department',
    accessorKey: 'departmentId',
    filterFn: inSet,
    sortingFn: (a, b) => a.original.departmentName.localeCompare(b.original.departmentName),
    cell: ({ row }) => <span className='text-muted-foreground'>{row.original.departmentName}</span>
  },
  {
    id: 'location',
    header: 'Location',
    accessorKey: 'locationId',
    filterFn: inSet,
    sortingFn: (a, b) => a.original.locationName.localeCompare(b.original.locationName),
    cell: ({ row }) => <span className='text-muted-foreground'>{row.original.locationName}</span>
  },
  {
    id: 'gross',
    header: 'Gross',
    accessorFn: row => row.gross.amount,
    cell: ({ row }) => moneyCell(row.original.gross)
  },
  {
    id: 'net',
    header: 'Net',
    accessorFn: row => row.net.amount,
    cell: ({ row }) => moneyCell(row.original.net, true)
  },
  {
    id: 'variance',
    header: 'Variance',

    // New joiners sort to the bottom rather than as zero, which would read as "unchanged".
    accessorFn: row => row.variance?.amount ?? Number.NEGATIVE_INFINITY,
    cell: ({ row }) => {
      const { variance, variancePercent } = row.original

      return (
        <VarianceValue
          value={variance}
          percent={variancePercent}
          emptyLabel='New'
          className='block text-right'
        />
      )
    }
  },
  {
    id: 'payrollStatus',
    header: 'Payroll status',
    accessorKey: 'payrollStatus',
    filterFn: inSet,
    cell: ({ row }) => (
      <Badge
        className={cn(
          'h-auto rounded-sm px-1.5 py-0.5 text-xs',
          EMPLOYEE_PAYROLL_STATUS_STYLES[row.original.payrollStatus]
        )}
      >
        {EMPLOYEE_PAYROLL_STATUS_LABELS[row.original.payrollStatus]}
      </Badge>
    )
  },
  {
    id: 'exceptions',
    header: 'Exceptions',
    accessorFn: row => row.openBlockers * 100 + row.openWarnings,
    filterFn: hasOpenException,
    cell: ({ row }) => {
      const open = row.original.exceptions.filter(e => !e.resolvedAt)

      if (open.length === 0) return <span className='text-muted-foreground text-xs'>—</span>

      const bySeverity = new Map<PayRunExceptionSeverity, number>()

      for (const exception of open) {
        bySeverity.set(exception.severity, (bySeverity.get(exception.severity) ?? 0) + 1)
      }

      return (
        <span className='flex flex-wrap gap-1'>
          {[...bySeverity.entries()]
            .sort((a, b) => EXCEPTION_SEVERITY_ORDER[a[0]] - EXCEPTION_SEVERITY_ORDER[b[0]])
            .map(([severity, count]) => (
              <ExceptionBadge key={severity} severity={severity} count={count} />
            ))}
        </span>
      )
    }
  },
  {
    id: 'paymentStatus',
    header: 'Payment',
    accessorKey: 'paymentStatus',
    filterFn: inSet,
    cell: ({ row }) => (
      <Badge
        className={cn('h-auto rounded-sm px-1.5 py-0.5 text-xs', PAYMENT_STATUS_STYLES[row.original.paymentStatus])}
      >
        {PAYMENT_STATUS_LABELS[row.original.paymentStatus]}
      </Badge>
    )
  }
]

/* -------------------------------------------------------------------------------------------- */
/* Table                                                                                        */
/* -------------------------------------------------------------------------------------------- */

type Props = {
  table: TanstackTable<PayrollRunRow>
  selectedEmployeeId: string | null
  onSelectEmployee: (employeeId: string) => void

  /** What to say when filters leave nothing. The caller knows what was searched for. */
  emptyMessage: string
  onClearFilters?: () => void
}

/**
 * The register. Same TanStack rendering as the other datatables in this app, at a denser row
 * height: an approver scans 30 payslips at a time and h-14 rows put half of them below the fold.
 */
const PayrollRunTable = ({ table, selectedEmployeeId, onSelectEmployee, emptyMessage, onClearFilters }: Props) => {
  const rows = table.getRowModel().rows
  const columnCount = table.getVisibleLeafColumns().length
  const { pageIndex, pageSize } = table.getState().pagination
  const total = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='min-h-0 flex-1 overflow-auto'>
        <Table>
          <TableHeader className='bg-card sticky top-0 z-20'>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className='bg-card h-10'>
                {headerGroup.headers.map(header => {
                  const alignRight = RIGHT_ALIGNED.has(header.column.id)
                  const sorted = header.column.getIsSorted()

                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={ariaSortFor(header.column)}
                      style={
                        pinnedStyle(header.column) ?? {
                          width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined
                        }
                      }
                      className={cn(
                        'text-muted-foreground text-xs first:pl-4 last:pr-4',
                        alignRight && 'text-right',
                        pinnedClass(header.column, true)
                      )}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className='h-32 text-center'>
                  <div className='text-muted-foreground flex flex-col items-center gap-2 text-sm'>
                    <span>{emptyMessage}</span>
                    {onClearFilters && (
                      <Button variant='link' size='sm' onClick={onClearFilters}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => {
                const inspected = row.original.employeeId === selectedEmployeeId

                // Mouse convenience only. The name in the employee cell is the real control, so
                // keyboard and assistive-tech users never depend on this handler. Clicks that land
                // on a control inside the row — checkbox, name, link — are that control's business.
                const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
                  if ((event.target as HTMLElement).closest('button, a, [role=checkbox], input')) return

                  onSelectEmployee(row.original.employeeId)
                }

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    aria-current={inspected ? 'true' : undefined}
                    className={cn('bg-card h-11 cursor-pointer', inspected && 'bg-primary/5 hover:bg-primary/5')}
                    onClick={handleRowClick}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        style={pinnedStyle(cell.column)}
                        className={cn('py-1.5 first:pl-4 last:pr-4', pinnedClass(cell.column))}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2'>
        <p className='text-muted-foreground text-xs tabular-nums' aria-live='polite'>
          {total === 0
            ? 'No employees'
            : `Showing ${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, total)} of ${total}`}
          {table.getSelectedRowModel().rows.length > 0 && ` · ${table.getSelectedRowModel().rows.length} selected`}
        </p>

        <div className='flex items-center gap-3'>
          {/* Rows-per-page is a preference, not a position. It goes first when the footer tightens. */}
          <div className='hidden items-center gap-2 @xl:flex'>
            <span className='text-muted-foreground text-xs'>Rows</span>
            <Select value={String(pageSize)} onValueChange={value => value && table.setPageSize(Number(value))}>
              <SelectTrigger size='sm' className='w-16' aria-label='Rows per page'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[25, 50, 100].map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className='text-muted-foreground hidden text-xs tabular-nums @md:inline'>
            Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
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

export default PayrollRunTable
