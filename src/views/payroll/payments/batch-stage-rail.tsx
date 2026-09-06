// Third-party Imports
import { CheckIcon } from 'lucide-react'

// Type Imports
import type { SettlementBatch } from '@/types/payroll/settlement-types'

// Util Imports
import { cn } from '@/lib/utils'
import { BATCH_STAGES, BATCH_STAGE_LABELS, batchStageIndex, batchStageTimestamps } from '@/utils/payroll-payments'
import { formatInstant } from '@/utils/payroll-workspace'

type Props = {
  batch: SettlementBatch
  className?: string
}

/**
 * Where the payment file is: the run workspace's stage-bar shape, so a person reading Pay on
 * the run and Released here reads one convention. Each done stage carries the instant it was
 * recorded, because "released" without "when" is not an audit trail.
 */
const BatchStageRail = ({ batch, className }: Props) => {
  const done = batchStageIndex(batch.status)
  const at = batchStageTimestamps(batch)

  return (

    // `relative` keeps the sr-only labels inside this scroller; see payroll-stage-bar.tsx.
    <ol className={cn('relative flex items-start gap-1 overflow-x-auto', className)} aria-label='Payment file progress'>
      {BATCH_STAGES.map((stage, index) => {
        const isDone = index < done
        const isActive = index === done

        return (
          <li key={stage} className='flex items-start gap-1'>
            <span className='flex flex-col gap-0.5'>
              <span
                className={cn(
                  'flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap',
                  isDone && 'text-muted-foreground',
                  isActive && 'bg-primary text-primary-foreground',
                  !isDone && !isActive && 'text-muted-foreground/60'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] tabular-nums',
                    isDone && 'bg-success/15 border-success/40 text-success',
                    isActive && 'border-primary-foreground/40',
                    !isDone && !isActive && 'border-current'
                  )}
                  aria-hidden='true'
                >
                  {isDone ? <CheckIcon className='size-2.5' /> : index + 1}
                </span>
                {BATCH_STAGE_LABELS[stage]}
                <span className='sr-only'>{isDone ? ' (done)' : isActive ? ' (next)' : ' (not started)'}</span>
              </span>
              {isDone && at[stage] && (
                <span className='text-muted-foreground px-2 text-[11px] whitespace-nowrap tabular-nums'>
                  {formatInstant(at[stage]!)}
                </span>
              )}
            </span>
            {index < BATCH_STAGES.length - 1 && (
              <span
                className={cn('mt-3.5 h-px w-4 shrink-0', isDone ? 'bg-success/40' : 'bg-border')}
                aria-hidden='true'
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default BatchStageRail
