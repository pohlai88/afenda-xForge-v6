// Third-party Imports
import { AlertTriangleIcon, CalendarClockIcon, UsersIcon } from 'lucide-react'

// Type Imports
import type { PayRun, PayRunStatus } from '@/types/payroll/pay-run-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { PAY_RUN_STATUS_LABELS, PAY_RUN_STATUS_STYLES, RUN_STAGES, stageIndexFor } from '@/utils/payroll-metrics'

/**
 * Shorter labels used throughout this card.
 *
 * The badge sits directly above the progress track, so both have to say the same word for the
 * same status — 'Pending approval' in one and 'Approval' in the other reads as two different
 * things. The track is the tighter of the two, so its wording wins for the whole card.
 * Everything else comes from the shared map.
 */
const CARD_LABELS: Partial<Record<string, string>> = { pending_approval: 'Approval' }

const cardLabel = (status: PayRunStatus) => CARD_LABELS[status] ?? PAY_RUN_STATUS_LABELS[status]

type Props = {
  run: PayRun

  /**
   * Supplied by the caller rather than read from the clock here, so this stays deterministic.
   * Null for a finished run, where a countdown to a long-past cut-off says nothing.
   */
  daysToCutoff: number | null
  blockingCount: number
  className?: string
}

const PayrollRunStatus = ({ run, daysToCutoff, blockingCount, className }: Props) => {
  const currentStage = stageIndexFor(run)
  const overdue = daysToCutoff !== null && daysToCutoff < 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
          {run.reference}
          <Badge className={PAY_RUN_STATUS_STYLES[run.status]}>{cardLabel(run.status)}</Badge>
        </CardTitle>
        <CardDescription>
          {run.periodStart} – {run.periodEnd} · pays {run.payDate}
        </CardDescription>
        <CardAction className='flex flex-col items-end gap-1'>
          <span className='text-2xl font-semibold'>{formatMoney(run.totals.employerCost)}</span>
          <span className='text-muted-foreground text-sm'>Total employer cost</span>
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-6'>
        {/* Stage track. A run that was cancelled or failed is not partway along this path, so
            it is rendered as a plain status above rather than a position on the track. */}
        <div className='flex items-center'>
          {RUN_STAGES.map((stage, index) => {
            const done = index < currentStage
            const active = index === currentStage

            return (
              <div key={stage} className='flex flex-1 items-center last:flex-none'>
                <div className='flex flex-col items-center gap-2'>
                  <span
                    className={cn(
                      'size-3 shrink-0 rounded-full border-2',
                      done && 'bg-primary border-primary',
                      active && 'border-primary bg-primary/20 ring-primary/20 ring-4',
                      !done && !active && 'border-muted-foreground/30'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs whitespace-nowrap',
                      active ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {cardLabel(stage)}
                  </span>
                </div>
                {index < RUN_STAGES.length - 1 && (
                  <span className={cn('mx-2 mb-6 h-0.5 flex-1', done ? 'bg-primary' : 'bg-muted-foreground/20')} />
                )}
              </div>
            )
          })}
        </div>

        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='flex items-center gap-3'>
            <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-sm'>
              <UsersIcon className='size-4.5' />
            </span>
            <span className='flex flex-col'>
              <span className='font-semibold'>{run.employeeCount}</span>
              <span className='text-muted-foreground text-sm'>Employees in run</span>
            </span>
          </div>

          <div className='flex items-center gap-3'>
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-sm',
                overdue ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
              )}
            >
              <CalendarClockIcon className='size-4.5' />
            </span>
            <span className='flex flex-col'>
              <span className='font-semibold'>
                {daysToCutoff === null
                  ? run.payDate
                  : overdue
                    ? `${Math.abs(daysToCutoff)} days overdue`
                    : `${daysToCutoff} days left`}
              </span>
              <span className='text-muted-foreground text-sm'>
                {daysToCutoff === null ? 'Paid on' : 'Until cut-off'}
              </span>
            </span>
          </div>

          <div className='flex items-center gap-3'>
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-sm',
                blockingCount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
              )}
            >
              <AlertTriangleIcon className='size-4.5' />
            </span>
            <span className='flex flex-col'>
              <span className='font-semibold'>{blockingCount}</span>
              <span className='text-muted-foreground text-sm'>
                {blockingCount === 1 ? 'Blocking issue' : 'Blocking issues'}
              </span>
            </span>
          </div>
        </div>

        {/* The same figures the bridge chart draws, as exact amounts. The chart shows the shape
            of the run; someone signing it off needs the numbers to the cent. */}
        <div className='mt-auto grid grid-cols-2 gap-4 border-t pt-5 sm:grid-cols-4'>
          {[
            { label: 'Gross', value: run.totals.grossPay },
            { label: 'Tax', value: run.totals.employeeTaxes },
            { label: 'Deductions', value: run.totals.employeeDeductions },
            { label: 'Net pay', value: run.totals.netPay }
          ].map(item => (
            <div key={item.label} className='flex flex-col gap-1'>
              <span className='text-muted-foreground text-xs tracking-wide uppercase'>{item.label}</span>
              <span className='font-semibold'>{formatMoney(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default PayrollRunStatus
