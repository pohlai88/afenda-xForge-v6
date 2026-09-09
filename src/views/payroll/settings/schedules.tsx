// Type Imports
import type { PayGroup, PaySchedule } from '@/types/payroll/settings-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SettingsSection from './settings-section'

// Util Imports
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/payroll-workspace'

const STATUS_LABELS: Record<PaySchedule['status'], string> = {
  closed: 'Closed',
  open: 'Open',
  upcoming: 'Upcoming'
}

const STATUS_STYLES: Record<PaySchedule['status'], string> = {
  closed: 'bg-muted text-muted-foreground',
  open: 'bg-info/10 text-info-strong',
  upcoming: 'bg-muted text-foreground'
}

type Props = {
  schedules: PaySchedule[]
  payGroups: PayGroup[]
}

/** The calendar: one row per period, so the next four paydays are readable at a glance. */
const ScheduleSettings = ({ schedules, payGroups }: Props) => {
  const groupNames = new Map(payGroups.map(g => [g.id, g.name]))

  return (
    <SettingsSection
      title='Pay schedule'
      description='Generated from each pay group’s payday rule. Move a date here when a holiday or bank closure gets in the way.'
      wide
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='h-9 pl-6 text-xs'>Period</TableHead>
            <TableHead className='h-9 text-xs'>Pay group</TableHead>
            <TableHead className='h-9 text-xs'>Period dates</TableHead>
            <TableHead className='h-9 text-xs'>Inputs close</TableHead>
            <TableHead className='h-9 text-xs'>Payday</TableHead>
            <TableHead className='h-9 pr-6 text-xs'>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map(schedule => (
            <TableRow key={schedule.id} data-state={schedule.status === 'open' ? 'selected' : undefined}>
              <TableCell className='py-2 pl-6 font-medium'>{schedule.label}</TableCell>
              <TableCell className='text-muted-foreground py-2'>{groupNames.get(schedule.payGroupId)}</TableCell>
              <TableCell className='text-muted-foreground py-2 tabular-nums'>
                {formatDate(schedule.periodStart)} – {formatDate(schedule.periodEnd)}
              </TableCell>
              <TableCell className='py-2 tabular-nums'>{formatDate(schedule.cutoff)}</TableCell>
              <TableCell className='py-2 font-medium tabular-nums'>{formatDate(schedule.payDate)}</TableCell>
              <TableCell className='py-2 pr-6'>
                <Badge className={cn('text-xs', STATUS_STYLES[schedule.status])}>
                  {STATUS_LABELS[schedule.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SettingsSection>
  )
}

export default ScheduleSettings
