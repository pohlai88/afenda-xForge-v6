/**
 * The approval policy, decided once.
 *
 * `approveRun()` on the server and the approval dialog in the browser both call
 * `evaluatePayrollApproval` with the same run, actor and settings, so the dialog can never show
 * a gate the server does not enforce, and the server can never refuse for a reason the dialog
 * did not list. Deterministic: no clock, no Intl.
 */

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'
import type { PayrollActor } from '@/types/payroll/permission-types'
import type { AccessRole, ApprovalSettings } from '@/types/payroll/settings-types'

// Util Imports
import { formatMoney } from '@/utils/money'
import { PAY_RUN_STATUS_LABELS, countExceptions } from '@/utils/payroll-metrics'

export type ApprovalReasonKey =
  | 'status'
  | 'stale'
  | 'unreviewed'
  | 'blockers'
  | 'errors'
  | 'warnings'
  | 'role'
  | 'already_signed'

export interface ApprovalReason {
  key: ApprovalReasonKey

  /** In the interface's voice: what is wrong and what clears it. */
  message: string

  /** Which workspace view clears it, when one does. */
  view?: 'employees' | 'exceptions'
}

export interface ApprovalEvaluation {
  canApprove: boolean
  blockingReasons: ApprovalReason[]

  /** True but not blocking: the approver is signing over these. */
  notes: string[]
  calculationVersion: number

  /** The current calculation has a review record. */
  reviewed: boolean

  /** Inputs landed after the current calculation. */
  stale: boolean
  requiresSecondApproval: boolean
  signaturesRequired: 1 | 2
  signaturesGiven: number

  /** Access role ids that may sign. */
  requiredApproverRoles: string[]
}

type Input = {
  run: PayRun
  settings: ApprovalSettings

  /** Null when evaluating without a person, e.g. to describe the gate on a server page. */
  actor: PayrollActor | null

  /** For naming roles in messages. Optional; ids are used when absent. */
  roles?: AccessRole[]
}

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`

export const evaluatePayrollApproval = ({ run, settings, actor, roles = [] }: Input): ApprovalEvaluation => {
  const reasons: ApprovalReason[] = []
  const notes: string[] = []
  const counts = countExceptions(run.exceptions)

  const awaiting = run.status === 'calculated' || run.status === 'pending_approval'
  const reviewed = run.review?.calculationVersion === run.calculationVersion
  const stale = !!run.pendingInputs

  const requiresSecondApproval =
    settings.secondApproverAbove !== null && run.totals.netPay.amount > settings.secondApproverAbove.amount

  const signaturesRequired = requiresSecondApproval ? 2 : 1
  const signaturesGiven = run.approvals.length

  if (!awaiting) {
    reasons.push({
      key: 'status',
      message:
        run.status === 'approved' || run.status === 'paid' || run.status === 'closed'
          ? `${run.reference} is already ${PAY_RUN_STATUS_LABELS[run.status].toLowerCase()}.`
          : `${run.reference} is ${PAY_RUN_STATUS_LABELS[run.status].toLowerCase()} and is not awaiting approval.`
    })
  }

  if (stale && run.pendingInputs) {
    reasons.push({
      key: 'stale',
      message: `Calculation #${run.calculationVersion} is out of date. ${plural(run.pendingInputs.count, 'input')} for ${plural(run.pendingInputs.employees, 'employee')} changed after it. Recalculate before approving.`
    })
  }

  if (!reviewed) {
    reasons.push({
      key: 'unreviewed',
      message: `Calculation #${run.calculationVersion} has not been reviewed. A reviewer signs it off before it can be approved.`
    })
  }

  if (counts.blocking > 0) {
    reasons.push({
      key: 'blockers',
      message: `${plural(counts.blocking, 'blocking exception')} still open. Resolve ${counts.blocking === 1 ? 'it' : 'them'}, then approve.`,
      view: 'exceptions'
    })
  }

  if (counts.error > 0) {
    if (settings.blockOnErrors) {
      reasons.push({
        key: 'errors',
        message: `${plural(counts.error, 'error')} unresolved. The approval rules treat errors as blockers.`,
        view: 'exceptions'
      })
    } else {
      notes.push(`Approving over ${plural(counts.error, 'unresolved error')}; the approval rules allow it.`)
    }
  }

  const unacknowledgedWarnings = run.exceptions.filter(
    e => e.severity === 'warning' && !e.resolvedAt && !e.acknowledgedAt
  ).length

  if (unacknowledgedWarnings > 0) {
    if (settings.requireWarningsAcknowledged) {
      reasons.push({
        key: 'warnings',
        message: `${plural(unacknowledgedWarnings, 'warning')} not yet acknowledged. Someone has to look at each one before approval.`,
        view: 'exceptions'
      })
    } else {
      notes.push(`${plural(unacknowledgedWarnings, 'warning')} not acknowledged; the approval rules do not require it.`)
    }
  }

  if (counts.acknowledged > 0) {
    notes.push(`Approving over ${plural(counts.acknowledged, 'acknowledged warning')}.`)
  }

  if (actor) {
    const mayApprove = actor.roleIds.some(roleId => settings.approverRoles.includes(roleId))

    if (!mayApprove) {
      const roleNames = settings.approverRoles.map(id => roles.find(role => role.id === id)?.name ?? id)

      reasons.push({
        key: 'role',
        message: `Your role cannot approve payroll. Approval needs ${roleNames.join(' or ')}.`
      })
    }

    if (run.approvals.some(approval => approval.approvedBy === actor.id)) {
      reasons.push({
        key: 'already_signed',
        message: 'You have already signed this run. A different approver must give the second signature.'
      })
    }
  }

  if (requiresSecondApproval && settings.secondApproverAbove) {
    notes.push(
      `Net pay is above ${formatMoney(settings.secondApproverAbove)}, so two signatures are required. ${signaturesGiven} of 2 given.`
    )
  }

  return {
    canApprove: reasons.length === 0,
    blockingReasons: reasons,
    notes,
    calculationVersion: run.calculationVersion,
    reviewed,
    stale,
    requiresSecondApproval,
    signaturesRequired,
    signaturesGiven,
    requiredApproverRoles: settings.approverRoles
  }
}

/**
 * Whether a run may be marked reviewed right now. Reviewing is cheaper than approving — it
 * needs a current calculation and nothing else — but it cannot happen over stale figures.
 */
export const reviewRefusal = (run: PayRun): string | null => {
  if (run.status !== 'calculated' && run.status !== 'pending_approval') {
    return `${run.reference} is ${PAY_RUN_STATUS_LABELS[run.status].toLowerCase()} and is not open for review.`
  }

  if (run.pendingInputs) {
    return `Calculation #${run.calculationVersion} is out of date. Recalculate before reviewing.`
  }

  if (run.review?.calculationVersion === run.calculationVersion) {
    return `Calculation #${run.calculationVersion} has already been reviewed.`
  }

  return null
}
