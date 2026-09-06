'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { CheckIcon, RotateCcwIcon } from 'lucide-react'

// Type Imports
import type { SettlementBatch } from '@/types/payroll/settlement-types'
import type { SettlementRow } from '@/utils/payroll-payments'

// Component Imports
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import PayrollAuditTimeline from '@/views/payroll/run/payroll-audit-timeline'
import SettlementStatusBadge from './settlement-status-badge'

// Util Imports
import { formatMoney } from '@/utils/money'
import { settlementEvents } from '@/utils/payroll-payments'
import { formatDate, initials } from '@/utils/payroll-workspace'

type Props = {
  row: SettlementRow | null
  batch?: SettlementBatch
  open: boolean
  onOpenChange: (open: boolean) => void

  /** Absent when the signed-in person may not re-issue; the record is still shown. */
  onReissue?: (row: SettlementRow) => void
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='grid grid-cols-[7.5rem_1fr] gap-x-3 py-1.5 text-sm'>
    <dt className='text-muted-foreground'>{label}</dt>
    <dd className='min-w-0 break-words'>{children}</dd>
  </div>
)

/**
 * One payment's record and its life. A returned or failed payment that has not been re-issued
 * shows the bank's reason and the one action that clears it.
 */
const SettlementInspector = ({ row, batch, open, onOpenChange, onReissue }: Props) => {
  if (!row) return null

  const needsAction = (row.status === 'returned' || row.status === 'failed') && !row.superseded
  const missingAccount = row.status === 'action_required'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='gap-0 sm:max-w-md'>
        <SheetHeader className='pr-12'>
          <div className='flex flex-wrap items-center gap-2'>
            <SettlementStatusBadge status={row.status} />
            {row.retryOfId && <span className='text-muted-foreground text-xs'>Re-issue</span>}
            {row.superseded && <span className='text-muted-foreground text-xs'>Re-issued later</span>}
          </div>
          <SheetTitle className='text-base'>{formatMoney(row.amount)}</SheetTitle>
          <SheetDescription>
            {row.runReference} · payday {formatDate(row.payDate)}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className='min-h-0 flex-1'>
          <div className='flex flex-col gap-4 px-4 pb-4'>
            <div className='bg-muted/40 flex items-center gap-3 rounded-md border p-3'>
              <Avatar className='size-9'>
                {row.avatar && <AvatarImage src={row.avatar} alt='' />}
                <AvatarFallback className='text-xs'>{initials(row.employeeName)}</AvatarFallback>
              </Avatar>
              <div className='flex min-w-0 flex-1 flex-col'>
                <span className='truncate text-sm font-medium'>{row.employeeName}</span>
                <span className='text-muted-foreground text-xs'>
                  {row.employeeNumber} · {row.departmentName}
                </span>
              </div>
              <Button
                variant='outline'
                size='sm'
                render={<Link href={`/payroll/runs/${row.payRunId}?employee=${row.employeeId}`} />}
                nativeButton={false}
              >
                Open payslip
              </Button>
            </div>

            {needsAction && (
              <Alert variant='destructive'>
                <AlertTitle>
                  {row.status === 'returned' ? 'Payment returned by the bank' : 'Payment rejected'}
                </AlertTitle>
                <AlertDescription>
                  {row.reason}. The employee has not been paid for this run. Correct the account details, then re-issue.
                </AlertDescription>
              </Alert>
            )}

            {missingAccount && (
              <Alert variant='destructive'>
                <AlertTitle>No bank account on file</AlertTitle>
                <AlertDescription>
                  This payment cannot be included in the batch until an account is added to the employee&apos;s profile.
                </AlertDescription>
              </Alert>
            )}

            <dl className='divide-y'>
              <Field label='Method'>
                {row.method === 'bank_transfer'
                  ? row.accountLast4
                    ? `Bank transfer ···· ${row.accountLast4}`
                    : 'Bank transfer — no account'
                  : row.method}
              </Field>
              <Field label='Bank reference'>
                <span className='font-mono text-xs'>{row.reference ?? 'Not yet released'}</span>
              </Field>
              {batch && (
                <Field label='Batch'>
                  <span className='font-mono text-xs'>{batch.reference}</span>
                </Field>
              )}
              {row.reason && <Field label='Bank said'>{row.reason}</Field>}
              {row.retryOfId && (
                <Field label='Replaces'>
                  <span className='font-mono text-xs'>{row.retryOfId}</span>
                </Field>
              )}
            </dl>

            <div className='flex flex-col gap-2'>
              <h3 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>History</h3>
              <PayrollAuditTimeline
                events={settlementEvents(row, batch)}
                emptyMessage='Not yet released. History starts when the batch goes to the bank.'
              />
            </div>
          </div>
        </ScrollArea>

        {needsAction && onReissue && (
          <SheetFooter className='flex-row justify-end border-t'>
            <Button onClick={() => onReissue(row)}>
              <RotateCcwIcon />
              Re-issue payment
            </Button>
          </SheetFooter>
        )}

        {row.status === 'paid' && (
          <SheetFooter className='flex-row items-center border-t'>
            <CheckIcon className='text-success size-4' aria-hidden='true' />
            <span className='text-muted-foreground text-xs'>Settled. Nothing to do here.</span>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default SettlementInspector
