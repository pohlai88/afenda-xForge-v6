'use client'

// Third-party Imports
import { ArrowRightIcon, CheckIcon, ClockIcon, RefreshCwIcon, UploadIcon, XIcon } from 'lucide-react'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'
import type { InputFeed, InputFeedStatus } from '@/utils/payroll-workspace'

// Component Imports
import { Button } from '@/components/ui/button'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// Util Imports
import { cn } from '@/lib/utils'
import { formatSignedMoney } from '@/utils/payroll-workspace'

const STATUS_LABELS: Record<InputFeedStatus, string> = {
  ready: 'Ready',
  pending: 'Not yet calculated',
  missing: 'Missing'
}

const STATUS_ICON_STYLES: Record<InputFeedStatus, string> = {
  ready: 'bg-success/15 border-success/40 text-success',
  pending: 'bg-warning/15 border-warning/40 text-warning',
  missing: 'bg-destructive/10 border-destructive/40 text-destructive'
}

const STATUS_ICONS: Record<InputFeedStatus, typeof CheckIcon> = {
  ready: CheckIcon,
  pending: ClockIcon,
  missing: XIcon
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  run: PayRun
  feeds: InputFeed[]

  /** Absent when the actor may not change inputs; the sheet still reports. */
  onImport?: () => void
  onRecalculate?: () => void
  onShowExceptions: () => void
}

/**
 * Are the inputs the calculation depends on complete? One row per feed the engine reads, each
 * saying what is there or exactly who is missing what. Opened from the Inputs stage: the stage
 * bar says where the run is, this says whether what feeds it is ready.
 */
const InputReadinessSheet = ({ open, onOpenChange, run, feeds, onImport, onRecalculate, onShowExceptions }: Props) => {
  const ready = feeds.filter(feed => feed.status === 'ready').length
  const percent = Math.round((ready / feeds.length) * 100)
  const diff = run.lastCalculationDiff

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col gap-0 overflow-y-auto sm:max-w-lg'>
        <SheetHeader className='pr-12'>
          <SheetTitle>Input readiness</SheetTitle>
          <SheetDescription>
            {run.reference} · {ready} of {feeds.length} feeds ready for calculation #{run.calculationVersion}
            {run.pendingInputs ? ' (next)' : ''}
          </SheetDescription>
          <Progress value={percent} aria-label={`${ready} of ${feeds.length} feeds ready`} className='mt-2'>
            <ProgressTrack className='h-1.5'>
              <ProgressIndicator className={percent === 100 ? 'bg-success' : undefined} />
            </ProgressTrack>
          </Progress>
        </SheetHeader>

        <ol className='flex flex-col divide-y px-4'>
          {feeds.map(feed => {
            const Icon = STATUS_ICONS[feed.status]

            return (
              <li key={feed.key} className='flex items-start gap-3 py-3'>
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                    STATUS_ICON_STYLES[feed.status]
                  )}
                  aria-hidden='true'
                >
                  <Icon className='size-3' />
                </span>
                <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <div className='flex flex-wrap items-baseline justify-between gap-x-3'>
                    <span className='text-sm font-medium'>
                      {feed.label}
                      <span className='sr-only'> — {STATUS_LABELS[feed.status]}</span>
                    </span>
                    <span
                      className={cn(
                        'text-xs',
                        feed.status === 'ready'
                          ? 'text-muted-foreground'
                          : feed.status === 'pending'
                            ? 'text-warning'
                            : 'text-destructive'
                      )}
                      aria-hidden='true'
                    >
                      {STATUS_LABELS[feed.status]}
                    </span>
                  </div>
                  <span className='text-muted-foreground text-xs'>{feed.source}</span>
                  <span
                    className={cn('text-xs', feed.status === 'ready' ? 'text-muted-foreground' : 'text-foreground')}
                  >
                    {feed.detail}
                  </span>
                  {feed.status === 'missing' && (feed.key === 'bank' || feed.key === 'tax') && (
                    <Button
                      variant='link'
                      size='xs'
                      className='h-auto w-fit p-0'
                      onClick={() => {
                        onOpenChange(false)
                        onShowExceptions()
                      }}
                    >
                      Open the exceptions
                      <ArrowRightIcon />
                    </Button>
                  )}
                  {feed.status === 'pending' && onRecalculate && (
                    <Button
                      variant='outline'
                      size='xs'
                      className='mt-1 w-fit'
                      onClick={() => {
                        onOpenChange(false)
                        onRecalculate()
                      }}
                    >
                      <RefreshCwIcon />
                      Recalculate now
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>

        {diff && diff.currentVersion === run.calculationVersion && (
          <div className='mx-4 mt-2 rounded-md border p-3 text-sm'>
            <p className='font-medium'>
              Calculation #{diff.currentVersion} vs #{diff.previousVersion}
            </p>
            <dl className='text-muted-foreground mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs tabular-nums'>
              <dt>Employees affected</dt>
              <dd className='text-foreground text-right'>{diff.affectedEmployees}</dd>
              <dt>Gross</dt>
              <dd className='text-foreground text-right'>{formatSignedMoney(diff.grossDelta)}</dd>
              <dt>Net</dt>
              <dd className='text-foreground text-right'>{formatSignedMoney(diff.netDelta)}</dd>
              <dt>Employer cost</dt>
              <dd className='text-foreground text-right'>{formatSignedMoney(diff.employerCostDelta)}</dd>
              <dt>Inputs applied</dt>
              <dd className='text-foreground text-right'>{diff.inputsApplied}</dd>
            </dl>
          </div>
        )}

        {onImport && (
          <SheetFooter className='mt-auto'>
            <Button
              variant='outline'
              onClick={() => {
                onOpenChange(false)
                onImport()
              }}
            >
              <UploadIcon />
              Import inputs
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default InputReadinessSheet
