'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { ChevronDownIcon, ChevronUpIcon, MinusIcon } from 'lucide-react'

// Type Imports
import type { Consolidation, MovementLine } from '@/types/payroll/group-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LineageDrawer from './lineage-drawer'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { periodLabel } from '@/utils/payroll-group'

type Props = {
  consolidation: Consolidation
  className?: string
}

/**
 * Where the change came from.
 *
 * The question a group finance lead asks is rarely what the total is. It is which company moved
 * it, and by how much. Ranking by absolute contribution answers that whether the number rose or
 * fell, and every row opens the same explanation the headline does.
 *
 * The bar sits behind the text rather than beside it, scaled against the largest contributor so
 * the leader fills its row, with a floor so a small contributor stays visible instead of
 * vanishing to nothing.
 */
const GroupMovement = ({ consolidation, className }: Props) => {
  const [openFor, setOpenFor] = useState<MovementLine | null>(null)

  const { previous, movement } = consolidation

  if (!previous || movement.length === 0) return null

  const total = previous.employerCost.change
  const rising = total.amount > 0
  const flat = total.amount === 0
  const TotalIcon = flat ? MinusIcon : rising ? ChevronUpIcon : ChevronDownIcon
  const largest = Math.max(...movement.map(line => Math.abs(line.change.amount)), 1)

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>Where the change came from</CardTitle>
          <CardDescription>
            Employer cost against {periodLabel(previous.period)}, in {consolidation.reportingCurrency}
          </CardDescription>
          <CardAction className='flex flex-col items-end gap-0.5'>
            <span
              className={cn(
                'flex items-center gap-1 text-2xl font-semibold tabular-nums',
                'text-foreground'
              )}
            >
              <TotalIcon className='size-5' aria-hidden='true' />
              {formatMoney(total)}
            </span>
            <span className='text-muted-foreground text-xs'>total movement</span>
          </CardAction>
        </CardHeader>

        <CardContent className='flex flex-col gap-3'>
          {!previous.comparable && (
            <p className='text-warning text-sm'>
              The two periods do not cover the same companies, so this is not a like-for-like movement. The companies
              present in both are listed below alongside the one that is not.
            </p>
          )}

          <ul className='flex flex-col'>
            {movement.map(line => {
              const negative = line.change.amount < 0
              const width = Math.max((Math.abs(line.change.amount) / largest) * 100, 2)
              const Icon = line.change.amount === 0 ? MinusIcon : negative ? ChevronDownIcon : ChevronUpIcon
              const drillable = Boolean(line.entityId)

              // A company that dropped out lowers the total, but that is not payroll getting
              // cheaper — it is a hole in the number. It reads as a warning rather than as an
              // improvement, whichever way the arithmetic went.
              // An absent company keeps its warning: that is a hole in the number, a genuine state.
              // Everything else is direction only, carried by the chevron and the sign.
              const tone = line.kind === 'absence' ? 'text-warning' : 'text-muted-foreground'

              const fill = line.kind === 'absence' ? 'bg-warning/15' : 'bg-muted-foreground/20'

              const body = (
                <>
                  <span
                    className={cn('absolute inset-y-0 left-0 rounded-sm', fill)}
                    style={{ width: `${width}%` }}
                    aria-hidden='true'
                  />
                  <span className='relative z-10 min-w-0 flex-1 truncate text-sm'>{line.label}</span>
                  <span className={cn('relative z-10 flex shrink-0 items-center gap-1 text-sm tabular-nums', tone)}>
                    <Icon className='size-3.5' aria-hidden='true' />
                    {formatMoney(line.change)}
                  </span>
                  <span className='text-muted-foreground relative z-10 w-12 shrink-0 text-right text-xs tabular-nums'>
                    {line.share.toFixed(0)}%
                  </span>
                </>
              )

              // A row only looks clickable when it can actually be opened. The exchange-rate line
              // belongs to no company, so it gets no hover state and no pointer.
              return (
                <li key={line.key}>
                  {drillable ? (
                    <Button
                      variant='ghost'
                      onClick={() => setOpenFor(line)}
                      aria-label={`Explain ${line.label}`}
                      className='relative h-auto w-full justify-start gap-3 px-2 py-2.5 text-left font-normal'
                    >
                      {body}
                    </Button>
                  ) : (
                    <div className='relative flex w-full items-center gap-3 rounded-sm px-2 py-2.5'>{body}</div>
                  )}
                </li>
              )
            })}
          </ul>

          <p className='text-muted-foreground text-xs'>
            Each company&apos;s movement is measured at this period&apos;s rate. What is left over is the exchange rate
            moving under a payroll that did not, shown as its own line so the list adds up to the total above.
          </p>
        </CardContent>
      </Card>

      <LineageDrawer
        consolidation={consolidation}
        open={Boolean(openFor)}
        onOpenChange={value => !value && setOpenFor(null)}
        entityIds={openFor?.entityId ? [openFor.entityId] : undefined}
        title={openFor?.label}
      />
    </>
  )
}

export default GroupMovement
