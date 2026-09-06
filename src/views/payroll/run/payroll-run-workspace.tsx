'use client'

// React Imports
import { useMemo, useState, useTransition } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

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
import {
  CheckIcon,
  ClipboardCheckIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  UploadIcon
} from 'lucide-react'
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import { toast } from 'sonner'

// Type Imports
import type { Department, WorkLocation } from '@/types/hrm/employee-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { PayRun, PayRunExceptionSeverity, Payslip } from '@/types/payroll/pay-run-types'
import type { PayrollActor } from '@/types/payroll/permission-types'
import type { PayrollRunRow } from '@/types/payroll/run-workspace-types'
import type { AccessRole, ApprovalSettings } from '@/types/payroll/settings-types'
import type { ApprovalReason } from '@/utils/payroll-approval'

// Component Imports
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CalculationStaleBanner from './calculation-stale-banner'
import ExceptionInspector from './exception-inspector'
import GrossToNetBreakdown from './gross-to-net-breakdown'
import ExceptionList, { type ExceptionListItem } from './exception-list'
import ExceptionSummary from './exception-summary'
import InputReadinessSheet from './input-readiness-sheet'
import PayrollApprovalDialog from './payroll-approval-dialog'
import PayrollAuditTimeline from './payroll-audit-timeline'
import PayrollEmployeeDrilldown, { type PayHistoryPoint } from './payroll-employee-drilldown'
import PayrollMetricRow, { type PayrollMetric } from './payroll-metric-row'
import PayrollReconciliation from './payroll-reconciliation'
import PayrollReviewDialog from './payroll-review-dialog'
import PayrollRunHeader from './payroll-run-header'
import PayrollRunTable, { buildPayrollColumns } from './payroll-run-table'
import PublishObjectContext from '@/components/layout/PublishObjectContext'
import { ObjectContextMenu } from '@/components/shared/ObjectCommands'
import PropertiesSheet from '@/components/shared/PropertiesSheet'
import {
  employeeObject,
  employeeProperties,
  payRunCommands,
  payRunObject,
  payRunProperties
} from '@/views/payroll/payroll-objects'
import PayrollStageBar from './payroll-stage-bar'
import PayrollImport, { type ImportRow } from './payroll-import'

// Action Imports
import {
  acknowledgeException,
  acknowledgeWarnings,
  approveRun,
  importPayrollInputs,
  markRunReviewed,
  recalculateRun,
  reopenException,
  resolveException
} from '@/app/server/actions'

// Util Imports
import { exportPayrollRegisterToCsv } from '@/utils/export-payroll-utils'
import { formatMoney } from '@/utils/money'
import { evaluatePayrollApproval } from '@/utils/payroll-approval'
import { changeVsPrevious, countExceptions, formatChange } from '@/utils/payroll-metrics'
import { can } from '@/utils/payroll-permissions'
import {
  auditEvents,
  formatPeriod,
  formatSignedMoney,
  inputReadiness,
  isLocked,
  refreshRows
} from '@/utils/payroll-workspace'

const VIEWS = ['employees', 'exceptions', 'reconciliation', 'audit'] as const

type Props = {
  run: PayRun

  /** The legal entity liable for this run, for the header's identity line. */
  entity?: LegalEntity
  previousRun?: PayRun
  rows: PayrollRunRow[]
  previousSlips: Payslip[]
  departments: Department[]
  locations: WorkLocation[]

  /** Employee id -> display name, for actors, owners and approvers. */
  employeeNames: Record<string, string>
  historyByEmployee: Record<string, PayHistoryPoint[]>
  daysToPayday: number | null

  /** Whoever is signed in, with the permissions the server will enforce. */
  actor: PayrollActor

  /** The approval rules and the roles they name, so the dialog reads the same gate as the server. */
  approvalSettings: ApprovalSettings
  roles: AccessRole[]
}

/**
 * The payroll operations workspace. One screen, four views, and an employee drill-down that takes
 * the table's place: most of a payroll cycle should be workable without leaving it.
 *
 * State that someone might want to share or come back to — which view, which employee — lives in
 * the URL. Everything else is local. Every mutation is applied to local run state at once and
 * then sent to its server action; the server's record replaces the optimistic one, or the
 * snapshot comes back with the refusal.
 */
const PayrollRunWorkspace = ({
  run: initialRun,
  entity,
  previousRun,
  rows: initialRows,
  previousSlips,
  departments,
  locations,
  employeeNames,
  historyByEmployee,
  daysToPayday,
  actor,
  approvalSettings,
  roles
}: Props) => {
  const router = useRouter()

  // Run state — status, approvals, exceptions — is what the session mutates.
  const [run, setRun] = useState(initialRun)

  const rows = useMemo(() => refreshRows(initialRows, run), [initialRows, run])
  const locked = isLocked(run.status)
  const nameOf = (employeeId: string) => employeeNames[employeeId] ?? employeeId

  // What this person may do. The server enforces the same permissions; hiding a control here
  // spares them a refusal, it does not grant anything.
  const mayProcess = can(actor, 'payroll.process') && !locked
  const mayReview = can(actor, 'payroll.review') && !locked
  const mayApprove = can(actor, 'payroll.approve')

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
  const [reviewOpen, setReviewOpen] = useState(false)
  const [readinessOpen, setReadinessOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [propertiesEmployee, setPropertiesEmployee] = useState<PayrollRunRow | null>(null)
  const [runPropertiesOpen, setRunPropertiesOpen] = useState(false)

  // Table state.
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ location: false })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })
  const [globalFilter, setGlobalFilter] = useState('')

  // No `onViewExceptions`: the exceptions tab is not filtered to one person, so a command
  // promising that employee's exceptions would land somewhere that shows everyone's.
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

      // Only what the identity column shows. Department is a `relation` with its own filter and
      // its own counts; matching it as loose text here would quietly answer a structured question
      // with a substring, and one department whose name contains another's would prove it.
      const { name, employeeNumber, positionTitle } = row.original

      return [name, employeeNumber, positionTitle].some(field => field.toLowerCase().includes(needle))
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
  const feeds = inputReadiness(run, rows)

  // The one approval verdict, from the same function the server runs.
  const evaluation = evaluatePayrollApproval({ run, actor, settings: approvalSettings, roles })
  const awaitingApproval = run.status === 'calculated' || run.status === 'pending_approval'
  const needsReview = awaitingApproval && !evaluation.reviewed && !evaluation.stale

  /**
   * Which lifecycle action the operator should take next. Exactly one is filled; everything else
   * still available drops to `outline`, and Export — which mutates nothing — leaves the row for the
   * overflow menu. The order is the lifecycle's own: a stale calculation has to be redone before a
   * review means anything, and a review has to exist before an approval can name one.
   *
   * Approve leads even while blocked. It is still the next step, and the approval dialog is where
   * the blocking reasons are stated — the same verdict the server enforces, so nothing is promised
   * that would then be refused silently. Gating it here instead would leave the header with three
   * buttons of equal weight and no answer to "what now".
   */
  const primaryAction: 'recalculate' | 'review' | 'approve' | null =
    evaluation.stale && mayProcess
      ? 'recalculate'
      : needsReview && mayReview
        ? 'review'
        : awaitingApproval && mayApprove
          ? 'approve'
          : null

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
      detail: formatChange(changeVsPrevious(run.totals.netPay, previousRun?.totals.netPay)),
      breakdown: <GrossToNetBreakdown totals={run.totals} />
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

      // Direction, not valence: a run costing more is not a failure and costing less is not a win.
      tone: 'default'
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
      () => updateException(id, { acknowledgedAt: new Date().toISOString(), acknowledgedBy: actor.id }),
      () => acknowledgeException(run.id, id),
      updated => {
        setRun(updated)
        toast.success('Exception acknowledged')
      }
    )

  const handleResolve = (id: string) =>
    commit(
      () => {
        updateException(id, { resolvedAt: new Date().toISOString(), resolvedBy: actor.id })
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

  /**
   * A real calculation happens on the server; the rows this screen holds are the old payslips
   * until the page re-renders, so on success the router is refreshed and the page remounts the
   * workspace on the new calculation version with fresh rows.
   */
  const handleRecalculate = (employeeIds?: string[]) => {
    commit(
      () =>
        setRun(current => ({
          ...current,
          status: current.status === 'pending_approval' ? 'calculated' : current.status,
          calculationVersion: current.calculationVersion + 1,
          lastCalculatedAt: new Date().toISOString(),
          pendingInputs: employeeIds ? current.pendingInputs : undefined,
          updatedAt: new Date().toISOString()
        })),
      () => recalculateRun(run.id, employeeIds),
      ({ run: updated, count: recalculated }) => {
        const diff = updated.lastCalculationDiff

        setRun(updated)
        toast.success(`Calculation #${updated.calculationVersion} complete`, {
          description: diff
            ? `${recalculated} ${recalculated === 1 ? 'payslip' : 'payslips'} recalculated · ${diff.affectedEmployees} changed · net ${formatSignedMoney(diff.netDelta)}${updated.review?.calculationVersion === updated.calculationVersion ? '' : ' · review needed'}`
            : `${recalculated} ${recalculated === 1 ? 'payslip' : 'payslips'} recalculated`
        })
        router.refresh()
      }
    )
  }

  const handleAcknowledgeSelectedWarnings = (employeeIds: string[]) => {
    const now = new Date().toISOString()
    const ids = new Set(employeeIds)

    commit(
      () =>
        setRun(current => ({
          ...current,
          exceptions: current.exceptions.map(e =>
            e.severity === 'warning' && !e.resolvedAt && !e.acknowledgedAt && e.employeeId && ids.has(e.employeeId)
              ? { ...e, acknowledgedAt: now, acknowledgedBy: actor.id }
              : e
          ),
          updatedAt: now
        })),
      () => acknowledgeWarnings(run.id, employeeIds),
      ({ run: updated, count }) => {
        setRun(updated)
        toast.success(`${count} ${count === 1 ? 'warning' : 'warnings'} acknowledged`)
      }
    )
  }

  const handleReview = (note?: string) => {
    const now = new Date().toISOString()

    commit(
      () => {
        setRun(current => ({
          ...current,
          status: 'pending_approval',
          review: {
            calculationVersion: current.calculationVersion,
            reviewedBy: actor.id,
            reviewedAt: now,
            findingsAtReview: { blocking: counts.blocking, error: counts.error, warning: counts.warning },
            acknowledgedWarnings: counts.acknowledged,
            note
          },
          updatedAt: now
        }))
        setReviewOpen(false)
      },
      () => markRunReviewed(run.id, run.calculationVersion, note),
      updated => {
        setRun(updated)
        toast.success(`Calculation #${updated.calculationVersion} reviewed`, {
          description: `${updated.reference} is now awaiting approval`
        })
      }
    )
  }

  const handleApprove = () => {
    const now = new Date().toISOString()

    // A run above the second-approver threshold stays Pending approval after the first signature.
    const complete = run.approvals.length + 1 >= evaluation.signaturesRequired

    commit(
      () => {
        setRun(current => ({
          ...current,
          status: complete ? 'approved' : current.status,
          approvals: [...current.approvals, { approvedBy: actor.id, approvedAt: now }],
          updatedAt: now
        }))
        setApprovalOpen(false)
      },
      () => approveRun(run.id, run.calculationVersion),
      updated => {
        setRun(updated)

        if (updated.status === 'approved') {
          toast.success(`${formatPeriod(updated.periodStart, updated.periodEnd)} payroll approved`, {
            description: `Calculation #${updated.calculationVersion} · ${formatMoney(updated.totals.netPay)} net to ${updated.employeeCount} employees`
          })
        } else {
          toast.success('First signature recorded', {
            description: `${updated.reference} needs a second approver before it is approved`
          })
        }
      }
    )
  }

  const handleImport = (imported: ImportRow[]) => {
    const rows = imported
      .filter(row => row.amount !== null)
      .map(row => ({ employeeNumber: row.employeeNumber, component: row.component, amount: row.amount as number }))

    const employees = new Set(rows.map(row => row.employeeNumber)).size
    const now = new Date().toISOString()

    commit(
      () =>
        setRun(current => ({
          ...current,
          pendingInputs: {
            count: (current.pendingInputs?.count ?? 0) + rows.length,
            employees: Math.max(current.pendingInputs?.employees ?? 0, employees),
            importedAt: now,
            importedBy: actor.id
          },
          updatedAt: now
        })),
      () => importPayrollInputs(run.id, rows),
      ({ run: updated, imported: count, employees: affected }) => {
        setRun(updated)
        toast.success(`${count} ${count === 1 ? 'input' : 'inputs'} imported`, {
          description: `${affected} ${affected === 1 ? 'employee' : 'employees'} affected · calculation #${updated.calculationVersion} is now out of date`
        })
      }
    )
  }

  /** Where the approval dialog sends someone to clear the first thing in the way. */
  const resolveApprovalReason = (reason: ApprovalReason) => {
    if (reason.key === 'stale') handleRecalculate()
    else if (reason.key === 'unreviewed') setReviewOpen(true)
    else if (reason.view) setView(reason.view)
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

  const filteredExceptions = exceptionSeverity
    ? exceptionItems.filter(e => e.severity === exceptionSeverity && !e.resolvedAt)
    : exceptionItems

  /* ---------------------------------------------------------------------------------------- */
  /* Render                                                                                   */
  /* ---------------------------------------------------------------------------------------- */

  // The drill-down walks the table's current order: filtered and sorted, across pages.
  const orderedIds = table.getSortedRowModel().rows.map(row => row.original.employeeId)
  const selectedIndex = selectedRow ? orderedIds.indexOf(selectedRow.employeeId) : -1

  const drilldown = selectedRow && (
    <PayrollEmployeeDrilldown
      row={selectedRow}
      run={run}
      previousReference={previousRun?.reference}
      history={historyByEmployee[selectedRow.employeeId] ?? []}
      exceptions={exceptionItems.filter(e => selectedRow.exceptions.some(own => own.id === e.id))}
      audit={audit.filter(
        event =>
          event.id.startsWith(`${run.id}-calculated`) || selectedRow.exceptions.some(e => event.id.startsWith(e.id))
      )}
      previousEmployeeId={selectedIndex > 0 ? orderedIds[selectedIndex - 1] : undefined}
      nextEmployeeId={
        selectedIndex >= 0 && selectedIndex < orderedIds.length - 1 ? orderedIds[selectedIndex + 1] : undefined
      }
      position={{ index: Math.max(selectedIndex, 0), total: orderedIds.length }}
      onSelectException={exception => setExceptionId(exception.id)}
      onSelectEmployee={setEmployeeId}
      onFilterDepartment={departmentId => {
        setEmployeeId(null)
        filterDepartment(departmentId)
      }}
      onRecalculate={mayProcess ? () => handleRecalculate([selectedRow.employeeId]) : undefined}
      onBack={() => setEmployeeId(null)}
    />
  )

  const handleSearchChange = (value: string) => {
    setGlobalFilter(value)
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }

  // The panel is an @container, not a viewport consumer: with the sidebar expanded a 1280px screen
  // leaves it around 1000px, and the table's controls have to compress on what they actually have.
  //
  // `active` is declared, never sensed. The tab panel stays mounted when the user moves to
  // Exceptions, and a mounted register that still answered right-clicks and commands would be
  // acting on rows nobody can see.
  const employeesView = drilldown ?? (
    <div className='bg-card @container flex flex-col overflow-hidden rounded-lg border'>
      <PayrollRunTable
        table={table}
        active={view === 'employees'}
        search={globalFilter}
        onSearchChange={handleSearchChange}
        departments={departments.map(d => ({ value: d.id, label: d.name }))}
        locations={locations.map(l => ({ value: l.id, label: l.name }))}
        onSelectEmployee={setEmployeeId}
        onOpenProperties={setPropertiesEmployee}
        onExport={handleExport}
        onRecalculate={mayProcess ? handleRecalculate : undefined}
        onAcknowledgeWarnings={mayReview ? handleAcknowledgeSelectedWarnings : undefined}
        locked={locked}
      />
    </div>
  )

  return (
    <div className='flex flex-col gap-4'>
      <ObjectContextMenu
        object={payRunObject(run)}
        commands={payRunCommands(run, true)}
        onOpenProperties={() => setRunPropertiesOpen(true)}
      >
        <PayrollRunHeader
          run={run}
          entity={entity}
          daysToPayday={daysToPayday}
          actions={
            <>
              {mayProcess && primaryAction !== 'recalculate' && (
                <Button variant='outline' onClick={() => handleRecalculate()}>
                  <RefreshCwIcon />
                  Recalculate
                </Button>
              )}
              {mayProcess && (
                <Button variant='outline' onClick={() => setImportOpen(true)}>
                  <UploadIcon />
                  Import inputs
                </Button>
              )}
              {needsReview && mayReview && primaryAction !== 'review' && (
                <Button variant='outline' onClick={() => setReviewOpen(true)}>
                  <ClipboardCheckIcon />
                  Mark as reviewed
                </Button>
              )}
              {awaitingApproval && mayApprove && primaryAction !== 'approve' && (
                <Button variant='outline' onClick={() => setApprovalOpen(true)}>
                  <CheckIcon />
                  Approve payroll
                </Button>
              )}

              {primaryAction === 'recalculate' && (
                <Button onClick={() => handleRecalculate()}>
                  <RefreshCwIcon />
                  Recalculate
                </Button>
              )}
              {primaryAction === 'review' && (
                <Button onClick={() => setReviewOpen(true)}>
                  <ClipboardCheckIcon />
                  Mark as reviewed
                </Button>
              )}
              {primaryAction === 'approve' && (
                <Button onClick={() => setApprovalOpen(true)}>
                  <CheckIcon />
                  Approve payroll
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant='ghost' size='icon' aria-label='More run actions' />}>
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => handleExport()}>
                    <DownloadIcon />
                    Export register
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
      </ObjectContextMenu>

      <PayrollStageBar
        status={run.status}
        inputsPending={!!run.pendingInputs}
        onInputsClick={() => setReadinessOpen(true)}
      />

      <CalculationStaleBanner
        run={run}
        onRecalculate={mayProcess ? () => handleRecalculate() : undefined}
        onShowInputs={() => setReadinessOpen(true)}
      />

      <PayrollMetricRow metrics={metrics} />

      <Tabs value={view} onValueChange={value => setView(value as (typeof VIEWS)[number])} className='gap-3'>
        {/*
          The four triggers need ~424px and a phone gives 375, so without a scroller here the whole
          page scrolls sideways — the tab strip, not the table, was what overflowed. Scrolling keeps
          all four reachable; dropping any of them would hide a view that has no other entrance.

          overflow-y must be pinned too: setting only overflow-x computes the other axis to `auto`,
          and the indicator's 1px puts a 16px scrollbar with arrow buttons on the tab strip.
        */}
        <TabsList variant='line' className='w-full justify-start overflow-x-auto overflow-y-hidden border-b px-0'>
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
              emptyMessage='No exceptions were raised on this run.'
              filtered={!!exceptionSeverity}
              onClearFilter={() => setExceptionSeverity(null)}
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
        locked={!mayReview}
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

      <PayrollReviewDialog open={reviewOpen} onOpenChange={setReviewOpen} run={run} onConfirm={handleReview} />

      <InputReadinessSheet
        open={readinessOpen}
        onOpenChange={setReadinessOpen}
        run={run}
        feeds={feeds}
        onImport={mayProcess ? () => setImportOpen(true) : undefined}
        onRecalculate={mayProcess ? () => handleRecalculate() : undefined}
        onShowExceptions={() => setView('exceptions')}
      />

      <PayrollApprovalDialog
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        run={run}
        evaluation={evaluation}
        preparedBy={nameOf(run.createdBy)}
        reviewedBy={run.review ? nameOf(run.review.reviewedBy) : undefined}
        onApprove={handleApprove}
        onResolve={resolveApprovalReason}
      />

      <PropertiesSheet
        object={payRunObject(run)}
        typeLabel='Pay run'
        sections={payRunProperties(run, nameOf, entity?.name)}
        open={runPropertiesOpen}
        onOpenChange={setRunPropertiesOpen}
      />

      <PropertiesSheet
        object={propertiesEmployee ? employeeObject(propertiesEmployee) : null}
        typeLabel='Employee'
        sections={propertiesEmployee ? employeeProperties(propertiesEmployee) : []}
        open={propertiesEmployee !== null}
        onOpenChange={open => {
          if (!open) setPropertiesEmployee(null)
        }}
      />

      {/* Names the breadcrumb leaf 'PR-SG-2026-09' instead of the id in the URL. */}
      <PublishObjectContext {...payRunObject(run)} />
    </div>
  )
}

export default PayrollRunWorkspace
