// Next Imports
import Link from 'next/link'

// Third-party Imports
import { AlertOctagonIcon, AlertTriangleIcon, ArrowRightIcon, CheckCircle2Icon } from 'lucide-react'

// Type Imports
import type { PayRunQueueRow } from '@/types/payroll/run-queue-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExceptionBadge } from '@/views/payroll/run/exception-badge'
import PayrollStageBar from '@/views/payroll/run/payroll-stage-bar'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { PAY_RUN_STATUS_LABELS, PAY_RUN_STATUS_STYLES } from '@/utils/payroll-metrics'
import { formatDate, formatInstant, formatPeriod } from '@/utils/payroll-workspace'

type Props = {
  row: PayRunQueueRow
  className?: string
}

const SEVERITIES = ['blocking', 'error', 'warning', 'info'] as const

/** Payday within this many days is close enough to colour. */
const SOON = 3

/**
 * The countdown is the page's one large figure. It is what the queue is for: not how much the
 * run costs — the dashboard leads with that — but how long there is to finish it.
 */
const Countdown = ({ row }: { row: PayRunQueueRow }) => {
  const days = row.daysToPayday

  if (days === null) {
    return (
      <>
        <span className='text-3xl leading-none font-semibold tracking-tight sm:text-4xl'>
          {formatDate(row.payDate)}
        </span>
        <span className='text-muted-foreground text-sm'>Payday</span>
      </>
    )
  }

  const overdue = days < 0
  const tone = overdue ? 'text-destructive' : days <= SOON ? 'text-warning' : 'text-foreground'

  return (
    <>
      <span className={cn('text-5xl leading-none font-semibold tracking-tight tabular-nums sm:text-6xl', tone)}>
        {days === 0 ? 'Today' : Math.abs(days)}
      </span>
      <span className={cn('text-sm', overdue ? 'text-destructive' : 'text-muted-foreground')}>
        {days === 0
          ? `Payday · ${formatDate(row.payDate)}`
          : overdue
            ? `${Math.abs(days) === 1 ? 'day' : 'days'} overdue · payday was ${formatDate(row.payDate)}`
            : `${days === 1 ? 'day' : 'days'} to payday · ${formatDate(row.payDate)}`}
      </span>
    </>
  )
}

/**
 * The run that needs working, as the first thing on the queue. Everything a person needs to
 * decide whether to open it: where it is in the lifecycle, what it pays, and what is in the way.
 */
const RunQueueFocus = ({ row, className }: Props) => {
  const { counts } = row
  const blocked = counts.blocking > 0 || counts.error > 0
  const awaitingApproval = row.status === 'calculated' || row.status === 'pending_approval'

  // Interface writing: say what is in the way and what to do about it, in one sentence.
  const gate = blocked
    ? {
        tone: 'text-destructive',
        Icon: AlertOctagonIcon,
        text: `Payroll cannot be approved. ${counts.blocking + counts.error} ${
          counts.blocking + counts.error === 1 ? 'exception is' : 'exceptions are'
        } unresolved.`
      }
    : counts.warning > 0
      ? {
          tone: 'text-warning',
          Icon: AlertTriangleIcon,
          text: `${counts.warning} ${counts.warning === 1 ? 'warning' : 'warnings'} to acknowledge before approval.`
        }
      : awaitingApproval
        ? { tone: 'text-success', Icon: CheckCircle2Icon, text: 'Nothing is blocking approval.' }
        : row.lifecycle === 'done'
          ? {
              tone: 'text-success',
              Icon: CheckCircle2Icon,
              text: row.approver ? `Approved by ${row.approver.name} and paid.` : 'Paid.'
            }
          : null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2 text-lg font-semibold'>
          <span className='whitespace-nowrap'>{row.reference}</span>
          <Badge className={PAY_RUN_STATUS_STYLES[row.status]}>{PAY_RUN_STATUS_LABELS[row.status]}</Badge>
        </CardTitle>
        <CardDescription>
          {formatPeriod(row.periodStart, row.periodEnd)} · {row.payGroup} · {row.employeeCount} employees
        </CardDescription>
        <CardAction className='flex flex-col items-end gap-1 text-right'>
          <Countdown row={row} />
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-5'>
        <PayrollStageBar status={row.status} />

        <dl className='grid gap-3 sm:grid-cols-3'>
          <div className='bg-muted/50 flex flex-col gap-1 rounded-lg px-4 py-3'>
            <dt className='text-muted-foreground text-sm'>Net pay</dt>
            <dd className='text-xl font-semibold tabular-nums'>{formatMoney(row.net)}</dd>
          </div>
          <div className='bg-muted/50 flex flex-col gap-1 rounded-lg px-4 py-3'>
            <dt className='text-muted-foreground text-sm'>Employer cost</dt>
            <dd className='text-xl font-semibold tabular-nums'>{formatMoney(row.employerCost)}</dd>
          </div>
          <div
            className={cn(
              'flex flex-col gap-1 rounded-lg px-4 py-3',
              blocked ? 'bg-destructive/5' : counts.warning > 0 ? 'bg-warning/10' : 'bg-success/10'
            )}
          >
            <dt className='text-muted-foreground text-sm'>Open exceptions</dt>
            <dd className='flex flex-wrap items-center gap-1.5'>
              <span className='text-xl font-semibold tabular-nums'>{counts.open}</span>
              {SEVERITIES.map(
                severity =>
                  counts[severity] > 0 && <ExceptionBadge key={severity} severity={severity} count={counts[severity]} />
              )}
            </dd>
          </div>
        </dl>

        <div className='mt-auto flex flex-wrap items-center justify-between gap-3'>
          {gate ? (
            <p className={cn('flex items-center gap-1.5 text-sm', gate.tone)} role='status'>
              <gate.Icon className='size-4 shrink-0' aria-hidden='true' />
              {gate.text}
            </p>
          ) : (
            <p className='text-muted-foreground text-sm'>Cut-off {formatInstant(row.cutoffAt)}</p>
          )}

          <div className='flex flex-wrap items-center gap-2'>
            {counts.open > 0 && (
              <Button
                variant='outline'
                render={<Link href={`/payroll/runs/${row.id}?view=exceptions`} />}
                nativeButton={false}
              >
                Review exceptions
              </Button>
            )}
            <Button render={<Link href={`/payroll/runs/${row.id}`} />} nativeButton={false}>
              Open run workspace
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RunQueueFocus
