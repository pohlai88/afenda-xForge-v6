// Third-party Imports
import { LandmarkIcon, TriangleAlertIcon } from 'lucide-react'

// Type Imports
import type { FundingSummary } from '@/utils/payroll-payments'

// Component Imports
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack } from '@/components/ui/progress'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'

/**
 * Either a funding position this company can actually be held to, or an honest refusal to state
 * one.
 *
 * There is no third shape on purpose. The defect this replaces rendered a shortfall computed by
 * subtracting a Singapore balance from a Malaysian obligation and stamping the run's currency on
 * the answer — a number that looked like money, gated payment release, and meant nothing.
 */
export type FundingPosition =
  | { state: 'resolved'; summary: FundingSummary; accountLabel: string }
  | { state: 'unresolved'; reason: string }

type Props = {
  position: FundingPosition
  className?: string
}

/**
 * Whether payday can be met from this company's own money.
 *
 * Funding is the one payroll measure that must never be translated or borrowed. A balance held by
 * another company in the group cannot cover this one's payroll, and an amount in one currency
 * subtracted from a balance in another is not a smaller number — it is not a number at all. So
 * when the operands cannot be proven to belong to this employer and to share its currency, this
 * says so and computes nothing.
 */
const EntityFunding = ({ position, className }: Props) => {
  if (position.state === 'unresolved') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
            Funding
          </CardTitle>
          <CardDescription>Whether payday can be met from this company&apos;s own account</CardDescription>
          <CardAction>
            <TriangleAlertIcon className='text-warning-strong size-5' aria-hidden='true' />
          </CardAction>
        </CardHeader>

        <CardContent className='flex flex-1 flex-col gap-3'>
          <p className='text-warning-strong text-sm'>Funding position cannot be determined.</p>
          <p className='text-muted-foreground text-sm'>{position.reason}</p>
          <p className='text-muted-foreground mt-auto text-xs'>
            Payment readiness is not fully evaluated while funding is unresolved, so no readiness figure is shown. A
            balance held by another company cannot cover this one&apos;s payroll.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { summary, accountLabel } = position
  const short = summary.headroom.amount < 0
  const coverage = Math.round(summary.coverage)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
          Funding
        </CardTitle>
        <CardDescription className='flex items-center gap-1.5'>
          <LandmarkIcon className='size-3.5 shrink-0' aria-hidden='true' />
          {accountLabel}
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-5'>
        <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
          <span className='text-3xl leading-none font-semibold tracking-tight tabular-nums sm:text-4xl'>
            {formatMoney(summary.required)}
          </span>
          <span className='text-muted-foreground text-sm'>still to leave the account for this run</span>
        </div>

        <Progress
          value={coverage}
          aria-label={`Funding covers ${coverage}% of the amount required`}
          className='flex-col gap-1.5'
        >
          <div className='flex w-full items-baseline justify-between gap-3 text-xs'>
            <ProgressLabel className='text-muted-foreground text-xs font-normal'>
              {formatMoney(summary.available)} available
            </ProgressLabel>
            <span className='tabular-nums'>{coverage}%</span>
          </div>
          <ProgressTrack className='h-2'>
            <ProgressIndicator className={cn(short ? 'bg-destructive' : 'bg-success')} />
          </ProgressTrack>
        </Progress>

        <p className={cn('text-sm', short ? 'text-destructive-strong' : 'text-muted-foreground')}>
          {short
            ? `${formatMoney({ ...summary.headroom, amount: -summary.headroom.amount })} short of what this run has to pay.`
            : `${formatMoney(summary.headroom)} headroom after this run is paid.`}
        </p>
      </CardContent>
    </Card>
  )
}

export default EntityFunding
