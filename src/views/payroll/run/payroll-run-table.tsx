'use client'

// Third-party Imports
import type { ColumnDef, FilterFn, Table as TanstackTable } from '@tanstack/react-table'
import { DownloadIcon, EyeIcon, RefreshCwIcon } from 'lucide-react'

// Type Imports
import type { PayRunExceptionSeverity } from '@/types/payroll/pay-run-types'
import type { PayrollRunRow } from '@/types/payroll/run-workspace-types'
import type { ObjectCommand } from '@/types/common/object-context-types'
import type { TableColumn, TableDefinition, TableFilterOption } from '@/types/common/table-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DataTable from '@/components/shared/DataTable'
import { employeeCommands, employeeObject } from '@/views/payroll/payroll-objects'
import { ExceptionBadge } from './exception-badge'
import VarianceValue from '@/views/payroll/variance-value'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { EXCEPTION_SEVERITY_LABELS, EXCEPTION_SEVERITY_ORDER } from '@/utils/payroll-metrics'
import {
  EMPLOYEE_PAYROLL_STATUS_LABELS,
  EMPLOYEE_PAYROLL_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  initials
} from '@/utils/payroll-workspace'
import { inSet } from '@/utils/table-utils'

/* -------------------------------------------------------------------------------------------- */
/* Domain filters                                                                               */
/* -------------------------------------------------------------------------------------------- */

/**
 * Multi-select on the exceptions column. Values are severities, plus 'none' for "clean rows only".
 * Resolved exceptions do not count — the filter is about what still needs attention.
 *
 * This is why `exceptions` is a `signal` column rather than a `status` one: the stored value is a
 * severity rank, the filter's values are a vocabulary, and the two are not the same set. The engine
 * reads that from the semantic and correctly refuses to count facets against it.
 */
const EXCEPTION_FILTER_NONE = 'none'

const hasOpenException: FilterFn<PayrollRunRow> = (row, _columnId, filterValue: string[]) => {
  if (!filterValue || filterValue.length === 0) return true

  const open = row.original.exceptions.filter(e => !e.resolvedAt)

  if (filterValue.includes(EXCEPTION_FILTER_NONE) && open.length === 0) return true

  return open.some(e => filterValue.includes(e.severity))
}

/* -------------------------------------------------------------------------------------------- */
/* Columns                                                                                      */
/* -------------------------------------------------------------------------------------------- */

const moneyCell = (value: PayrollRunRow['gross'], emphasis?: boolean) => (
  <span className={cn('block text-right tabular-nums', emphasis && 'font-medium')}>{formatMoney(value)}</span>
)

/**
 * What each column *is*. The engine reads these to decide alignment, sort behaviour, which filters
 * can honestly be counted and which columns a search may look at — none of which this file states
 * twice.
 *
 * `employee` is pinned here and nowhere else. The engine works out where the frozen block ends,
 * including the width of the checkbox column it renders itself, so no payroll code knows or cares
 * that a checkbox sits to the left of the name.
 */
const EMPLOYEE_COLUMNS: TableColumn[] = [
  { id: 'employee', label: 'Employee', semantic: 'identity', isAnchor: true, pinned: true },
  { id: 'department', label: 'Department', semantic: 'relation', hideable: true },
  { id: 'location', label: 'Location', semantic: 'relation', hideable: true },
  { id: 'gross', label: 'Gross', semantic: 'money', hideable: true },
  { id: 'net', label: 'Net', semantic: 'money', hideable: true },
  { id: 'variance', label: 'Variance', semantic: 'money', hideable: true },
  { id: 'payrollStatus', label: 'Payroll status', semantic: 'status', hideable: true },
  { id: 'exceptions', label: 'Exceptions', semantic: 'signal', hideable: true },
  { id: 'paymentStatus', label: 'Payment', semantic: 'status', hideable: true }
]

/**
 * The register's cells. Selection and the command overflow are not here: those are structural
 * columns the engine renders from `selection` and `getCommands`, so a domain never builds them.
 */
export const buildPayrollColumns = (onSelectEmployee: (employeeId: string) => void): ColumnDef<PayrollRunRow>[] => [
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
    size: 260
  },
  {
    id: 'department',
    header: 'Department',
    accessorKey: 'departmentId',
    filterFn: inSet<PayrollRunRow>(),
    sortingFn: (a, b) => a.original.departmentName.localeCompare(b.original.departmentName),
    cell: ({ row }) => <span className='text-muted-foreground'>{row.original.departmentName}</span>
  },
  {
    id: 'location',
    header: 'Location',
    accessorKey: 'locationId',
    filterFn: inSet<PayrollRunRow>(),
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

      return <VarianceValue value={variance} percent={variancePercent} emptyLabel='New' className='block text-right' />
    }
  },
  {
    id: 'payrollStatus',
    header: 'Payroll status',
    accessorKey: 'payrollStatus',
    filterFn: inSet<PayrollRunRow>(),
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
    filterFn: inSet<PayrollRunRow>(),
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

  /** False while the workspace is showing another tab. The panel stays mounted; it stops answering. */
  active: boolean
  search: string
  onSearchChange: (value: string) => void
  departments: TableFilterOption[]
  locations: TableFilterOption[]
  onSelectEmployee: (employeeId: string) => void
  onOpenProperties: (row: PayrollRunRow) => void
  onViewExceptions?: (employeeId: string) => void
  onExport: (rows: PayrollRunRow[]) => void

  /** Absent when the actor may not run these operations; the engine then never offers them. */
  onRecalculate?: (employeeIds: string[]) => void
  onAcknowledgeWarnings?: (employeeIds: string[]) => void

  /** Once approved, inputs and exceptions are frozen; only export remains. */
  locked: boolean
}

/**
 * The register: what a payroll run's employees are, and what may be done to them.
 *
 * Everything about how a table behaves — sorting, the filter controls, selection, pinning, the
 * command surfaces, pagination — belongs to the engine. What stays here is what only payroll can
 * say: what these columns mean, which dimensions are worth filtering and what their values are
 * called, and which bulk operations this selection of payslips actually admits.
 */
const PayrollRunTable = ({
  table,
  active,
  search,
  onSearchChange,
  departments,
  locations,
  onSelectEmployee,
  onOpenProperties,
  onViewExceptions,
  onExport,
  onRecalculate,
  onAcknowledgeWarnings,
  locked
}: Props) => {
  const needle = search.trim()
  const datasetEmpty = table.getCoreRowModel().rows.length === 0
  const filtered = table.getState().columnFilters.length > 0 || needle.length > 0

  // Built for the definition rather than inside the empty branch, so it has to hold for every
  // combination — including a run that genuinely has nobody on it, which "no employees match
  // these filters" would have misreported as a filtering problem.
  const emptyMessage = datasetEmpty
    ? 'This run has no employees.'
    : needle
      ? `No employees match “${needle}”.`
      : 'No employees match these filters.'

  /**
   * Which operations this selection admits, resolved against the rows themselves.
   *
   * Acknowledge is absent — not disabled — when nothing in the selection has an open warning,
   * because a control that explains what it cannot do is chrome. Nothing here is destructive:
   * payroll bulk actions re-run, acknowledge or export, and they never delete.
   */
  const bulkActions = (rows: PayrollRunRow[]): ObjectCommand[] => {
    const employeeIds = rows.map(row => row.employeeId)
    const commands: ObjectCommand[] = []

    const acknowledgeable = rows.reduce(
      (total, row) =>
        total + row.exceptions.filter(e => e.severity === 'warning' && !e.resolvedAt && !e.acknowledgedAt).length,
      0
    )

    if (!locked && onRecalculate) {
      commands.push({
        id: 'recalculate',
        label: 'Recalculate',
        family: 'update',
        icon: RefreshCwIcon,
        onSelect: () => onRecalculate(employeeIds)
      })
    }

    if (!locked && onAcknowledgeWarnings && acknowledgeable > 0) {
      commands.push({
        id: 'acknowledge',
        label: `Acknowledge ${acknowledgeable} ${acknowledgeable === 1 ? 'warning' : 'warnings'}`,
        family: 'update',
        icon: EyeIcon,
        onSelect: () => onAcknowledgeWarnings(employeeIds)
      })
    }

    commands.push({
      id: 'export-selected',
      label: 'Export selected',
      family: 'read',
      icon: DownloadIcon,
      onSelect: () => onExport(rows)
    })

    return commands
  }

  const definition: TableDefinition<PayrollRunRow> = {
    id: 'payroll-register',
    getRowId: row => row.employeeId,
    columns: EMPLOYEE_COLUMNS,
    mode: 'client',
    density: 'compact',
    noun: { one: 'employee', many: 'employees' },
    pageSizes: [25, 50, 100],
    getObject: employeeObject,
    getCommands: row => employeeCommands(row, { onOpen: onSelectEmployee, onViewExceptions }),

    // Named, not inferred: this row has two `read` commands, and the one a click means is Open.
    getDefaultCommandId: () => 'open',
    onOpenProperties,
    selection: { bulkActions },
    filters: [
      {
        columnId: 'payrollStatus',
        label: 'Status',
        options: Object.entries(EMPLOYEE_PAYROLL_STATUS_LABELS).map(([value, label]) => ({ value, label }))
      },
      {
        columnId: 'exceptions',
        label: 'Exceptions',
        options: [
          ...Object.entries(EXCEPTION_SEVERITY_LABELS).map(([value, label]) => ({ value, label })),
          { value: EXCEPTION_FILTER_NONE, label: 'No open exceptions' }
        ]
      },
      { columnId: 'department', label: 'Department', options: departments },
      { columnId: 'location', label: 'Location', options: locations },
      {
        columnId: 'paymentStatus',
        label: 'Payment',
        options: Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
      }
    ],
    emptyState: {
      message: emptyMessage,
      onClear: filtered
        ? () => {
            table.resetColumnFilters()
            onSearchChange('')
          }
        : undefined
    },
    onExport: rows => onExport(rows)
  }

  return (
    <DataTable
      definition={definition}
      table={table}
      active={active}
      caption='Every employee on this run'
      search={search}
      onSearchChange={onSearchChange}
      className='h-[min(70dvh,56rem)] min-h-[28rem]'
    />
  )
}

export default PayrollRunTable
