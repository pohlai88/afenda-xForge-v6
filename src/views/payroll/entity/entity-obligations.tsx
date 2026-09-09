// Next Imports
import Link from 'next/link'

// Third-party Imports
import { BanknoteIcon, FileTextIcon, ScissorsIcon } from 'lucide-react'

// Type Imports
import type { IsoDate } from '@/types/common/primitive-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/payroll-workspace'

/**
 * One dated obligation of this company.
 *
 * Three kinds, and no more, because three is what the domain stores. An input cut-off and a pay
 * date come from the payroll calendar; a statutory due date comes from a filing record. Approval,
 * funding and close deadlines are not stored anywhere — they are contract gap P01-GAP-002 — and a
 * deadline someone could miss is the last thing to invent.
 */
export type ObligationRow = {
  id: string
  kind: 'cutoff' | 'payday' | 'statutory'
  label: string
  date: IsoDate

  /** Days from the server clock, computed once by the caller. Negative is overdue. */
  days: number
  href: string
}

const KIND_ICONS = {
  cutoff: ScissorsIcon,
  payday: BanknoteIcon,
  statutory: FileTextIcon
} as const

/** Within this many days is close enough to colour. Matches the run queue's own threshold. */
const SOON = 3

type Props = {
  rows: ObligationRow[]

  /** True when this company has no entity-scoped filing evidence, so the statutory rows are absent. */
  statutoryUnavailable?: boolean
  className?: string
}

/**
 * What is dated for this company and how close it is.
 *
 * Not a timeline and not a calendar. A month grid spends most of its area on days when nothing
 * happens, and the question is not what the month looks like — it is what falls due next. Each
 * row keeps its own business name: a cut-off is not a payday and neither is a filing due date, so
 * they are never flattened into a single word like "deadlines".
 */
const EntityObligations = ({ rows, statutoryUnavailable, className }: Props) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
        What is dated
      </CardTitle>
      <CardDescription>Cut-offs, paydays and statutory due dates for this company</CardDescription>
    </CardHeader>

    <CardContent className='flex flex-1 flex-col gap-4'>
      {rows.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          No cut-off, payday or filing falls after today for this company.
        </p>
      ) : (
        <ol className='flex flex-col'>
          {rows.map(row => {
            const Icon = KIND_ICONS[row.kind]
            const urgent = row.days <= SOON

            return (
              <li key={row.id}>
                {/* The whole row is the control. A 20px inline link is below the pointer minimum,
                    and the row is what a reader aims at anyway. */}
                <Button
                  variant='ghost'
                  render={<Link href={row.href} />}
                  nativeButton={false}
                  className='h-auto w-full flex-wrap items-start justify-start gap-x-3 gap-y-1 px-2 py-2.5 text-left font-normal'
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md',
                      urgent ? 'bg-warning/15 text-warning-strong' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className='size-4' aria-hidden='true' />
                  </span>

                  <span className='flex min-w-0 flex-1 flex-col'>
                    <span className='text-sm font-medium'>{row.label}</span>
                    <span className='text-muted-foreground text-xs tabular-nums'>{formatDate(row.date)}</span>
                  </span>

                  <span
                    className={cn(
                      'shrink-0 text-xs tabular-nums',
                      urgent ? 'text-warning-strong' : 'text-muted-foreground'
                    )}
                  >
                    {row.days === 0 ? 'today' : `in ${row.days} ${row.days === 1 ? 'day' : 'days'}`}
                  </span>
                </Button>
              </li>
            )
          })}
        </ol>
      )}

      <p className='text-muted-foreground mt-auto text-xs'>
        Approval, funding and close deadlines are not stored by the payroll calendar, so they are not shown.
        {statutoryUnavailable && ' Statutory due dates are shown for the runs this company has, not company-wide.'}
      </p>
    </CardContent>
  </Card>
)

export default EntityObligations
