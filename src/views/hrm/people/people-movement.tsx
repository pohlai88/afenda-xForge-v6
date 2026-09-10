// Type Imports
import type { WorkforceMovement } from '@/types/hrm/people-types'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'

type Props = {
  movement: WorkforceMovement
  className?: string
}

/**
 * The UNDERSTAND band: how this month differs from the last.
 *
 * The narrowest band and the only one permitted to be empty, so it renders nothing at all when
 * nobody joined or left in either month. A card explaining that it has nothing to show is an
 * argument for deleting the card.
 *
 * Nothing here is coloured by direction. A workforce shrinking is not a failure and growing is
 * not a success — the doctrine forbids using success and error colours for neutral direction,
 * and a headcount change is exactly that. The arrow states the direction; the colour does not.
 */
const PeopleMovement = ({ movement, className }: Props) => {
  const nothingHappened =
    movement.joiners === 0 && movement.leavers === 0 && movement.previousJoiners === 0 && movement.previousLeavers === 0

  if (nothingHappened) return null

  const rows = [
    { label: 'Joined', now: movement.joiners, before: movement.previousJoiners },
    { label: 'Left', now: movement.leavers, before: movement.previousLeavers }
  ]

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle role='heading' aria-level={2}>
          Arrivals and departures
        </CardTitle>
        <CardDescription>
          {movement.periodLabel}, against {movement.previousPeriodLabel}
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-col gap-4'>
        {rows.map(row => (
          <div key={row.label} className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground text-sm'>{row.label}</span>
            <span className='flex items-baseline gap-3'>
              <span className='text-lg font-medium tabular-nums'>{row.now}</span>
              <span className='text-muted-foreground text-xs tabular-nums'>was {row.before}</span>
            </span>
          </div>
        ))}

        <div className='flex items-baseline justify-between gap-4 border-t pt-4'>
          <span className='text-sm'>Net change</span>
          <span className='text-sm font-medium tabular-nums'>
            {movement.net > 0 ? `+${movement.net}` : movement.net}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default PeopleMovement
