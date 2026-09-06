/**
 * ! In-memory inputs store and recalculation for the payroll seed. Swap for queries when the
 * ! database lands — src/app/server/actions.ts is the only place that calls these.
 *
 * The import action stores rows here; the recalculation action asks this module to rebuild the
 * run's payslips from the employee record plus the stored inputs, so a new calculation version
 * carries new figures, a diff against the previous calculation, and settlements that still
 * reconcile to the payslips they pay.
 */

// Type Imports
import type { IsoDateTime, Money } from '@/types/common/primitive-types'
import type { CalculationDiff, ComponentChange, PayRun, Payslip } from '@/types/payroll/pay-run-types'

// Data Imports
import { employees } from '@/fake-db/hrm/employees'
import { calculatePayslip, payslips, periodForRun, totalsFor, type PayInputOverride } from '@/fake-db/payroll/pay-runs'
import { settlementBatches, settlements } from '@/fake-db/payroll/settlements'

export interface StoredInput {
  employeeId: string
  code: string
  amount: Money
  importedAt: IsoDateTime
  importedBy: string

  /** Cleared by the calculation that consumed it. */
  appliedInVersion?: number
}

const inputsByRun = new Map<string, StoredInput[]>()

export const storeInputs = (runId: string, inputs: StoredInput[]) => {
  inputsByRun.set(runId, [...(inputsByRun.get(runId) ?? []), ...inputs])
}

export const inputsForRun = (runId: string): StoredInput[] => inputsByRun.get(runId) ?? []

/** Inputs no calculation has consumed yet. */
export const unappliedInputs = (runId: string) => inputsForRun(runId).filter(input => !input.appliedInVersion)

const money = (amount: number, currency: Money['currency']): Money => ({ amount, currency })

/**
 * Rebuild the payslips for a run, or for a subset of its employees, applying every stored input.
 * The latest input per employee and component wins. Mutates the payslip records in place so
 * every reader sees the new figures, and returns the diff the run should carry.
 */
export const recalculatePayslips = (
  run: PayRun,
  nextVersion: number,
  employeeIds?: string[]
): { diff: CalculationDiff; count: number } => {
  const located = periodForRun(run.id)

  if (!located) throw new Error(`No period for ${run.id}`)

  const { period, profile } = located
  const currency = run.currency
  const inputs = inputsForRun(run.id)
  const subset = employeeIds ? new Set(employeeIds) : null
  const employeeById = new Map(employees.map(e => [e.id, e]))

  const componentChanges: ComponentChange[] = []
  const affected = new Set<string>()
  let count = 0

  for (let i = 0; i < payslips.length; i += 1) {
    const slip = payslips[i]

    if (slip.payRunId !== run.id) continue
    if (subset && !subset.has(slip.employeeId)) continue

    const employee = employeeById.get(slip.employeeId)

    if (!employee) continue

    // Latest input per component for this person.
    const overrides = new Map<string, PayInputOverride>()

    for (const input of inputs) {
      if (input.employeeId === slip.employeeId) overrides.set(input.code, { code: input.code, amount: input.amount })
    }

    const next: Payslip = { ...calculatePayslip(employee, period, profile, [...overrides.values()]), status: slip.status }

    count += 1

    const before = new Map(slip.components.map(c => [c.code, c]))
    const after = new Map(next.components.map(c => [c.code, c]))

    for (const code of new Set([...before.keys(), ...after.keys()])) {
      const previous = before.get(code)?.amount ?? money(0, currency)
      const current = after.get(code)?.amount ?? money(0, currency)

      if (previous.amount !== current.amount) {
        affected.add(slip.employeeId)
        componentChanges.push({
          employeeId: slip.employeeId,
          code,
          label: (after.get(code) ?? before.get(code))!.label,
          previous,
          current
        })
      }
    }

    payslips[i] = next
  }

  const runSlips = payslips.filter(slip => slip.payRunId === run.id)
  const previousTotals = run.totals
  const totals = totalsFor(runSlips, currency)

  run.totals = totals
  run.employeeCount = runSlips.length

  // A payment that has not left the account pays whatever the payslip now says.
  const netByEmployee = new Map(runSlips.map(slip => [slip.employeeId, slip.netPay]))

  for (const settlement of settlements) {
    if (settlement.payRunId !== run.id) continue
    if (settlement.status !== 'ready' && settlement.status !== 'action_required') continue

    const net = netByEmployee.get(settlement.employeeId)

    if (net) settlement.amount = net
  }

  // An unprepared file describes the payslips as they now are; a prepared one is a record.
  const batch = settlementBatches.find(candidate => candidate.payRunId === run.id)

  if (batch && batch.status === 'draft') {
    const unpaid = settlements.filter(s => s.payRunId === run.id && !s.retryOfId)

    batch.count = unpaid.length
    batch.total = money(
      unpaid.reduce((sum, s) => sum + s.amount.amount, 0),
      currency
    )
  }

  let applied = 0

  for (const input of inputs) {
    if (!input.appliedInVersion && (!subset || subset.has(input.employeeId))) {
      input.appliedInVersion = nextVersion
      applied += 1
    }
  }

  return {
    count,
    diff: {
      previousVersion: run.calculationVersion,
      currentVersion: nextVersion,
      affectedEmployees: affected.size,
      grossDelta: money(totals.grossPay.amount - previousTotals.grossPay.amount, currency),
      netDelta: money(totals.netPay.amount - previousTotals.netPay.amount, currency),
      employerCostDelta: money(totals.employerCost.amount - previousTotals.employerCost.amount, currency),
      componentChanges,
      inputsApplied: applied
    }
  }
}
