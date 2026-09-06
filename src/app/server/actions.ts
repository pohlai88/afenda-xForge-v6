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
import type { PayRun, PayRunException } from '@/types/payroll/pay-run-types'
import type { StatutoryFiling } from '@/types/payroll/compliance-types'
import type { ReportExport } from '@/types/payroll/report-types'
import type { FundingAccount, Settlement } from '@/types/payroll/settlement-types'
import type { PayGroup, PayrollSettings } from '@/types/payroll/settings-types'

// Util Imports
import { applyFilingAction, type FilingAction } from '@/utils/payroll-compliance'
import { countExceptions } from '@/utils/payroll-metrics'

// Data Imports
import { db as calendarDb } from '@/fake-db/apps/calendar'
import { initialColumns, teamMembers } from '@/fake-db/apps/kanban'
import { db as mailDb } from '@/fake-db/apps/mail'
import { db as userSettingsDb } from '@/fake-db/pages/user-settings'
import { db as userProfileDb } from '@/fake-db/pages/user-profile'
import { activeEmployees, departments, employees, locations } from '@/fake-db/hrm/employees'
import { currentPayRun, payRuns, payslips } from '@/fake-db/payroll/pay-runs'
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

// Payroll Actions
export const getPayRuns = async () => payRuns

export const getCurrentPayRun = async () => currentPayRun

/** By id ('run-2026-09') or by reference ('PR-2026-09') — both appear in URLs people share. */
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
 * Whoever is signed in. There is no auth in this app yet, so the Finance head stands in. The
 * server stamps every actor from here so no client can name its own approver.
 */
const CURRENT_USER_ID = 'emp-020'

export const getCurrentUser = async () => CURRENT_USER_ID

const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data })
const refuse = <T>(message: string): ActionResult<T> => ({ ok: false, message })

const idSchema = z.string().trim().min(1)

const invalid = (error: z.ZodError) => refuse<never>(error.issues.map(issue => issue.message).join(' '))

const findRun = (runId: string) => payRuns.find(run => run.id === runId || run.reference === runId)

const revalidateRun = (run: PayRun) => {
  revalidatePath('/payroll')
  revalidatePath('/payroll/runs')
  revalidatePath(`/payroll/runs/${run.id}`)
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

const recalculateInput = z.object({ runId: idSchema, employeeIds: z.array(idSchema).optional() })

export const recalculateRun = async (
  runId: string,
  employeeIds?: string[]
): Promise<ActionResult<{ run: PayRun; count: number }>> => {
  const parsed = recalculateInput.safeParse({ runId, employeeIds })

  if (!parsed.success) return invalid(parsed.error)

  const run = findRun(parsed.data.runId)

  if (!run) return refuse('That pay run no longer exists.')

  if (LOCKED.has(run.status)) {
    return refuse(`${run.reference} is ${run.status} and cannot be recalculated. Reopen it first.`)
  }

  const now = new Date().toISOString()

  run.calculationVersion += 1
  run.lastCalculatedAt = now
  run.updatedAt = now
  revalidateRun(run)

  return ok({ run, count: parsed.data.employeeIds?.length ?? run.employeeCount })
}

const importInput = z.object({
  runId: idSchema,
  rows: z
    .array(
      z.object({
        employeeNumber: idSchema,
        component: idSchema,
        amount: z.number().finite()
      })
    )
    .min(1, 'Nothing to import: every row was rejected.')
})

export type ImportedInput = z.infer<typeof importInput>['rows'][number]

/**
 * Accept validated input rows onto a run. The fake-db has no inputs store, so the run records
 * that its figures are stale; a real service would write the rows and queue a recalculation.
 */
export const importPayrollInputs = async (
  runId: string,
  rows: ImportedInput[]
): Promise<ActionResult<{ run: PayRun; imported: number; employees: number }>> => {
  const parsed = importInput.safeParse({ runId, rows })

  if (!parsed.success) return invalid(parsed.error)

  const run = findRun(parsed.data.runId)

  if (!run) return refuse('That pay run no longer exists.')

  if (LOCKED.has(run.status)) {
    return refuse(`${run.reference} is ${run.status}. Inputs cannot be added to a run after approval.`)
  }

  run.updatedAt = new Date().toISOString()
  revalidateRun(run)

  return ok({
    run,
    imported: parsed.data.rows.length,
    employees: new Set(parsed.data.rows.map(row => row.employeeNumber)).size
  })
}

const approveInput = z.object({
  runId: idSchema,
  calculationVersion: z.number().int().positive(),
  note: z.string().trim().max(500).optional()
})

/**
 * The one gate that matters. Refuses unless the run is awaiting approval, nothing blocking is
 * open, and the client is approving the calculation it looked at — the same rules the approval
 * dialog shows, enforced where a client cannot skip them.
 */
export const approveRun = async (
  runId: string,
  calculationVersion: number,
  note?: string
): Promise<ActionResult<PayRun>> => {
  const parsed = approveInput.safeParse({ runId, calculationVersion, note })

  if (!parsed.success) return invalid(parsed.error)

  const run = findRun(parsed.data.runId)

  if (!run) return refuse('That pay run no longer exists.')

  if (run.status !== 'calculated' && run.status !== 'pending_approval') {
    return refuse(`${run.reference} is ${run.status} and is not awaiting approval.`)
  }

  if (run.calculationVersion !== parsed.data.calculationVersion) {
    return refuse(
      `The run was recalculated since you reviewed it (now calculation #${run.calculationVersion}). Review the changes, then approve again.`
    )
  }

  const counts = countExceptions(run.exceptions)
  const blocking = counts.blocking + counts.error

  if (blocking > 0) {
    return refuse(
      `Payroll cannot be approved. ${blocking} ${blocking === 1 ? 'exception is' : 'exceptions are'} still blocking.`
    )
  }

  const now = new Date().toISOString()

  run.status = 'approved'
  run.approvals.push({ approvedBy: CURRENT_USER_ID, approvedAt: now, note: parsed.data.note })
  run.updatedAt = now
  revalidateRun(run)

  return ok(run)
}

// --- Payments ---------------------------------------------------------------------------------

/** Re-issue a returned or failed payment. The original stays as the audit record; a new one is released. */
export const reissueSettlement = async (settlementId: string): Promise<ActionResult<Settlement>> => {
  const parsed = idSchema.safeParse(settlementId)

  if (!parsed.success) return invalid(parsed.error)

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

// --- Settings ---------------------------------------------------------------------------------

type SettingsSection = 'general' | 'approvals' | 'notifications' | 'statutory' | 'components' | 'accounting'

const sectionSchemas = {
  general: z.object({
    entityName: z.string().trim().min(1, 'The entity needs a name.'),
    registrationNumber: z.string().trim().min(1, 'The registration number is required.'),
    defaultCurrency: z.enum(['USD', 'EUR', 'GBP', 'SGD', 'MYR', 'AUD', 'INR']),
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

  const parsed = schema.safeParse(values)

  if (!parsed.success) return invalid(parsed.error)
  ;(payrollSettings as Record<SettingsSection, unknown>)[section] = parsed.data
  revalidatePath('/payroll/settings')

  return ok(payrollSettings[section])
}

const payGroupInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'The pay group needs a name.'),
  entity: z.string().trim().min(1),
  currency: z.enum(['USD', 'EUR', 'GBP', 'SGD', 'MYR', 'AUD', 'INR']),
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

  const existing = parsed.data.id ? payrollSettings.payGroups.find(group => group.id === parsed.data.id) : undefined

  if (parsed.data.id && !existing) return refuse('That pay group no longer exists.')

  const duplicate = payrollSettings.payGroups.find(
    group => group.name.toLowerCase() === parsed.data.name.toLowerCase() && group.id !== existing?.id
  )

  if (duplicate) return refuse(`A pay group called ${duplicate.name} already exists.`)

  const saved: PayGroup = {
    id: existing?.id ?? `pg-${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: parsed.data.name,
    entity: parsed.data.entity,
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
  name: z.string().trim().min(1, 'The account needs a name.'),
  bankName: z.string().trim().min(1, 'Which bank?'),
  accountLast4: z.string().regex(/^\d{4}$/, 'Enter the last four digits only.'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'SGD', 'MYR', 'AUD', 'INR'])
})

export const addFundingAccount = async (
  values: Pick<FundingAccount, 'name' | 'bankName' | 'accountLast4' | 'currency'>
): Promise<ActionResult<FundingAccount>> => {
  const parsed = fundingAccountInput.safeParse(values)

  if (!parsed.success) return invalid(parsed.error)

  const account: FundingAccount = {
    id: `acct-${fundingAccounts.length + 1}`,
    ...parsed.data,
    balance: { amount: 0, currency: parsed.data.currency },
    isDefault: fundingAccounts.length === 0
  }

  fundingAccounts.push(account)
  revalidatePath('/payroll/settings')
  revalidatePath('/payroll/payments')

  return ok(account)
}

export const setDefaultFundingAccount = async (accountId: string): Promise<ActionResult<FundingAccount>> => {
  const parsed = idSchema.safeParse(accountId)

  if (!parsed.success) return invalid(parsed.error)

  const account = fundingAccounts.find(candidate => candidate.id === parsed.data)

  if (!account) return refuse('That funding account no longer exists.')

  for (const candidate of fundingAccounts) candidate.isDefault = candidate.id === account.id

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
