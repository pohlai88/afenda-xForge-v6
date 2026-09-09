/**
 * Payroll's side of the object-context contract: what a pay run and an employee-on-a-run are
 * called, what can be done with them, and what they exactly are.
 *
 * The shared layer in `src/components/shared/ObjectCommands.tsx` and `PropertiesSheet.tsx`
 * renders these; it does not know what a payslip is. Every command here is one the domain can
 * actually perform — doctrine `context_menu` requires irrelevant commands to be omitted, so a
 * command that would be unavailable is simply absent rather than present and disabled.
 */

// Third-party Imports
import { CopyIcon, ExternalLinkIcon, HistoryIcon, TriangleAlertIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { PayRun, PayRunException } from '@/types/payroll/pay-run-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { FilingRow } from '@/types/payroll/compliance-types'
import type { PayRunQueueRow } from '@/types/payroll/run-queue-types'
import type { PayrollRunRow } from '@/types/payroll/run-workspace-types'
import type { ObjectCommand, ObjectContext } from '@/types/common/object-context-types'
import type { PropertySection } from '@/components/shared/PropertiesSheet'
import type { EntityRow } from '@/types/payroll/group-types'
import type { SettlementRow } from '@/utils/payroll-payments'

// Util Imports
import { formatCount, formatMoney } from '@/utils/money'
import { COUNTRY_LABELS } from '@/utils/payroll-group'
import { FILING_KIND_LABELS } from '@/utils/payroll-compliance'
import { PAY_RUN_STATUS_LABELS } from '@/utils/payroll-metrics'
import {
  EMPLOYEE_PAYROLL_STATUS_LABELS,
  PAY_FREQUENCY_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  formatInstant,
  formatPeriod
} from '@/utils/payroll-workspace'

const copyReference = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied`, { description: value })
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}`, {
      description: 'The browser refused clipboard access.'
    })
  }
}

// ---------------------------------------------------------------------------
// Pay run
// ---------------------------------------------------------------------------

export const payRunObject = (run: Pick<PayRun, 'id' | 'reference'>): ObjectContext => ({
  type: 'payroll_run',
  id: run.id,
  label: run.reference,
  href: `/payroll/runs/${run.id}`
})

/**
 * One command list for a pay run, wherever a pay run appears. Doctrine `identity_rule`: the same
 * object offers the same things to do with it, so there is never a second, shorter vocabulary for
 * the same type that could drift from this one.
 *
 * `isCurrent` drops Open when the user is already looking at the run. A command that would
 * navigate to where you already are is noise, not capability.
 *
 * `href` overrides where Open goes, because that is the one thing about a run that depends on
 * where you are reading it. A company's run history selects the run on the page it is already on;
 * the group's run queue opens the workspace. The commands are the same either way.
 */
export const payRunCommands = (
  run: Pick<PayRun, 'id' | 'reference'>,
  { isCurrent = false, href }: { isCurrent?: boolean; href?: string } = {}
): ObjectCommand[] => {
  const commands: ObjectCommand[] = []

  if (!isCurrent) {
    commands.push({
      id: 'open',
      label: 'Open run',
      family: 'read',
      icon: ExternalLinkIcon,
      href: href ?? `/payroll/runs/${run.id}`
    })
  }

  commands.push({
    id: 'copy-reference',
    label: 'Copy reference',
    family: 'search',
    icon: CopyIcon,
    onSelect: () => {
      void copyReference(run.reference, 'Run reference')
    }
  })

  commands.push({
    id: 'audit',
    label: 'View audit trail',
    family: 'audit',
    icon: HistoryIcon,
    href: `/payroll/runs/${run.id}?view=audit`
  })

  return commands
}

/**
 * Review is reported against the calculation it reviewed, never as a bare "reviewed". A run
 * recalculated after its review is not a reviewed run, and doctrine `domain_truth` forbids the
 * interface claiming a state the domain cannot prove.
 */
const reviewField = (run: PayRun, nameOf: (employeeId: string) => string) => {
  if (!run.review) return 'Not reviewed'

  const who = nameOf(run.review.reviewedBy)
  const when = formatInstant(run.review.reviewedAt)

  if (run.review.calculationVersion !== run.calculationVersion) {
    return `v${run.review.calculationVersion} by ${who} — superseded by v${run.calculationVersion}`
  }

  return `v${run.review.calculationVersion} by ${who}, ${when}`
}

export const payRunProperties = (
  run: PayRun,
  nameOf: (employeeId: string) => string,
  entityName?: string
): PropertySection[] => [
  {
    title: 'Identity',
    fields: [
      { label: 'Reference', value: run.reference },
      { label: 'Entity', value: entityName ?? run.entityId },
      { label: 'Pay group', value: run.payGroup },
      { label: 'Frequency', value: PAY_FREQUENCY_LABELS[run.frequency] },
      { label: 'Currency', value: run.currency }
    ]
  },
  {
    title: 'Lifecycle',
    fields: [
      { label: 'Status', value: PAY_RUN_STATUS_LABELS[run.status] },
      { label: 'Period', value: formatPeriod(run.periodStart, run.periodEnd) },
      { label: 'Pay date', value: formatDate(run.payDate) },
      { label: 'Cut-off', value: formatInstant(run.cutoffAt) },
      { label: 'Employees', value: formatCount(run.employeeCount) }
    ]
  },
  {
    title: 'Calculation',
    fields: [
      { label: 'Version', value: `v${run.calculationVersion}` },
      { label: 'Last calculated', value: run.lastCalculatedAt ? formatInstant(run.lastCalculatedAt) : 'Never' },
      { label: 'Review', value: reviewField(run, nameOf) }
    ]
  },
  {
    title: 'System',
    fields: [
      { label: 'Created', value: `${formatInstant(run.createdAt)} by ${nameOf(run.createdBy)}` },
      { label: 'Updated', value: formatInstant(run.updatedAt) },
      { label: 'Id', value: run.id }
    ]
  }
]

/**
 * The same object as `payRunProperties`, described from what the run queue has loaded.
 *
 * The queue holds a row, not the full run, so the calculation and system sections are absent
 * rather than guessed at. Fewer proven facts is not a different object; inventing the missing
 * ones, or fetching a whole run to open a panel, would be the actual mistake.
 */
export const payRunQueueProperties = (row: PayRunQueueRow): PropertySection[] => [
  {
    title: 'Identity',
    fields: [
      { label: 'Reference', value: row.reference },
      { label: 'Entity', value: `${row.entityName} (${row.countryCode})` },
      { label: 'Pay group', value: row.payGroup },
      { label: 'Frequency', value: PAY_FREQUENCY_LABELS[row.frequency] }
    ]
  },
  {
    title: 'Lifecycle',
    fields: [
      { label: 'Status', value: PAY_RUN_STATUS_LABELS[row.status] },
      { label: 'Period', value: formatPeriod(row.periodStart, row.periodEnd) },
      { label: 'Pay date', value: formatDate(row.payDate) },
      { label: 'Cut-off', value: formatInstant(row.cutoffAt) },
      { label: 'Employees', value: formatCount(row.employeeCount) },
      ...(row.approver ? [{ label: 'Approved by', value: row.approver.name }] : [])
    ]
  },
  {
    title: 'Exceptions',
    fields: [
      { label: 'Open', value: formatCount(row.counts.open) },
      { label: 'Blocking', value: formatCount(row.counts.blocking) },
      { label: 'Acknowledged', value: formatCount(row.counts.acknowledged) },
      { label: 'Resolved', value: formatCount(row.resolvedExceptions) }
    ]
  }
]

// ---------------------------------------------------------------------------
// Employee on a run
// ---------------------------------------------------------------------------

/**
 * No `href`: an employee within a run has no route of its own. It is reached through
 * `?employee=` on the run workspace, which is why the contract makes `href` optional.
 */
export const employeeObject = (row: Pick<PayrollRunRow, 'employeeId' | 'name'>): ObjectContext => ({
  type: 'employee',
  id: row.employeeId,
  label: row.name
})

export const employeeCommands = (
  row: PayrollRunRow,
  handlers: {
    onOpen: (employeeId: string) => void
    onViewExceptions?: (employeeId: string) => void
  }
): ObjectCommand[] => {
  const commands: ObjectCommand[] = [
    {
      id: 'open',
      label: 'Open payslip',
      family: 'read',
      icon: ExternalLinkIcon,
      onSelect: () => handlers.onOpen(row.employeeId)
    }
  ]

  // Only offered when this person actually has something outstanding.
  if (handlers.onViewExceptions && row.exceptions.length > 0) {
    commands.push({
      id: 'exceptions',
      label: `View exceptions (${row.exceptions.length})`,
      family: 'read',
      icon: TriangleAlertIcon,
      onSelect: () => handlers.onViewExceptions?.(row.employeeId)
    })
  }

  commands.push({
    id: 'copy-employee-number',
    label: 'Copy employee number',
    family: 'search',
    icon: CopyIcon,
    onSelect: () => {
      void copyReference(row.employeeNumber, 'Employee number')
    }
  })

  return commands
}

/**
 * Identity and state only. The payslip itself belongs to the drilldown, which gives it the full
 * width it needs — Properties answers "what exactly is this?", not "show me the pay".
 */
export const employeeProperties = (row: PayrollRunRow): PropertySection[] => [
  {
    title: 'Identity',
    fields: [
      { label: 'Name', value: row.name },
      { label: 'Employee no.', value: row.employeeNumber },
      { label: 'Position', value: row.positionTitle },
      { label: 'Department', value: row.departmentName },
      { label: 'Location', value: row.locationName }
    ]
  },
  {
    title: 'This run',
    fields: [
      { label: 'Payroll', value: EMPLOYEE_PAYROLL_STATUS_LABELS[row.payrollStatus] },
      { label: 'Payment', value: PAYMENT_STATUS_LABELS[row.paymentStatus] },
      { label: 'Open blockers', value: formatCount(row.openBlockers) },
      { label: 'Open warnings', value: formatCount(row.openWarnings) }
    ]
  },
  {
    title: 'Payslip',
    fields: [
      { label: 'Status', value: row.payslip.status },
      { label: 'Gross', value: formatMoney(row.gross) },
      { label: 'Net', value: formatMoney(row.net) },
      { label: 'Id', value: row.payslip.id }
    ]
  }
]

// ---------------------------------------------------------------------------
// Statutory filing
// ---------------------------------------------------------------------------

/**
 * No `href`: a filing is read in the inspector over the compliance page, not at a route of its
 * own. The label names it the way a person does — the return and the period it covers, which is
 * what distinguishes two rows of the same kind.
 */
export const filingObject = (row: Pick<FilingRow, 'id' | 'kind' | 'periodStart' | 'periodEnd'>): ObjectContext => ({
  type: 'statutory_filing',
  id: row.id,
  label: `${FILING_KIND_LABELS[row.kind]} · ${formatPeriod(row.periodStart, row.periodEnd)}`
})

/**
 * Opening the filing is the only thing this surface can do to one; preparing, submitting and
 * accepting all live in the inspector, where the rule being applied is stated. Doctrine
 * `context_menu` requires a command that cannot be performed to be absent rather than disabled,
 * so this list is deliberately short rather than padded to look complete.
 */
export const filingCommands = (row: FilingRow, handlers: { onOpen: (id: string) => void }): ObjectCommand[] => [
  {
    id: 'open',
    label: 'Open filing',
    family: 'read',
    icon: ExternalLinkIcon,
    onSelect: () => handlers.onOpen(row.id)
  }
]

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------

/**
 * No `href`: a payment is read in the inspector over the payments page. The label names it the
 * way a person does — who was paid, on which run — because the same person appears once per run
 * and the run is what separates two otherwise identical rows.
 */
export const settlementObject = (row: SettlementRow): ObjectContext => ({
  type: 'settlement',
  id: row.id,
  label: `${row.employeeName} · ${row.runReference}`
})

/**
 * Opening the payment, and copying the reference the bank knows it by.
 *
 * Re-issuing is deliberately absent even for a failed payment. It is an operation with a rule —
 * only a genuinely returned or failed payment, not one already re-issued — and the surfaces that
 * offer it (the outstanding-failures list and the inspector) show the reason alongside it. A menu
 * item cannot state a reason, so offering it here would move the action away from its evidence.
 *
 * The reference is present only once a payment has actually been released, so the command is
 * absent until there is something to copy rather than copying an empty string.
 */
export const settlementCommands = (
  row: SettlementRow,
  handlers: { onOpen: (row: SettlementRow) => void }
): ObjectCommand[] => {
  const commands: ObjectCommand[] = [
    {
      id: 'open',
      label: 'Open payment',
      family: 'read',
      icon: ExternalLinkIcon,
      onSelect: () => handlers.onOpen(row)
    }
  ]

  if (row.reference) {
    const reference = row.reference

    commands.push({
      id: 'copy-reference',
      label: 'Copy bank reference',
      family: 'search',
      icon: CopyIcon,
      onSelect: () => {
        void copyReference(reference, 'Bank reference')
      }
    })
  }

  return commands
}

// ---------------------------------------------------------------------------
// A company's payroll for one period
// ---------------------------------------------------------------------------

/**
 * The subject of a row on Group payroll: one legal entity's payroll standing for the period being
 * consolidated. Not the company as a permanent thing — the label names the company because that
 * is what a person calls the row, and the period is the page's, held once rather than repeated
 * down every row.
 */
export const entityPayrollObject = (entity: Pick<LegalEntity, 'id' | 'name'>, href: string): ObjectContext => ({
  type: 'entity_payroll',
  id: entity.id,
  label: entity.name,
  href
})

/**
 * The same object, described from a row of the group control matrix.
 *
 * Delegates rather than repeating the three fields, because doctrine `identity_rule` says a
 * company's payroll must not become a different conceptual identity in another view — and the
 * cheapest way to guarantee that is for one function to own what the label and the type are. The
 * row supplies the href because the group view a reader came from is part of where Open returns
 * them to.
 */
export const entityPeriodObject = (row: EntityRow): ObjectContext => entityPayrollObject(row.entity, row.href)

/**
 * Opening the company is the only thing this surface does to one, so the list is one command long
 * and the table renders no overflow column at all.
 *
 * Everything else a reader might want — why a figure is what it is, what moved, which calculation
 * it came from — is a question about the consolidation rather than about a row, and the lineage
 * drawer answers it with the working shown. A menu item cannot show working.
 *
 * `href` is resolved by the caller rather than read from `row.href`, because the group view a
 * reader came from is part of where Open should return them to.
 */
export const entityPeriodCommands = (row: EntityRow, href: (entityId: string) => string): ObjectCommand[] => [
  {
    id: 'open',
    label: 'Open company',
    family: 'read',
    icon: ExternalLinkIcon,
    href: href(row.entity.id)
  }
]

/* -------------------------------------------------------------------------------------------- */
/* Legal entity — P02's own subject                                                             */
/* -------------------------------------------------------------------------------------------- */

/**
 * The company itself, not its period row.
 *
 * `entityPeriodObject` above is a different object: it is one employer *on one period*, which is
 * what the group matrix lists. This is the employer, whose identity has to stay the same wherever
 * it is named, so it carries its own doctrine type rather than borrowing that one.
 */
export const legalEntityObject = (entity: Pick<LegalEntity, 'id' | 'name'>): ObjectContext => ({
  type: 'legal_entity',
  id: entity.id,
  label: entity.name,
  href: `/payroll/entities/${entity.id}`
})

/**
 * What can be done with a company from a payroll surface.
 *
 * Deliberately short. Configuration is P10's, payments are P07's, and filings are P08's — this
 * offers the two things that are about the company itself plus the routes into those surfaces,
 * scoped to it. `isCurrent` drops Open on the page that already is the company.
 */
export const legalEntityCommands = (
  entity: Pick<LegalEntity, 'id' | 'name' | 'registrationNumber'>,
  { isCurrent = false }: { isCurrent?: boolean } = {}
): ObjectCommand[] => {
  const commands: ObjectCommand[] = []

  if (!isCurrent) {
    commands.push({
      id: 'open',
      label: 'Open company',
      family: 'read',
      icon: ExternalLinkIcon,
      href: `/payroll/entities/${entity.id}`
    })
  }

  commands.push(
    {
      id: 'copy-registration',
      label: 'Copy registration number',
      family: 'search',
      icon: CopyIcon,
      onSelect: () => {
        void copyReference(entity.registrationNumber, 'Registration number')
      }
    },
    {
      id: 'payments',
      label: 'Open payments',
      family: 'read',
      icon: ExternalLinkIcon,
      href: `/payroll/payments?entity=${encodeURIComponent(entity.id)}`
    },
    {
      id: 'compliance',
      label: 'Open compliance',
      family: 'read',
      icon: ExternalLinkIcon,
      href: `/payroll/compliance?entity=${encodeURIComponent(entity.id)}`
    }
  )

  return commands
}

/** What a company exactly is. Only fields the entity record itself fixes. */
export const legalEntityProperties = (entity: LegalEntity, openPeriodLabel?: string): PropertySection[] => [
  {
    title: 'Identity',
    fields: [
      { label: 'Name', value: entity.name },
      { label: 'Code', value: entity.code },
      { label: 'Registration', value: entity.registrationNumber },
      { label: 'Country', value: COUNTRY_LABELS[entity.countryCode] }
    ]
  },
  {
    title: 'Payroll',
    fields: [
      { label: 'Currency', value: entity.currency },
      { label: 'Timezone', value: entity.timezone },
      { label: 'Statutory profile', value: entity.statutoryProfileId },
      ...(openPeriodLabel ? [{ label: 'Open period', value: openPeriodLabel }] : [])
    ]
  }
]

/* -------------------------------------------------------------------------------------------- */
/* Payroll exception                                                                            */
/* -------------------------------------------------------------------------------------------- */

/**
 * One exception on a run.
 *
 * No `href`. `ObjectContext.href` is optional precisely for objects that have no canonical route,
 * and an exception is one: it is reached through the run workspace's exception view, never through
 * a route of its own. The attention list supplies the destination separately.
 */
export const payrollExceptionObject = (
  exception: Pick<PayRunException, 'id' | 'title'>,
  subject?: string
): ObjectContext => ({
  type: 'payroll_exception',
  id: exception.id,
  label: subject ? `${exception.title} · ${subject}` : exception.title,
  href: undefined
})

/**
 * What can be done with an exception from a surface that only reports it.
 *
 * Acknowledging and resolving belong to the run workspace, which owns the mutation and the
 * calculation version it is recorded against. This offers the way there and the rule that raised
 * it, so someone can read what was checked without leaving.
 */
export const payrollExceptionCommands = (
  exception: Pick<PayRunException, 'id' | 'rule'>,
  { href }: { href: string }
): ObjectCommand[] => {
  const commands: ObjectCommand[] = [
    {
      id: 'open',
      label: 'Work this exception',
      family: 'read',
      icon: ExternalLinkIcon,
      href
    }
  ]

  if (exception.rule) {
    commands.push({
      id: 'copy-rule',
      label: 'Copy the rule that raised it',
      family: 'search',
      icon: CopyIcon,
      onSelect: () => {
        void copyReference(exception.rule!, 'Rule')
      }
    })
  }

  return commands
}
