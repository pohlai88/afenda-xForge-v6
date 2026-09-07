/**
 * ! Server-side 360 Query questions. Like the actions beside them these read the fake-db; swap the
 * ! filters for real queries and the contract above them does not move.
 */
'use server'

// Type Imports
import type { AuditEvent } from '@/types/common/audit-types'
import type { FindObjectHit } from '@/types/common/find-types'

// Data Imports
import { employees } from '@/fake-db/hrm/employees'
import { payRuns, payslips } from '@/fake-db/payroll/pay-runs'
import { payrollSettings } from '@/fake-db/payroll/settings'

// Util Imports
import { EXCEPTION_SEVERITY_LABELS, EXCEPTION_SEVERITY_ORDER } from '@/utils/payroll-metrics'
import { actorFor, can } from '@/utils/payroll-permissions'
import { calculationChangeEvents, exceptionsForEmployee } from '@/utils/payroll-workspace'
import { employeeObject } from '@/views/payroll/payroll-objects'

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
