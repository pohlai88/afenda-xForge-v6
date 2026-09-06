'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { ClipboardCheckIcon } from 'lucide-react'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Util Imports
import { formatMoney } from '@/utils/money'
import { countExceptions } from '@/utils/payroll-metrics'
import { formatPeriod, formatSignedMoney } from '@/utils/payroll-workspace'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  run: PayRun
  onConfirm: (note?: string) => void
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className='flex items-baseline justify-between gap-4 py-1 text-sm'>
    <dt className='text-muted-foreground'>{label}</dt>
    <dd className='font-medium tabular-nums'>{value}</dd>
  </div>
)

/**
 * "I have reviewed calculation #N." The reviewer signs the figures and the open findings as they
 * stand; the record moves the run to Pending approval, and the approver reads it back in the
 * approval dialog. It is deliberately a small decision — reviewing is not approving.
 */
const PayrollReviewDialog = ({ open, onOpenChange, run, onConfirm }: Props) => {
  const [note, setNote] = useState('')
  const counts = countExceptions(run.exceptions)
  const diff = run.lastCalculationDiff

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Mark calculation #{run.calculationVersion} as reviewed?</DialogTitle>
          <DialogDescription>
            {run.reference} · {formatPeriod(run.periodStart, run.periodEnd)}. This records that you have looked at these
            figures and findings. It does not approve the run.
          </DialogDescription>
        </DialogHeader>

        <dl className='divide-y'>
          <Row label='Employees' value={run.employeeCount} />
          <Row label='Net pay' value={formatMoney(run.totals.netPay)} />
          {diff && diff.currentVersion === run.calculationVersion && (
            <Row
              label={`Changed vs #${diff.previousVersion}`}
              value={`${diff.affectedEmployees} ${diff.affectedEmployees === 1 ? 'employee' : 'employees'} · net ${formatSignedMoney(diff.netDelta)}`}
            />
          )}
          <Row
            label='Open findings'
            value={
              counts.open === 0
                ? 'None'
                : `${counts.blocking} blocking · ${counts.error} error · ${counts.warning} warning`
            }
          />
        </dl>

        <div className='flex flex-col gap-2'>
          <Label htmlFor='review-note'>Note for the approver (optional)</Label>
          <Textarea
            id='review-note'
            value={note}
            onChange={event => setNote(event.target.value)}
            placeholder='What you checked, and anything the approver should know.'
            rows={3}
            maxLength={500}
          />
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(note.trim() || undefined)
              setNote('')
            }}
          >
            <ClipboardCheckIcon />
            Mark as reviewed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PayrollReviewDialog
