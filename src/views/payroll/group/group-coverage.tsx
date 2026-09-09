// Next Imports
import Link from 'next/link'

// Third-party Imports
import { CheckCircle2Icon, TriangleAlertIcon } from 'lucide-react'

// Type Imports
import type { Coverage } from '@/types/payroll/group-types'

// Component Imports
import { Progress } from '@/components/ui/progress'

// Util Imports
import { cn } from '@/lib/utils'
import { formatCount, formatMoney } from '@/utils/money'

type Props = {
  coverage: Coverage

  /** What is incomplete, e.g. 'group total', 'selection total', 'these shares'. */
  subject?: string

  /** 'line' is the one-liner beside a figure; 'block' adds the three measures and a bar. */
  variant?: 'line' | 'block'
  className?: string
}

const listNames = (names: string[]) => {
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`

  return `${names.length} entities`
}

/**
 * What a consolidated figure includes, stated beside the figure rather than beneath the card.
 *
 * This is the one component that must never be optional. A total whose coverage is a footnote is
 * a total that gets quoted without it, and the whole point of this surface is that a group number
 * carries what went into it wherever it goes.
 */
const GroupCoverage = ({ coverage, subject = 'group total', variant = 'line', className }: Props) => {
  const { entities, employees, expectedCost, complete } = coverage
  const missingNames = entities.missing.map(item => item.entityName)

  const line = complete ? (
    <p className={cn('text-muted-foreground flex items-center gap-1.5 text-sm', className)}>
      <CheckCircle2Icon className='size-4 shrink-0' aria-hidden='true' />
      All {entities.total} entities included
    </p>
  ) : (
    <p role='status' className={cn('text-warning-strong flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm', className)}>
      <TriangleAlertIcon className='size-4 shrink-0' aria-hidden='true' />
      <span>
        {entities.included} of {entities.total} entities included
      </span>
      <span aria-hidden='true'>·</span>
      <span>
        {entities.missing.length <= 2 ? (
          entities.missing.map((item, index) => (
            <span key={item.entityId}>
              {index > 0 && ' and '}
              <Link href={`/payroll/entities/${item.entityId}`} className='underline underline-offset-4'>
                {item.entityName}
              </Link>
            </span>
          ))
        ) : (
          <span>{listNames(missingNames)}</span>
        )}{' '}
        awaiting data
      </span>
      <span aria-hidden='true'>·</span>
      <span>current {subject} is incomplete</span>
    </p>
  )

  if (variant === 'line') return line

  // The block form answers the question one count cannot: is the gap material? Missing a dormant
  // company and missing the largest business unit are both "4 of 5".
  return (
    <div className='flex flex-col gap-3'>
      {line}
      <Progress
        value={(entities.included / Math.max(1, entities.total)) * 100}
        aria-label={`${entities.included} of ${entities.total} entities included`}
      />
      <dl className='grid gap-3 sm:grid-cols-3'>
        <div className='flex flex-col gap-0.5'>
          <dt className='text-muted-foreground text-xs'>Entity coverage</dt>
          <dd className='text-sm font-medium tabular-nums'>
            {entities.included} of {entities.total}
          </dd>
        </div>
        <div className='flex flex-col gap-0.5'>
          <dt className='text-muted-foreground text-xs'>Employee coverage</dt>
          <dd className='text-sm font-medium tabular-nums'>
            {employees.percent.toFixed(0)}%
            <span className='text-muted-foreground ml-1 font-normal'>
              of {formatCount(employees.expected)}
            </span>
          </dd>
        </div>
        <div className='flex flex-col gap-0.5'>
          <dt className='text-muted-foreground text-xs'>Expected cost covered</dt>
          <dd className='text-sm font-medium tabular-nums'>
            {expectedCost.percent.toFixed(0)}%
            <span className='text-muted-foreground ml-1 font-normal'>of {formatMoney(expectedCost.expected)}</span>
          </dd>
        </div>
      </dl>
      <p className='text-muted-foreground text-xs'>
        Expected employees and cost are last period&apos;s, which is the only expectation the domain can prove.
      </p>
    </div>
  )
}

export default GroupCoverage
