// Type Imports
import type { Money } from '@/types/common/primitive-types'

// Util Imports
import { cn } from '@/lib/utils'
import { formatSignedMoney, formatSignedPercent } from '@/utils/payroll-workspace'

/**
 * A movement in a payroll figure. Direction, never valence.
 *
 * Payroll going up is not success and payroll going down is not failure: a rise may be a bonus run
 * or a hiring month, a fall may be leavers or a shorter period. The screens used to disagree with
 * each other about it — the run workspace painted a rise green, the group views painted the same
 * rise red — which meant green carried no stable meaning at all. Both are neutral now.
 *
 * Direction is carried three times over: the arrow, the sign, and the percentage. The arrow is
 * `aria-hidden` because the sign already says it in text, so nothing here depends on colour or on
 * seeing the glyph. Red, amber and green are reserved for state — blocking, attention, ready.
 */
export type VarianceDirection = 'up' | 'down' | 'flat'

export const varianceDirection = (amount: number | null | undefined): VarianceDirection =>
  amount === null || amount === undefined || amount === 0 ? 'flat' : amount > 0 ? 'up' : 'down'

const ARROWS: Record<VarianceDirection, string> = { up: '↑', down: '↓', flat: '' }

type Props = {
  /** The change itself. Null when there is nothing to compare against. */
  value: Money | null

  /** Shown after the amount when given. Pass null for "no percentage is meaningful here". */
  percent?: number | null

  /** What to render when `value` is null — 'New' in the register, '—' in a summary. */
  emptyLabel?: string

  /** Drops the percentage to its own muted run of text rather than inline. */
  className?: string
}

const VarianceValue = ({ value, percent, emptyLabel = '—', className }: Props) => {
  if (!value) {
    return <span className={cn('text-muted-foreground text-xs', className)}>{emptyLabel}</span>
  }

  const direction = varianceDirection(value.amount)

  return (
    <span className={cn('tabular-nums', direction === 'flat' && 'text-muted-foreground', className)}>
      {direction !== 'flat' && (
        <span aria-hidden='true' className='text-muted-foreground'>
          {ARROWS[direction]}{' '}
        </span>
      )}
      {formatSignedMoney(value)}
      {percent !== undefined && (
        <span className='text-muted-foreground ml-1 text-xs'>{formatSignedPercent(percent)}</span>
      )}
    </span>
  )
}

export default VarianceValue
