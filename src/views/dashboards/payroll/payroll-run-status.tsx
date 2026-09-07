// Next Imports
import Link from 'next/link'

// Third-party Imports
import { AlertTriangleIcon, ArrowRightIcon, CalendarClockIcon, UsersIcon } from 'lucide-react'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'
import { PAYROLL_STAGES } from '@/types/payroll/run-workspace-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { PAY_RUN_STATUS_LABELS, PAY_RUN_STATUS_STYLES } from '@/utils/payroll-metrics'
import { PAYROLL_STAGE_LABELS, stageIndexForStatus } from '@/utils/payroll-workspace'

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
  // The same six stages the run workspace draws, so the two never disagree on where a run is.
  const currentStage = stageIndexForStatus(run.status)
  const overdue = daysToCutoff !== null && daysToCutoff < 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
          {run.reference}
          <Badge className={PAY_RUN_STATUS_STYLES[run.status]}>{PAY_RUN_STATUS_LABELS[run.status]}</Badge>
        </CardTitle>
        <CardDescription>
          {run.periodStart} – {run.periodEnd} · pays {run.payDate}
        </CardDescription>
        <CardAction className='flex flex-col items-end gap-0.5'>
          <span className='text-3xl leading-none font-semibold tracking-tight sm:text-4xl'>
            {formatMoney(run.totals.employerCost)}
          </span>
          <span className='text-muted-foreground text-sm'>Total employer cost</span>
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-5'>
        {/* Stage track. A run that was cancelled or failed is not partway along this path, so
            it is rendered as a plain status above rather than a position on the track. */}
        <div className='flex items-center'>
          {PAYROLL_STAGES.map((stage, index) => {
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
                    {PAYROLL_STAGE_LABELS[stage]}
                  </span>
                </div>
                {index < PAYROLL_STAGES.length - 1 && (
                  <span className={cn('mx-2 mb-6 h-0.5 flex-1', done ? 'bg-primary' : 'bg-muted-foreground/20')} />
                )}
              </div>
            )
          })}
        </div>

        <div className='grid flex-1 items-center gap-4 sm:grid-cols-3'>
          <div className='bg-muted/40 flex items-center gap-3 rounded-md p-3'>
            <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-sm'>
              <UsersIcon className='size-4.5' />
            </span>
            <span className='flex flex-col'>
              <span className='font-semibold'>{run.employeeCount}</span>
              <span className='text-muted-foreground text-sm'>Employees in run</span>
            </span>
          </div>

          <div className='bg-muted/40 flex items-center gap-3 rounded-md p-3'>
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-sm',
                overdue ? 'bg-destructive/10 text-destructive-strong' : 'bg-success/10 text-success-strong'
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

          <div className='bg-muted/40 flex items-center gap-3 rounded-md p-3'>
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-sm',
                blockingCount > 0 ? 'bg-destructive/10 text-destructive-strong' : 'bg-success/10 text-success-strong'
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
        <div className='bg-muted/40 mt-auto grid grid-cols-2 gap-4 rounded-md p-4 sm:grid-cols-4'>
          {[
            { label: 'Gross', value: run.totals.grossPay },
            { label: 'Tax', value: run.totals.employeeTaxes },
            { label: 'Deductions', value: run.totals.employeeDeductions },
            { label: 'Net pay', value: run.totals.netPay }
          ].map(item => (
            <div key={item.label} className='flex flex-col gap-1'>
              <span className='text-muted-foreground text-xs tracking-wide uppercase'>{item.label}</span>
              <span className='text-base font-semibold'>{formatMoney(item.value)}</span>
            </div>
          ))}
        </div>

        <Button variant='outline' className='w-fit' render={<Link href={`/payroll/runs/${run.id}`} />} nativeButton={false}>
          Open run workspace
          <ArrowRightIcon />
        </Button>
      </CardContent>
    </Card>
  )
}

export default PayrollRunStatus
