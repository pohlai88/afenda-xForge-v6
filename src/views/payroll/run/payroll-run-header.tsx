// React Imports
import type { ReactNode } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronLeftIcon } from 'lucide-react'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Util Imports
import { cn } from '@/lib/utils'
import { PAY_RUN_STATUS_LABELS, PAY_RUN_STATUS_STYLES } from '@/utils/payroll-metrics'
import { formatDate, formatInstant, formatPeriod } from '@/utils/payroll-workspace'

type Props = {
  run: PayRun

  /**
   * Whole days until payday, computed by the page from a clock read once. Null for a finished run,
   * where a countdown says nothing useful.
   */
  daysToPayday: number | null

  /** Primary actions — recalculate, export, approve. Owned by the workspace so it can wire state. */
  actions?: ReactNode
  className?: string
}

/**
 * Who, what period, where it stands. The one place on the screen that says which run this is,
 * so everything the table shows can be read against it.
 */
const PayrollRunHeader = ({ run, daysToPayday, actions, className }: Props) => {
  const overdue = daysToPayday !== null && daysToPayday < 0

  return (
    <header className={cn('flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between', className)}>
      <div className='flex min-w-0 flex-col gap-2'>
        <Button
          variant='link'
          size='xs'
          className='text-muted-foreground w-fit px-0 font-normal'
          render={<Link href='/payroll/runs' />}
          nativeButton={false}
        >
          <ChevronLeftIcon />
          All runs
        </Button>

        <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>{formatPeriod(run.periodStart, run.periodEnd)}</h1>
          <Badge className={cn('text-xs', PAY_RUN_STATUS_STYLES[run.status])}>
            {PAY_RUN_STATUS_LABELS[run.status]}
          </Badge>
        </div>

        <p className='text-muted-foreground text-sm'>
          {run.reference} · {run.payGroup} · {run.employeeCount} employees
        </p>

        <dl className='text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm'>
          <div className='flex gap-1.5'>
            <dt>Payday</dt>
            <dd className={cn('text-foreground font-medium tabular-nums', overdue && 'text-destructive')}>
              {formatDate(run.payDate)}
              {daysToPayday !== null && (
                <span className={cn('font-normal', overdue ? 'text-destructive' : 'text-muted-foreground')}>
                  {' · '}
                  {overdue
                    ? `${Math.abs(daysToPayday)} days overdue`
                    : daysToPayday === 0
                      ? 'today'
                      : `${daysToPayday} days remaining`}
                </span>
              )}
            </dd>
          </div>
          <div className='flex gap-1.5'>
            <dt>Calculation</dt>
            <dd className='text-foreground font-medium tabular-nums'>
              #{run.calculationVersion}
              {run.lastCalculatedAt && (
                <span className='text-muted-foreground font-normal'> · {formatInstant(run.lastCalculatedAt)}</span>
              )}
            </dd>
          </div>
          <div className='flex gap-1.5'>
            <dt>Cut-off</dt>
            <dd className='text-foreground font-medium tabular-nums'>{formatInstant(run.cutoffAt)}</dd>
          </div>
        </dl>
      </div>

      {actions && <div className='flex flex-wrap items-center gap-2 lg:shrink-0'>{actions}</div>}
    </header>
  )
}

export default PayrollRunHeader
