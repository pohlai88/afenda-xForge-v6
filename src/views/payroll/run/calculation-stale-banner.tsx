'use client'

// Third-party Imports
import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'

// Component Imports
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

// Util Imports
import { cn } from '@/lib/utils'
import { formatInstant } from '@/utils/payroll-workspace'

type Props = {
  run: PayRun

  /** Absent when the actor may not recalculate; the banner still states the fact. */
  onRecalculate?: () => void
  onShowInputs: () => void
  className?: string
}

/**
 * The run's figures are older than its inputs. A state, not a notification: it has no dismiss,
 * it stays until a calculation consumes the inputs, and approval is refused while it shows. A
 * toast would be gone by the time the approver arrived.
 */
const CalculationStaleBanner = ({ run, onRecalculate, onShowInputs, className }: Props) => {
  const pending = run.pendingInputs

  if (!pending) return null

  return (
    <Alert className={cn('border-warning/40 bg-warning/10 text-foreground', className)} role='status'>
      <TriangleAlertIcon className='text-warning-strong' />
      <AlertTitle>Calculation #{run.calculationVersion} is out of date</AlertTitle>
      <AlertDescription className='text-foreground/80'>
        {pending.count} {pending.count === 1 ? 'input' : 'inputs'} for {pending.employees}{' '}
        {pending.employees === 1 ? 'employee' : 'employees'} landed {formatInstant(pending.importedAt)}, after the last
        calculation. Approval stays unavailable until the run is recalculated.{' '}
        <Button variant='link' size='xs' className='h-auto p-0 text-current underline' onClick={onShowInputs}>
          See what changed
        </Button>
      </AlertDescription>
      {onRecalculate && (
        <AlertAction className='top-2.5 right-3'>
          <Button size='sm' onClick={onRecalculate}>
            <RefreshCwIcon />
            Recalculate
          </Button>
        </AlertAction>
      )}
    </Alert>
  )
}

export default CalculationStaleBanner
