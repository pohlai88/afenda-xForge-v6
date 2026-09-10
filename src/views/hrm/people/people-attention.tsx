// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon } from 'lucide-react'

// Type Imports
import type { PeopleAttentionItem } from '@/types/hrm/people-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'

type Props = {
  items: PeopleAttentionItem[]
  className?: string
}

/**
 * The ATTEND band: which records need attention.
 *
 * P02's rule for this band, applied here: every item names one destination. An item with neither
 * an action nor a destination is information, not attention, and belongs somewhere else.
 *
 * What this band must never say is whether anybody can be paid. "No bank account on file" is a
 * fact about the record and HRM can prove it; "cannot be paid" is a conclusion about a pay run,
 * which depends on the calculation, the open exceptions and the approval policy — none of which
 * this module holds. That is the whole reason the module's vocabulary is completeness rather than
 * readiness (`afenda-hrm-architecture.yaml` B07).
 */
const PeopleAttention = ({ items, className }: Props) => (
  <Card className={cn(className)}>
    <CardHeader>
      <CardTitle role='heading' aria-level={2}>
        Records needing attention
      </CardTitle>
      <CardDescription>Payroll-relevant details that are missing or approaching</CardDescription>
      {items.length > 0 && (
        <CardAction>
          <span className='text-muted-foreground text-sm tabular-nums'>{items.length}</span>
        </CardAction>
      )}
    </CardHeader>

    <CardContent>
      {items.length === 0 ? (
        <p className='text-muted-foreground text-sm'>Every record has its payroll-relevant details.</p>
      ) : (
        <ul className='flex flex-col'>
          {items.map((item, index) => (
            <li key={item.id} className={cn('flex items-center gap-3 py-3', index > 0 && 'border-t')}>
              <span className='flex min-w-0 flex-1 flex-col'>
                <span className='truncate text-sm font-medium'>{item.employeeName}</span>
                <span className='text-muted-foreground truncate text-xs'>
                  {item.detail} · {item.entityName}
                </span>
              </span>

              {/*
                The destination this item names. A Button that navigates uses `render`, never a
                Link wrapping a Button — that nests an anchor inside a button and costs two tab
                stops for one control.
              */}
              <Button
                variant='ghost'
                size='icon-sm'
                className='text-muted-foreground shrink-0'
                render={<Link href={item.href} />}
                nativeButton={false}
                aria-label={`Open ${item.employeeName}`}
              >
                <ArrowRightIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
)

export default PeopleAttention
