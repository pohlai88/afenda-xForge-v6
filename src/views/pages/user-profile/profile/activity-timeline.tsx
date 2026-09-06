// Third-party Imports
import { ChartNoAxesColumnIncreasingIcon, FileIcon, FileSpreadsheetIcon, FileTextIcon, ImageIcon } from 'lucide-react'

// Type Imports
import type { ActivityFileType, UserActivityItem } from '@/types/pages/user-profile-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine
} from '@/components/ui/timeline'

// Util Imports
import { cn } from '@/lib/utils'

const ATTACHMENT_FILE_ICONS: Record<ActivityFileType, typeof FileTextIcon> = {
  pdf: FileTextIcon,
  image: ImageIcon,
  doc: FileIcon,
  excel: FileSpreadsheetIcon
}

const ATTACHMENT_BADGE_STYLES: Record<ActivityFileType, string> = {
  // File types are categories, not statuses: a PDF is not an error and a spreadsheet is not a
  // success. chart-1..4 is the categorical palette — its job is mutual distinguishability, which
  // is exactly what is wanted here. The icon and filename already identify the type, so colour is
  // reinforcement rather than the signal, and losing the red-means-PDF convention costs nothing.
  pdf: 'border-chart-1 text-chart-1',
  image: 'border-chart-2 text-chart-2',
  doc: 'border-chart-3 text-chart-3',
  excel: 'border-chart-4 text-chart-4'
}

function ActivityAttachment({ attachment }: { attachment: NonNullable<UserActivityItem['attachment']> }) {
  const FileIconComponent = ATTACHMENT_FILE_ICONS[attachment.fileType]

  return (
    <Badge
      variant='outline'
      className={cn('h-auto gap-1.5 rounded-sm px-2 py-1 font-normal', ATTACHMENT_BADGE_STYLES[attachment.fileType])}
    >
      <FileIconComponent className='size-3.5' />
      {attachment.name}
    </Badge>
  )
}

function ActivityPersonCard({ person }: { person: NonNullable<UserActivityItem['person']> }) {
  return (
    <div className='bg-muted/50 flex w-fit max-w-sm items-center gap-3 rounded-md border px-3 py-2.5'>
      <Avatar className='size-8'>
        {person.avatar ? <AvatarImage src={person.avatar} alt={person.name} /> : null}
        <AvatarFallback className='text-xs'>{person.initials}</AvatarFallback>
      </Avatar>
      <div className='min-w-0'>
        <p className='truncate text-sm font-semibold'>{person.name}</p>
        {person.role ? <p className='text-muted-foreground truncate text-xs'>{person.role}</p> : null}
      </div>
    </div>
  )
}

function ActivityTeamAvatars({
  teamMembers,
  teamExtraCount
}: {
  teamMembers: NonNullable<UserActivityItem['teamMembers']>
  teamExtraCount?: number
}) {
  const visibleMembers = teamMembers.slice(0, 3)

  return (
    <AvatarGroup>
      {visibleMembers.map((member, index) => (
        <Avatar key={`${member.name}-${index}`} className='ring-background ring-2' size='sm'>
          {member.avatar ? <AvatarImage src={member.avatar} alt={member.name} /> : null}
          <AvatarFallback className='text-[10px]'>{member.initials}</AvatarFallback>
        </Avatar>
      ))}
      {teamExtraCount ? <AvatarGroupCount>+{teamExtraCount}</AvatarGroupCount> : null}
    </AvatarGroup>
  )
}

export interface ActivityTimelineProps {
  activityLog: UserActivityItem[]
  className?: string
}

export const ActivityTimeline = ({ activityLog, className }: ActivityTimelineProps) => {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <Card>
        <CardHeader className='flex items-center gap-2'>
          <ChartNoAxesColumnIncreasingIcon />
          <h2 className='text-lg font-medium'>Activity Timeline</h2>
        </CardHeader>
        <CardContent>
          <Timeline>
            {activityLog.map((item, index) => {
              const isLast = index === activityLog.length - 1

              return (
                <TimelineItem key={item.id} status='done' className='gap-x-0'>
                  <TimelineDot
                    status='custom'
                    className='bg-primary/20 flex size-4.5 shrink-0 items-center justify-center rounded-full'
                  >
                    <span className='bg-primary size-3 rounded-full' />
                  </TimelineDot>
                  {!isLast && <TimelineLine done className='bg-muted min-h-10' />}
                  <TimelineHeading className='text-foreground flex w-full items-center justify-between pt-2.5 pb-2 pl-4 text-base font-medium text-wrap'>
                    {item.description}
                    <span className='text-muted-foreground text-xs font-normal text-nowrap md:text-sm'>
                      {item.timestamp}
                    </span>
                  </TimelineHeading>
                  {item.detail || item.attachment || item.person || (item.teamMembers && item.teamMembers.length) ? (
                    <TimelineContent className='flex flex-col gap-2 pb-3 pl-4'>
                      {item.detail ? <span className='text-muted-foreground text-sm'>{item.detail}</span> : null}
                      {item.attachment ? <ActivityAttachment attachment={item.attachment} /> : null}
                      {item.person ? <ActivityPersonCard person={item.person} /> : null}
                      {item.teamMembers?.length ? (
                        <ActivityTeamAvatars teamMembers={item.teamMembers} teamExtraCount={item.teamExtraCount} />
                      ) : null}
                    </TimelineContent>
                  ) : null}
                </TimelineItem>
              )
            })}
          </Timeline>
        </CardContent>
      </Card>
    </div>
  )
}

export default ActivityTimeline
