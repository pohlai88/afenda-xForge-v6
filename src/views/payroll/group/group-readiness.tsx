// Next Imports
import Link from 'next/link'

// Third-party Imports
import { BanknoteIcon, WalletIcon } from 'lucide-react'

// Type Imports
import type { Consolidation, EntityPayrollState } from '@/types/payroll/group-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { ENTITY_STATE_LABELS, ENTITY_STATE_ORDER, ENTITY_STATE_STYLES, periodLabel } from '@/utils/payroll-group'

type Props = {
  consolidation: Consolidation
  className?: string
}

/**
 * Net pay, and how many companies can actually proceed.
 *
 * "Ready" here means approved. The sketch this surface came from wrote "4 / 5 entities ready",
 * but under the states the domain can prove that is not true of this period — four are included
 * and one is approved, which are different facts. The card says both rather than the flattering
 * one.
 */
const GroupReadiness = ({ consolidation, className }: Props) => {
  const { coverage, netPay, grossPay, entityCount, entities } = consolidation
  const ready = coverage.byState.ready

  const states = (Object.keys(ENTITY_STATE_LABELS) as EntityPayrollState[])
    .filter(state => coverage.byState[state] > 0)
    .sort((a, b) => ENTITY_STATE_ORDER[a] - ENTITY_STATE_ORDER[b])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
          Net pay and readiness
        </CardTitle>
        <CardDescription>
          {periodLabel(consolidation.period)} · {coverage.entities.included} of {entityCount} included
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-5'>
        <dl className='flex flex-col divide-y'>
          <div className='flex items-center gap-3 pb-3'>
            <span className='bg-chart-2/10 text-chart-2 flex size-9 shrink-0 items-center justify-center rounded-md'>
              <BanknoteIcon className='size-4.5' />
            </span>
            <div className='flex min-w-0 flex-1 flex-col'>
              <dt className='text-muted-foreground text-sm'>Net pay to employees</dt>
              <dd className='text-xl font-semibold tabular-nums'>{formatMoney(netPay.total)}</dd>
            </div>
          </div>
          <div className='flex items-center gap-3 py-3'>
            <span className='bg-chart-1/10 text-chart-1 flex size-9 shrink-0 items-center justify-center rounded-md'>
              <WalletIcon className='size-4.5' />
            </span>
            <div className='flex min-w-0 flex-1 flex-col'>
              <dt className='text-muted-foreground text-sm'>Gross pay</dt>
              <dd className='text-xl font-semibold tabular-nums'>{formatMoney(grossPay.total)}</dd>
            </div>
          </div>
        </dl>

        <ul className='flex flex-col gap-2 text-sm'>
          {states.map(state => {
            const named = entities.filter(row => row.state === state)

            return (
              <li key={state} className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
                <Badge className={cn('shrink-0', ENTITY_STATE_STYLES[state])}>{ENTITY_STATE_LABELS[state]}</Badge>
                <span className='text-muted-foreground'>
                  {named.map((row, index) => (
                    <span key={row.entity.id}>
                      {index > 0 && ', '}
                      <Link
                        href={row.href}
                        className='underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
                      >
                        {row.entity.name}
                      </Link>
                      {row.blockingCount > 0 && ` (${row.blockingCount} blocking)`}
                    </span>
                  ))}
                </span>
              </li>
            )
          })}
        </ul>

        <div className='mt-auto flex flex-col gap-2'>
          <div className='flex items-baseline justify-between text-sm'>
            <span className='text-muted-foreground'>Approved and ready to pay</span>
            <span className='font-medium tabular-nums'>
              {ready} of {entityCount}
            </span>
          </div>
          <Progress
            value={(ready / Math.max(1, entityCount)) * 100}
            aria-label={`${ready} of ${entityCount} companies approved and ready to pay`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default GroupReadiness
