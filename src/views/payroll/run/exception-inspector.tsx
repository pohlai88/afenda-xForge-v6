'use client'

// Third-party Imports
import { CheckIcon, EyeIcon, RotateCcwIcon } from 'lucide-react'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ExceptionBadge, ExceptionStatusBadge } from './exception-badge'
import type { ExceptionListItem } from './exception-list'

// Util Imports
import { formatMoney } from '@/utils/money'
import { exceptionStatusOf } from '@/utils/payroll-metrics'
import { formatInstant, initials } from '@/utils/payroll-workspace'

type Props = {
  exception: ExceptionListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void

  /** Resolves an employee id to a display name, for owner and actor fields. */
  nameOf: (employeeId: string) => string

  /** Once a run is approved its exceptions are part of the record and can no longer be changed. */
  locked: boolean
  onAcknowledge: (id: string) => void
  onResolve: (id: string) => void
  onReopen: (id: string) => void
  onOpenEmployee?: (employeeId: string) => void
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='grid grid-cols-[7.5rem_1fr] gap-x-3 py-1.5 text-sm'>
    <dt className='text-muted-foreground'>{label}</dt>
    <dd className='min-w-0 break-words'>{children}</dd>
  </div>
)

/**
 * The full record for one exception with its actions. A Sheet rather than a page: the person
 * clearing it wants to get back to the table they came from with their filters intact.
 */
const ExceptionInspector = ({
  exception,
  open,
  onOpenChange,
  nameOf,
  locked,
  onAcknowledge,
  onResolve,
  onReopen,
  onOpenEmployee
}: Props) => {
  if (!exception) return null

  const status = exceptionStatusOf(exception)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='gap-0 sm:max-w-md'>
        <SheetHeader className='pr-12'>
          <div className='flex flex-wrap items-center gap-2'>
            <ExceptionBadge severity={exception.severity} />
            <ExceptionStatusBadge exception={exception} />
          </div>
          <SheetTitle className='text-base'>{exception.title}</SheetTitle>
          <SheetDescription>{exception.message}</SheetDescription>
        </SheetHeader>

        <ScrollArea className='min-h-0 flex-1'>
          <div className='flex flex-col gap-4 px-4 pb-4'>
            <div className='bg-muted/40 flex items-center gap-3 rounded-md border p-3'>
              <Avatar className='size-9'>
                {exception.avatar && <AvatarImage src={exception.avatar} alt='' />}
                <AvatarFallback className='text-xs'>{initials(exception.subject)}</AvatarFallback>
              </Avatar>
              <div className='flex min-w-0 flex-1 flex-col'>
                <span className='truncate text-sm font-medium'>{exception.subject}</span>
                <span className='text-muted-foreground text-xs'>
                  {exception.employeeId ? 'Employee' : exception.departmentId ? 'Department' : 'Run-wide'}
                </span>
              </div>
              {exception.employeeId && onOpenEmployee && (
                <Button variant='outline' size='sm' onClick={() => onOpenEmployee(exception.employeeId!)}>
                  Open payslip
                </Button>
              )}
            </div>

            <dl className='divide-y'>
              {exception.impact && (
                <Field label='Impact'>
                  <span className='font-medium tabular-nums'>
                    {exception.impact.amount === 0 ? 'None on net pay' : formatMoney(exception.impact)}
                  </span>
                </Field>
              )}
              {exception.previousValue && <Field label='Previous'>{exception.previousValue}</Field>}
              {exception.currentValue && <Field label='Current'>{exception.currentValue}</Field>}
              {exception.source && <Field label='Source'>{exception.source}</Field>}
              {exception.rule && <Field label='Rule'>{exception.rule}</Field>}
              <Field label='Owner'>{exception.ownerId ? nameOf(exception.ownerId) : 'Unassigned'}</Field>
              <Field label='Detected'>{formatInstant(exception.detectedAt)}</Field>
              {exception.acknowledgedAt && (
                <Field label='Acknowledged'>
                  {formatInstant(exception.acknowledgedAt)}
                  {exception.acknowledgedBy && ` by ${nameOf(exception.acknowledgedBy)}`}
                </Field>
              )}
              {exception.resolvedAt && (
                <Field label='Resolved'>
                  {formatInstant(exception.resolvedAt)}
                  {exception.resolvedBy && ` by ${nameOf(exception.resolvedBy)}`}
                </Field>
              )}
            </dl>

            {exception.severity === 'blocking' && status !== 'resolved' && (
              <>
                <Separator />
                <p className='text-destructive text-sm'>
                  Payroll cannot be approved while this is open. Blockers must be resolved, not acknowledged.
                </p>
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className='flex-row justify-end border-t'>
          {locked ? (
            <p className='text-muted-foreground mr-auto self-center text-xs'>
              The run is approved. This record is part of the approval and can no longer change.
            </p>
          ) : status === 'resolved' ? (
            <Button variant='outline' onClick={() => onReopen(exception.id)}>
              <RotateCcwIcon />
              Reopen
            </Button>
          ) : (
            <>
              {status === 'open' && exception.severity !== 'blocking' && (
                <Button variant='outline' onClick={() => onAcknowledge(exception.id)}>
                  <EyeIcon />
                  Acknowledge
                </Button>
              )}
              <Button onClick={() => onResolve(exception.id)}>
                <CheckIcon />
                Mark resolved
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default ExceptionInspector
