/**
 * ! Server-side Find sources. Like the actions beside them these read the fake-db; swap the filters
 * ! for real queries and the contract above them does not move.
 */
'use server'

// Type Imports
import type { FindObjectHit } from '@/types/common/find-types'

// Data Imports
import { employees } from '@/fake-db/hrm/employees'
import { filings } from '@/fake-db/payroll/filings'
import { payRuns } from '@/fake-db/payroll/pay-runs'
import { payrollSettings } from '@/fake-db/payroll/settings'
import { settlements } from '@/fake-db/payroll/settlements'

// Util Imports
import { FILING_AUTHORITIES } from '@/utils/payroll-compliance'
import { PAY_RUN_STATUS_LABELS } from '@/utils/payroll-metrics'
import { actorFor, can } from '@/utils/payroll-permissions'
import { PAYMENT_STATUS_LABELS, formatPeriod } from '@/utils/payroll-workspace'
import { employeeObject, filingObject, payRunObject } from '@/views/payroll/payroll-objects'

/** Matches `currentActor` in `actions.ts`; both stand in until there is a session. */
const CURRENT_USER_ID = 'emp-020'

const actor = () => {
  const employee = employees.find(candidate => candidate.id === CURRENT_USER_ID)

  return actorFor(employee ?? { id: CURRENT_USER_ID, firstName: 'Unknown', lastName: 'user' }, payrollSettings.access)
}

/**
 * How many hits one source may return.
 *
 * A cap rather than a page, because Find is for recognising something you already have in mind. If
 * the answer is not in the first handful the query was too vague, and a longer list does not fix
 * that. It also means a broad query cannot be used to enumerate the dataset.
 */
const LIMIT = 6

const normalise = (value: string) => value.trim().toLowerCase()

/**
 * Pay runs the signed-in person may see.
 *
 * Small enough to filter in memory today and still written as a query the actor is applied to,
 * because the shape is what has to survive the move to a database — not the array.
 *
 * The permission gate is in the source, not in the rendering: a refusal returns nothing at all, so
 * an unauthorised run is indistinguishable from a run that does not exist. There is no count, no
 * "hidden results" note and no separate empty state, because each of those would confirm existence
 * to someone who may not know the record is there.
 */
export const findPayRuns = async (query: string): Promise<FindObjectHit[]> => {
  if (!can(actor(), 'payroll.view')) return []

  const needle = normalise(query)

  if (!needle) return []

  return payRuns
    .filter(run => normalise(run.reference).includes(needle) || normalise(run.payGroup).includes(needle))
    .slice(0, LIMIT)
    .map(run => ({
      object: payRunObject(run),
      sublabel: `${formatPeriod(run.periodStart, run.periodEnd)} · ${PAY_RUN_STATUS_LABELS[run.status]}`,
      keywords: [run.payGroup, run.currency]
    }))
}

/**
 * People the signed-in person may see, and where to read one.
 *
 * An employee has no route of its own — it is read on the run workspace its payroll belongs to —
 * so the addressable location is resolved here, where the run is known, rather than guessed at by
 * the caller. The newest run for that person's company is the one a reader means by "open this
 * employee"; someone with no run at all is not addressable and is therefore not offered.
 *
 * `ObjectContext` itself is unchanged: `employeeObject` builds the same identity a table builds,
 * and the location is supplied beside it rather than added to the contract.
 */
export const findEmployees = async (query: string): Promise<FindObjectHit[]> => {
  if (!can(actor(), 'payroll.view')) return []

  const needle = normalise(query)

  if (needle.length < 2) return []

  const latestRunFor = (entityId: string) =>
    [...payRuns]
      .filter(run => run.entityId === entityId)
      .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
      .at(-1)

  const hits: FindObjectHit[] = []

  for (const employee of employees) {
    if (hits.length >= LIMIT) break

    const name = `${employee.firstName} ${employee.lastName}`

    const matches =
      normalise(name).includes(needle) ||
      normalise(employee.employeeNumber).includes(needle) ||
      normalise(employee.positionTitle).includes(needle)

    if (!matches) continue

    const run = latestRunFor(employee.entityId)

    if (!run) continue

    hits.push({
      object: {
        ...employeeObject({ employeeId: employee.id, name }),
        href: `/payroll/runs/${run.id}?employee=${encodeURIComponent(employee.id)}`
      },

      // What tells two people of the same name apart. Both halves are needed: this dataset has two
      // employees called Anh Ngo in different departments.
      sublabel: `${employee.employeeNumber} · ${employee.positionTitle}`,
      keywords: [employee.employeeNumber, run.reference]
    })
  }

  return hits
}

/**
 * Turn stored targets back into something showable, under today's actor.
 *
 * This is what makes a saved target safe to keep. Nothing about a favourite or a recent entry is
 * trusted except the pair of strings naming it: the label, the figures and the address are all
 * resolved again here, so a renamed run, a moved employee or a permission taken away are reflected
 * the next time the palette opens rather than the next time somebody notices.
 *
 * Targets the actor may not see come back missing, exactly like targets that no longer exist. The
 * caller cannot tell the two apart, and neither can the reader — which is the point.
 */
export const resolveObjectTargets = async (
  targets: readonly { type: string; id: string }[]
): Promise<FindObjectHit[]> => {
  if (!can(actor(), 'payroll.view')) return []

  const hits: FindObjectHit[] = []

  for (const target of targets) {
    if (target.type === 'payroll_run') {
      const run = payRuns.find(candidate => candidate.id === target.id)

      if (!run) continue

      hits.push({
        object: payRunObject(run),
        sublabel: `${formatPeriod(run.periodStart, run.periodEnd)} · ${PAY_RUN_STATUS_LABELS[run.status]}`
      })

      continue
    }

    if (target.type === 'employee') {
      const employee = employees.find(candidate => candidate.id === target.id)

      if (!employee) continue

      const run = [...payRuns]
        .filter(candidate => candidate.entityId === employee.entityId)
        .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
        .at(-1)

      if (!run) continue

      hits.push({
        object: {
          ...employeeObject({ employeeId: employee.id, name: `${employee.firstName} ${employee.lastName}` }),
          href: `/payroll/runs/${run.id}?employee=${encodeURIComponent(employee.id)}`
        },
        sublabel: `${employee.employeeNumber} · ${employee.positionTitle}`
      })

      continue
    }

    if (target.type === 'statutory_filing') {
      const filing = filings.find(candidate => candidate.id === target.id)

      if (!filing) continue

      hits.push({
        object: {
          ...filingObject({ id: filing.id, kind: filing.kind, periodStart: filing.periodStart, periodEnd: filing.periodEnd }),
          href: `/payroll/compliance?filing=${encodeURIComponent(filing.id)}`
        },
        sublabel: FILING_AUTHORITIES[filing.kind]
      })

      continue
    }

    if (target.type === 'settlement') {
      const settlement = settlements.find(candidate => candidate.id === target.id)

      if (!settlement) continue

      const employee = employees.find(candidate => candidate.id === settlement.employeeId)
      const run = payRuns.find(candidate => candidate.id === settlement.payRunId)

      if (!employee || !run) continue

      hits.push({
        object: {
          type: 'settlement',
          id: settlement.id,
          label: `${employee.firstName} ${employee.lastName} · ${run.reference}`,
          href: `/payroll/payments?payment=${encodeURIComponent(settlement.id)}`
        },
        sublabel: `${employee.employeeNumber} · ${PAYMENT_STATUS_LABELS[settlement.status]}`
      })
    }
  }

  return hits
}
