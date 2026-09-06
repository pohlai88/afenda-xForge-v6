'use client'

// Third-party Imports
import { AlertOctagonIcon, CheckIcon } from 'lucide-react'

// Type Imports
import type { PayRun, PayRunException } from '@/types/payroll/pay-run-types'

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
import { formatInstant, formatPeriod } from '@/utils/payroll-workspace'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  run: PayRun

  /** Current exception state — may differ from `run.exceptions` if some were cleared this session. */
  exceptions: PayRunException[]

  /** Employees whose payslip changed after the last review of this calculation. */
  changedSinceReview: number
  preparedBy: string
  reviewedBy?: string
  onApprove: () => void
  onReviewExceptions: () => void
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className='flex items-baseline justify-between gap-4 py-1 text-sm'>
    <dt className='text-muted-foreground'>{label}</dt>
    <dd className='font-medium tabular-nums'>{value}</dd>
  </div>
)

/**
 * The contained decision. Everything the approver is signing is on this one surface: the
 * figures, which calculation produced them, what is still open and who has looked at it.
 * There is no way to approve from a context-free button.
 */
const PayrollApprovalDialog = ({
  open,
  onOpenChange,
  run,
  exceptions,
  changedSinceReview,
  preparedBy,
  reviewedBy,
  onApprove,
  onReviewExceptions
}: Props) => {
  const counts = countExceptions(exceptions)
  const blocked = counts.blocking > 0 || counts.error > 0

  const unacknowledgedWarnings = exceptions.filter(
    e => e.severity === 'warning' && !e.resolvedAt && !e.acknowledgedAt
  ).length

  const blockedEmployees = new Set(
    exceptions
      .filter(e => (e.severity === 'blocking' || e.severity === 'error') && !e.resolvedAt)
      .map(e => e.employeeId ?? e.departmentId)
  ).size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Approve {formatPeriod(run.periodStart, run.periodEnd)} payroll?</DialogTitle>
          <DialogDescription>
            {run.reference} · {run.payGroup}. Approval locks calculation #{run.calculationVersion}; any later change to
            inputs will require a new calculation and a new approval.
          </DialogDescription>
        </DialogHeader>

        {blocked && (
          <Alert variant='destructive'>
            <AlertOctagonIcon />
            <AlertTitle>Payroll cannot be approved.</AlertTitle>
            <AlertDescription>
              {blockedEmployees === 1 ? '1 record still has' : `${blockedEmployees} records still have`} unresolved{' '}
              {counts.blocking > 0 && counts.error > 0
                ? 'blocking and error'
                : counts.blocking > 0
                  ? 'blocking'
                  : 'error'}{' '}
              exceptions. Resolve them, then come back here.
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
                <span className='text-muted-foreground font-normal'>
                  {' '}
                  · {counts.warning - unacknowledgedWarnings} acknowledged
                  {unacknowledgedWarnings > 0 && `, ${unacknowledgedWarnings} not yet`}
                </span>
              </>
            }
          />
          <Row
            label='Changed since review'
            value={changedSinceReview === 0 ? 'No payslips' : `${changedSinceReview} payslips`}
          />
          <Row label='Prepared by' value={preparedBy} />
          <Row
            label='Reviewed by'
            value={reviewedBy ?? <span className='text-muted-foreground'>Not yet reviewed</span>}
          />
        </dl>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {blocked ? (
            <Button
              onClick={() => {
                onOpenChange(false)
                onReviewExceptions()
              }}
            >
              Review exceptions
            </Button>
          ) : (
            <Button onClick={onApprove}>
              <CheckIcon />
              Approve payroll
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PayrollApprovalDialog
