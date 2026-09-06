// Type Imports
import type { CurrencyCode, IsoDate, IsoDateTime, Money } from '@/types/common/primitive-types'
import type { PaymentMethod } from '@/types/hrm/employee-types'
import type { EmployeePaymentStatus } from '@/types/payroll/run-workspace-types'

/**
 * Payments domain: how an approved run's net pay actually reaches people.
 *
 * A Settlement is one payment to one employee for one run. Settlements are grouped into a
 * Batch, which is what gets released to a bank as a single file drawn on one FundingAccount.
 * The status vocabulary is `EmployeePaymentStatus` — the same words the run workspace shows
 * in its Payment column, on purpose: a settlement that is 'returned' here is 'returned' there.
 */

export interface FundingAccount {
  id: string
  name: string
  bankName: string

  /** Last four digits only. The full number never leaves the server boundary. */
  accountLast4: string
  currency: CurrencyCode
  balance: Money
  isDefault: boolean
}

/**
 * A batch's life, in order. 'draft' is a file nobody has built yet; 'prepared' is a file that
 * has been built and validated; 'released' has gone to the bank; 'accepted' is the bank's
 * acknowledgement; 'processing' is money in flight; 'settled' is money landed. Every step is a
 * recorded event with a timestamp, never an assumption from the calendar.
 * 'partially_returned' is settled with at least one payment back.
 */
export type SettlementBatchStatus =
  | 'draft'
  | 'prepared'
  | 'released'
  | 'accepted'
  | 'processing'
  | 'settled'
  | 'partially_returned'

/** What preparing the file checked, kept so the release screen can show its evidence. */
export interface BatchValidation {
  checkedAt: IsoDateTime
  payments: number
  total: Money

  /** Problems that stop release, in the interface's voice. Empty means the file is clean. */
  issues: string[]

  /** Employees left out of the file because they cannot be paid by it yet, e.g. no bank account. */
  excludedEmployeeIds: string[]
}

export interface SettlementBatch {
  id: string
  payRunId: string
  fundingAccountId: string

  /** What the bank statement will show, e.g. 'AFENDA PAYROLL SEP26'. */
  reference: string
  total: Money
  count: number
  status: SettlementBatchStatus
  scheduledFor: IsoDate
  preparedAt?: IsoDateTime
  preparedBy?: string
  validation?: BatchValidation
  releasedAt?: IsoDateTime
  releasedBy?: string

  /** The bank's reference for the file, recorded when it acknowledges receipt. */
  bankReference?: string
  acceptedAt?: IsoDateTime
  settledAt?: IsoDateTime
}

export interface Settlement {
  id: string
  batchId: string
  payRunId: string
  employeeId: string
  amount: Money
  method: PaymentMethod
  accountLast4?: string
  status: EmployeePaymentStatus

  /** Bank-side transaction reference once released. */
  reference?: string
  releasedAt?: IsoDateTime
  settledAt?: IsoDateTime
  returnedAt?: IsoDateTime
  failedAt?: IsoDateTime

  /** Why it came back or did not go, in the bank's words. */
  reason?: string

  /** Set on a re-issue, pointing at the settlement it replaces. */
  retryOfId?: string
}
