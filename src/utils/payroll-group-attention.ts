// Type Imports
import type { IsoDate, Money } from '@/types/common/primitive-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { Employee } from '@/types/hrm/employee-types'
import type { StatutoryFiling } from '@/types/payroll/compliance-types'
import type { EntityRow } from '@/types/payroll/group-types'
import type { PayRunExceptionSeverity } from '@/types/payroll/pay-run-types'
import type { PayGroup, PaySchedule } from '@/types/payroll/settings-types'

// Util Imports
import { formatMoney } from '@/utils/money'
import { countExceptions, daysBetween, EXCEPTION_SEVERITY_ORDER } from '@/utils/payroll-metrics'
import { formatDate } from '@/utils/format-datetime'

/**
 * The operational half of Group Payroll Control: what is wrong, what to do next, what is owed,
 * what is coming, and who joined or left.
 *
 * Separate from `payroll-group.ts`, which consolidates money. Nothing here converts a currency or
 * sums across an entity; everything here answers "where must the operator act", which is a
 * different question with different rules.
 *
 * The governing constraint is `.architecture/payroll/P01-group-payroll-control.yaml`: every value
 * below is derived from a record the domain already holds. Four things the source specification
 * asked for are absent from the domain — transfer history, approval/funding/close deadlines,
 * compensation history, and pay-group/bank-change history — and they are recorded as contract gaps
 * in that file rather than inferred here. A function that cannot prove something omits it.
 *
 * No function reads the clock. `today` is passed in, the way `daysBetween` already requires, so a
 * server render and a re-render an hour later produce the same page.
 */

/**
 * One name per filing kind, used by every section that mentions one.
 *
 * Shared rather than formatted per call site: Next actions and Statutory readiness name the same
 * obligation, and "tax withholding" in one place with "Tax withholding" in the other reads as two
 * different things.
 */
const FILING_KIND_LABELS: Record<StatutoryFiling['kind'], string> = {
  cpf_contribution: 'CPF contribution',
  tax_withholding: 'Tax withholding',
  annual_return: 'Annual return'
}

/** A company's funding position, flattened from the exposure the page already computes. */
export interface ExposureInput {
  entityId: string
  entityName: string
  required: Money
  headroom: Money
  releasable: boolean
  href: string
}

/* -------------------------------------------------------------------------------------------- */
/* Needs attention                                                                              */
/* -------------------------------------------------------------------------------------------- */

/**
 * One thing that needs a person. Carries its own consequence because a severity alone does not
 * say what happens if it is left — which is the whole difference between an alert and work.
 */
export interface AttentionItem {
  id: string
  severity: PayRunExceptionSeverity
  scope: string
  entityId?: string
  reason: string
  consequence: string
  dueLabel?: string
  actionLabel: string
  href: string
}

/** At most this many. A longer list is an alert archive, which P01 explicitly refuses to be. */
const ATTENTION_LIMIT = 5

const paydayLabel = (payDate: IsoDate | undefined, today: string): string | undefined => {
  if (!payDate) return undefined

  const days = daysBetween(today, payDate)

  if (days < 0) return `Payday was ${formatDate(payDate)}`
  if (days === 0) return `Payday today`

  return `${days} ${days === 1 ? 'day' : 'days'} to payday`
}

/**
 * What needs a person, worst first.
 *
 * Three kinds of problem, ranked against each other rather than listed by source: a company that
 * cannot fund its own payroll, a company whose run cannot be approved, and a company missing from
 * the period altogether. They are genuinely comparable — each one stops somebody being paid — and
 * ordering them by severity is what lets the section stop at five without hiding the worst.
 *
 * Exceptions are aggregated per company, not listed individually. Five rows of "missing bank
 * account" from one payroll is one problem with one destination, and the run workspace is where it
 * is actually cleared.
 */
export const groupAttention = (
  entities: readonly EntityRow[],
  exposures: readonly ExposureInput[],
  today: string
): AttentionItem[] => {
  const items: AttentionItem[] = []

  for (const exposure of exposures) {
    if (exposure.headroom.amount >= 0) continue

    const short = { amount: Math.abs(exposure.headroom.amount), currency: exposure.headroom.currency }

    items.push({
      id: `funding-${exposure.entityId}`,
      severity: 'blocking',
      scope: exposure.entityName,
      entityId: exposure.entityId,
      reason: `The funding account is ${formatMoney(short)} short of the ${formatMoney(exposure.required)} still to be paid.`,

      // Never "the group cannot pay". Funding is per legal employer, and a balance held by
      // another company in the group cannot cover this one.
      consequence: 'Payments for this company cannot be released until the account is funded.',
      actionLabel: 'Open payments',
      href: exposure.href
    })
  }

  for (const row of entities) {
    if (!row.run) continue

    const counts = countExceptions(row.run.exceptions)
    const due = paydayLabel(row.run.payDate, today)
    const href = `/payroll/runs/${row.run.id}?view=exceptions`

    if (counts.blocking > 0) {
      items.push({
        id: `blocking-${row.entity.id}`,
        severity: 'blocking',
        scope: row.entity.name,
        entityId: row.entity.id,
        reason: `${counts.blocking} blocking ${counts.blocking === 1 ? 'exception is' : 'exceptions are'} unresolved on ${row.run.reference}.`,
        consequence: 'This payroll cannot be approved.',
        dueLabel: due,
        actionLabel: 'Review exceptions',
        href
      })
    }

    if (counts.error > 0) {
      items.push({
        id: `error-${row.entity.id}`,
        severity: 'error',
        scope: row.entity.name,
        entityId: row.entity.id,
        reason: `${counts.error} ${counts.error === 1 ? 'calculation the engine could not trust' : 'calculations the engine could not trust'} on ${row.run.reference}.`,
        consequence: 'Each one needs a decision before the figures can be relied on.',
        dueLabel: due,
        actionLabel: 'Review exceptions',
        href
      })
    }

    if (counts.warning > 0 && counts.warning > counts.acknowledged) {
      const unacknowledged = counts.warning - counts.acknowledged

      items.push({
        id: `warning-${row.entity.id}`,
        severity: 'warning',
        scope: row.entity.name,
        entityId: row.entity.id,
        reason: `${unacknowledged} ${unacknowledged === 1 ? 'warning has' : 'warnings have'} not been acknowledged on ${row.run.reference}.`,
        consequence: 'Approval will ask someone to sign off over these.',
        dueLabel: due,
        actionLabel: 'Review exceptions',
        href
      })
    }
  }

  for (const row of entities) {
    if (row.included || !row.excludedReason) continue

    items.push({
      id: `missing-${row.entity.id}`,
      severity: 'warning',
      scope: row.entity.name,
      entityId: row.entity.id,
      reason: row.excludedReason,

      // The coverage line beside the total says the same thing. It is repeated here because this
      // is the section someone reads to decide what to do, and a hole in the number is work.
      consequence: 'This company is not in the group total, so the total is incomplete.',
      actionLabel: 'Open company',
      href: row.href
    })
  }

  return items
    .sort((a, b) => EXCEPTION_SEVERITY_ORDER[a.severity] - EXCEPTION_SEVERITY_ORDER[b.severity])
    .slice(0, ATTENTION_LIMIT)
}

/* -------------------------------------------------------------------------------------------- */
/* Next actions                                                                                 */
/* -------------------------------------------------------------------------------------------- */

/**
 * A real task with a destination. Not a link to a section — the distinction P01 draws between work
 * and navigation is the reason this type has a `task` rather than a `label`.
 */
export interface NextAction {
  id: string
  task: string
  scope: string
  dueLabel?: string
  href: string
}

/** Lower sorts first. The order is what a payroll actually has to happen in. */
const ACTION_RANK = {
  clear_blockers: 0,
  fund: 1,
  approve: 2,
  release: 3,
  review: 4,
  create: 5,
  file: 6
} as const

const NEXT_ACTION_LIMIT = 6

/**
 * What to do next, in the order payroll has to happen in.
 *
 * Every entry is derived from a lifecycle state the domain stores, so the list shortens by itself
 * as work is done rather than needing a task record to be closed. Ranked by stage rather than by
 * severity: clearing a blocker precedes approving, approving precedes releasing, and a company
 * with no run at all is further behind than one awaiting review.
 */
export const groupNextActions = (
  entities: readonly EntityRow[],
  exposures: readonly ExposureInput[],
  filings: readonly StatutoryFiling[],
  entityNames: ReadonlyMap<string, string>,
  periodTitle: string,
  today: string
): NextAction[] => {
  const ranked: { rank: number; action: NextAction }[] = []

  for (const row of entities) {
    const due = paydayLabel(row.run?.payDate, today)

    if (!row.run) {
      ranked.push({
        rank: ACTION_RANK.create,
        action: {
          id: `create-${row.entity.id}`,
          task: `Create the ${periodTitle} payroll`,
          scope: row.entity.name,
          href: row.href
        }
      })

      continue
    }

    const counts = countExceptions(row.run.exceptions)
    const runHref = `/payroll/runs/${row.run.id}`

    if (counts.blocking + counts.error > 0) {
      ranked.push({
        rank: ACTION_RANK.clear_blockers,
        action: {
          id: `clear-${row.entity.id}`,
          task: `Clear ${counts.blocking + counts.error} unresolved ${counts.blocking + counts.error === 1 ? 'exception' : 'exceptions'}`,
          scope: row.entity.name,
          dueLabel: due,
          href: `${runHref}?view=exceptions`
        }
      })
    } else if (row.run.status === 'calculated' || row.run.status === 'pending_approval') {
      ranked.push({
        rank: ACTION_RANK.approve,
        action: {
          id: `approve-${row.entity.id}`,
          task: `Approve ${row.run.reference}`,
          scope: row.entity.name,
          dueLabel: due,
          href: runHref
        }
      })
    } else if (row.run.status === 'draft' || row.run.status === 'calculating') {
      ranked.push({
        rank: ACTION_RANK.review,
        action: {
          id: `review-${row.entity.id}`,
          task: `Calculate and review ${row.run.reference}`,
          scope: row.entity.name,
          dueLabel: due,
          href: runHref
        }
      })
    }
  }

  for (const exposure of exposures) {
    if (exposure.headroom.amount < 0) {
      const short = { amount: Math.abs(exposure.headroom.amount), currency: exposure.headroom.currency }

      ranked.push({
        rank: ACTION_RANK.fund,
        action: {
          id: `fund-${exposure.entityId}`,
          task: `Fund the payment account by ${formatMoney(short)}`,
          scope: exposure.entityName,
          href: exposure.href
        }
      })

      continue
    }

    if (exposure.releasable && exposure.required.amount > 0) {
      ranked.push({
        rank: ACTION_RANK.release,
        action: {
          id: `release-${exposure.entityId}`,
          task: `Release ${formatMoney(exposure.required)} to employees`,
          scope: exposure.entityName,
          href: exposure.href
        }
      })
    }
  }

  for (const filing of filings) {
    if (filing.status === 'accepted') continue

    const days = daysBetween(today, filing.dueDate)

    // Only a filing that is overdue or inside a fortnight is work today. Everything else belongs
    // to the timeline, not to the list of things to do next.
    if (days > 14) continue

    ranked.push({
      rank: ACTION_RANK.file,
      action: {
        id: `file-${filing.id}`,
        task:
          filing.status === 'submitted'
            ? `Chase acceptance of ${FILING_KIND_LABELS[filing.kind]}`
            : `Prepare and submit ${FILING_KIND_LABELS[filing.kind]}`,
        scope: entityNames.get(filing.entityId) ?? filing.entityId,
        dueLabel:
          days < 0
            ? `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} overdue`
            : days === 0
              ? 'Due today'
              : `Due in ${days} ${days === 1 ? 'day' : 'days'}`,
        href: `/payroll/compliance?entity=${filing.entityId}`
      }
    })
  }

  return ranked
    .sort((a, b) => a.rank - b.rank)
    .slice(0, NEXT_ACTION_LIMIT)
    .map(item => item.action)
}

/* -------------------------------------------------------------------------------------------- */
/* Statutory snapshot                                                                           */
/* -------------------------------------------------------------------------------------------- */

/**
 * Statutory readiness, at the size P01 is allowed to state it.
 *
 * Deliberately four numbers and one date. The Compliance workspace owns filing work; this only
 * answers whether statutory obligations are threatening payroll delivery, and duplicating the
 * registry here would be the "duplicated compliance work" the page contract rejects.
 */
export interface StatutorySnapshot {
  ready: number
  review: number
  overdue: number
  outstanding: number
  next?: {
    label: string
    scope: string
    date: IsoDate
    days: number
    href: string
  }
}

/**
 * A company is "ready" when nothing it owes is overdue or rejected. Not when it has filed
 * everything: a filing that is not yet due is not a problem, and counting it as one would put
 * every company in review for most of the month.
 */
export const groupStatutory = (
  filings: readonly StatutoryFiling[],
  entities: readonly LegalEntity[],
  today: string
): StatutorySnapshot => {
  const entityIds = new Set(entities.map(entity => entity.id))
  const relevant = filings.filter(filing => entityIds.has(filing.entityId))
  const outstanding = relevant.filter(filing => filing.status !== 'accepted')

  const troubled = new Set(
    outstanding
      .filter(filing => filing.status === 'rejected' || daysBetween(today, filing.dueDate) < 0)
      .map(filing => filing.entityId)
  )

  const overdue = outstanding.filter(filing => daysBetween(today, filing.dueDate) < 0).length

  const soonest = [...outstanding].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]

  const names = new Map(entities.map(entity => [entity.id, entity.name]))

  return {
    ready: entities.length - troubled.size,
    review: troubled.size,
    overdue,
    outstanding: outstanding.length,
    next: soonest
      ? {
          label: FILING_KIND_LABELS[soonest.kind],
          scope: names.get(soonest.entityId) ?? soonest.entityId,
          date: soonest.dueDate,
          days: daysBetween(today, soonest.dueDate),
          href: `/payroll/compliance?entity=${soonest.entityId}`
        }
      : undefined
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Timeline                                                                                     */
/* -------------------------------------------------------------------------------------------- */

/**
 * One dated obligation.
 *
 * `kind` is the three the domain can prove and no more. The page contract records approval,
 * funding and close deadlines as a contract gap: `PaySchedule` stores a cut-off and a pay date,
 * and inventing the other three from them would be a date the operator could miss because we made
 * it up.
 */
export interface TimelineEvent {
  id: string
  kind: 'cutoff' | 'payday' | 'statutory'
  date: IsoDate
  label: string
  scope: string
  days: number
  href: string
}

const TIMELINE_LIMIT = 6

/**
 * The next few meaningful dates, chronologically.
 *
 * Forward-looking only. A payroll calendar showing dates that have passed is a record, and the
 * question this answers is what happens next.
 */
export const groupTimeline = (
  schedules: readonly PaySchedule[],
  payGroups: readonly PayGroup[],
  filings: readonly StatutoryFiling[],
  entities: readonly LegalEntity[],
  today: string
): TimelineEvent[] => {
  const names = new Map(entities.map(entity => [entity.id, entity.name]))
  const entityOf = new Map(payGroups.map(group => [group.id, group.entityId]))
  const events: TimelineEvent[] = []

  for (const schedule of schedules) {
    if (schedule.status === 'closed') continue

    const entityId = entityOf.get(schedule.payGroupId)
    const scope = entityId ? (names.get(entityId) ?? schedule.label) : schedule.label

    if (entityId && !names.has(entityId)) continue

    events.push(
      {
        id: `cutoff-${schedule.id}`,
        kind: 'cutoff',
        date: schedule.cutoff,
        label: `Input cut-off · ${schedule.label}`,
        scope,
        days: daysBetween(today, schedule.cutoff),
        href: '/payroll/runs'
      },
      {
        id: `payday-${schedule.id}`,
        kind: 'payday',
        date: schedule.payDate,
        label: `Payday · ${schedule.label}`,
        scope,
        days: daysBetween(today, schedule.payDate),
        href: '/payroll/payments'
      }
    )
  }

  for (const filing of filings) {
    if (filing.status === 'accepted' || !names.has(filing.entityId)) continue

    events.push({
      id: `filing-${filing.id}`,
      kind: 'statutory',
      date: filing.dueDate,
      label: `${FILING_KIND_LABELS[filing.kind]} due`,
      scope: names.get(filing.entityId)!,
      days: daysBetween(today, filing.dueDate),
      href: `/payroll/compliance?entity=${filing.entityId}`
    })
  }

  return events
    .filter(event => event.days >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, TIMELINE_LIMIT)
}

/* -------------------------------------------------------------------------------------------- */
/* Changes affecting payroll                                                                    */
/* -------------------------------------------------------------------------------------------- */

/** People joining or leaving one company in the period. */
export interface ChangeRow {
  entityId: string
  entityName: string
  joiners: number
  leavers: number
  href: string
}

/**
 * Two categories, where the source specification drew seven.
 *
 * Joiners and leavers are provable: an employee record carries a hire date and a termination date.
 * The other five the specification asked for — inter-company transfers, salary changes, pay-group
 * changes, unpaid leave, bank changes — have no history in this domain, and reconstructing them
 * from current values is exactly what the movement architecture forbids. They are recorded as
 * contract gaps P01-GAP-001, 003 and 004 rather than approximated, and this function shows two
 * categories rather than seven mostly-empty ones.
 */
export const groupChanges = (
  employees: readonly Employee[],
  entities: readonly LegalEntity[],
  period: string
): ChangeRow[] =>
  entities
    .map(entity => {
      const own = employees.filter(employee => employee.entityId === entity.id)

      return {
        entityId: entity.id,
        entityName: entity.name,
        joiners: own.filter(employee => employee.hireDate.slice(0, 7) === period).length,
        leavers: own.filter(employee => employee.terminationDate?.slice(0, 7) === period).length,
        href: `/payroll/entities/${entity.id}`
      }
    })
    .filter(row => row.joiners > 0 || row.leavers > 0)
    .sort((a, b) => b.joiners + b.leavers - (a.joiners + a.leavers))
