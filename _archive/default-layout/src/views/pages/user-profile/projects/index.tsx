// Third-party Imports
import { EllipsisVerticalIcon, MessageCircleMoreIcon } from 'lucide-react'

// Component Imports
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// Data Imports
import { db } from '@/fake-db/pages/user-profile'

const { projectCardActions, projectCards } = db

function ProjectsCard() {
  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {projectCards.map(project => (
        <Card
          key={project.id}
          className='h-full min-h-84 justify-between transition-all hover:-translate-y-0.5 hover:shadow-md'
        >
          <CardContent className='space-y-3'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex min-w-0 items-start gap-3'>
                <div className='bg-background flex items-center justify-center rounded-full border p-1'>
                  <img src={project.logo} alt={project.title} className='size-7 rounded-full dark:hidden' />
                  <img src={project.logoDark} alt={project.title} className='hidden size-7 rounded-full dark:block' />
                </div>

                <div>
                  <h3 className='text-base font-medium'>{project.title}</h3>
                  <p className='text-muted-foreground text-sm'>Client: {project.client}</p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant='ghost' size='icon-sm' className='text-muted-foreground rounded-full' />}
                >
                  <EllipsisVerticalIcon className='size-4' />
                  <span className='sr-only'>Open {project.title} actions</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-34'>
                  <DropdownMenuGroup>
                    {projectCardActions.map(action => (
                      <DropdownMenuItem
                        key={`${project.id}-${action}`}
                        variant={action === 'Delete' ? 'destructive' : 'default'}
                      >
                        {action}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className='flex items-center justify-between gap-4'>
              <div className='bg-muted rounded-md px-3 py-2'>
                <p className='text-sm font-medium'>
                  {project.budgetSpent}
                  <span className='text-muted-foreground font-medium'>/{project.budgetTotal}</span>
                </p>
                <p className='text-muted-foreground text-sm'>Total Budget</p>
              </div>

              <div className='space-y-0.5 pt-0.5'>
                <p>
                  <span className='text-sm font-medium'>Start Date: </span>
                  {project.startDate}
                </p>
                <p>
                  <span className='text-sm font-medium'>Deadline: </span>
                  {project.deadline}
                </p>
              </div>
            </div>

            <p className='text-muted-foreground text-base'>{project.description}</p>
          </CardContent>
          <Separator />

          <CardContent className='space-y-3'>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-sm font-medium'>
                All Hours: <span className='text-muted-foreground font-medium'>{project.allHours}</span>
              </p>
              <Badge variant='outline'>{project.daysLeftLabel}</Badge>
            </div>

            <div className='flex items-center justify-between gap-3'>
              <p className='text-muted-foreground text-sm'>Tasks: {project.tasks}</p>
              <p className='text-muted-foreground text-sm'>{project.completion}% Completed</p>
            </div>

            <Progress
              value={project.completion}
              className='*:data-[slot=progress-track]:bg-primary/20 *:data-[slot=progress-track]:h-2'
            />
          </CardContent>

          <CardContent className='text-muted-foreground flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <AvatarGroup className='*:data-[slot=avatar]:ring-background -space-x-3 *:data-[slot=avatar]:ring-2'>
                {project.members.map(member => (
                  <Avatar key={`${project.id}-${member.name}`} size='sm'>
                    {member.avatar ? <AvatarImage src={member.avatar} alt={member.name} /> : null}
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
              <span className='text-sm'>{project.membersLabel}</span>
            </div>

            <div className='flex items-center gap-1 text-sm'>
              <MessageCircleMoreIcon className='size-4.5' />
              <span>{project.commentsCount}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default ProjectsCard
