// Type Imports
import type { PeopleSummary } from '@/types/hrm/people-types'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'
import { EMPLOYMENT_STATUS_LABELS } from '@/utils/hrm-people'

type Props = {
  summary: PeopleSummary
  className?: string
}

/**
 * The OPERATE band: who works here.
 *
 * A workbench, not an overview, so this does not lead with a 60px figure the way `/payroll` does.
 * The headcount is the largest thing on the page and stops well short of a hero number, because
 * the work here is the table underneath.
 *
 * Headcount and FTE are both shown and explicitly labelled. They are different measures — two
 * half-time employees are 2 headcount and 1.0 FTE — and a surface that shows one while a reader
 * assumes the other has told them something untrue about capacity.
 */
const PeopleHeadline = ({ summary, className }: Props) => {
  const statuses = (Object.keys(EMPLOYMENT_STATUS_LABELS) as (keyof typeof EMPLOYMENT_STATUS_LABELS)[]).filter(
    status => (summary.byStatus[status] ?? 0) > 0
  )

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle role='heading' aria-level={2}>
          Who works here
        </CardTitle>
        <CardDescription>
          Across {summary.entityCount} {summary.entityCount === 1 ? 'company' : 'companies'}
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-col gap-6'>
        <div className='flex flex-wrap items-end gap-x-10 gap-y-4'>
          <div className='flex flex-col'>
            <span className='text-4xl leading-none font-semibold tabular-nums'>{summary.headcount}</span>
            <span className='text-muted-foreground mt-1.5 text-xs'>People employed</span>
          </div>

          {/*
            FTE sits beside headcount rather than under it, at a step down in size. It is the same
            population measured differently, not a subordinate detail — and not a second focal
            point either, which is why it is not the same size.
          */}
          <div className='flex flex-col'>
            <span className='text-2xl leading-none font-medium tabular-nums'>{summary.fte.toFixed(1)}</span>
            <span className='text-muted-foreground mt-1.5 text-xs'>Full-time equivalent</span>
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          {statuses.map(status => (
            <div key={status} className='flex items-baseline justify-between gap-4 text-sm'>
              <span className='text-muted-foreground'>{EMPLOYMENT_STATUS_LABELS[status]}</span>
              <span className='tabular-nums'>{summary.byStatus[status]}</span>
            </div>
          ))}
        </div>

        {/*
          The reason compensation is never totalled anywhere on this page, said once where the
          figures are rather than as a footnote under the table nobody scrolls to.
        */}
        {summary.currencies.length > 1 && (
          <p className='text-muted-foreground border-t pt-4 text-xs'>
            Salaries are held in {summary.currencies.join(', ')}. Pay is not totalled across companies — filter to one
            company to compare like for like.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default PeopleHeadline
