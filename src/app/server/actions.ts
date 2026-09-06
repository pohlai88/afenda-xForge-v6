/**
 * ! The server actions below are used to fetch the static data from the fake-db. If you're using an ORM
 * ! (Object-Relational Mapping) or a database, you can swap the code below with your own database queries.
 */
'use server'

// Next Imports
import { revalidatePath } from 'next/cache'

// Third-party Imports
import { z } from 'zod'

// Type Imports
import { CURRENCY_CODES } from '@/types/common/primitive-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { PayrollGroup } from '@/types/payroll/group-types'
import type { PayRun, PayRunException } from '@/types/payroll/pay-run-types'
import type { StatutoryFiling } from '@/types/payroll/compliance-types'
import type { PayrollActor, PayrollPermission } from '@/types/payroll/permission-types'
import type { ReportExport } from '@/types/payroll/report-types'
import type { FundingAccount, Settlement, SettlementBatch } from '@/types/payroll/settlement-types'
import type { PayGroup, PayrollSettings } from '@/types/payroll/settings-types'

// Util Imports
import { evaluatePayrollApproval, reviewRefusal } from '@/utils/payroll-approval'
import { applyFilingAction, type FilingAction } from '@/utils/payroll-compliance'
import { PAY_RUN_STATUS_LABELS, countExceptions } from '@/utils/payroll-metrics'
import { BATCH_STATUS_LABELS, evaluateBatch, fundingSummary } from '@/utils/payroll-payments'
import { actorFor, can, permissionRefusal } from '@/utils/payroll-permissions'

// Data Imports
import { db as calendarDb } from '@/fake-db/apps/calendar'
import { initialColumns, teamMembers } from '@/fake-db/apps/kanban'
import { db as mailDb } from '@/fake-db/apps/mail'
import { db as userSettingsDb } from '@/fake-db/pages/user-settings'
import { db as userProfileDb } from '@/fake-db/pages/user-profile'
import { activeEmployees, departments, employees, locations } from '@/fake-db/hrm/employees'
import { legalEntities } from '@/fake-db/hrm/entities'
import { currentPayRun, latestRunFor, payRuns, payslips } from '@/fake-db/payroll/pay-runs'
import { BUDGET_YEAR, budgetRates, fxRates } from '@/fake-db/payroll/fx-rates'
import { statutoryProfiles } from '@/fake-db/payroll/statutory-profiles'
import { recalculatePayslips, storeInputs, unappliedInputs } from '@/fake-db/payroll/inputs'
import { fundingAccounts, settlementBatches, settlements } from '@/fake-db/payroll/settlements'
import { payrollSettings } from '@/fake-db/payroll/settings'
import { filings } from '@/fake-db/payroll/filings'
import { recentExports } from '@/fake-db/payroll/reports'

// Calendar App Actions
export const getCalendarData = async () => {
  return calendarDb
}

// Kanban App Actions
export const getKanbanData = async () => {
  return { columns: initialColumns, teamMembers: teamMembers }
}

// Mail App Actions
export const getMailData = async () => {
  return mailDb
}

// User Settings Actions
export const getMembersData = async () => ({
  members: userSettingsDb.members,
  pending: userSettingsDb.pending
})

export const getSessionsData = async () => userSettingsDb.sessions

export const getIntegrationsData = async () => userSettingsDb.integrations

// User Profile Actions
export const getProfileData = async () => userProfileDb

// HRM Actions
export const getEmployees = async () => employees

export const getActiveEmployees = async () => activeEmployees

export const getDepartments = async () => departments

export const getLocations = async () => locations

// Payroll Group Actions
export const getLegalEntities = async () => legalEntities

export const getLegalEntity = async (entityId: string) => legalEntities.find(entity => entity.id === entityId)

export const getFxRates = async () => fxRates

export const getStatutoryProfiles = async () => statutoryProfiles

/**
 * The group, composed from settings and the rate table rather than stored twice.
 *
 * Its name, home entity, reporting currency and basis are all settings someone can change on
 * screen; keeping a second copy here is how the settings page and the group page would start
 * disagreeing about what the group is.
 */
export const getPayrollGroup = async (): Promise<PayrollGroup> => ({
  id: 'grp-afenda',
  name: payrollSettings.general.groupName,
  homeEntityId: payrollSettings.general.homeEntityId,
  entityIds: payrollSettings.entities.map(entity => entity.id),
  reportingCurrency: payrollSettings.general.reportingCurrency,
  fxBasis: payrollSettings.general.fxBasis,
  budgetRates,
  budgetYear: BUDGET_YEAR
})

// Payroll Actions
export const getPayRuns = async () => payRuns

export const getPayRunsForEntity = async (entityId: string) => payRuns.filter(run => run.entityId === entityId)

/**
 * The open run for an entity, defaulting to the group's home entity.
 *
 * "The current run" stopped being a single thing once there was more than one company, so the
 * caller says whose. Screens that are still single-entity get the home entity, which is what
 * they showed before.
 */
export const getCurrentPayRun = async (entityId?: string) => (entityId ? latestRunFor(entityId) : currentPayRun)

/** By id ('run-sg-2026-09') or by reference ('PR-SG-2026-09') — both appear in URLs people share. */
export const getPayRun = async (runIdOrReference: string) =>
  payRuns.find(run => run.id === runIdOrReference || run.reference === runIdOrReference)

export const getPayslipsForRun = async (payRunId: string) => payslips.filter(slip => slip.payRunId === payRunId)

// Payroll Payments Actions
export const getFundingAccounts = async () => fundingAccounts

export const getSettlementBatches = async () => settlementBatches

export const getSettlements = async (payRunId?: string) =>
  payRunId ? settlements.filter(settlement => settlement.payRunId === payRunId) : settlements

// Payroll Settings Actions
export const getPayrollSettings = async () => payrollSettings

// Payroll Compliance Actions
export const getFilings = async (payRunId?: string) =>
  payRunId ? filings.filter(filing => filing.payRunId === payRunId) : filings

// Payroll Reports Actions
export const getRecentExports = async () => recentExports

/* -------------------------------------------------------------------------------------------- */
/* Payroll mutations                                                                            */
/*                                                                                              */
/* Each one validates its input, refuses business-rule violations with a message in the        */
/* interface's voice, mutates the in-memory seed, and revalidates the routes that read it.      */
/* Against the fake-db the change lives for the dev-server process; each body is the one place */
/* to swap for a query. Refusals are returned, never thrown: a blocked approval is an answer,   */
/* not an error.                                                                                */
/* -------------------------------------------------------------------------------------------- */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string }

/**
 * Whoever is signed in. There is no session in this app yet, so the Finance head stands in; the
 * actor is still built the way a real one will be — from the Access roles that list the person —
 * so every permission check below is the real check against a stub identity, not a stub check.
 * The server stamps every actor from here so no client can name its own approver.
 */
const CURRENT_USER_ID = 'emp-020'

const currentActor = (): PayrollActor => {
  const employee = employees.find(candidate => candidate.id === CURRENT_USER_ID)

  return actorFor(employee ?? { id: CURRENT_USER_ID, firstName: 'Unknown', lastName: 'user' }, payrollSettings.access)
}

export const getCurrentUser = async (): Promise<PayrollActor> => currentActor()

const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data })
const refuse = <T>(message: string): ActionResult<T> => ({ ok: false, message })

/** The refusal for a missing permission, or null when the actor holds it. */
const denied = (permission: PayrollPermission): string | null =>
  can(currentActor(), permission) ? null : permissionRefusal(permission)

const idSchema = z.string().trim().min(1)

const invalid = (error: z.ZodError) => refuse<never>(error.issues.map(issue => issue.message).join(' '))

const findRun = (runId: string) => payRuns.find(run => run.id === runId || run.reference === runId)

const revalidateRun = (run: PayRun) => {
  revalidatePath('/payroll')
  revalidatePath(`/payroll/entities/${run.entityId}`)
  revalidatePath('/payroll/runs')
  revalidatePath(`/payroll/runs/${run.id}`)
  revalidatePath('/payroll/payments')
  revalidatePath('/payroll/reports')
}

// --- Exceptions -------------------------------------------------------------------------------

const exceptionInput = z.object({ runId: idSchema, exceptionId: idSchema })

const patchException = (
  runId: string,
  exceptionId: string,
  patch: (exception: PayRunException, now: string) => Partial<PayRunException>
): ActionResult<PayRun> => {
  const parsed = exceptionInput.safeParse({ runId, exceptionId })

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.review')

  if (refusal) return refuse(refusal)

  const run = findRun(parsed.data.runId)

  if (!run) return refuse('That pay run no longer exists.')

  const exception = run.exceptions.find(candidate => candidate.id === parsed.data.exceptionId)

  if (!exception) return refuse('That exception is no longer on the run.')

  const now = new Date().toISOString()

  Object.assign(exception, patch(exception, now))
  run.updatedAt = now
  revalidateRun(run)

  return ok(run)
}

export const acknowledgeException = async (runId: string, exceptionId: string) =>
  patchException(runId, exceptionId, (exception, now) =>
    exception.resolvedAt ? {} : { acknowledgedAt: now, acknowledgedBy: CURRENT_USER_ID }
  )

export const resolveException = async (runId: string, exceptionId: string) =>
  patchException(runId, exceptionId, (_exception, now) => ({ resolvedAt: now, resolvedBy: CURRENT_USER_ID }))

export const reopenException = async (runId: string, exceptionId: string) =>
  patchException(runId, exceptionId, () => ({
    resolvedAt: undefined,
    resolvedBy: undefined,
    acknowledgedAt: undefined,
    acknowledgedBy: undefined
  }))

const warningsInput = z.object({ runId: idSchema, employeeIds: z.array(idSchema).min(1) })

/** Acknowledge every open warning about the given employees. Returns the run and how many changed. */
export const acknowledgeWarnings = async (
  runId: string,
  employeeIds: string[]
): Promise<ActionResult<{ run: PayRun; count: number }>> => {
  const parsed = warningsInput.safeParse({ runId, employeeIds })

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.review')

  if (refusal) return refuse(refusal)

  const run = findRun(parsed.data.runId)

  if (!run) return refuse('That pay run no longer exists.')

  const ids = new Set(parsed.data.employeeIds)
  const now = new Date().toISOString()
  let count = 0

  for (const exception of run.exceptions) {
    if (
      exception.severity === 'warning' &&
      !exception.resolvedAt &&
      !exception.acknowledgedAt &&
      exception.employeeId &&
      ids.has(exception.employeeId)
    ) {
      exception.acknowledgedAt = now
      exception.acknowledgedBy = CURRENT_USER_ID
      count += 1
    }
  }

  run.updatedAt = now
  revalidateRun(run)

  return ok({ run, count })
}

// --- Calculation, import, approval ------------------------------------------------------------

const LOCKED = new Set(['approved', 'paid', 'closed', 'cancelled', 'failed'])

const lockedRefusal = (run: PayRun, verb: string) =>
  `${run.reference} is ${PAY_RUN_STATUS_LABELS[run.status].toLowerCase()} and cannot be ${verb}. Changes go through an off-cycle run.`

const recalculateInput = z.object({ runId: idSchema, employeeIds: z.array(idSchema).optional() })

/**
 * A real calculation: every payslip on the run (or the chosen employees) is rebuilt from the
 * employee record plus whatever inputs have landed, the totals are recomputed, and the run
 * carries a diff against the calculation before. The version number moves because the figures
 * did. Any review of the previous calculation no longer covers this one, so the run returns to
 * Calculated for a reviewer to sign again.
 */
export const recalculateRun = async (
  runId: string,
  employeeIds?: string[]
): Promise<ActionResult<{ run: PayRun; count: number }>> => {
  const parsed = recalculateInput.safeParse({ runId, employeeIds })

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.process')

  if (refusal) return refuse(refusal)

  const run = findRun(parsed.data.runId)

  if (!run) return refuse('That pay run no longer exists.')

  if (LOCKED.has(run.status)) return refuse(lockedRefusal(run, 'recalculated'))

  const nextVersion = run.calculationVersion + 1
  const { diff, count } = recalculatePayslips(run, nextVersion, parsed.data.employeeIds)
  const now = new Date().toISOString()

  run.calculationVersion = nextVersion
  run.lastCalculatedAt = now
  run.lastCalculationDiff = diff
  run.updatedAt = now

  // A partial recalculation leaves the other employees' inputs pending.
  const stillPending = unappliedInputs(run.id)

  run.pendingInputs =
    stillPending.length === 0
      ? undefined
      : {
          count: stillPending.length,
          employees: new Set(stillPending.map(input => input.employeeId)).size,
          importedAt: stillPending[stillPending.length - 1].importedAt,
          importedBy: stillPending[stillPending.length - 1].importedBy
        }

  if (run.status === 'pending_approval' || run.status === 'draft' || run.status === 'calculating') {
    run.status = 'calculated'
  }

  revalidateRun(run)

  return ok({ run, count })
}

const importInput = z.object({
  runId: idSchema,
  rows: z
    .array(
      z.object({
        employeeNumber: idSchema,
        component: idSchema,

        /** Major units, as typed in the file. Stored in minor units. */
        amount: z.number().finite()
      })
    )
    .min(1, 'Nothing to import: every row was rejected.')
})

export type ImportedInput = z.infer<typeof importInput>['rows'][number]

/**
 * Accept validated input rows onto a run. The rows are stored; the run records that its figures
 * are out of date until a calculation consumes them. Nothing is recalculated here — a person
 * asks for that, and sees the diff when it lands.
 */
export const importPayrollInputs = async (
  runId: string,
  rows: ImportedInput[]
): Promise<ActionResult<{ run: PayRun; imported: number; employees: number }>> => {
  const parsed = importInput.safeParse({ runId, rows })

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.process')

  if (refusal) return refuse(refusal)

  const run = findRun(parsed.data.runId)

  if (!run) return refuse('That pay run no longer exists.')

  if (LOCKED.has(run.status)) return refuse(lockedRefusal(run, 'given new inputs'))

  const employeeIdByNumber = new Map(employees.map(employee => [employee.employeeNumber, employee.id]))
  const unknown = parsed.data.rows.filter(row => !employeeIdByNumber.has(row.employeeNumber))

  if (unknown.length > 0) {
    return refuse(
      `${unknown.length} ${unknown.length === 1 ? 'row names' : 'rows name'} an employee number not on this run: ${[...new Set(unknown.map(row => row.employeeNumber))].slice(0, 3).join(', ')}.`
    )
  }

  const now = new Date().toISOString()

  storeInputs(
    run.id,
    parsed.data.rows.map(row => ({
      employeeId: employeeIdByNumber.get(row.employeeNumber)!,
      code: row.component,
      amount: { amount: Math.round(row.amount * 100), currency: run.currency },
      importedAt: now,
      importedBy: CURRENT_USER_ID
    }))
  )

  const pending = unappliedInputs(run.id)

  run.pendingInputs = {
    count: pending.length,
    employees: new Set(pending.map(input => input.employeeId)).size,
    importedAt: now,
    importedBy: CURRENT_USER_ID
  }
  run.updatedAt = now
  revalidateRun(run)

  return ok({
    run,
    imported: parsed.data.rows.length,
    employees: new Set(parsed.data.rows.map(row => row.employeeNumber)).size
  })
}

const reviewInput = z.object({
  runId: idSchema,
  calculationVersion: z.number().int().positive(),
  note: z.string().trim().max(500).optional()
})

/**
 * "I have reviewed calculation #N" as a recorded event. Moves a Calculated run to Pending
 * approval; refuses over stale figures, and refuses to review a calculation other than the one
 * the reviewer was looking at.
 */
export const markRunReviewed = async (
  runId: string,
  calculationVersion: number,
  note?: string
): Promise<ActionResult<PayRun>> => {
  const parsed = reviewInput.safeParse({ runId, calculationVersion, note })

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.review')

  if (refusal) return refuse(refusal)

  const run = findRun(parsed.data.runId)

  if (!run) return refuse('That pay run no longer exists.')

  const reason = reviewRefusal(run)

  if (reason) return refuse(reason)

  if (run.calculationVersion !== parsed.data.calculationVersion) {
    return refuse(
      `The run was recalculated while you were reviewing it (now calculation #${run.calculationVersion}). Look at the changes, then review again.`
    )
  }

  const counts = countExceptions(run.exceptions)
  const now = new Date().toISOString()

  run.review = {
    calculationVersion: run.calculationVersion,
    reviewedBy: CURRENT_USER_ID,
    reviewedAt: now,
    findingsAtReview: { blocking: counts.blocking, error: counts.error, warning: counts.warning },
    acknowledgedWarnings: counts.acknowledged,
    note: parsed.data.note
  }
  run.status = 'pending_approval'
  run.updatedAt = now
  revalidateRun(run)

  return ok(run)
}

const approveInput = z.object({
  runId: idSchema,
  calculationVersion: z.number().int().positive(),
  note: z.string().trim().max(500).optional()
})

/**
 * The one gate that matters. `evaluatePayrollApproval` decides — the same function the approval
 * dialog reads — with the actor the server knows and the approval rules in settings. A run above
 * the second-approver threshold stays Pending approval after the first signature.
 */
export const approveRun = async (
  runId: string,
  calculationVersion: number,
  note?: string
): Promise<ActionResult<PayRun>> => {
  const parsed = approveInput.safeParse({ runId, calculationVersion, note })

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.approve')

  if (refusal) return refuse(refusal)

  const run = findRun(parsed.data.runId)

  if (!run) return refuse('That pay run no longer exists.')

  if (run.calculationVersion !== parsed.data.calculationVersion) {
    return refuse(
      `The run was recalculated since you reviewed it (now calculation #${run.calculationVersion}). Review the changes, then approve again.`
    )
  }

  const actor = currentActor()

  const evaluation = evaluatePayrollApproval({
    run,
    actor,
    settings: payrollSettings.approvals,
    roles: payrollSettings.access
  })

  if (!evaluation.canApprove) return refuse(`Payroll cannot be approved. ${evaluation.blockingReasons[0].message}`)

  const now = new Date().toISOString()

  run.approvals.push({ approvedBy: actor.id, approvedAt: now, note: parsed.data.note })

  if (run.approvals.length >= evaluation.signaturesRequired) run.status = 'approved'

  run.updatedAt = now
  revalidateRun(run)

  return ok(run)
}

// --- Payments ---------------------------------------------------------------------------------

/** Re-issue a returned or failed payment. The original stays as the audit record; a new one is released. */
export const reissueSettlement = async (settlementId: string): Promise<ActionResult<Settlement>> => {
  const parsed = idSchema.safeParse(settlementId)

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.payment.reissue')

  if (refusal) return refuse(refusal)

  const original = settlements.find(settlement => settlement.id === parsed.data)

  if (!original) return refuse('That payment no longer exists.')

  if (original.status !== 'returned' && original.status !== 'failed') {
    return refuse(`This payment is ${original.status.replace('_', ' ')} and does not need re-issuing.`)
  }

  if (settlements.some(settlement => settlement.retryOfId === original.id)) {
    return refuse('This payment has already been re-issued.')
  }

  const now = new Date().toISOString()

  const retry: Settlement = {
    ...original,
    id: `${original.id}-retry-${settlements.filter(s => s.retryOfId).length + 1}`,
    status: 'released',
    reference: original.reference ? `${original.reference}R` : undefined,
    releasedAt: now,
    settledAt: undefined,
    returnedAt: undefined,
    failedAt: undefined,
    reason: undefined,
    retryOfId: original.id
  }

  settlements.push(retry)
  revalidatePath('/payroll/payments')
  revalidatePath('/payroll')

  return ok(retry)
}

// --- Payment batches --------------------------------------------------------------------------

const revalidateBatch = (batch: SettlementBatch) => {
  revalidatePath('/payroll/payments')
  revalidatePath('/payroll')
  revalidatePath(`/payroll/runs/${batch.payRunId}`)
  revalidatePath('/payroll/runs')

  // The batch knows its run, and the run knows whose payroll it is. Without this the entity
  // overview keeps showing a run as unpaid after its file has settled.
  const run = payRuns.find(candidate => candidate.id === batch.payRunId)

  if (run) revalidatePath(`/payroll/entities/${run.entityId}`)
}

/** The batch, its run, its settlements and its funding position — what every batch step reads. */
const loadBatch = (batchId: string) => {
  const batch = settlementBatches.find(candidate => candidate.id === batchId)

  if (!batch) return null

  const run = payRuns.find(candidate => candidate.id === batch.payRunId)

  if (!run) return null

  const runSettlements = settlements.filter(settlement => settlement.payRunId === run.id)
  const account = fundingAccounts.find(candidate => candidate.id === batch.fundingAccountId)
  const funding = fundingSummary(runSettlements, account, run.currency)

  return { batch, run, runSettlements, funding, evaluation: evaluateBatch(batch, run, runSettlements, funding) }
}

const batchRefusal = (batchId: string, permission: PayrollPermission, expected: SettlementBatch['status'][]) => {
  const parsed = idSchema.safeParse(batchId)

  if (!parsed.success) return { error: invalid(parsed.error) as ActionResult<SettlementBatch> }

  const refusal = denied(permission)

  if (refusal) return { error: refuse<SettlementBatch>(refusal) }

  const loaded = loadBatch(parsed.data)

  if (!loaded) return { error: refuse<SettlementBatch>('That payment batch no longer exists.') }

  if (!expected.includes(loaded.batch.status)) {
    return {
      error: refuse<SettlementBatch>(
        `This batch is ${BATCH_STATUS_LABELS[loaded.batch.status].toLowerCase()} and cannot move from there.`
      )
    }
  }

  if (loaded.evaluation.blockingReasons.length > 0) {
    return { error: refuse<SettlementBatch>(loaded.evaluation.blockingReasons[0]) }
  }

  return { loaded }
}

/** Build and validate the bank file from the approved run. Records what was checked. */
export const prepareBatch = async (batchId: string): Promise<ActionResult<SettlementBatch>> => {
  const { error, loaded } = batchRefusal(batchId, 'payroll.process', ['draft'])

  if (error) return error

  const { batch, runSettlements } = loaded
  const included = runSettlements.filter(s => !s.retryOfId && s.status === 'ready')
  const excluded = runSettlements.filter(s => !s.retryOfId && s.status === 'action_required')
  const now = new Date().toISOString()

  batch.count = included.length
  batch.total = { amount: included.reduce((sum, s) => sum + s.amount.amount, 0), currency: batch.total.currency }

  batch.validation = {
    checkedAt: now,
    payments: included.length,
    total: batch.total,
    issues: [],
    excludedEmployeeIds: excluded.map(s => s.employeeId)
  }
  batch.preparedAt = now
  batch.preparedBy = CURRENT_USER_ID
  batch.status = 'prepared'
  revalidateBatch(batch)

  return ok(batch)
}

/** Send the prepared file to the bank. Every included payment becomes Released. */
export const releaseBatch = async (batchId: string): Promise<ActionResult<SettlementBatch>> => {
  const { error, loaded } = batchRefusal(batchId, 'payroll.payment.release', ['prepared'])

  if (error) return error

  const { batch, runSettlements } = loaded
  const now = new Date().toISOString()

  for (const settlement of runSettlements) {
    if (settlement.status === 'ready' && !settlement.retryOfId) {
      settlement.status = 'released'
      settlement.releasedAt = now
      settlement.reference = `GIRO-${batch.reference.split(' ').pop()}-${settlement.employeeId.replace('emp-', '')}`
    }
  }

  batch.releasedAt = now
  batch.releasedBy = CURRENT_USER_ID
  batch.status = 'released'
  revalidateBatch(batch)

  return ok(batch)
}

const acknowledgeInput = z.object({
  batchId: idSchema,
  bankReference: z.string().trim().min(1, 'Enter the reference the bank returned.')
})

/** Record the bank's acknowledgement of the file. Payments are now in flight. */
export const acknowledgeBatch = async (
  batchId: string,
  bankReference: string
): Promise<ActionResult<SettlementBatch>> => {
  const parsed = acknowledgeInput.safeParse({ batchId, bankReference })

  if (!parsed.success) return invalid(parsed.error)

  const { error, loaded } = batchRefusal(parsed.data.batchId, 'payroll.payment.release', ['released'])

  if (error) return error

  const { batch, runSettlements } = loaded
  const now = new Date().toISOString()

  for (const settlement of runSettlements) {
    if (settlement.status === 'released') settlement.status = 'processing'
  }

  batch.bankReference = parsed.data.bankReference
  batch.acceptedAt = now
  batch.status = 'processing'
  revalidateBatch(batch)

  return ok(batch)
}

/** Record that the bank settled the file. Payments are Paid; the run is Paid. */
export const settleBatch = async (batchId: string): Promise<ActionResult<SettlementBatch>> => {
  const { error, loaded } = batchRefusal(batchId, 'payroll.payment.release', ['accepted', 'processing'])

  if (error) return error

  const { batch, run, runSettlements } = loaded
  const now = new Date().toISOString()

  for (const settlement of runSettlements) {
    if (settlement.status === 'processing' || settlement.status === 'released') {
      settlement.status = 'paid'
      settlement.settledAt = now
    }
  }

  for (const slip of payslips) {
    if (slip.payRunId === run.id) slip.status = 'paid'
  }

  batch.settledAt = now
  batch.status = runSettlements.some(s => s.status === 'returned') ? 'partially_returned' : 'settled'

  if (run.status === 'approved') {
    run.status = 'paid'
    run.updatedAt = now
  }

  revalidateBatch(batch)

  return ok(batch)
}

// --- Settings ---------------------------------------------------------------------------------

type SettingsSection = 'general' | 'approvals' | 'notifications' | 'statutory' | 'components' | 'accounting'

const sectionSchemas = {
  general: z.object({
    entityName: z.string().trim().min(1, 'The entity needs a name.'),
    registrationNumber: z.string().trim().min(1, 'The registration number is required.'),
    defaultCurrency: z.enum(CURRENCY_CODES),
    timezone: z.string().trim().min(1),
    payslipSender: z.string().trim().email('The payslip sender must be an email address.'),
    rounding: z.enum(['nearest_cent', 'nearest_dollar'])
  }),
  approvals: z.object({
    approverRoles: z.array(z.string()).min(1, 'At least one role must be able to approve.'),
    secondApproverAbove: z.object({ amount: z.number().int().nonnegative(), currency: z.string() }).nullable(),
    requireWarningsAcknowledged: z.boolean(),
    blockOnErrors: z.boolean(),
    lockInputsOnApproval: z.boolean()
  }),
  notifications: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      description: z.string(),
      email: z.boolean(),
      inApp: z.boolean()
    })
  ),
  statutory: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      party: z.enum(['employee', 'employer']),
      rate: z.number().min(0).max(100, 'A rate is a percentage.'),
      ceiling: z.object({ amount: z.number().int().nonnegative(), currency: z.string() }).nullable(),
      effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective from must be a date.')
    })
  ),
  components: z.array(
    z.object({
      code: z.string().trim().min(1),
      label: z.string().trim().min(1),
      kind: z.enum(['earning', 'deduction', 'employer_contribution', 'tax']),
      taxable: z.boolean(),
      contributable: z.boolean(),
      glAccount: z.string(),
      active: z.boolean()
    })
  ),
  accounting: z.array(
    z.object({
      componentCode: z.string().trim().min(1),
      debitAccount: z.string().trim().min(1, 'Every component needs a debit account.'),
      creditAccount: z.string().trim().min(1, 'Every component needs a credit account.'),
      splitByCostCentre: z.boolean()
    })
  )
} satisfies Record<SettingsSection, z.ZodTypeAny>

/** Save one settings section. Validated against its own schema; other sections are untouched. */
export const savePayrollSettingsSection = async <S extends SettingsSection>(
  section: S,
  values: PayrollSettings[S]
): Promise<ActionResult<PayrollSettings[S]>> => {
  const schema = sectionSchemas[section]

  if (!schema) return refuse('Unknown settings section.')

  const refusal = denied('payroll.settings.manage')

  if (refusal) return refuse(refusal)

  const parsed = schema.safeParse(values)

  if (!parsed.success) return invalid(parsed.error)
  ;(payrollSettings as Record<SettingsSection, unknown>)[section] = parsed.data
  revalidatePath('/payroll/settings')

  return ok(payrollSettings[section])
}

const legalEntityInput = z.object({
  id: idSchema,
  name: z.string().trim().min(1, 'The company needs its registered name.'),
  registrationNumber: z.string().trim().min(1, 'Registration number is required.'),
  timezone: z.string().trim().min(1, 'Choose a timezone.')
})

/**
 * Correct a company's paperwork.
 *
 * Country and currency are deliberately not editable. They decide which statutory rules priced
 * every payslip the company has ever produced, so changing one would re-interpret history rather
 * than correct it. A company that needs a different currency is a different company.
 */
export const saveLegalEntity = async (
  values: Pick<LegalEntity, 'id' | 'name' | 'registrationNumber' | 'timezone'>
): Promise<ActionResult<LegalEntity>> => {
  const parsed = legalEntityInput.safeParse(values)

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.settings.manage')

  if (refusal) return refuse(refusal)

  const entity = payrollSettings.entities.find(candidate => candidate.id === parsed.data.id)

  if (!entity) return refuse('That legal entity no longer exists.')

  const duplicate = payrollSettings.entities.find(
    candidate => candidate.name.toLowerCase() === parsed.data.name.toLowerCase() && candidate.id !== entity.id
  )

  if (duplicate) return refuse(`A company called ${duplicate.name} already exists.`)

  entity.name = parsed.data.name
  entity.registrationNumber = parsed.data.registrationNumber
  entity.timezone = parsed.data.timezone

  revalidatePath('/payroll/settings')
  revalidatePath('/payroll')
  revalidatePath(`/payroll/entities/${entity.id}`)

  return ok(entity)
}

const payGroupInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'The pay group needs a name.'),
  entityId: z.string().trim().min(1),
  currency: z.enum(CURRENCY_CODES),
  frequency: z.enum(['weekly', 'biweekly', 'semi_monthly', 'monthly']),
  paydayRule: z.string().trim().min(1, 'Say when payday is.'),
  cutoffDaysBeforePayday: z.number().int().min(0).max(31),
  employeeCount: z.number().int().nonnegative().optional(),
  active: z.boolean().optional()
})

/** Create a pay group, or update the one whose id is given. */
export const savePayGroup = async (values: Partial<PayGroup>): Promise<ActionResult<PayGroup>> => {
  const parsed = payGroupInput.safeParse(values)

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.settings.manage')

  if (refusal) return refuse(refusal)

  const existing = parsed.data.id ? payrollSettings.payGroups.find(group => group.id === parsed.data.id) : undefined

  if (parsed.data.id && !existing) return refuse('That pay group no longer exists.')

  const duplicate = payrollSettings.payGroups.find(
    group => group.name.toLowerCase() === parsed.data.name.toLowerCase() && group.id !== existing?.id
  )

  if (duplicate) return refuse(`A pay group called ${duplicate.name} already exists.`)

  const entity = payrollSettings.entities.find(item => item.id === parsed.data.entityId)

  if (!entity) return refuse('That legal entity no longer exists.')

  // The entity decides the currency it pays in. A pay group claiming otherwise would price a
  // run in a currency its own company does not hold an account in.
  if (parsed.data.currency !== entity.currency) {
    return refuse(`${entity.name} pays in ${entity.currency}, so this pay group cannot be ${parsed.data.currency}.`)
  }

  const saved: PayGroup = {
    id: existing?.id ?? `pg-${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: parsed.data.name,
    entityId: parsed.data.entityId,
    currency: parsed.data.currency,
    frequency: parsed.data.frequency,
    paydayRule: parsed.data.paydayRule,
    cutoffDaysBeforePayday: parsed.data.cutoffDaysBeforePayday,
    employeeCount: parsed.data.employeeCount ?? existing?.employeeCount ?? 0,
    active: parsed.data.active ?? existing?.active ?? true
  }

  if (existing) Object.assign(existing, saved)
  else payrollSettings.payGroups.push(saved)

  revalidatePath('/payroll/settings')

  return ok(saved)
}

const fundingAccountInput = z.object({
  entityId: z.string().trim().min(1),
  name: z.string().trim().min(1, 'The account needs a name.'),
  bankName: z.string().trim().min(1, 'Which bank?'),
  accountLast4: z.string().regex(/^\d{4}$/, 'Enter the last four digits only.'),
  currency: z.enum(CURRENCY_CODES)
})

export const addFundingAccount = async (
  values: Pick<FundingAccount, 'entityId' | 'name' | 'bankName' | 'accountLast4' | 'currency'>
): Promise<ActionResult<FundingAccount>> => {
  const parsed = fundingAccountInput.safeParse(values)

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.settings.manage')

  if (refusal) return refuse(refusal)

  const entity = payrollSettings.entities.find(item => item.id === parsed.data.entityId)

  if (!entity) return refuse('That legal entity no longer exists.')

  if (parsed.data.currency !== entity.currency) {
    return refuse(
      `${entity.name} pays in ${entity.currency}, so it cannot fund payroll from a ${parsed.data.currency} account.`
    )
  }

  const account: FundingAccount = {
    id: `acct-${fundingAccounts.length + 1}`,
    ...parsed.data,
    balance: { amount: 0, currency: parsed.data.currency },

    // Default is per entity: the first account a company opens is the one it pays from.
    isDefault: !fundingAccounts.some(item => item.entityId === parsed.data.entityId)
  }

  fundingAccounts.push(account)
  revalidatePath('/payroll/settings')
  revalidatePath('/payroll/payments')

  return ok(account)
}

export const setDefaultFundingAccount = async (accountId: string): Promise<ActionResult<FundingAccount>> => {
  const parsed = idSchema.safeParse(accountId)

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.settings.manage')

  if (refusal) return refuse(refusal)

  const account = fundingAccounts.find(candidate => candidate.id === parsed.data)

  if (!account) return refuse('That funding account no longer exists.')

  // Scoped to the account's own entity. Clearing the flag across every account would mean
  // choosing Malaysia's default silently left Singapore with no account to pay from.
  for (const candidate of fundingAccounts) {
    if (candidate.entityId !== account.entityId) continue
    candidate.isDefault = candidate.id === account.id
  }

  revalidatePath('/payroll/settings')
  revalidatePath('/payroll/payments')

  return ok(account)
}

// --- Compliance -------------------------------------------------------------------------------

const filingActionInput = z.discriminatedUnion('type', [
  z.object({ type: z.literal('prepare') }),
  z.object({
    type: z.literal('submit'),
    reference: z.string().trim().min(1, 'Enter the reference the authority gave.')
  }),
  z.object({ type: z.literal('accept') }),
  z.object({ type: z.literal('reject'), reason: z.string().trim().min(1, 'Record what the authority said.') })
])

/** Move a filing through its lifecycle with the same rule the page applies optimistically. */
export const applyFilingTransition = async (
  filingId: string,
  action: FilingAction
): Promise<ActionResult<StatutoryFiling>> => {
  const parsedId = idSchema.safeParse(filingId)

  if (!parsedId.success) return invalid(parsedId.error)

  const parsedAction = filingActionInput.safeParse(action)

  if (!parsedAction.success) return invalid(parsedAction.error)

  const refusal = denied('payroll.process')

  if (refusal) return refuse(refusal)

  const index = filings.findIndex(filing => filing.id === parsedId.data)

  if (index === -1) return refuse('That filing no longer exists.')

  const next = applyFilingAction(filings[index], parsedAction.data, new Date().toISOString(), CURRENT_USER_ID)

  if (!next) {
    return refuse(
      `This filing is ${filings[index].status.replace('_', ' ')} and cannot be ${parsedAction.data.type}ed from there.`
    )
  }

  filings[index] = next
  revalidatePath('/payroll/compliance')

  return ok(next)
}

// --- Reports ----------------------------------------------------------------------------------

const exportInput = z.object({
  reportKey: z.enum([
    'register',
    'run_summary',
    'gross_to_net',
    'cost_by_department',
    'variance',
    'overtime',
    'statutory',
    'bank_file'
  ]),
  runReference: z.string().optional(),
  format: z.enum(['csv', 'xlsx']),
  rowCount: z.number().int().nonnegative(),
  fileName: z.string().trim().min(1)
})

/** Record that a file was exported, so the reports page can show who took what. */
export const recordReportExport = async (
  values: Pick<ReportExport, 'reportKey' | 'runReference' | 'format' | 'rowCount' | 'fileName'>
): Promise<ActionResult<ReportExport>> => {
  const parsed = exportInput.safeParse(values)

  if (!parsed.success) return invalid(parsed.error)

  const refusal = denied('payroll.report.export')

  if (refusal) return refuse(refusal)

  const record: ReportExport = {
    id: `export-${Date.now()}`,
    ...parsed.data,
    createdAt: new Date().toISOString(),
    createdBy: CURRENT_USER_ID
  }

  recentExports.unshift(record)
  revalidatePath('/payroll/reports')

  return ok(record)
}
