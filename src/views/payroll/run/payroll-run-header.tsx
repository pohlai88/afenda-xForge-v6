// React Imports
import type { ReactNode } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronLeftIcon } from 'lucide-react'

// Type Imports
import type { LegalEntity } from '@/types/hrm/entity-types'
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
   * Who is liable for this run. Only the name is shown: the entity's code and the frequency are
   * already in the reference (`PR-SG-2026-09`) and the pay group (`SG Monthly`) beside it, and
   * repeating them would spend a line saying nothing new.
   */
  entity?: LegalEntity

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
const PayrollRunHeader = ({ run, entity, daysToPayday, actions, className }: Props) => {
  const overdue = daysToPayday !== null && daysToPayday < 0

  // The metadata row is a sibling of the title/actions row, not a child of the title column. Kept
  // inside it, it only had the width the actions left over and broke onto three lines — 58px of
  // chrome above a register that was already starting below the fold.
  return (
    <header className={cn('flex flex-col gap-3', className)}>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
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
            {entity && <span className='text-foreground font-medium'>{entity.name}</span>}
            {entity && ' · '}
            {run.reference} · {run.payGroup} · {run.employeeCount} employees
          </p>
        </div>

        {actions && <div className='flex flex-wrap items-center gap-2 lg:shrink-0'>{actions}</div>}
      </div>

      <dl className='text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm'>
        <div className='flex gap-1.5'>
          <dt>Payday</dt>
          <dd className={cn('text-foreground font-medium tabular-nums', overdue && 'text-destructive-strong')}>
            {formatDate(run.payDate)}
            {daysToPayday !== null && (
              <span className={cn('font-normal', overdue ? 'text-destructive-strong' : 'text-muted-foreground')}>
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
    </header>
  )
}

export default PayrollRunHeader
