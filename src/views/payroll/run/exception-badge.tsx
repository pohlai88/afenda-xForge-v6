// Third-party Imports
import { AlertOctagonIcon, AlertTriangleIcon, CircleAlertIcon, InfoIcon } from 'lucide-react'

// Type Imports
import type { PayRunException, PayRunExceptionSeverity } from '@/types/payroll/pay-run-types'

// Component Imports
import { Badge } from '@/components/ui/badge'

// Util Imports
import { cn } from '@/lib/utils'
import {
  EXCEPTION_SEVERITY_LABELS,
  EXCEPTION_SEVERITY_STYLES,
  EXCEPTION_STATUS_LABELS,
  EXCEPTION_STATUS_STYLES,
  exceptionStatusOf
} from '@/utils/payroll-metrics'

/**
 * Blocking and error share a colour, so the icon is what tells them apart. Never the only cue:
 * the word is always rendered too, except in the compact count where the label is a tooltip.
 */
export const SEVERITY_ICONS: Record<PayRunExceptionSeverity, typeof AlertTriangleIcon> = {
  blocking: AlertOctagonIcon,
  error: CircleAlertIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon
}

type BadgeProps = {
  severity: PayRunExceptionSeverity

  /** A count instead of the word, for table cells where the column header already says "Exceptions". */
  count?: number
  className?: string
}

export const ExceptionBadge = ({ severity, count, className }: BadgeProps) => {
  const Icon = SEVERITY_ICONS[severity]
  const label = EXCEPTION_SEVERITY_LABELS[severity]

  return (
    <Badge
      className={cn(
        'h-auto rounded-sm px-1.5 py-0.5 text-xs tabular-nums',
        EXCEPTION_SEVERITY_STYLES[severity],
        className
      )}
      aria-label={count === undefined ? label : `${count} ${label.toLowerCase()}${count === 1 ? '' : 's'}`}
    >
      <Icon aria-hidden='true' />
      {count ?? label}
    </Badge>
  )
}

export const ExceptionStatusBadge = ({ exception, className }: { exception: PayRunException; className?: string }) => {
  const status = exceptionStatusOf(exception)

  return (
    <Badge className={cn('h-auto rounded-sm px-1.5 py-0.5 text-xs', EXCEPTION_STATUS_STYLES[status], className)}>
      {EXCEPTION_STATUS_LABELS[status]}
    </Badge>
  )
}
