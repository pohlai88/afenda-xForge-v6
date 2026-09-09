'use client'

// React Imports
import { useState, useTransition } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { AlertOctagonIcon, ArrowRightIcon, CheckIcon, FileCheckIcon, LandmarkIcon, SendIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'
import type { SettlementBatch } from '@/types/payroll/settlement-types'
import type { BatchEvaluation } from '@/utils/payroll-payments'

// Component Imports
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BatchStageRail from './batch-stage-rail'

// Action Imports
import { acknowledgeBatch, prepareBatch, releaseBatch, settleBatch } from '@/app/server/actions'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { BATCH_ACTION_LABELS, BATCH_STATUS_LABELS, BATCH_STATUS_STYLES } from '@/utils/payroll-payments'
import { formatDate, formatInstant } from '@/utils/payroll-workspace'

type Props = {
  batch: SettlementBatch
  run: PayRun
  evaluation: BatchEvaluation

  /** Employee id -> display name, for who prepared and released. */
  employeeNames: Record<string, string>

  /** What the signed-in person may do. The server enforces the same; these only hide controls. */
  mayPrepare: boolean
  mayRelease: boolean
  className?: string
}

const ACTION_ICONS = {
  prepare: FileCheckIcon,
  release: SendIcon,
  acknowledge: LandmarkIcon,
  settle: CheckIcon
} as const

/**
 * The payment file's life, and the one thing that moves it on. Prepare builds and validates the
 * file from the approved run; Release sends it; the bank's acknowledgement and settlement are
 * recorded as they arrive, so "paid" on a payslip is a bank event someone entered, not a date
 * that passed. Every step is refused with a reason when its gate is not met — the same gate the
 * server applies.
 */
const PaymentRelease = ({
  batch: initial,
  run,
  evaluation,
  employeeNames,
  mayPrepare,
  mayRelease,
  className
}: Props) => {
  const router = useRouter()
  const [batch, setBatch] = useState(initial)
  const [bankReference, setBankReference] = useState('')
  const [pending, startTransition] = useTransition()

  const next = evaluation.next
  const blocked = evaluation.blockingReasons.length > 0
  const allowed = next === 'prepare' ? mayPrepare : next !== null ? mayRelease : false
  const nameOf = (id?: string) => (id ? (employeeNames[id] ?? id) : undefined)

  const commit = (
    optimistic: Partial<SettlementBatch>,
    action: () => Promise<{ ok: true; data: SettlementBatch } | { ok: false; message: string }>,
    message: string
  ) => {
    const snapshot = batch

    setBatch(current => ({ ...current, ...optimistic }))
    startTransition(async () => {
      const result = await action()

      if (!result.ok) {
        setBatch(snapshot)
        toast.error(result.message)

        return
      }

      setBatch(result.data)
      toast.success(message, { description: `${batch.reference} · ${formatMoney(result.data.total)}` })

      // The settlements, the run and the readiness gates all moved; let the page re-read them.
      router.refresh()
    })
  }

  const act = () => {
    const now = new Date().toISOString()

    switch (next) {
      case 'prepare':
        return commit({ status: 'prepared', preparedAt: now }, () => prepareBatch(batch.id), 'Payment file prepared')
      case 'release':
        return commit(
          { status: 'released', releasedAt: now },
          () => releaseBatch(batch.id),
          'Payment file released to the bank'
        )
      case 'acknowledge':
        return commit(
          { status: 'processing', acceptedAt: now, bankReference: bankReference.trim() },
          () => acknowledgeBatch(batch.id, bankReference.trim()),
          'Bank acknowledgement recorded'
        )
      case 'settle':
        return commit({ status: 'settled', settledAt: now }, () => settleBatch(batch.id), 'Settlement recorded')
      default:
        return undefined
    }
  }

  const ActionIcon = next ? ACTION_ICONS[next] : CheckIcon

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Payment file</CardTitle>
        <CardDescription>
          {run.reference} · {batch.reference} · payday {formatDate(batch.scheduledFor)}
        </CardDescription>
        <CardAction>
          <Badge className={BATCH_STATUS_STYLES[batch.status]}>{BATCH_STATUS_LABELS[batch.status]}</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-5'>
        <BatchStageRail batch={batch} />

        <dl className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4'>
          <div className='flex flex-col gap-0.5'>
            <dt className='text-muted-foreground text-xs tracking-wide uppercase'>Payments</dt>
            <dd className='font-semibold tabular-nums'>{batch.count}</dd>
          </div>
          <div className='flex flex-col gap-0.5'>
            <dt className='text-muted-foreground text-xs tracking-wide uppercase'>Total</dt>
            <dd className='font-semibold tabular-nums'>{formatMoney(batch.total)}</dd>
          </div>
          <div className='flex flex-col gap-0.5'>
            <dt className='text-muted-foreground text-xs tracking-wide uppercase'>Prepared by</dt>
            <dd className={cn('font-medium', !batch.preparedBy && 'text-muted-foreground')}>
              {nameOf(batch.preparedBy) ?? 'Not yet'}
            </dd>
          </div>
          <div className='flex flex-col gap-0.5'>
            <dt className='text-muted-foreground text-xs tracking-wide uppercase'>
              {batch.bankReference ? 'Bank reference' : 'Released by'}
            </dt>
            <dd className={cn('font-medium', !batch.releasedBy && 'text-muted-foreground')}>
              {batch.bankReference ? (
                <span className='font-mono text-xs'>{batch.bankReference}</span>
              ) : (
                (nameOf(batch.releasedBy) ?? 'Not yet')
              )}
            </dd>
          </div>
        </dl>

        {batch.validation && (
          <p className='text-muted-foreground text-xs'>
            Validated {formatInstant(batch.validation.checkedAt)}: {batch.validation.payments} payments,{' '}
            {formatMoney(batch.validation.total)},{' '}
            {batch.validation.issues.length === 0
              ? 'no issues'
              : `${batch.validation.issues.length} ${batch.validation.issues.length === 1 ? 'issue' : 'issues'}`}
            {batch.validation.excludedEmployeeIds.length > 0 &&
              ` · left out: ${batch.validation.excludedEmployeeIds.map(id => nameOf(id)).join(', ')}`}
            .
          </p>
        )}

        {evaluation.notes.length > 0 && (
          <ul className='text-warning-strong list-disc pl-4 text-xs'>
            {evaluation.notes.map(note => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}

        {blocked && next && (
          <Alert variant='destructive'>
            <AlertOctagonIcon />
            <AlertTitle>{BATCH_ACTION_LABELS[next]} is not possible yet.</AlertTitle>
            <AlertDescription>
              {evaluation.blockingReasons.length === 1 ? (
                evaluation.blockingReasons[0]
              ) : (
                <ul className='list-disc pl-4'>
                  {evaluation.blockingReasons.map(reason => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {next === 'acknowledge' && allowed && (
          <div className='flex flex-col gap-2'>
            <Label htmlFor='bank-reference'>Bank reference from the acknowledgement</Label>
            <Input
              id='bank-reference'
              value={bankReference}
              onChange={event => setBankReference(event.target.value)}
              placeholder='e.g. DBS-GIRO-SEP26-097'
              className='max-w-xs font-mono text-xs'
            />
          </div>
        )}
      </CardContent>

      <CardFooter className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-muted-foreground text-sm'>
          {next === null
            ? `Settled ${batch.settledAt ? formatInstant(batch.settledAt) : ''}`
            : !allowed
              ? `Your role cannot ${BATCH_ACTION_LABELS[next].toLowerCase()}.`
              : next === 'prepare'
                ? 'Builds the bank file from the approved calculation and checks every payment.'
                : next === 'release'
                  ? 'Sends the file to the bank. Payments cannot be recalled after this.'
                  : next === 'acknowledge'
                    ? 'Enter the reference the bank returned when it accepted the file.'
                    : 'Confirms the bank has settled every payment in the file.'}
        </p>
        <div className='flex items-center gap-2'>
          {blocked && evaluation.href && (
            <Button variant='outline' render={<Link href={evaluation.href} />} nativeButton={false}>
              Fix
              <ArrowRightIcon />
            </Button>
          )}
          {next && allowed && (
            <Button onClick={act} disabled={pending || blocked || (next === 'acknowledge' && !bankReference.trim())}>
              <ActionIcon />
              {BATCH_ACTION_LABELS[next]}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

export default PaymentRelease
