// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon, CheckCircle2Icon } from 'lucide-react'

// Type Imports
import type { NextAction } from '@/utils/payroll-group-attention'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  actions: NextAction[]
  className?: string
}

/**
 * The work, in the order payroll has to happen in.
 *
 * Not quick actions. A grid of links to Reports, Payments and Settings is navigation wearing the
 * clothes of a task list, and the page contract rejects it by name: every row here is something a
 * person does, to a named company, with a destination that lands on the thing itself.
 *
 * The order is the payroll lifecycle rather than severity — clearing a blocker precedes approving,
 * approving precedes releasing — because that is the order the work can actually be done in. The
 * list shortens by itself as states advance; nothing has to be ticked off.
 */
const GroupNextActions = ({ actions, className }: Props) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
        Next actions
      </CardTitle>
      <CardDescription>Ranked by what payroll needs first</CardDescription>
    </CardHeader>

    <CardContent className='flex flex-1 flex-col'>
      {actions.length === 0 ? (
        <p className='text-success flex items-center gap-2 text-sm'>
          <CheckCircle2Icon className='size-4 shrink-0' aria-hidden='true' />
          Nothing outstanding across the group this period.
        </p>
      ) : (
        <ol className='flex flex-col divide-y'>
          {actions.map((action, index) => (
            <li key={action.id} className={index === 0 ? 'pb-2' : 'py-2 last:pb-0'}>
              <Button
                variant='ghost'
                render={<Link href={action.href} />}
                nativeButton={false}
                className='h-auto w-full justify-start gap-3 px-2 py-2.5 text-left font-normal'
              >
                <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <span className='truncate text-sm font-medium'>{action.task}</span>
                  <span className='text-muted-foreground truncate text-xs'>
                    {action.scope}
                    {action.dueLabel && ` · ${action.dueLabel}`}
                  </span>
                </span>
                <ArrowRightIcon className='text-muted-foreground size-4 shrink-0' aria-hidden='true' />
              </Button>
            </li>
          ))}
        </ol>
      )}
    </CardContent>
  </Card>
)

export default GroupNextActions
