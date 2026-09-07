// Third-party Imports
import Papa from 'papaparse'

// Type Imports
import type { IsoDateTime, Money } from '@/types/common/primitive-types'
import type { Employee } from '@/types/hrm/employee-types'
import type {
  ComplianceSummary,
  FilingKind,
  FilingRow,
  FilingStatus,
  StatutoryFiling
} from '@/types/payroll/compliance-types'
import type { AuditEvent } from '@/types/payroll/run-workspace-types'

// Util Imports
import { formatMoney } from '@/utils/money'
import { daysBetween } from '@/utils/payroll-metrics'
import { formatDate, formatPeriod } from '@/utils/payroll-workspace'

/* -------------------------------------------------------------------------------------------- */
/* Vocabulary — decided once, imported everywhere                                               */
/* -------------------------------------------------------------------------------------------- */

export const FILING_KIND_LABELS: Record<FilingKind, string> = {
  cpf_contribution: 'CPF contributions',
  tax_withholding: 'Income tax withholding',
  annual_return: 'Annual return (IR8A)'
}

/** Who the filing goes to. Shown beside the kind so "submit" always says submit to whom. */
export const FILING_AUTHORITIES: Record<FilingKind, string> = {
  cpf_contribution: 'CPF Board',
  tax_withholding: 'IRAS',
  annual_return: 'IRAS'
}

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  not_started: 'Not started',
  prepared: 'Prepared',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected'
}

/**
 * Status -> badge colour. Semantic tokens only: prepared is informational, submitted is pending
 * someone else's answer, accepted is good, rejected is bad. Not started is inert.
 */
export const FILING_STATUS_STYLES: Record<FilingStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  prepared: 'bg-info/10 text-info-strong',
  submitted: 'bg-warning/15 text-warning-strong',
  accepted: 'bg-success/15 text-success-strong',
  rejected: 'bg-destructive/10 text-destructive-strong'
}

/** Sort order for a status column: what needs a person first, what is done last. */
export const FILING_STATUS_ORDER: Record<FilingStatus, number> = {
  rejected: 0,
  not_started: 1,
  prepared: 2,
  submitted: 3,
  accepted: 4
}

/**
 * The coarse filter the page offers. Three buckets rather than five statuses, because the
 * question is "what do I have to do" and not "which exact state is it in".
 */
export type FilingBucket = 'action' | 'awaiting' | 'accepted'

export const FILING_BUCKET_LABELS: Record<FilingBucket, string> = {
  action: 'Needs action',
  awaiting: 'Awaiting response',
  accepted: 'Accepted'
}

export const bucketOf = (status: FilingStatus): FilingBucket =>
  status === 'accepted' ? 'accepted' : status === 'submitted' ? 'awaiting' : 'action'

/** Payday within this many days of the due date is close enough to colour. */
export const DUE_SOON_DAYS = 7

/* -------------------------------------------------------------------------------------------- */
/* Rows                                                                                         */
/* -------------------------------------------------------------------------------------------- */

type RowSources = {
  filings: StatutoryFiling[]
  employees: Employee[]

  /** Today's date, read once by the page. Never read from the clock here. */
  today: string
}

/** Filings with their people attached, soonest due first. */
export const buildFilingRows = ({ filings, employees, today }: RowSources): FilingRow[] => {
  const employeeById = new Map(employees.map(employee => [employee.id, employee]))

  const person = (id?: string) => {
    const employee = id ? employeeById.get(id) : undefined

    return employee && { name: `${employee.firstName} ${employee.lastName}`, avatar: employee.avatar }
  }

  return filings
    .map(filing => ({
      ...filing,
      daysToDue: filing.status === 'accepted' ? null : daysBetween(today, filing.dueDate),
      preparer: person(filing.preparedBy),
      submitter: person(filing.submittedBy)
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

/* -------------------------------------------------------------------------------------------- */
/* Summary                                                                                      */
/* -------------------------------------------------------------------------------------------- */

export const complianceSummary = (rows: FilingRow[]): ComplianceSummary => {
  // Overdue first, then the soonest due. `rows` is already sorted by due date, so the first
  // unaccepted row is the answer; overdue rows sort before upcoming ones by construction.
  const open = rows.filter(row => row.status !== 'accepted')

  const focus = open[0] ?? [...rows].sort((a, b) => (b.respondedAt ?? '').localeCompare(a.respondedAt ?? ''))[0]

  const year = focus.dueDate.slice(0, 4)
  const currency = focus.amount.currency
  const thisYear = rows.filter(row => row.dueDate.startsWith(year))
  const accepted = thisYear.filter(row => row.status === 'accepted')

  const sum = (subset: FilingRow[]): Money => ({
    amount: subset.reduce((total, row) => total + row.amount.amount, 0),
    currency
  })

  return {
    focus,
    year,
    total: thisYear.length,
    accepted: accepted.length,
    owed: sum(thisYear),
    filed: sum(accepted),
    onTime: accepted.filter(row => (row.submittedAt ?? '').slice(0, 10) <= row.dueDate).length,
    overdue: thisYear.filter(row => row.daysToDue !== null && row.daysToDue < 0).length,
    rejected: thisYear.filter(row => row.status === 'rejected').length
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Transitions — one state machine for the client today and the server action later            */
/* -------------------------------------------------------------------------------------------- */

export type FilingAction =
  | { type: 'prepare' }
  | { type: 'submit'; reference: string }
  | { type: 'accept' }
  | { type: 'reject'; reason: string }

/** Which actions a filing in each status accepts. The inspector shows exactly these. */
export const ALLOWED_ACTIONS: Record<FilingStatus, FilingAction['type'][]> = {
  not_started: ['prepare'],
  prepared: ['submit'],
  submitted: ['accept', 'reject'],
  accepted: [],
  rejected: ['prepare']
}

/**
 * Apply an action to a filing. Returns the next record, or null when the transition is not
 * allowed from the current status — the caller says why in the interface's voice.
 */
export const applyFilingAction = (
  filing: StatutoryFiling,
  action: FilingAction,
  at: IsoDateTime,
  actorId: string
): StatutoryFiling | null => {
  if (!ALLOWED_ACTIONS[filing.status].includes(action.type)) return null

  switch (action.type) {
    case 'prepare':
      return {
        ...filing,
        status: 'prepared',
        preparedAt: at,
        preparedBy: actorId,
        submittedAt: undefined,
        submittedBy: undefined,
        reference: undefined,
        respondedAt: undefined,
        rejectionReason: undefined
      }
    case 'submit':
      return { ...filing, status: 'submitted', submittedAt: at, submittedBy: actorId, reference: action.reference }
    case 'accept':
      return { ...filing, status: 'accepted', respondedAt: at, rejectionReason: undefined }
    case 'reject':
      return { ...filing, status: 'rejected', respondedAt: at, rejectionReason: action.reason }
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Audit                                                                                        */
/* -------------------------------------------------------------------------------------------- */

/** The filing's history from its timestamps, newest first, in the run workspace's event shape. */
export const filingAuditEvents = (filing: StatutoryFiling, nameOf: (employeeId: string) => string): AuditEvent[] => {
  const events: AuditEvent[] = []
  const authority = FILING_AUTHORITIES[filing.kind]

  if (filing.preparedAt) {
    events.push({
      id: `${filing.id}-prepared`,
      at: filing.preparedAt,
      actor: filing.preparedBy ? nameOf(filing.preparedBy) : 'System',
      action: 'Filing prepared',
      detail: filing.calculationVersion
        ? `From calculation #${filing.calculationVersion} · ${formatMoney(filing.amount)}`
        : formatMoney(filing.amount),
      kind: 'user'
    })
  }

  if (filing.submittedAt) {
    events.push({
      id: `${filing.id}-submitted`,
      at: filing.submittedAt,
      actor: filing.submittedBy ? nameOf(filing.submittedBy) : 'System',
      action: `Submitted to ${authority}`,
      detail: filing.reference && `Reference ${filing.reference}`,
      kind: 'user'
    })
  }

  if (filing.respondedAt) {
    events.push(
      filing.status === 'rejected'
        ? {
            id: `${filing.id}-rejected`,
            at: filing.respondedAt,
            actor: authority,
            action: 'Filing rejected',
            detail: filing.rejectionReason,
            kind: 'exception'
          }
        : {
            id: `${filing.id}-accepted`,
            at: filing.respondedAt,
            actor: authority,
            action: 'Filing accepted',
            kind: 'approval'
          }
    )
  }

  return events.reverse()
}

/* -------------------------------------------------------------------------------------------- */
/* Export                                                                                       */
/* -------------------------------------------------------------------------------------------- */

/** The filing's lines as CSV — what gets uploaded to the authority's portal. */
export const exportFilingToCsv = (filing: StatutoryFiling): string => {
  const rows = filing.lines.map(line => ({
    Filing: FILING_KIND_LABELS[filing.kind],
    Period: formatPeriod(filing.periodStart, filing.periodEnd),
    Due: formatDate(filing.dueDate),
    Component: line.label,
    Code: line.code,
    Employees: line.employeeCount,
    Amount: formatMoney(line.amount)
  }))

  const csv = Papa.unparse(rows, { header: true })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  const name = `${filing.runReference ?? filing.periodStart.slice(0, 4)}-${filing.kind.replace(/_/g, '-')}.csv`

  link.setAttribute('href', url)
  link.setAttribute('download', name)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return name
}
