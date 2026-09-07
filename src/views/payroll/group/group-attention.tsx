// Next Imports
import Link from 'next/link'

// Third-party Imports
import { CheckCircle2Icon } from 'lucide-react'

// Type Imports
import type { AttentionItem } from '@/utils/payroll-group-attention'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExceptionBadge } from '@/views/payroll/run/exception-badge'

type Props = {
  items: AttentionItem[]
  className?: string
}

/**
 * What needs a person, worst first, and never more than five.
 *
 * The discipline this section exists to keep is that a payroll problem becomes resolvable work
 * rather than a report row. So every item states its own consequence — what happens if it is left
 * — and carries exactly one destination. A row that said "3 exceptions" and linked nowhere would
 * be an alert; these are tasks.
 *
 * Five is a cap, not a target. An empty list is a real and good answer, and it says so rather
 * than rendering an empty frame.
 */
const GroupAttention = ({ items, className }: Props) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
        Needs attention
      </CardTitle>
      <CardDescription>
        {items.length === 0
          ? 'Nothing is holding up this period'
          : `${items.length} ${items.length === 1 ? 'item' : 'items'}, most serious first`}
      </CardDescription>
    </CardHeader>

    <CardContent className='flex flex-1 flex-col'>
      {items.length === 0 ? (
        <p className='text-success flex items-center gap-2 text-sm'>
          <CheckCircle2Icon className='size-4 shrink-0' aria-hidden='true' />
          No company is blocked, short of funds, or missing from the period.
        </p>
      ) : (
        <ul className='flex flex-col divide-y'>
          {items.map((item, index) => (
            <li
              key={item.id}
              className={index === 0 ? 'flex flex-col gap-2 pb-4' : 'flex flex-col gap-2 py-4 last:pb-0'}
            >
              <div className='flex flex-wrap items-center gap-2'>
                <ExceptionBadge severity={item.severity} />
                <span className='text-sm font-medium'>{item.scope}</span>
                {item.dueLabel && <span className='text-muted-foreground text-xs'>· {item.dueLabel}</span>}
              </div>

              <p className='text-sm'>{item.reason}</p>
              <p className='text-muted-foreground text-sm'>{item.consequence}</p>

              <Button
                variant='outline'
                size='sm'
                className='w-fit'
                render={<Link href={item.href} />}
                nativeButton={false}
              >
                {item.actionLabel}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
)

export default GroupAttention
