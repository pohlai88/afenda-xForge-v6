// Next Imports
import Link from 'next/link'

// Third-party Imports
import { CheckCircle2Icon } from 'lucide-react'

// Type Imports
import type { PayRunException, PayRunExceptionSeverity } from '@/types/payroll/pay-run-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

// Util Imports
import { cn } from '@/lib/utils'

/** An exception plus the human name and face of whatever it is about, resolved by the caller. */
export type ExceptionRow = PayRunException & { subject?: string; avatar?: string }

/** 'Yuki Tanaka' -> 'YT'. Run-wide exceptions have no person, so they fall back to a glyph. */
const initials = (name?: string) =>
  name
    ?.split(' ')
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() ?? '—'

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

  /** Set when a department chip in the cost chart has scoped this queue to one department. */
  departmentFilter?: { id: string; name: string }

  /** Reference of the run currently shown, so "Clear filter" can drop `dept` and keep `run`. */
  runReference: string
  className?: string
}

const PayrollExceptionQueue = ({ exceptions, departmentFilter, runReference, className }: Props) => {
  const open = [...exceptions]
    .filter(exception => !exception.resolvedAt)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  const clearFilterHref = `/dashboard/payroll?run=${encodeURIComponent(runReference)}`

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Exceptions</CardTitle>
        <CardDescription>
          {departmentFilter ? `Filtered to ${departmentFilter.name}` : 'Clear before approving the run'}
        </CardDescription>
        <CardAction className='flex flex-col items-end gap-1'>
          <Badge
            className={cn(open.length === 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive')}
          >
            {open.length} open
          </Badge>
          {departmentFilter && (
            <Link
              href={clearFilterHref}
              scroll={false}
              className='text-muted-foreground text-xs underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
            >
              Clear filter
            </Link>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className='pt-0'>
        {open.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center gap-2 py-10 text-center'>
            <CheckCircle2Icon className='text-primary size-8' />
            <span className='text-sm'>
              {departmentFilter
                ? `No open exceptions for ${departmentFilter.name}.`
                : 'Nothing outstanding on this run.'}
            </span>
            {departmentFilter && (
              <Link
                href={clearFilterHref}
                scroll={false}
                className='text-primary text-sm underline-offset-4 hover:underline'
              >
                Clear filter
              </Link>
            )}
          </div>
        ) : (
          <ScrollArea className='h-83'>
            <ul className='flex flex-col gap-3 pr-3'>
              {open.map(exception => (
                <li key={exception.id} className='hover:bg-muted/40 flex gap-3 rounded-md border p-3 transition-colors'>
                  <Avatar className='size-9 shrink-0'>
                    {exception.avatar && <AvatarImage src={exception.avatar} alt='' />}
                    <AvatarFallback className='text-xs'>{initials(exception.subject)}</AvatarFallback>
                  </Avatar>
                  <div className='flex min-w-0 flex-1 flex-col gap-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='truncate text-sm font-medium'>{exception.subject ?? 'Run-wide'}</span>
                      <Badge className={cn('shrink-0 text-xs', SEVERITY_STYLES[exception.severity])}>
                        {SEVERITY_LABELS[exception.severity]}
                      </Badge>
                    </div>
                    <p className='text-muted-foreground text-sm'>{exception.message}</p>
                  </div>
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
