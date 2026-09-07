// Type Imports
import type { Consolidation } from '@/types/payroll/group-types'
import type { TimelineEvent } from '@/utils/payroll-group-attention'

// Util Imports
import { cn } from '@/lib/utils'
import { formatCount } from '@/utils/money'
import { formatDate } from '@/utils/format-datetime'
import { periodLabel } from '@/utils/payroll-group'

type Props = {
  consolidation: Consolidation
  nextPayday?: TimelineEvent
  className?: string
}

/**
 * The first thing read on the page: whether group payroll is on track.
 *
 * A band rather than a card. The page contract makes this the leading figure of the operational
 * zone, and a card would frame it as one object among the several beneath it instead of as the
 * page's opening statement.
 *
 * "On track" is defined on screen because it has to be. It means the company is neither blocked
 * nor missing from the period — the two states where somebody is at risk of not being paid. It
 * does not mean approved, and it does not mean paid; the consolidation zone below states those
 * separately, and conflating them here would be a reassuring number that cannot be checked.
 */
const GroupOnTrack = ({ consolidation, nextPayday, className }: Props) => {
  const { coverage, entityCount, headcount } = consolidation
  const blocked = coverage.byState.blocked
  const awaiting = coverage.byState.awaiting_data
  const onTrack = entityCount - blocked - awaiting

  // Neither the figure nor these tiles is coloured, and both decisions are the same decision.
  // `--warning` measures 2.28:1 on a light background, which fails even the 3:1 large-text floor,
  // so the figure would have been an accessibility defect in the most prominent position on the
  // page. It does not need the colour: "2 of 5" already reads as short, the tiles below name what
  // is missing, and Needs Attention states the same facts as work with a severity badge. Three
  // alarms on one fact is emphasis spent three times.
  const tiles: { label: string; value: string; note: string }[] = [
    { label: 'Employees', value: formatCount(headcount.unique), note: 'counted once each' },
    {
      label: 'Blocked',
      value: String(blocked),
      note: blocked === 0 ? 'nothing is blocking approval' : 'cannot be approved'
    },
    {
      label: 'Awaiting data',
      value: String(awaiting),
      note: awaiting === 0 ? 'every company has a calculation' : 'no calculation this period'
    },
    {
      label: 'Next payday',
      value: nextPayday ? formatDate(nextPayday.date) : '—',
      note: nextPayday
        ? nextPayday.days === 0
          ? 'today'
          : `in ${nextPayday.days} ${nextPayday.days === 1 ? 'day' : 'days'} · ${nextPayday.scope}`
        : 'no scheduled payday ahead'
    }
  ]

  return (
    <section aria-labelledby='group-on-track' className={cn('flex flex-col gap-5', className)}>
      <div className='flex flex-col gap-1.5'>
        <h2 id='group-on-track' className='sr-only'>
          Group payroll readiness
        </h2>

        <p className='flex flex-wrap items-baseline gap-x-3'>
          <span className='text-5xl leading-none font-semibold tracking-tight tabular-nums sm:text-6xl'>
            {onTrack}
            <span className='text-muted-foreground font-normal'> of {entityCount}</span>
          </span>
          <span className='text-lg font-medium'>companies on track</span>
        </p>

        <p className='text-muted-foreground text-sm'>
          {periodLabel(consolidation.period)} · on track means neither blocked nor awaiting data. Approval and payment
          are separate states, reported below.
        </p>
      </div>

      <dl className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {tiles.map(tile => (
          <div key={tile.label} className='bg-muted/50 flex flex-col gap-1 rounded-lg px-4 py-3'>
            <dt className='text-muted-foreground text-sm'>{tile.label}</dt>
            <dd className='text-xl font-semibold tabular-nums'>{tile.value}</dd>
            <dd className='text-muted-foreground text-xs'>{tile.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default GroupOnTrack
