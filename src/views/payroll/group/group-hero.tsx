'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { ChevronDownIcon, ChevronUpIcon, InfoIcon, MinusIcon } from 'lucide-react'

// Type Imports
import type { Consolidation } from '@/types/payroll/group-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import GroupCoverage from './group-coverage'
import LineageDrawer from './lineage-drawer'

// Util Imports
import { cn } from '@/lib/utils'
import { formatCount, formatMoney } from '@/utils/money'
import { FX_BASIS_LABELS, periodLabel } from '@/utils/payroll-group'

type Props = {
  consolidation: Consolidation
  comparisonLabel: string
  className?: string
}

/**
 * The group's dominant figure, and the three things that qualify it.
 *
 * Value, then what changed, then how complete it is, then how much of it can still move, then how
 * much of it is ready to pay. The qualifiers sit inside the same block as the number at body
 * size, not as a footnote under the card: a total quoted without its coverage is the failure this
 * whole surface exists to prevent, and layout is most of what decides whether that happens.
 *
 * One dominant figure, not two. Employer cost is the group's number; net pay is secondary and
 * reachable through the drawer's measure toggle. Two competing 60px figures would push the delta
 * and the coverage line into the position a footnote occupies.
 */
const GroupHero = ({ consolidation, comparisonLabel, className }: Props) => {
  const [open, setOpen] = useState(false)

  const { employerCost, coverage, previous, entityCount } = consolidation
  const change = previous?.employerCost
  const rising = (change?.change.amount ?? 0) > 0
  const flat = (change?.change.amount ?? 0) === 0

  // Direction, not valence. A group costing more is not a failure and costing less is not a win —
  // it may be a hiring month or a leaver month. The chevron and the sign carry the direction; red
  // and green are kept for state (blocking, attention, ready) so they still mean something.
  const tone = 'text-muted-foreground'
  const DirectionIcon = !change || flat ? MinusIcon : rising ? ChevronUpIcon : ChevronDownIcon

  const readyCount = coverage.byState.ready
  const provisional = coverage.provisional

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>Group employer cost</CardTitle>
          <CardDescription>
            {periodLabel(consolidation.period)} · reported in {consolidation.reportingCurrency} ·{' '}
            {FX_BASIS_LABELS[consolidation.fxBasis]}
          </CardDescription>
          <CardAction>
            <Button variant='outline' size='sm' onClick={() => setOpen(true)} aria-haspopup='dialog'>
              <InfoIcon />
              Explain
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className='flex flex-1 flex-col gap-5'>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            {/* The figure is itself the trigger — "click the big number" — and a real control,
                so keyboard users reach the explanation the same way. */}
            <Button
              variant='ghost'
              onClick={() => setOpen(true)}
              aria-haspopup='dialog'
              aria-expanded={open}
              aria-label={`Explain group employer cost, ${formatMoney(employerCost.total)}`}
              className='h-auto w-fit px-0 py-0 text-left hover:bg-transparent'
            >
              <span className='text-5xl leading-none font-semibold tracking-tight tabular-nums sm:text-6xl'>
                {formatMoney(employerCost.total)}
              </span>
            </Button>

            {change && (
              <Badge variant='secondary' className={cn('gap-1 text-sm tabular-nums', tone)}>
                <DirectionIcon className='size-3.5' aria-hidden='true' />
                {change.changePercent === null ? formatMoney(change.change) : `${change.changePercent.toFixed(1)}%`}
                <span className='text-muted-foreground font-normal'>vs {comparisonLabel}</span>
              </Badge>
            )}
          </div>

          <div className='flex flex-col gap-2'>
            <p className='text-muted-foreground text-sm'>
              Employer cost across {coverage.entities.included} of {entityCount} companies
            </p>

            <GroupCoverage coverage={coverage} />

            {provisional.count > 0 && (
              <p className='text-muted-foreground text-sm'>
                <span className='text-foreground font-medium tabular-nums'>{formatMoney(provisional.amount)}</span> of
                this total can still move — {provisional.count} calculation
                {provisional.count === 1 ? '' : 's'} not yet approved
              </p>
            )}

            <p className='text-muted-foreground text-sm'>
              <span className='text-foreground font-medium tabular-nums'>
                {readyCount} of {entityCount}
              </span>{' '}
              ready to pay
            </p>
          </div>

          {/* The three lines of the bridge, so the card already shows the arithmetic the drawer
              expands rather than making the reader open it to learn there is any. */}
          <dl className='mt-auto grid gap-3 sm:grid-cols-3'>
            <div className='bg-muted/50 flex flex-col gap-1 rounded-lg px-4 py-3'>
              <dt className='text-muted-foreground text-sm'>At budget rates</dt>
              <dd className='text-xl font-semibold tabular-nums'>{formatMoney(employerCost.atBudget)}</dd>
            </div>
            <div className='bg-muted/50 flex flex-col gap-1 rounded-lg px-4 py-3'>
              <dt className='text-muted-foreground text-sm'>Exchange rate movement</dt>
              <dd className='text-xl font-semibold tabular-nums'>
                {employerCost.fxMovement.amount > 0 ? '+' : ''}
                {formatMoney(employerCost.fxMovement)}
              </dd>
            </div>
            <div className='bg-muted/50 flex flex-col gap-1 rounded-lg px-4 py-3'>
              <dt className='text-muted-foreground text-sm'>Employees</dt>
              <dd className='text-xl font-semibold tabular-nums'>
                {formatCount(consolidation.headcount.unique)}
              </dd>
              <dd className='text-muted-foreground text-xs'>counted once each</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <LineageDrawer consolidation={consolidation} open={open} onOpenChange={setOpen} measure='employer_cost' />
    </>
  )
}

export default GroupHero
