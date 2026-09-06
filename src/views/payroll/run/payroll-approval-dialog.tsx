'use client'

// Third-party Imports
import { AlertOctagonIcon, CheckIcon } from 'lucide-react'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'
import type { ApprovalEvaluation, ApprovalReason } from '@/utils/payroll-approval'

// Component Imports
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { formatMoney } from '@/utils/money'
import { countExceptions } from '@/utils/payroll-metrics'
import { formatInstant, formatPeriod, formatSignedMoney } from '@/utils/payroll-workspace'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  run: PayRun

  /** From `evaluatePayrollApproval` — the same verdict `approveRun()` will reach. */
  evaluation: ApprovalEvaluation
  preparedBy: string
  reviewedBy?: string
  onApprove: () => void

  /** Where a blocking reason is cleared. */
  onResolve: (reason: ApprovalReason) => void
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className='flex items-baseline justify-between gap-4 py-1 text-sm'>
    <dt className='text-muted-foreground'>{label}</dt>
    <dd className='font-medium tabular-nums'>{value}</dd>
  </div>
)

/**
 * The contained decision. Everything the approver is signing is on this one surface: the
 * figures, which calculation produced them, what changed since the last one, who reviewed it,
 * and every reason the policy would refuse — listed from the same evaluation the server runs,
 * so nothing shown here can be approved over and nothing hidden here can refuse.
 */
const PayrollApprovalDialog = ({
  open,
  onOpenChange,
  run,
  evaluation,
  preparedBy,
  reviewedBy,
  onApprove,
  onResolve
}: Props) => {
  const counts = countExceptions(run.exceptions)
  const blocked = !evaluation.canApprove
  const first = evaluation.blockingReasons[0]
  const diff = run.lastCalculationDiff
  const unacknowledgedWarnings = counts.warning - counts.acknowledged

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Scrolls inside the viewport: with a reviewer's note and policy notes the content can be
          taller than a laptop screen, and a footer below the fold is an approval nobody can give. */}
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Approve {formatPeriod(run.periodStart, run.periodEnd)} payroll?</DialogTitle>
          <DialogDescription>
            {run.reference} · {run.payGroup}. Approval locks calculation #{run.calculationVersion}; any later change to
            inputs will require a new calculation, a new review and a new approval.
          </DialogDescription>
        </DialogHeader>

        {blocked && (
          <Alert variant='destructive'>
            <AlertOctagonIcon />
            <AlertTitle>Payroll cannot be approved.</AlertTitle>
            <AlertDescription>
              {evaluation.blockingReasons.length === 1 ? (
                first.message
              ) : (
                <ul className='list-disc pl-4'>
                  {evaluation.blockingReasons.map(reason => (
                    <li key={reason.key}>{reason.message}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        <dl className='divide-y'>
          <Row label='Employees' value={run.employeeCount} />
          <Row label='Gross pay' value={formatMoney(run.totals.grossPay)} />
          <Row label='Net pay' value={formatMoney(run.totals.netPay)} />
          <Row label='Employer cost' value={formatMoney(run.totals.employerCost)} />
          <Row
            label='Calculation'
            value={
              <>
                #{run.calculationVersion}
                {run.lastCalculatedAt && (
                  <span className='text-muted-foreground font-normal'> · {formatInstant(run.lastCalculatedAt)}</span>
                )}
              </>
            }
          />
          {diff && diff.currentVersion === run.calculationVersion && (
            <Row
              label={`Changed vs #${diff.previousVersion}`}
              value={
                diff.affectedEmployees === 0 ? (
                  'No payslips'
                ) : (
                  <>
                    {diff.affectedEmployees} {diff.affectedEmployees === 1 ? 'payslip' : 'payslips'}
                    <span className='text-muted-foreground font-normal'>
                      {' '}
                      · net {formatSignedMoney(diff.netDelta)} · cost {formatSignedMoney(diff.employerCostDelta)}
                    </span>
                  </>
                )
              }
            />
          )}
        </dl>

        <Separator />

        <dl className='divide-y'>
          <Row
            label='Blockers'
            value={<span className={counts.blocking > 0 ? 'text-destructive' : 'text-success'}>{counts.blocking}</span>}
          />
          <Row
            label='Errors'
            value={<span className={counts.error > 0 ? 'text-destructive' : 'text-success'}>{counts.error}</span>}
          />
          <Row
            label='Warnings'
            value={
              <>
                {counts.warning}
                {counts.warning > 0 && (
                  <span className='text-muted-foreground font-normal'>
                    {' '}
                    · {counts.acknowledged} acknowledged
                    {unacknowledgedWarnings > 0 && `, ${unacknowledgedWarnings} not yet`}
                  </span>
                )}
              </>
            }
          />
          <Row label='Prepared by' value={preparedBy} />
          <Row
            label='Reviewed by'
            value={
              evaluation.reviewed && reviewedBy ? (
                <>
                  {reviewedBy}
                  {run.review && (
                    <span className='text-muted-foreground font-normal'> · {formatInstant(run.review.reviewedAt)}</span>
                  )}
                </>
              ) : (
                <span className='text-muted-foreground'>Not reviewed</span>
              )
            }
          />
          {evaluation.requiresSecondApproval && (
            <Row label='Signatures' value={`${evaluation.signaturesGiven} of ${evaluation.signaturesRequired}`} />
          )}
        </dl>

        {run.review?.note && evaluation.reviewed && (
          <p className='bg-muted/40 rounded-md border p-3 text-sm'>
            <span className='text-muted-foreground text-xs'>Reviewer’s note</span>
            <br />
            {run.review.note}
          </p>
        )}

        {evaluation.notes.length > 0 && (
          <ul className='text-muted-foreground list-disc pl-4 text-xs'>
            {evaluation.notes.map(note => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {blocked ? (
            <Button
              onClick={() => {
                onOpenChange(false)
                onResolve(first)
              }}
            >
              {first.key === 'stale'
                ? 'Recalculate'
                : first.key === 'unreviewed'
                  ? 'Review the calculation'
                  : first.view === 'exceptions'
                    ? 'Review exceptions'
                    : 'Close'}
            </Button>
          ) : (
            <Button onClick={onApprove}>
              <CheckIcon />
              {evaluation.requiresSecondApproval && evaluation.signaturesGiven === 0
                ? 'Give first signature'
                : 'Approve payroll'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PayrollApprovalDialog
