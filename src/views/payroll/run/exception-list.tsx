// Third-party Imports
import { CheckCircle2Icon, ChevronRightIcon } from 'lucide-react'

// Type Imports
import type { PayRunException } from '@/types/payroll/pay-run-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ExceptionBadge, ExceptionStatusBadge } from './exception-badge'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { EXCEPTION_SEVERITY_ORDER, exceptionStatusOf } from '@/utils/payroll-metrics'
import { initials, sortExceptions } from '@/utils/payroll-workspace'

/** An exception plus the name and face of whoever or whatever it is about, resolved by the caller. */
export type ExceptionListItem = PayRunException & { subject: string; avatar?: string }

type Props = {
  exceptions: ExceptionListItem[]
  selectedId?: string | null
  onSelect: (exception: ExceptionListItem) => void

  /** Hide the subject column when every exception is about the same person, as in the inspector. */
  showSubject?: boolean
  emptyMessage?: string
  className?: string
}

/**
 * The to-do list. Each row is one exception; opening one shows the inspector with the full
 * record and its actions. Resolved rows stay in the list, greyed, because "what was cleared and
 * by whom" is part of the record the approver signs.
 */
const ExceptionList = ({
  exceptions,
  selectedId,
  onSelect,
  showSubject = true,
  emptyMessage = 'No exceptions found.',
  className
}: Props) => {
  const sorted = sortExceptions(exceptions, EXCEPTION_SEVERITY_ORDER) as ExceptionListItem[]

  if (sorted.length === 0) {
    return (
      <div className={cn('text-muted-foreground flex flex-col items-center gap-2 py-10 text-center', className)}>
        <CheckCircle2Icon className='text-success size-6' aria-hidden='true' />
        <p className='text-sm'>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className={cn('divide-y', className)}>
      {sorted.map(exception => {
        const resolved = exceptionStatusOf(exception) === 'resolved'
        const selected = exception.id === selectedId

        return (
          <li key={exception.id}>
            <Button
              variant='ghost'
              onClick={() => onSelect(exception)}
              aria-current={selected ? 'true' : undefined}
              className={cn(
                'h-auto w-full items-start justify-start gap-3 rounded-none px-3 py-2.5 text-left font-normal whitespace-normal',
                selected && 'bg-muted',
                resolved && 'opacity-60'
              )}
            >
              {showSubject && (
                <Avatar className='mt-0.5 size-7 shrink-0'>
                  {exception.avatar && <AvatarImage src={exception.avatar} alt='' />}
                  <AvatarFallback className='text-[10px]'>{initials(exception.subject)}</AvatarFallback>
                </Avatar>
              )}
              <span className='flex min-w-0 flex-1 flex-col gap-1'>
                <span className='flex items-center gap-2'>
                  <span className='truncate text-sm font-medium'>{exception.title}</span>
                  <ExceptionBadge severity={exception.severity} />
                  <ExceptionStatusBadge exception={exception} />
                </span>
                <span className='text-muted-foreground line-clamp-2 text-xs'>{exception.message}</span>
                <span className='text-muted-foreground flex flex-wrap gap-x-3 text-xs'>
                  {showSubject && <span>{exception.subject}</span>}
                  {exception.impact && exception.impact.amount !== 0 && (
                    <span className='tabular-nums'>Impact {formatMoney(exception.impact)}</span>
                  )}
                  {exception.source && <span>{exception.source}</span>}
                </span>
              </span>
              <ChevronRightIcon className='text-muted-foreground mt-1 size-4 shrink-0' aria-hidden='true' />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

export default ExceptionList
