'use client'

// React Imports
import { useState, useTransition } from 'react'

// Third-party Imports
import { parseAsStringLiteral, useQueryState } from 'nuqs'

// Third-party Imports
import { toast } from 'sonner'

// Type Imports
import type { Employee } from '@/types/hrm/employee-types'
import type {
  ReportDefinition,
  ReportExport,
  ReportFormat,
  ReportKey,
  ReportTable,
  ReportTables
} from '@/types/payroll/report-types'

// Component Imports
import PayrollCostTrend, { type CostTrendPoint } from '@/views/dashboards/payroll/payroll-cost-trend'
import RecentExports, { type RecentExportRow } from './recent-exports'
import ReportCatalogue from './report-catalogue'
import ReportSheet, { type RunOption } from './report-sheet'

// Action Imports
import { recordReportExport } from '@/app/server/actions'

// Util Imports
import { exportReportTable } from '@/utils/export-report-utils'
import { REPORTS, reportByKey, reportFileName } from '@/utils/payroll-reports'

/**
 * Whoever is signed in, for the provisional row only — the server stamps the real actor. The
 * Finance head stands in until a session exists, as on the run workspace.
 */
const CURRENT_USER_ID = 'emp-020'

type Props = {
  runs: RunOption[]

  /** The run the sheet opens on: the one being worked, so the default file is the useful one. */
  currentRunId: string
  tables: ReportTables
  exports: ReportExport[]
  employees: Employee[]
  costTrend: CostTrendPoint[]
  currencySymbol: string
}

/**
 * The reports page's working half. The file is written in the browser from a table the server
 * already rendered; the export is then recorded server-side so the trail survives a reload. A
 * refusal to record does not take the file back — the person has it — it just says so.
 */
/** Valid values for `?report=`, taken from the catalogue so the two cannot disagree. */
const REPORT_KEYS = REPORTS.map(report => report.key) as [ReportKey, ...ReportKey[]]

const ReportsWorkspace = ({
  runs,
  currentRunId,
  tables,
  exports: initialExports,
  employees,
  costTrend,
  currencySymbol
}: Props) => {
  const [exports, setExports] = useState(initialExports)


  /*
   * Which report the sheet is showing, in the URL like every other inspector in payroll.
   *
   * A report someone pinned has to be openable from the palette, and a selection held only in
   * React state has no address to open. Same shape as `?employee=`, `?filing=` and `?payment=`:
   * replace rather than push, cleared when the sheet closes.
   */
  const [openKey, setOpenKey] = useQueryState(
    'report',
    parseAsStringLiteral(REPORT_KEYS).withOptions({ clearOnDefault: true, history: 'replace' })
  )

  const [, startTransition] = useTransition()

  const people = new Map(
    employees.map(employee => [
      employee.id,
      { name: `${employee.firstName} ${employee.lastName}`, avatar: employee.avatar }
    ])
  )

  const rows: RecentExportRow[] = exports.map(record => ({ ...record, creator: people.get(record.createdBy) }))

  const lastExports = exports.reduce<Partial<Record<ReportKey, ReportExport>>>(
    (last, record) => (last[record.reportKey] ? last : { ...last, [record.reportKey]: record }),
    {}
  )

  const report = openKey ? reportByKey(openKey) : null

  const handleExport = (definition: ReportDefinition, runId: string, format: ReportFormat, table: ReportTable) => {
    const run = runs.find(candidate => candidate.id === runId)
    const runReference = definition.perRun ? run?.reference : undefined
    const fileName = reportFileName(definition, format, runReference)
    const provisionalId = `export-pending-${Date.now()}`

    exportReportTable(table, format, fileName)

    const values = { reportKey: definition.key, runReference, format, rowCount: table.rows.length, fileName }

    setExports(current => [
      { id: provisionalId, ...values, createdAt: new Date().toISOString(), createdBy: CURRENT_USER_ID },
      ...current
    ])

    toast.success('Export created', {
      description: `${table.rows.length} ${table.rows.length === 1 ? 'row' : 'rows'} · ${fileName}`
    })

    startTransition(async () => {
      const result = await recordReportExport(values)

      if (!result.ok) {
        setExports(current => current.filter(record => record.id !== provisionalId))
        toast.error(`The file was saved, but the export could not be recorded. ${result.message}`)

        return
      }

      setExports(current => current.map(record => (record.id === provisionalId ? result.data : record)))
    })
  }

  const handleRepeat = (record: RecentExportRow) => {
    const definition = reportByKey(record.reportKey)
    const run = runs.find(candidate => candidate.reference === record.runReference)
    const runId = definition.perRun ? (run?.id ?? currentRunId) : 'all'
    const table = tables[definition.key][runId]

    if (!table) {
      toast.error(`${definition.name} for ${record.runReference} is no longer available.`)

      return
    }

    handleExport(definition, runId, record.format, table)
  }

  return (
    <>
      <div className='grid grid-cols-6 gap-6'>
        <ReportCatalogue
          reports={REPORTS}
          lastExports={lastExports}
          onOpen={key => void setOpenKey(key)}
          className='col-span-full lg:col-span-4'
        />
        <PayrollCostTrend points={costTrend} currencySymbol={currencySymbol} className='col-span-full lg:col-span-2' />
        <RecentExports exports={rows} onRepeat={handleRepeat} className='col-span-full' />
      </div>

      <ReportSheet
        report={report}
        open={!!report}
        onOpenChange={open => {
          if (!open) void setOpenKey(null)
        }}
        runs={runs}
        tables={report ? tables[report.key] : {}}
        defaultRunId={currentRunId}
        onExport={handleExport}
      />
    </>
  )
}

export default ReportsWorkspace
