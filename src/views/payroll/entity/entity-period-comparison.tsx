// Type Imports
import type { Money } from '@/types/common/primitive-types'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import VarianceValue, { varianceDirection } from '@/views/payroll/variance-value'

// Util Imports
import { formatCount, formatMoney } from '@/utils/money'
import { formatSignedPercent } from '@/utils/payroll-workspace'

/**
 * One figure and how it moved.
 *
 * `movement` is null when there is nothing to compare against, and its kind decides how the
 * change is written. A headcount is not money: giving it a currency so it could share the money
 * formatter would put a dollar sign on a number of people.
 */
export type ComparisonRow = {
  label: string
  value: string
  movement: { kind: 'money'; change: Money } | { kind: 'count'; change: number } | null
  percent: number | null
}

type Props = {
  rows: ComparisonRow[]

  /** The run being compared against, named. A delta against an unnamed baseline is not a fact. */
  baselineReference: string
  className?: string
}

const ARROWS = { up: '↑', down: '↓', flat: '' } as const

/** The same neutral grammar VarianceValue uses, for a figure that is a count rather than money. */
const CountVariance = ({ change, percent }: { change: number; percent: number | null }) => {
  const direction = varianceDirection(change)

  // No movement is said once. '0' followed by '0.0%' states the same nothing twice and reads
  // like a formatting fault rather than a stable headcount.
  if (direction === 'flat') return <span className='text-muted-foreground text-sm'>no change</span>

  return (
    <span className='text-sm tabular-nums'>
      <span aria-hidden='true' className='text-muted-foreground'>
        {ARROWS[direction]}{' '}
      </span>
      {change > 0 ? `+${formatCount(change)}` : formatCount(change)}
      {percent !== null && <span className='text-muted-foreground ml-1 text-xs'>{formatSignedPercent(percent)}</span>}
    </span>
  )
}

/**
 * How this run differs from the one before it.
 *
 * Movement only, never explanation. The domain holds no compensation history, so a rise can be
 * measured but not attributed — whether it is a pay increase, a joiner, a bonus or a longer
 * period is not recorded anywhere, and a caption guessing between them would be the interface
 * inventing a cause. That absence is contract gap P01-GAP-003.
 *
 * Direction is not valence: payroll costing more is not a failure and costing less is not a win.
 * The arrow and the sign carry the direction, and red and green stay reserved for state.
 */
const EntityPeriodComparison = ({ rows, baselineReference, className }: Props) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
        Period over period
      </CardTitle>
      <CardDescription>Movement against {baselineReference}, stated but not explained</CardDescription>
    </CardHeader>

    <CardContent>
      <dl className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {rows.map(row => (
          <div key={row.label} className='flex flex-col gap-1'>
            <dt className='text-muted-foreground text-xs tracking-wide uppercase'>{row.label}</dt>
            <dd className='flex flex-col gap-0.5'>
              <span className='text-base font-semibold tabular-nums'>{row.value}</span>
              {row.movement === null ? (
                <span className='text-muted-foreground text-xs'>no prior run to compare</span>
              ) : row.movement.kind === 'money' ? (
                <VarianceValue value={row.movement.change} percent={row.percent} className='text-sm' />
              ) : (
                <CountVariance change={row.movement.change} percent={row.percent} />
              )}
            </dd>
          </div>
        ))}
      </dl>
    </CardContent>
  </Card>
)

export default EntityPeriodComparison

/** A money figure and its movement, both in the entity's own currency. */
export const moneyRow = (label: string, current: Money, previous?: Money): ComparisonRow => ({
  label,
  value: formatMoney(current),
  movement: previous
    ? { kind: 'money', change: { amount: current.amount - previous.amount, currency: current.currency } }
    : null,
  percent: !previous || previous.amount === 0 ? null : ((current.amount - previous.amount) / previous.amount) * 100
})

/** A headcount and its movement, as people rather than as an amount. */
export const countRow = (label: string, current: number, previous?: number): ComparisonRow => ({
  label,
  value: formatCount(current),
  movement: previous === undefined ? null : { kind: 'count', change: current - previous },
  percent: previous === undefined || previous === 0 ? null : ((current - previous) / previous) * 100
})
