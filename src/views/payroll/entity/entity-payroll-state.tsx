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
import { formatDate, formatPeriod } from '@/utils/payroll-workspace'
import { PAYROLL_STAGE_LABELS, stageIndexForStatus } from '@/utils/payroll-workspace'

type Props = {
  run: PayRun

  /**
   * Supplied by the caller rather than read from the clock here, so this stays deterministic.
   * Null for a finished run, where a countdown to a long-past cut-off says nothing.
   */
  daysToCutoff: number | null

  /**
   * Blocking exceptions in the *same* set the attention surface is showing. When a department
   * filter is on, both narrow together — a company-wide count beside a filtered list is two
   * different answers to one question.
   */
  blockingCount: number

  /** What that count covers, when it is not the whole run. Names the department in force. */
  blockingScope?: string

  /** Supporting navigation into the displayed run. Lower emphasis than the primary next action. */
  runHref: string
  className?: string
}

/**
 * What this company's payroll is doing for the run on screen.
 *
 * The leading figure of the page, and deliberately not a card grid: one dominant number, the
 * lifecycle position underneath it, and the three facts that qualify it. Exact gross-to-net
 * figures are not here — they decompose the run rather than state its condition, so they sit in
 * INSPECT where the reader is reconciling rather than operating.
 *
 * The figure wraps rather than sharing a header row with the reference. At 390px a header grid
 * gave the amount 205px and it clipped mid-digit, which on a payroll product reads as a broken
 * number rather than a broken layout.
 */
const EntityPayrollState = ({ run, daysToCutoff, blockingCount, blockingScope, runHref, className }: Props) => {
  // The same six stages the run workspace draws, so the two never disagree on where a run is.
  const currentStage = stageIndexForStatus(run.status)
  const overdue = daysToCutoff !== null && daysToCutoff < 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle role='heading' aria-level={2} className='flex flex-wrap items-center gap-2 text-lg font-semibold'>
          {/* The badge may wrap to its own line; the reference may not break inside itself. A
              run identifier split across two lines is one nobody can match against a bank file. */}
          <span className='whitespace-nowrap'>{run.reference}</span>
          <Badge className={PAY_RUN_STATUS_STYLES[run.status]}>{PAY_RUN_STATUS_LABELS[run.status]}</Badge>
        </CardTitle>
        <CardDescription>
          {formatPeriod(run.periodStart, run.periodEnd)} · pays {formatDate(run.payDate)}
        </CardDescription>
        <CardAction>
          <Button variant='ghost' size='sm' render={<Link href={runHref} />} nativeButton={false}>
            View run details
            <ArrowRightIcon />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-5'>
        {/* Wraps as siblings. The amount never competes with the reference for a single line. */}
        <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
          <span className='text-4xl leading-none font-semibold tracking-tight tabular-nums sm:text-5xl'>
            {formatMoney(run.totals.employerCost)}
          </span>
          <span className='text-muted-foreground text-sm'>total employer cost</span>
        </div>

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
              <span className='font-semibold tabular-nums'>{run.employeeCount}</span>
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
              <span className='font-semibold tabular-nums'>
                {daysToCutoff === null
                  ? formatDate(run.payDate)
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
            <span className='flex min-w-0 flex-col'>
              <span className='font-semibold tabular-nums'>{blockingCount}</span>
              <span className='text-muted-foreground text-sm'>
                {blockingCount === 1 ? 'Blocking issue' : 'Blocking issues'}
                {blockingScope && <span className='block truncate text-xs'>in {blockingScope}</span>}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default EntityPayrollState
