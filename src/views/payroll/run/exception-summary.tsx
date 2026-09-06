// Third-party Imports
import { CheckCircle2Icon } from 'lucide-react'

// Type Imports
import type { PayRunException, PayRunExceptionSeverity } from '@/types/payroll/pay-run-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { ExceptionBadge } from './exception-badge'

// Util Imports
import { cn } from '@/lib/utils'
import { EXCEPTION_SEVERITY_LABELS, countExceptions } from '@/utils/payroll-metrics'

type Props = {
  exceptions: PayRunException[]

  /** Currently applied severity filter, so the pressed chip can show as pressed. */
  activeSeverity?: PayRunExceptionSeverity | null

  /** Fired with the severity to filter to, or null to clear. */
  onFilter?: (severity: PayRunExceptionSeverity | null) => void
  className?: string
}

const SEVERITIES: PayRunExceptionSeverity[] = ['blocking', 'error', 'warning', 'info']

/**
 * Open exceptions by severity as a row of pressable counts. Each is a filter, because a count
 * you cannot act on is a fact you have to go and find again.
 */
const ExceptionSummary = ({ exceptions, activeSeverity = null, onFilter, className }: Props) => {
  const counts = countExceptions(exceptions)

  if (counts.open === 0) {
    return (
      <p className={cn('text-success flex items-center gap-1.5 text-sm', className)} role='status'>
        <CheckCircle2Icon className='size-4' aria-hidden='true' />
        Nothing outstanding on this run
      </p>
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)} role='group' aria-label='Open exceptions'>
      {SEVERITIES.map(severity => {
        const count = counts[severity]

        if (count === 0) return null

        const pressed = activeSeverity === severity

        return (
          <Button
            key={severity}
            variant={pressed ? 'secondary' : 'ghost'}
            size='xs'
            className='h-auto gap-1.5 px-1.5 py-1'
            aria-pressed={pressed}
            onClick={() => onFilter?.(pressed ? null : severity)}
          >
            <ExceptionBadge severity={severity} count={count} />
            <span className={cn('text-xs', pressed ? 'text-foreground' : 'text-muted-foreground')}>
              {EXCEPTION_SEVERITY_LABELS[severity]}
              {count === 1 ? '' : 's'}
            </span>
          </Button>
        )
      })}
      {counts.acknowledged > 0 && (
        <span className='text-muted-foreground pl-1 text-xs'>{counts.acknowledged} acknowledged</span>
      )}
    </div>
  )
}

export default ExceptionSummary
