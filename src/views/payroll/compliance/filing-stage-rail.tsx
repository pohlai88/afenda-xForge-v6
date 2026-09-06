// Third-party Imports
import { CheckIcon, XIcon } from 'lucide-react'

// Type Imports
import type { FilingStage, FilingStatus } from '@/types/payroll/compliance-types'
import { FILING_STAGES } from '@/types/payroll/compliance-types'

// Util Imports
import { cn } from '@/lib/utils'

const STAGE_LABELS: Record<FilingStage, string> = {
  prepared: 'Prepared',
  submitted: 'Submitted',
  accepted: 'Accepted'
}

/** How many stages are done for a status. Rejected counts as submitted, with the last stage in error. */
const doneCount = (status: FilingStatus) =>
  status === 'not_started' ? 0 : status === 'prepared' ? 1 : status === 'accepted' ? 3 : 2

type Props = {
  status: FilingStatus
  className?: string
}

/**
 * Where a filing is: the same shape as the run workspace's stage bar, so a person moving between
 * the two reads one convention. Rejected is drawn as the last stage failing rather than as a
 * separate path, because a rejected filing goes back to Prepared and tries the same stages again.
 */
const FilingStageRail = ({ status, className }: Props) => {
  const done = doneCount(status)
  const rejected = status === 'rejected'

  return (

    // `relative` keeps the sr-only labels inside this scroller; see payroll-stage-bar.tsx.
    <ol className={cn('relative flex items-center gap-1 overflow-x-auto', className)} aria-label='Filing progress'>
      {FILING_STAGES.map((stage, index) => {
        const isDone = index < done
        const isError = rejected && index === 2
        const isActive = !isError && index === done && status !== 'accepted'

        return (
          <li key={stage} className='flex items-center gap-1'>
            <span
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap',
                isDone && 'text-muted-foreground',
                isActive && 'bg-primary text-primary-foreground',
                isError && 'bg-destructive/10 text-destructive',
                !isDone && !isActive && !isError && 'text-muted-foreground/60'
              )}
              aria-current={isActive ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] tabular-nums',
                  isDone && 'bg-success/15 border-success/40 text-success',
                  isActive && 'border-primary-foreground/40',
                  isError && 'border-destructive/40',
                  !isDone && !isActive && !isError && 'border-current'
                )}
                aria-hidden='true'
              >
                {isDone ? <CheckIcon className='size-2.5' /> : isError ? <XIcon className='size-2.5' /> : index + 1}
              </span>
              {isError ? 'Rejected' : STAGE_LABELS[stage]}
              <span className='sr-only'>
                {isDone ? ' (done)' : isActive ? ' (current)' : isError ? ' (failed)' : ' (not started)'}
              </span>
            </span>
            {index < FILING_STAGES.length - 1 && (
              <span className={cn('h-px w-4 shrink-0', isDone ? 'bg-success/40' : 'bg-border')} aria-hidden='true' />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default FilingStageRail
