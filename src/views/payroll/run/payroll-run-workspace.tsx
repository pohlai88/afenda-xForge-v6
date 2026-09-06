'use client'

// React Imports
import { useMemo, useState, useTransition } from 'react'

// Third-party Imports
import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState
} from '@tanstack/react-table'
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { CheckIcon, DownloadIcon, RefreshCwIcon, UploadIcon } from 'lucide-react'
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import { toast } from 'sonner'

// Type Imports
import type { Department, WorkLocation } from '@/types/hrm/employee-types'
import type { PayRun, PayRunExceptionSeverity, Payslip } from '@/types/payroll/pay-run-types'
import type { PayrollRunRow } from '@/types/payroll/run-workspace-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ExceptionInspector from './exception-inspector'
import ExceptionList, { type ExceptionListItem } from './exception-list'
import ExceptionSummary from './exception-summary'
import PayrollApprovalDialog from './payroll-approval-dialog'
import PayrollAuditTimeline from './payroll-audit-timeline'
import PayrollBulkActions from './payroll-bulk-actions'
import PayrollEmployeeInspector, { type PayHistoryPoint } from './payroll-employee-inspector'
import PayrollMetricRow, { type PayrollMetric } from './payroll-metric-row'
import PayrollReconciliation from './payroll-reconciliation'
import PayrollRunHeader from './payroll-run-header'
import PayrollRunTable, { buildPayrollColumns } from './payroll-run-table'
import PayrollStageBar from './payroll-stage-bar'
import PayrollImport, { type ImportRow } from './payroll-import'
import PayrollTableToolbar from './payroll-table-toolbar'

// Hook Imports
import { useIsMobile } from '@/hooks/use-mobile'

// Action Imports
import {
  acknowledgeException,
  acknowledgeWarnings,
  approveRun,
  importPayrollInputs,
  recalculateRun,
  reopenException,
  resolveException
} from '@/app/server/actions'

// Util Imports
import { exportPayrollRegisterToCsv } from '@/utils/export-payroll-utils'
import { formatMoney } from '@/utils/money'
import { changeVsPrevious, countExceptions, formatChange } from '@/utils/payroll-metrics'
import { auditEvents, formatPeriod, formatSignedMoney, isLocked, refreshRows } from '@/utils/payroll-workspace'

/**
 * Whoever is signed in. There is no auth in this app yet, so the Finance head stands in; when a
 * session exists this becomes a prop from the page.
 */
const CURRENT_USER_ID = 'emp-020'

const VIEWS = ['employees', 'exceptions', 'reconciliation', 'audit'] as const

type Props = {
  run: PayRun
  previousRun?: PayRun
  rows: PayrollRunRow[]
  previousSlips: Payslip[]
  departments: Department[]
  locations: WorkLocation[]

  /** Employee id -> display name, for actors, owners and approvers. */
  employeeNames: Record<string, string>
  historyByEmployee: Record<string, PayHistoryPoint[]>
  daysToPayday: number | null
}

/**
 * The payroll operations workspace. One screen, four views, and a persistent inspector: most of
 * a payroll cycle should be workable without leaving it.
 *
 * State that someone might want to share or come back to — which view, which employee — lives in
 * the URL. Everything else is local. Mutations (acknowledge, resolve, approve, recalculate) are
 * applied to local run state because the data layer is still the fake-db; each handler is the
 * place a server action will be called from when one exists.
 */
const PayrollRunWorkspace = ({
  run: initialRun,
  previousRun,
  rows: initialRows,
  previousSlips,
  departments,
  locations,
  employeeNames,
  historyByEmployee,
  daysToPayday
}: Props) => {
  const isMobile = useIsMobile()

  // Run state — status, approvals, exceptions — is what the session mutates.
  const [run, setRun] = useState(initialRun)
  const [changedSinceReview, setChangedSinceReview] = useState(0)

  const rows = useMemo(() => refreshRows(initialRows, run), [initialRows, run])
  const locked = isLocked(run.status)
  const nameOf = (employeeId: string) => employeeNames[employeeId] ?? employeeId

  // URL state.
  const [view, setView] = useQueryState('view', parseAsStringLiteral(VIEWS).withDefault('employees'))

  const [employeeId, setEmployeeId] = useQueryState(
    'employee',
    parseAsString.withOptions({ clearOnDefault: true, history: 'replace' })
  )

  // Local UI state.
  const [exceptionId, setExceptionId] = useState<string | null>(null)
  const [exceptionSeverity, setExceptionSeverity] = useState<PayRunExceptionSeverity | null>(null)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  // Table state.
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ location: false })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo(() => buildPayrollColumns(id => setEmployeeId(id)), [setEmployeeId])

  // Same opt-out the other datatables in this repo carry: useReactTable returns functions the
  // React Compiler cannot memoize, so it declines to compile the component rather than risk
  // stale UI.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getRowId: row => row.employeeId,
    enableRowSelection: true,
    enableSortingRemoval: false,
    globalFilterFn: (row, _columnId, value: string) => {
      const needle = value.trim().toLowerCase()

      if (!needle) return true

      const { name, employeeNumber, positionTitle, departmentName } = row.original

      return [name, employeeNumber, positionTitle, departmentName].some(field => field.toLowerCase().includes(needle))
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel()
  })

  /* ---------------------------------------------------------------------------------------- */
  /* Derived                                                                                  */
  /* ---------------------------------------------------------------------------------------- */

  const selectedRow = employeeId ? rows.find(row => row.employeeId === employeeId) : undefined
  const rowByEmployee = new Map(rows.map(row => [row.employeeId, row]))
  const departmentNames = new Map(departments.map(d => [d.id, d.name]))

  const exceptionItems: ExceptionListItem[] = run.exceptions.map(exception => {
    const subjectRow = exception.employeeId ? rowByEmployee.get(exception.employeeId) : undefined

    return {
      ...exception,
      subject:
        subjectRow?.name ??
        (exception.departmentId ? departmentNames.get(exception.departmentId) : undefined) ??
        'Run-wide',
      avatar: subjectRow?.avatar
    }
  })

  const selectedException = exceptionId ? (exceptionItems.find(e => e.id === exceptionId) ?? null) : null
  const counts = countExceptions(run.exceptions)
  const audit = auditEvents(run, nameOf)

  const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id])
  const selectedRows = rows.filter(row => selectedIds.includes(row.employeeId))

  const acknowledgeableCount = selectedRows.reduce(
    (total, row) =>
      total + row.exceptions.filter(e => e.severity === 'warning' && !e.resolvedAt && !e.acknowledgedAt).length,
    0
  )

  const netDelta = previousRun ? run.totals.netPay.amount - previousRun.totals.netPay.amount : null

  const metrics: PayrollMetric[] = [
    {
      key: 'employees',
      label: 'Employees',
      value: String(run.employeeCount),
      detail: previousRun
        ? `${run.employeeCount - previousRun.employeeCount >= 0 ? '+' : ''}${run.employeeCount - previousRun.employeeCount} vs ${previousRun.reference}`
        : 'First run'
    },
    {
      key: 'gross',
      label: 'Gross',
      value: formatMoney(run.totals.grossPay),
      detail: formatChange(changeVsPrevious(run.totals.grossPay, previousRun?.totals.grossPay))
    },
    {
      key: 'net',
      label: 'Net',
      value: formatMoney(run.totals.netPay),
      detail: formatChange(changeVsPrevious(run.totals.netPay, previousRun?.totals.netPay))
    },
    {
      key: 'employer-cost',
      label: 'Employer cost',
      value: formatMoney(run.totals.employerCost),
      detail: formatChange(changeVsPrevious(run.totals.employerCost, previousRun?.totals.employerCost))
    },
    {
      key: 'variance',
      label: 'Net variance',
      value: netDelta === null ? '—' : formatSignedMoney({ amount: netDelta, currency: run.currency }),
      detail: previousRun ? `vs ${previousRun.reference}` : 'No previous run',
      tone: netDelta === null ? 'default' : netDelta > 0 ? 'success' : netDelta < 0 ? 'destructive' : 'default'
    },
    {
      key: 'exceptions',
      label: 'Open exceptions',
      value: String(counts.open),
      detail:
        counts.open === 0
          ? 'Nothing outstanding'
          : `${counts.blocking} blocking · ${counts.error} error · ${counts.warning} warning`,
      tone: counts.blocking > 0 || counts.error > 0 ? 'destructive' : counts.warning > 0 ? 'warning' : 'success',
      onClick: () => setView('exceptions')
    }
  ]

  /* ---------------------------------------------------------------------------------------- */
  /* Handlers                                                                                 */
  /* ---------------------------------------------------------------------------------------- */

  /**
   * Every mutation follows one shape: apply the change to local state at once so the screen
   * answers immediately, call the server action, then either adopt the record the server sends
   * back (its timestamps and actor win) or put the previous state back and say why. Refusals
   * come back as messages, not exceptions, because a blocked approval is an answer.
   */
  const [, startTransition] = useTransition()

  const commit = <T,>(
    optimistic: () => void,
    action: () => Promise<{ ok: true; data: T } | { ok: false; message: string }>,
    onSuccess: (data: T) => void
  ) => {
    const snapshot = run

    optimistic()
    startTransition(async () => {
      const result = await action()

      if (!result.ok) {
        setRun(snapshot)
        toast.error(result.message)

        return
      }

      onSuccess(result.data)
    })
  }

  const updateException = (id: string, patch: Partial<PayRun['exceptions'][number]>) =>
    setRun(current => ({
      ...current,
      exceptions: current.exceptions.map(e => (e.id === id ? { ...e, ...patch } : e)),
      updatedAt: new Date().toISOString()
    }))

  const handleAcknowledge = (id: string) =>
    commit(
      () => updateException(id, { acknowledgedAt: new Date().toISOString(), acknowledgedBy: CURRENT_USER_ID }),
      () => acknowledgeException(run.id, id),
      updated => {
        setRun(updated)
        toast.success('Exception acknowledged')
      }
    )

  const handleResolve = (id: string) =>
    commit(
      () => {
        updateException(id, { resolvedAt: new Date().toISOString(), resolvedBy: CURRENT_USER_ID })
        setExceptionId(null)
      },
      () => resolveException(run.id, id),
      updated => {
        setRun(updated)
        toast.success('Exception resolved')
      }
    )

  const handleReopen = (id: string) =>
    commit(
      () =>
        updateException(id, {
          resolvedAt: undefined,
          resolvedBy: undefined,
          acknowledgedAt: undefined,
          acknowledgedBy: undefined
        }),
      () => reopenException(run.id, id),
      updated => {
        setRun(updated)
        toast.success('Exception reopened')
      }
    )

  const handleRecalculate = (count: number) => {
    // A count equal to the selection means "these employees"; anything else means the whole run.
    const employeeIds = count === selectedIds.length && count < run.employeeCount ? selectedIds : undefined

    commit(
      () =>
        setRun(current => ({
          ...current,
          calculationVersion: current.calculationVersion + 1,
          lastCalculatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
      () => recalculateRun(run.id, employeeIds),
      ({ run: updated, count: recalculated }) => {
        setRun(updated)
        setChangedSinceReview(total => total + recalculated)
        toast.success(`Calculation #${updated.calculationVersion} complete`, {
          description: `${recalculated} ${recalculated === 1 ? 'payslip' : 'payslips'} recalculated`
        })
      }
    )
  }

  const handleAcknowledgeSelectedWarnings = () => {
    const now = new Date().toISOString()
    const ids = new Set(selectedIds)

    commit(
      () =>
        setRun(current => ({
          ...current,
          exceptions: current.exceptions.map(e =>
            e.severity === 'warning' && !e.resolvedAt && !e.acknowledgedAt && e.employeeId && ids.has(e.employeeId)
              ? { ...e, acknowledgedAt: now, acknowledgedBy: CURRENT_USER_ID }
              : e
          ),
          updatedAt: now
        })),
      () => acknowledgeWarnings(run.id, selectedIds),
      ({ run: updated, count }) => {
        setRun(updated)
        toast.success(`${count} ${count === 1 ? 'warning' : 'warnings'} acknowledged`)
      }
    )
  }

  const handleApprove = () => {
    const now = new Date().toISOString()

    commit(
      () => {
        setRun(current => ({
          ...current,
          status: 'approved',
          approvals: [...current.approvals, { approvedBy: CURRENT_USER_ID, approvedAt: now }],
          updatedAt: now
        }))
        setApprovalOpen(false)
      },
      () => approveRun(run.id, run.calculationVersion),
      updated => {
        setRun(updated)
        toast.success(`${formatPeriod(updated.periodStart, updated.periodEnd)} payroll approved`, {
          description: `Calculation #${updated.calculationVersion} · ${formatMoney(updated.totals.netPay)} net to ${updated.employeeCount} employees`
        })
      }
    )
  }

  const handleImport = (imported: ImportRow[]) => {
    const rows = imported
      .filter(row => row.amount !== null)
      .map(row => ({ employeeNumber: row.employeeNumber, component: row.component, amount: row.amount as number }))

    const employees = new Set(rows.map(row => row.employeeNumber)).size

    commit(
      () => setChangedSinceReview(total => total + employees),
      () => importPayrollInputs(run.id, rows),
      ({ run: updated, imported: count, employees: affected }) => {
        setRun(updated)
        toast.success(`${count} ${count === 1 ? 'input' : 'inputs'} imported`, {
          description: `${affected} ${affected === 1 ? 'employee' : 'employees'} affected · recalculate to apply`
        })
      }
    )
  }

  const handleExport = (subset?: PayrollRunRow[]) => {
    const target = subset ?? table.getFilteredRowModel().rows.map(row => row.original)

    exportPayrollRegisterToCsv(target, run.reference)
    toast.success('Export created', { description: `${target.length} employees · ${run.reference}-register.csv` })
  }

  const openEmployee = (id: string) => {
    setExceptionId(null)
    setView('employees')
    setEmployeeId(id)
  }

  const drillDown = (sortBy: string, desc: boolean) => {
    setSorting([{ id: sortBy, desc }])
    setPagination(p => ({ ...p, pageIndex: 0 }))
    setView('employees')
  }

  const filterDepartment = (departmentId: string) => {
    table.getColumn('department')?.setFilterValue([departmentId])
    setPagination(p => ({ ...p, pageIndex: 0 }))
    setView('employees')
  }

  const canApprove = run.status === 'calculated' || run.status === 'pending_approval'

  const filteredExceptions = exceptionSeverity
    ? exceptionItems.filter(e => e.severity === exceptionSeverity && !e.resolvedAt)
    : exceptionItems

  /* ---------------------------------------------------------------------------------------- */
  /* Render                                                                                   */
  /* ---------------------------------------------------------------------------------------- */

  const inspector = selectedRow && (
    <PayrollEmployeeInspector
      row={selectedRow}
      run={run}
      previousReference={previousRun?.reference}
      history={historyByEmployee[selectedRow.employeeId] ?? []}
      exceptions={exceptionItems.filter(e => selectedRow.exceptions.some(own => own.id === e.id))}
      audit={audit.filter(
        event =>
          event.id.startsWith(`${run.id}-calculated`) || selectedRow.exceptions.some(e => event.id.startsWith(e.id))
      )}
      onSelectException={exception => setExceptionId(exception.id)}
      onClose={() => setEmployeeId(null)}
    />
  )

  const employeesView = (
    <div className='bg-card flex flex-col overflow-hidden rounded-lg border'>
      <PayrollTableToolbar
        table={table}
        search={globalFilter}
        onSearchChange={value => {
          setGlobalFilter(value)
          setPagination(p => ({ ...p, pageIndex: 0 }))
        }}
        departments={departments.map(d => ({ value: d.id, label: d.name }))}
        locations={locations.map(l => ({ value: l.id, label: l.name }))}
        onExport={() => handleExport()}
      />

      {selectedIds.length > 0 && (
        <PayrollBulkActions
          selectedCount={selectedIds.length}
          acknowledgeableCount={acknowledgeableCount}
          locked={locked}
          onRecalculate={() => handleRecalculate(selectedIds.length)}
          onAcknowledgeWarnings={handleAcknowledgeSelectedWarnings}
          onExportSelected={() => handleExport(selectedRows)}
          onClearSelection={() => setRowSelection({})}
        />
      )}

      <div className='h-[min(70dvh,56rem)] min-h-[28rem]'>
        {selectedRow && !isMobile ? (
          <ResizablePanelGroup orientation='horizontal' className='h-full'>
            {/* min-w-0 on both panels: a flex item's default minimum is its content width, and a
                table with nowrap cells would otherwise force the group wider than the page. */}
            <ResizablePanel defaultSize='68%' minSize='45%' className='flex min-h-0 min-w-0 flex-col overflow-hidden'>
              <PayrollRunTable
                table={table}
                selectedEmployeeId={employeeId}
                onSelectEmployee={setEmployeeId}
                emptyMessage={
                  globalFilter ? `No employees match “${globalFilter}”.` : 'No employees match these filters.'
                }
                onClearFilters={() => {
                  table.resetColumnFilters()
                  setGlobalFilter('')
                }}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize='32%'
              minSize='24%'
              maxSize='45%'
              className='flex min-h-0 min-w-0 flex-col overflow-hidden'
            >
              {inspector}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className='flex h-full min-h-0 flex-col'>
            <PayrollRunTable
              table={table}
              selectedEmployeeId={employeeId}
              onSelectEmployee={setEmployeeId}
              emptyMessage={
                globalFilter ? `No employees match “${globalFilter}”.` : 'No employees match these filters.'
              }
              onClearFilters={() => {
                table.resetColumnFilters()
                setGlobalFilter('')
              }}
            />
          </div>
        )}
      </div>

      {isMobile && (
        <Sheet open={!!selectedRow} onOpenChange={open => !open && setEmployeeId(null)}>
          <SheetContent side='right' showCloseButton={false} className='w-full gap-0 p-0 sm:max-w-lg'>
            <SheetTitle className='sr-only'>{selectedRow ? `${selectedRow.name} — payslip` : 'Employee'}</SheetTitle>
            {inspector}
          </SheetContent>
        </Sheet>
      )}
    </div>
  )

  return (
    <div className='flex flex-col gap-4'>
      <PayrollRunHeader
        run={run}
        daysToPayday={daysToPayday}
        actions={
          <>
            {!locked && (
              <Button variant='outline' onClick={() => setImportOpen(true)}>
                <UploadIcon />
                Import inputs
              </Button>
            )}
            {!locked && (
              <Button variant='outline' onClick={() => handleRecalculate(run.employeeCount)}>
                <RefreshCwIcon />
                Recalculate
              </Button>
            )}
            <Button variant='outline' onClick={() => handleExport()}>
              <DownloadIcon />
              Export
            </Button>
            {canApprove && (
              <Button onClick={() => setApprovalOpen(true)}>
                <CheckIcon />
                Approve payroll
              </Button>
            )}
          </>
        }
      />

      <PayrollStageBar status={run.status} />

      <PayrollMetricRow metrics={metrics} />

      <Tabs value={view} onValueChange={value => setView(value as (typeof VIEWS)[number])} className='gap-3'>
        <TabsList variant='line' className='w-full justify-start border-b px-0'>
          <TabsTrigger value='employees' className='flex-none px-3'>
            Employees
          </TabsTrigger>
          <TabsTrigger value='exceptions' className='flex-none px-3'>
            Exceptions
            {counts.open > 0 && (
              <span className='bg-muted text-foreground rounded-full px-1.5 text-[10px] tabular-nums'>
                {counts.open}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value='reconciliation' className='flex-none px-3'>
            Reconciliation
          </TabsTrigger>
          <TabsTrigger value='audit' className='flex-none px-3'>
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value='employees'>{employeesView}</TabsContent>

        <TabsContent value='exceptions'>
          <div className='bg-card rounded-lg border'>
            <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3'>
              <ExceptionSummary
                exceptions={run.exceptions}
                activeSeverity={exceptionSeverity}
                onFilter={setExceptionSeverity}
              />
              <p className='text-muted-foreground text-xs'>
                {counts.blocking > 0 || counts.error > 0
                  ? 'Blockers and errors must be resolved before approval. Warnings may be acknowledged.'
                  : 'Nothing is blocking approval.'}
              </p>
            </div>
            <ExceptionList
              exceptions={filteredExceptions}
              selectedId={exceptionId}
              onSelect={exception => setExceptionId(exception.id)}
              emptyMessage={
                exceptionSeverity ? 'No open exceptions at this severity.' : 'No exceptions raised on this run.'
              }
            />
          </div>
        </TabsContent>

        <TabsContent value='reconciliation'>
          <PayrollReconciliation
            run={run}
            previousRun={previousRun}
            rows={rows}
            previousSlips={previousSlips}
            departments={departments}
            onDrillDown={drillDown}
            onFilterDepartment={filterDepartment}
            onSelectEmployee={openEmployee}
          />
        </TabsContent>

        <TabsContent value='audit'>
          <div className='bg-card rounded-lg border p-4'>
            <PayrollAuditTimeline events={audit} />
          </div>
        </TabsContent>
      </Tabs>

      <ExceptionInspector
        exception={selectedException}
        open={!!selectedException}
        onOpenChange={open => !open && setExceptionId(null)}
        nameOf={nameOf}
        locked={locked}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
        onReopen={handleReopen}
        onOpenEmployee={openEmployee}
      />

      <PayrollImport
        open={importOpen}
        onOpenChange={setImportOpen}
        runReference={run.reference}
        employeeNumbers={new Set(rows.map(row => row.employeeNumber))}
        componentCodes={
          new Set(rows.flatMap(row => row.payslip.components.map(c => c.code)).concat(['SHIFT', 'BONUS']))
        }
        currency={run.currency}
        onImport={handleImport}
      />

      <PayrollApprovalDialog
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        run={run}
        exceptions={run.exceptions}
        changedSinceReview={changedSinceReview}
        preparedBy={nameOf(run.createdBy)}
        reviewedBy={
          run.exceptions.some(e => e.acknowledgedBy)
            ? nameOf(run.exceptions.find(e => e.acknowledgedBy)!.acknowledgedBy!)
            : undefined
        }
        onApprove={handleApprove}
        onReviewExceptions={() => setView('exceptions')}
      />
    </div>
  )
}

export default PayrollRunWorkspace
