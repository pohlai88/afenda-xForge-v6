// Third-party Imports
import { CheckCircle2Icon } from 'lucide-react'

// Type Imports
import type { PayRunException, PayRunExceptionSeverity } from '@/types/payroll/pay-run-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

// Util Imports
import { cn } from '@/lib/utils'

/** An exception plus the human name of whatever it is about, resolved by the caller. */
export type ExceptionRow = PayRunException & { subject?: string }

const SEVERITY_STYLES: Record<PayRunExceptionSeverity, string> = {
  blocking: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-muted text-muted-foreground'
}

const SEVERITY_LABELS: Record<PayRunExceptionSeverity, string> = {
  blocking: 'Blocking',
  warning: 'Warning',
  info: 'Info'
}

// Blocking first: this list is a to-do, and the things that stop the run belong at the top.
const SEVERITY_ORDER: Record<PayRunExceptionSeverity, number> = { blocking: 0, warning: 1, info: 2 }

type Props = {
  exceptions: ExceptionRow[]
  className?: string
}

const PayrollExceptionQueue = ({ exceptions, className }: Props) => {
  const open = [...exceptions]
    .filter(exception => !exception.resolvedAt)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Exceptions</CardTitle>
        <CardDescription>Clear before approving the run</CardDescription>
        <CardAction>
          <Badge
            className={cn(open.length === 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive')}
          >
            {open.length} open
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className='pt-0'>
        {open.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center gap-2 py-10 text-center'>
            <CheckCircle2Icon className='text-primary size-8' />
            <span className='text-sm'>Nothing outstanding on this run.</span>
          </div>
        ) : (
          <ScrollArea className='h-83'>
            <ul className='flex flex-col gap-3 pr-3'>
              {open.map(exception => (
                <li key={exception.id} className='flex flex-col gap-1.5 rounded-md border p-3'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-sm font-medium'>{exception.subject ?? 'Run-wide'}</span>
                    <Badge className={cn('shrink-0 text-xs', SEVERITY_STYLES[exception.severity])}>
                      {SEVERITY_LABELS[exception.severity]}
                    </Badge>
                  </div>
                  <p className='text-muted-foreground text-sm'>{exception.message}</p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export default PayrollExceptionQueue
