// Third-party Imports
import { CheckIcon, TriangleAlertIcon } from 'lucide-react'

// Type Imports
import type { PayRunStatus } from '@/types/payroll/pay-run-types'
import { PAYROLL_STAGES } from '@/types/payroll/run-workspace-types'

// Component Imports
import { Button } from '@/components/ui/button'

// Util Imports
import { cn } from '@/lib/utils'
import { PAYROLL_STAGE_LABELS, stageIndexForStatus } from '@/utils/payroll-workspace'

type Props = {
  status: PayRunStatus

  /**
   * Opens the input readiness sheet from the Inputs stage. The stage bar stays a status
   * display; this one stage is also a door because "where is the run" and "are its inputs
   * complete" are asked together.
   */
  onInputsClick?: () => void

  /** Inputs landed after the last calculation: the Inputs stage carries a warning mark. */
  inputsPending?: boolean
  className?: string
}

/**
 * Where the run is in its life. Not a wizard: nothing here navigates, and the person reviewing a
 * run in Approve is expected to keep looking at Inputs. The bar answers "how far along is this",
 * and the table below answers everything else.
 *
 * Cancelled and failed runs are not on this path, so they are rendered as a plain statement
 * instead of a position — a failed run is not 60% of the way to closed.
 */
const PayrollStageBar = ({ status, onInputsClick, inputsPending = false, className }: Props) => {
  if (status === 'cancelled' || status === 'failed') {
    return (
      <p className={cn('text-destructive-strong text-sm', className)} role='status'>
        This run was {status}. It is no longer moving through the payroll lifecycle.
      </p>
    )
  }

  const current = stageIndexForStatus(status)

  return (

    // `relative` makes this list the containing block for the sr-only stage labels below. Without
    // it their absolute positioning escapes the scroller and, on a narrow screen, they sit past the
    // right edge and make the whole page scroll sideways.
    <ol className={cn('relative flex items-center gap-1 overflow-x-auto', className)} aria-label='Payroll lifecycle'>
      {PAYROLL_STAGES.map((stage, index) => {
        const done = index < current
        const active = index === current
        const clickable = stage === 'inputs' && !!onInputsClick
        const flagged = stage === 'inputs' && inputsPending

        const body = (
          <>
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] tabular-nums',
                flagged && 'bg-warning/15 border-warning/40 text-warning-strong',
                !flagged && done && 'bg-success/15 border-success/40 text-success-strong',
                !flagged && active && 'border-primary-foreground/40',
                !flagged && !done && !active && 'border-current'
              )}
              aria-hidden='true'
            >
              {flagged ? (
                <TriangleAlertIcon className='size-2.5' />
              ) : done ? (
                <CheckIcon className='size-2.5' />
              ) : (
                index + 1
              )}
            </span>
            {PAYROLL_STAGE_LABELS[stage]}
            <span className='sr-only'>
              {flagged
                ? ' (inputs changed since calculation)'
                : done
                  ? ' (done)'
                  : active
                    ? ' (current)'
                    : ' (not started)'}
            </span>
          </>
        )

        const stageClassName = cn(
          'flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap',
          done && 'text-muted-foreground',
          active && 'bg-primary text-primary-foreground',
          !done && !active && 'text-muted-foreground/60'
        )

        return (
          <li key={stage} className='flex items-center gap-1'>
            {clickable ? (
              <Button
                variant='ghost'
                size='xs'
                className={cn(stageClassName, 'hover:bg-muted', done && 'hover:text-foreground')}
                aria-current={active ? 'step' : undefined}
                onClick={onInputsClick}
              >
                {body}
                <span className='sr-only'>. Open input readiness</span>
              </Button>
            ) : (
              <span className={stageClassName} aria-current={active ? 'step' : undefined}>
                {body}
              </span>
            )}
            {index < PAYROLL_STAGES.length - 1 && (
              <span className={cn('h-px w-4 shrink-0', done ? 'bg-success/40' : 'bg-border')} aria-hidden='true' />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default PayrollStageBar
