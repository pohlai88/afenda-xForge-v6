// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon, LandmarkIcon } from 'lucide-react'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'
import type { FundingAccount, SettlementBatch } from '@/types/payroll/settlement-types'
import type { FundingSummary as Summary } from '@/utils/payroll-payments'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack } from '@/components/ui/progress'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { BATCH_STATUS_LABELS, BATCH_STATUS_STYLES } from '@/utils/payroll-payments'
import { formatDate, formatPeriod } from '@/utils/payroll-workspace'

type Props = {
  run: PayRun
  batch?: SettlementBatch
  account?: FundingAccount
  summary: Summary
  className?: string
}

/**
 * The one dominant figure on the payments page: what has to leave the account for the current
 * run, against what is in it. The Payments dashboard leads with a balance; here the balance
 * only matters relative to the obligation, so the obligation is the headline.
 */
const FundingSummary = ({ run, batch, account, summary, className }: Props) => {
  const short = summary.headroom.amount < 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Funding</CardTitle>
        <CardDescription>
          {formatPeriod(run.periodStart, run.periodEnd)} · {run.reference} · payday {formatDate(run.payDate)}
        </CardDescription>
        <CardAction>
          {batch && <Badge className={BATCH_STATUS_STYLES[batch.status]}>{BATCH_STATUS_LABELS[batch.status]}</Badge>}
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-5'>
        <div className='flex flex-col gap-1'>
          <span className='text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl'>
            {formatMoney(summary.required)}
          </span>
          <span className='text-muted-foreground text-sm'>Net pay still to release for this run</span>
        </div>

        <Progress
          value={Math.round(summary.coverage)}
          aria-label={`Funding covers ${Math.round(summary.coverage)}% of the amount required`}
          className='flex-col gap-1.5'
        >
          <div className='flex w-full items-baseline justify-between gap-3 text-xs'>
            <ProgressLabel className='text-muted-foreground text-xs font-normal'>
              Funded — {formatMoney(summary.available)} available against {formatMoney(summary.required)} required
            </ProgressLabel>
            <span className='tabular-nums'>{Math.round(summary.coverage)}%</span>
          </div>
          <ProgressTrack className='h-2'>
            <ProgressIndicator className={cn(short ? 'bg-destructive' : 'bg-success')} />
          </ProgressTrack>
        </Progress>

        <dl className='grid grid-cols-2 gap-4 text-sm sm:grid-cols-3'>
          <div className='flex flex-col gap-0.5'>
            <dt className='text-muted-foreground text-xs tracking-wide uppercase'>Available</dt>
            <dd className='font-semibold tabular-nums'>{formatMoney(summary.available)}</dd>
          </div>
          <div className='flex flex-col gap-0.5'>
            <dt className='text-muted-foreground text-xs tracking-wide uppercase'>
              {short ? 'Shortfall' : 'Headroom'}
            </dt>
            <dd className={cn('font-semibold tabular-nums', short ? 'text-destructive' : 'text-success')}>
              {formatMoney({ ...summary.headroom, amount: Math.abs(summary.headroom.amount) })}
            </dd>
          </div>
          <div className='flex flex-col gap-0.5'>
            <dt className='text-muted-foreground text-xs tracking-wide uppercase'>Payments</dt>
            <dd className='font-semibold tabular-nums'>{batch?.count ?? run.employeeCount}</dd>
          </div>
        </dl>

        {account && (

          // A rule and space, not a second card: this is the account the figure above is drawn on,
          // not a separate object. The filled, bordered, rounded box made it read as one.
          <div className='mt-auto flex items-center gap-3 border-t pt-4'>
            <span className='text-muted-foreground flex size-8 shrink-0 items-center justify-center'>
              <LandmarkIcon className='size-4.5' />
            </span>
            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='truncate text-sm font-medium'>{account.name}</span>
              <span className='text-muted-foreground text-xs'>
                {account.bankName} ···· {account.accountLast4}
                {batch && ` · ref ${batch.reference}`}
              </span>
            </div>
            <Button
              variant='ghost'
              size='sm'
              render={<Link href='/payroll/settings?section=banking' />}
              nativeButton={false}
            >
              Accounts
              <ArrowRightIcon />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FundingSummary
