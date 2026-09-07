// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { CalendarCheckIcon, CheckCheckIcon, HourglassIcon } from 'lucide-react'

// Type Imports
import type { ComplianceSummary } from '@/types/payroll/compliance-types'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'

type Props = {
  summary: ComplianceSummary
  className?: string
}

type Measure = {
  key: string
  icon: ReactNode
  value: string
  label: string
  chipClassName: string
}

/**
 * The year's filings in three figures and a track. Outstanding is tinted as a warning only while
 * there is something outstanding — an all-clear year should look clear.
 */
const ComplianceYear = ({ summary, className }: Props) => {
  const outstanding = { amount: summary.owed.amount - summary.filed.amount, currency: summary.owed.currency }

  const measures: Measure[] = [
    {
      key: 'filed',
      icon: <CheckCheckIcon />,
      value: formatMoney(summary.filed),
      label: 'Filed and accepted',
      chipClassName: 'bg-chart-2/10 text-chart-2'
    },
    {
      key: 'outstanding',
      icon: <HourglassIcon />,
      value: formatMoney(outstanding),
      label: 'Still to file',
      chipClassName: outstanding.amount > 0 ? 'bg-warning/15 text-warning-strong' : 'bg-success/15 text-success-strong'
    },
    {
      key: 'on-time',
      icon: <CalendarCheckIcon />,
      value: `${summary.onTime} of ${summary.accepted}`,
      label: 'Accepted filings sent on time',
      chipClassName: 'bg-chart-1/10 text-chart-1'
    }
  ]

  const progress = summary.total === 0 ? 0 : Math.round((summary.accepted / summary.total) * 100)

  const attention = [
    summary.overdue > 0 && `${summary.overdue} overdue`,
    summary.rejected > 0 && `${summary.rejected} rejected`
  ].filter(Boolean)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>{summary.year} filings</CardTitle>
        <CardDescription className={cn(attention.length > 0 && 'text-destructive-strong')}>
          {attention.length > 0 ? attention.join(' · ') : 'Nothing overdue or rejected'}
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-5'>
        <dl className='flex flex-col divide-y'>
          {measures.map(measure => (
            <div key={measure.key} className='flex items-center gap-3 py-3 first:pt-0 last:pb-0'>
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-sm [&>svg]:size-4.5',
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
            <span className='text-muted-foreground'>Filings accepted this year</span>
            <span className='font-medium tabular-nums'>
              {summary.accepted} of {summary.total}
            </span>
          </div>
          <Progress value={progress} aria-label={`${summary.accepted} of ${summary.total} filings accepted`} />
        </div>
      </CardContent>
    </Card>
  )
}

export default ComplianceYear
