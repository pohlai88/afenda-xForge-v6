/**
 * ! Server-side 360 Query questions. Like the actions beside them these read the fake-db; swap the
 * ! filters for real queries and the contract above them does not move.
 */
'use server'

// Type Imports
import type { AuditEvent } from '@/types/common/audit-types'
import type { FindObjectHit } from '@/types/common/find-types'

// Data Imports
import { departments, employees } from '@/fake-db/hrm/employees'
import { payRuns, payslips } from '@/fake-db/payroll/pay-runs'
import { payrollSettings } from '@/fake-db/payroll/settings'
import { settlementBatches, settlements } from '@/fake-db/payroll/settlements'

// Util Imports
import { formatMoney } from '@/utils/money'
import { EXCEPTION_SEVERITY_LABELS, EXCEPTION_SEVERITY_ORDER } from '@/utils/payroll-metrics'
import { buildSettlementRows, settlementEvents, type SettlementRow } from '@/utils/payroll-payments'
import { actorFor, can } from '@/utils/payroll-permissions'
import { PAYMENT_STATUS_LABELS, calculationChangeEvents, exceptionsForEmployee } from '@/utils/payroll-workspace'
import { employeeObject, settlementObject } from '@/views/payroll/payroll-objects'

/** Matches `currentActor` in `actions.ts`; both stand in until there is a session. */
const CURRENT_USER_ID = 'emp-020'

const actor = () => {
  const employee = employees.find(candidate => candidate.id === CURRENT_USER_ID)

  return actorFor(employee ?? { id: CURRENT_USER_ID, firstName: 'Unknown', lastName: 'user' }, payrollSettings.access)
}

/**
 * The people on one run who still have something outstanding against them.
 *
 * Deliberately not capped. Find caps its sources because Find is recognition — if what you had in
 * mind is not in the first handful, a longer list does not help. An answer is the opposite: it is a
 * set, and a set silently truncated is a wrong answer rather than a short one.
 *
 * "Open" is the run's own definition, not a second one invented here: an exception attributed to
 * this person or to their department, which nobody has resolved. Acknowledged still counts as open,
 * exactly as `countExceptions` and the run's own exception list count it — acknowledging is a
 * decision to proceed, not a fix.
 *
 * The permission gate is in the query, not in the rendering. A refusal returns nothing at all, so a
 * run the actor may not see is indistinguishable from a run with nobody outstanding: no count, no
 * "hidden results" note, no separate empty state, because each of those confirms existence.
 */
export const payRunEmployeesWithOpenExceptions = async (runId: string): Promise<FindObjectHit[]> => {
  if (!can(actor(), 'payroll.view')) return []

  const run = payRuns.find(candidate => candidate.id === runId)

  if (!run) return []

  const employeeById = new Map(employees.map(employee => [employee.id, employee]))

  const found: { hit: FindObjectHit; severity: number; name: string }[] = []

  for (const slip of payslips.filter(candidate => candidate.payRunId === run.id)) {
    const employee = employeeById.get(slip.employeeId)

    if (!employee) continue

    const open = exceptionsForEmployee(run.exceptions, employee).filter(exception => !exception.resolvedAt)

    if (open.length === 0) continue

    const severity = Math.min(...open.map(exception => EXCEPTION_SEVERITY_ORDER[exception.severity]))
    const worst = open.find(exception => EXCEPTION_SEVERITY_ORDER[exception.severity] === severity)!
    const name = `${employee.firstName} ${employee.lastName}`

    found.push({
      severity,
      name,
      hit: {
        object: {
          ...employeeObject({ employeeId: employee.id, name }),

          // An employee has no route of its own; it is read on the run workspace its payroll
          // belongs to, and the run is known here. Same address Find resolves, built the same way.
          href: `/payroll/runs/${run.id}?employee=${encodeURIComponent(employee.id)}`
        },

        // What the reader needs to triage the list: who this is, and how bad it is. Both halves
        // matter — this dataset has two employees called Anh Ngo.
        sublabel: `${employee.employeeNumber} · ${open.length} open · worst: ${EXCEPTION_SEVERITY_LABELS[worst.severity]}`
      }
    })
  }

  // Blockers first, because the list is a to-do; then by name, so the order is stable.
  return found.sort((a, b) => a.severity - b.severity || a.name.localeCompare(b.name)).map(entry => entry.hit)
}

/**
 * What the run's last calculation changed, and what has happened to it since.
 *
 * The first surface in this app to enforce `payroll.audit.view`. The permission has been granted in
 * settings and checked nowhere, so an audit trail has until now been visible to anyone who could
 * see a run at all; a new capability is the right place to start applying it, and the existing
 * surfaces that still do not are recorded rather than quietly changed here.
 *
 * Both gates are the same refusal. Someone without audit rights gets exactly what someone looking
 * at a run that has never been calculated gets — nothing — so refusal, absence and emptiness are
 * indistinguishable, and no count, version number or actor name leaks through the difference.
 */
export const payRunCalculationChanges = async (runId: string): Promise<AuditEvent[]> => {
  const current = actor()

  if (!can(current, 'payroll.view') || !can(current, 'payroll.audit.view')) return []

  const run = payRuns.find(candidate => candidate.id === runId)

  if (!run) return []

  const nameById = new Map(employees.map(employee => [employee.id, `${employee.firstName} ${employee.lastName}`]))

  return calculationChangeEvents(run, id => nameById.get(id) ?? 'Unknown')
}

/* -------------------------------------------------------------------------------------------- */
/* Settlement                                                                                   */
/* -------------------------------------------------------------------------------------------- */

/**
 * One payment, joined to the person and the run, exactly as the payments workspace joins it.
 *
 * The same builder rather than a lighter local join, so a payment named in a 360 Query answer is
 * the payment the table shows, down to the sort order.
 */
const settlementRowFor = (settlementId: string): { row: SettlementRow; rows: SettlementRow[] } | null => {
  const rows = buildSettlementRows(settlements, employees, departments, payRuns)
  const row = rows.find(candidate => candidate.id === settlementId)

  return row ? { row, rows } : null
}

/** The domain's own definition of a payment that did not land. Not re-decided here. */
const FAILED_STATUSES = new Set(['returned', 'failed'])

const failedWithReason = (row: SettlementRow) => FAILED_STATUSES.has(row.status) && Boolean(row.reason)

/**
 * Which questions this payment can be asked, decided by the record and the actor.
 *
 * A capability check, never the gate: each question below re-checks its own permission, because a
 * client that skipped this call must get the same refusal as one that did not. What this prevents
 * is a question that could only ever answer "not applicable" — a settled payment has no failure
 * reason, so asking what else failed for the same reason is not a question about it at all.
 *
 * Both flags are false for a payment the actor may not see, which is the same answer as a payment
 * that does not exist.
 */
export const settlementQueryCapabilities = async (
  settlementId: string
): Promise<{ sameReasonFailures: boolean; history: boolean }> => {
  const none = { sameReasonFailures: false, history: false }
  const current = actor()

  if (!can(current, 'payroll.view')) return none

  const found = settlementRowFor(settlementId)

  if (!found) return none

  return {
    sameReasonFailures: failedWithReason(found.row) && settlementBatches.some(b => b.id === found.row.batchId),
    history: can(current, 'payroll.audit.view')
  }
}

/**
 * The other payments in this payment's own file that came back for the same stated reason.
 *
 * Three things bound the answer, and none of them is inferred. The batch, because a batch is one
 * file drawn on one account for one run — which is also what keeps this traversal inside the
 * company the subject already belongs to, with no entity scope invented for it. The reason,
 * compared as the bank stored it: unlike wordings are left unlike, because normalising them would
 * manufacture matches the record does not support. And the domain's own failure set, `returned` or
 * `failed`, which is the pair `openFailures` already treats as a payment that did not land.
 *
 * Returned and rejected are not merged into one word — each row carries its own status — but they
 * are searched together, because one `reason` field records both and a bank that gives the same
 * reason twice has said the same thing twice.
 *
 * The subject is never in its own answer, and the set is complete: no cap, because a question about
 * a payment file is answered by all of it or not at all.
 */
export const settlementSameReasonFailures = async (settlementId: string): Promise<FindObjectHit[]> => {
  if (!can(actor(), 'payroll.view')) return []

  const found = settlementRowFor(settlementId)

  if (!found || !failedWithReason(found.row)) return []

  const { row, rows } = found

  // Already ordered by the payments builder — attention first, then name — and every match shares
  // one batch and therefore one pay date, so filtering preserves that order rather than imposing
  // a second one.
  return rows
    .filter(
      candidate =>
        candidate.id !== row.id &&
        candidate.batchId === row.batchId &&
        FAILED_STATUSES.has(candidate.status) &&
        candidate.reason === row.reason
    )
    .map(candidate => ({
      object: {
        ...settlementObject(candidate),
        href: `/payroll/payments?payment=${encodeURIComponent(candidate.id)}`
      },

      // The status is on every row rather than in the heading: the file records one of these as
      // returned and another as rejected, and collapsing that into "failed" would lose it.
      sublabel: `${candidate.employeeNumber} · ${formatMoney(candidate.amount)} · ${PAYMENT_STATUS_LABELS[candidate.status]}`
    }))
}

/**
 * What the record says happened to one payment.
 *
 * `settlementEvents` verbatim: prepared into a file, accepted by the bank, released, settled,
 * returned or rejected, each from a stored timestamp and carrying the bank's own reference or
 * reason where one was recorded. Nothing is added — no cause beyond the stated reason, no actor the
 * record does not name, and no advice about what to do next, which is a different question.
 *
 * Gated on `payroll.audit.view` exactly as the pay run's audit question is, and refusing the same
 * way: nothing at all, indistinguishable from a payment with no history.
 */
export const settlementHistory = async (settlementId: string): Promise<AuditEvent[]> => {
  const current = actor()

  if (!can(current, 'payroll.view') || !can(current, 'payroll.audit.view')) return []

  const found = settlementRowFor(settlementId)

  if (!found) return []

  return settlementEvents(found.row, settlementBatches.find(batch => batch.id === found.row.batchId))
}
