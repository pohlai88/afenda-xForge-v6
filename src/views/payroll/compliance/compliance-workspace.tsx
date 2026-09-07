'use client'

// React Imports
import { useEffect, useState, useTransition } from 'react'

// Third-party Imports
import { parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

// Type Imports
import type { Employee } from '@/types/hrm/employee-types'
import type { StatutoryFiling } from '@/types/payroll/compliance-types'
import type { StatutoryRule } from '@/types/payroll/settings-types'

// Component Imports
import ComplianceFocus, { type InspectorMode } from './compliance-focus'
import ComplianceYear from './compliance-year'
import FilingInspector from './filing-inspector'
import FilingsTable from './filings-table'

// Find Imports
import { recordRecentObject } from '@/lib/find/recent-and-favourites'
import { filingObject } from '@/views/payroll/payroll-objects'

// Action Imports
import { applyFilingTransition } from '@/app/server/actions'

// Util Imports
import {
  FILING_AUTHORITIES,
  FILING_KIND_LABELS,
  FILING_STATUS_LABELS,
  applyFilingAction,
  buildFilingRows,
  complianceSummary,
  exportFilingToCsv,
  type FilingAction
} from '@/utils/payroll-compliance'

/**
 * Whoever is signed in, for the optimistic stamp only — the server stamps the real actor. The
 * Finance head stands in until a session exists, as on the run workspace.
 */
const CURRENT_USER_ID = 'emp-020'

type Props = {
  filings: StatutoryFiling[]
  employees: Employee[]
  rules: StatutoryRule[]

  /** Today's date, read once by the page. */
  today: string
}

/**
 * The compliance page's working half: the filing that needs working, the year so far, every
 * filing, and the inspector. Prepare, submit, accept and reject apply at once on screen through
 * the same `applyFilingAction` the server uses, then the server's record replaces the local one
 * or the refusal is shown and the previous state restored.
 */
const ComplianceWorkspace = ({ filings: initialFilings, employees, rules, today }: Props) => {
  const [filings, setFilings] = useState(initialFilings)

  /*
   * Which filing the inspector is showing, in the URL rather than in state.
   *
   * The same shape the run workspace uses for `?employee=`, for the same reason: an inspector that
   * only exists in React state cannot be linked to, reloaded, or reached from anywhere but this
   * page. Find has to be able to open a filing from the palette, and a favourite has to be able to
   * point at one, so the selection has to be addressable.
   *
   * `history: 'replace'` matches the employee pattern deliberately — opening a side panel is not a
   * navigation, so it should not add a Back step. `clearOnDefault` keeps the URL clean once the
   * inspector closes.
   *
   * The mode stays local: a link opens a filing to read, never mid-action.
   */
  const [selectedId, setSelectedId] = useQueryState(
    'filing',
    parseAsString.withOptions({ clearOnDefault: true, history: 'replace' })
  )

  const [mode, setMode] = useState<InspectorMode>('view')
  const [, startTransition] = useTransition()

  const rows = buildFilingRows({ filings, employees, today })
  const summary = complianceSummary(rows)
  const selected = selectedId ? (rows.find(row => row.id === selectedId) ?? null) : null

  // Remembered from the URL, so a filing opened by link counts exactly as one opened from the table.
  useEffect(() => {
    if (selected) recordRecentObject(filingObject(selected))
  }, [selected])

  const names = new Map(employees.map(employee => [employee.id, `${employee.firstName} ${employee.lastName}`]))
  const nameOf = (id: string) => names.get(id) ?? id

  const openFiling = (id: string, nextMode: InspectorMode = 'view') => {
    setMode(nextMode)
    void setSelectedId(id)
  }

  const replace = (next: StatutoryFiling) =>
    setFilings(current => current.map(candidate => (candidate.id === next.id ? next : candidate)))

  const handleAction = (id: string, action: FilingAction) => {
    const filing = filings.find(candidate => candidate.id === id)

    if (!filing) return

    const optimistic = applyFilingAction(filing, action, new Date().toISOString(), CURRENT_USER_ID)

    if (!optimistic) {
      toast.error(
        `${FILING_KIND_LABELS[filing.kind]} is ${FILING_STATUS_LABELS[filing.status].toLowerCase()} and cannot be ${action.type === 'prepare' ? 'prepared' : action.type === 'submit' ? 'submitted' : 'answered'} from there.`
      )

      return
    }

    const snapshot = filings

    replace(optimistic)

    startTransition(async () => {
      const result = await applyFilingTransition(id, action)

      if (!result.ok) {
        setFilings(snapshot)
        toast.error(result.message)

        return
      }

      replace(result.data)

      const label = FILING_KIND_LABELS[filing.kind]
      const authority = FILING_AUTHORITIES[filing.kind]

      switch (action.type) {
        case 'prepare':
          toast.success(`${label} prepared`, {
            description: `${filing.runReference ?? filing.periodStart.slice(0, 4)} · ready to submit to ${authority}`
          })
          break
        case 'submit':
          toast.success(`${label} submitted to ${authority}`, { description: `Reference ${action.reference}` })
          break
        case 'accept':
          toast.success(`${label} accepted by ${authority}`)
          break
        case 'reject':
          toast.success('Rejection recorded', {
            description: 'The filing is back at Prepared once you fix the records.'
          })
          break
      }
    })
  }

  const handleDownload = (id: string) => {
    const filing = filings.find(candidate => candidate.id === id)

    if (!filing) return

    const name = exportFilingToCsv(filing)

    toast.success('Export created', { description: `${filing.lines.length} lines · ${name}` })
  }

  return (
    <>
      <div className='grid grid-cols-6 gap-6'>
        <ComplianceFocus
          row={summary.focus}
          onOpen={nextMode => openFiling(summary.focus.id, nextMode)}
          onPrepare={() => handleAction(summary.focus.id, { type: 'prepare' })}
          onDownload={() => handleDownload(summary.focus.id)}
          className='col-span-full lg:col-span-4'
        />
        <ComplianceYear summary={summary} className='col-span-full lg:col-span-2' />
        <FilingsTable rows={rows} selectedId={selectedId} onOpen={id => openFiling(id)} className='col-span-full' />
      </div>

      <FilingInspector
        filing={selected}
        open={!!selected}
        mode={mode}
        onOpenChange={open => {
          if (!open) void setSelectedId(null)
        }}
        rules={rules}
        nameOf={nameOf}
        onAction={action => selected && handleAction(selected.id, action)}
        onDownload={() => selected && handleDownload(selected.id)}
      />
    </>
  )
}

export default ComplianceWorkspace
