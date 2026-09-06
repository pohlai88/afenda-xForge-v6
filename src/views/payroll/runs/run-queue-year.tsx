// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { BanknoteIcon, CheckCheckIcon, WalletIcon } from 'lucide-react'

// Type Imports
import type { RunQueueSummary } from '@/types/payroll/run-queue-types'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { formatPeriod } from '@/utils/payroll-workspace'

type Props = {
  summary: RunQueueSummary
  className?: string
}

type Measure = {
  key: string
  icon: ReactNode
  value: string
  label: string

  /** Same tint each figure carries on the payroll overview, so the two pages agree on colour. */
  chipClassName?: string
}

/**
 * The year so far, beside the run that needs working. Three figures and a progress track: enough
 * to answer "how much has gone out and how far through the year are we" without a chart.
 */
const RunQueueYear = ({ summary, className }: Props) => {
  // One figure per currency rather than one figure. The queue spans companies that pay in
  // different currencies, and a single total would have to pick one and be wrong about the rest.
  // Consolidating them is Group payroll's job, where the reporting currency and the exchange
  // rate basis are both stated on screen.
  const measures: Measure[] = [
    ...summary.paidByCurrency.map(entry => ({
      key: `employer-cost-${entry.currency}`,
      icon: <WalletIcon />,
      value: formatMoney(entry.employerCost),
      label:
        summary.paidByCurrency.length > 1
          ? `Employer cost paid · ${entry.currency}`
          : 'Employer cost paid'
    })),
    ...summary.paidByCurrency.map(entry => ({
      key: `net-${entry.currency}`,
      icon: <BanknoteIcon />,
      value: formatMoney(entry.netPay),
      label:
        summary.paidByCurrency.length > 1 ? `Net pay to employees · ${entry.currency}` : 'Net pay to employees',
      chipClassName: 'bg-chart-2/10 text-chart-2'
    })),
    {
      key: 'resolved',
      icon: <CheckCheckIcon />,
      value: String(summary.exceptionsResolved),
      label: 'Exceptions resolved',
      chipClassName: 'bg-chart-1/10 text-chart-1'
    }
  ]

  const progress = Math.round((summary.paidRuns / summary.expectedRuns) * 100)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>{summary.year} to date</CardTitle>
        <CardDescription>
          {summary.paidSpan
            ? `${summary.paidRuns} ${summary.paidRuns === 1 ? 'run' : 'runs'} paid · ${formatPeriod(
                summary.paidSpan.from,
                summary.paidSpan.to
              )}`
            : 'No runs paid yet this year'}
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-5'>
        <dl className='flex flex-col divide-y'>
          {measures.map(measure => (
            <div key={measure.key} className='flex items-center gap-3 py-3 first:pt-0 last:pb-0'>
              <span
                className={cn(
                  'bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-sm [&>svg]:size-4.5',
                  measure.chipClassName
                )}
                aria-hidden='true'
              >
                {measure.icon}
              </span>
              <div className='flex min-w-0 flex-1 flex-col'>
                <dd className='text-lg font-semibold tabular-nums'>{measure.value}</dd>
                <dt className='text-muted-foreground text-sm'>{measure.label}</dt>
              </div>
            </div>
          ))}
        </dl>

        <div className='mt-auto flex flex-col gap-2'>
          <div className='flex items-baseline justify-between text-sm'>
            <span className='text-muted-foreground'>Runs paid this year</span>
            <span className='font-medium tabular-nums'>
              {summary.paidRuns} of {summary.expectedRuns}
            </span>
          </div>
          <Progress value={progress} aria-label={`${summary.paidRuns} of ${summary.expectedRuns} runs paid`} />
        </div>
      </CardContent>
    </Card>
  )
}

export default RunQueueYear
