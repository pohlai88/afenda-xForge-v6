// Type Imports
import type { EmployeeMovement } from '@/types/hrm/movement-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'
import { formatDate, formatInstant } from '@/utils/format-datetime'
import { formatMoney } from '@/utils/money'
import { MOVEMENT_DIMENSION_LABELS, MOVEMENT_KIND_LABELS, MOVEMENT_KIND_STYLES } from '@/utils/hrm-movement'

type Props = {
  movements: EmployeeMovement[]

  /**
   * Employee id to name, for the `recordedBy` stamp.
   *
   * A plain record rather than a resolver function: this renders inside a client component, and a
   * function prop cannot cross the server/client boundary. The server resolves the names it has
   * and an id with no entry falls back to itself rather than rendering blank.
   */
  recorderNames: Record<string, string>
  className?: string
}

/**
 * The effective-dated ledger: what changed, from what to what, when it took effect, and who
 * recorded it.
 *
 * Two dates are shown per entry and they are not interchangeable. `effectiveFrom` is when the
 * change takes effect in the business; `recordedAt` is when somebody entered it. A transfer agreed
 * in August and effective in October is one event with two dates, and a timeline showing only
 * sequence would be reconstructing history from the order things were typed — which A07 forbids.
 *
 * Nothing here is folded into a current value. The Employee record is authoritative; this explains
 * how it got there.
 */
const EmployeeMovementLedger = ({ movements, recorderNames, className }: Props) => (
  <Card className={cn(className)}>
    <CardHeader>
      <CardTitle role='heading' aria-level={2}>
        Movement
      </CardTitle>
      <CardDescription>
        {movements.length === 1 ? 'One recorded change' : `${movements.length} recorded changes, most recent first`}
      </CardDescription>
    </CardHeader>

    <CardContent>
      {movements.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          No movement is on record for this person — not even a hire. That is a gap in the record rather than a
          statement that nothing ever changed.
        </p>
      ) : (
        <ol className='flex flex-col'>
          {movements.map((movement, index) => {
            // Destructured so the narrowing survives into the JSX. Read back off `movement` these
            // need a non-null assertion, which claims the guard is right rather than proving it.
            const { previousAmount, nextAmount } = movement
            const showsValues = movement.previousValue || movement.nextValue

            return (
              <li key={movement.id} className={cn('flex flex-col gap-1.5 py-4', index > 0 && 'border-t')}>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge className={cn('whitespace-nowrap', MOVEMENT_KIND_STYLES[movement.kind])}>
                    {MOVEMENT_KIND_LABELS[movement.kind]}
                  </Badge>
                  {movement.dimension && (
                    <span className='text-muted-foreground text-xs'>
                      {MOVEMENT_DIMENSION_LABELS[movement.dimension]}
                    </span>
                  )}
                  <span className='ml-auto text-sm whitespace-nowrap tabular-nums'>
                    {formatDate(movement.effectiveFrom)}
                  </span>
                </div>

                {previousAmount && nextAmount && (
                  <p className='text-sm tabular-nums'>
                    <span className='text-muted-foreground line-through'>{formatMoney(previousAmount)}</span>
                    {' → '}
                    <span className='font-medium'>{formatMoney(nextAmount)}</span>
                  </p>
                )}

                {!(previousAmount && nextAmount) && showsValues && (
                  <p className='text-sm'>
                    {movement.previousValue && (
                      <>
                        <span className='text-muted-foreground'>{movement.previousValue}</span>
                        {' → '}
                      </>
                    )}
                    <span className='font-medium'>{movement.nextValue ?? '—'}</span>
                  </p>
                )}

                {movement.reason && <p className='text-muted-foreground text-sm'>{movement.reason}</p>}

                {/*
                  Recorded-by and recorded-at, kept visually subordinate to the effective date
                  above. They answer "who says so", which matters for an audit and not for reading
                  the career.
                */}
                <p className='text-muted-foreground text-xs'>
                  Recorded by {recorderNames[movement.recordedBy] ?? movement.recordedBy} · {formatInstant(movement.recordedAt)}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </CardContent>
  </Card>
)

export default EmployeeMovementLedger
