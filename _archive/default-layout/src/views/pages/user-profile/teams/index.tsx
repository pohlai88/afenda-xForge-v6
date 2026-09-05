// Third-party Imports
import { EllipsisVerticalIcon, StarIcon } from 'lucide-react'

// Component Imports
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@/components/ui/avatar'
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

// Data Imports
import { db } from '@/fake-db/pages/user-profile'

const { teamCardActions, teamCards } = db

function TeamsCard() {
  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
      {teamCards.map(team => (
        <Card key={team.id} className='transition-all hover:-translate-y-0.5 hover:shadow-md'>
          <CardContent className='flex items-start justify-between gap-3'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='bg-background flex items-center justify-center rounded-full border p-1'>
                <img src={team.avatar} alt={team.title} className='size-7 rounded-full dark:hidden' />
                <img src={team.avatarDark} alt={team.title} className='hidden size-7 rounded-full dark:block' />
              </div>
              <h3 className='text-base font-medium'>{team.title}</h3>
            </div>

            <div className='flex items-center'>
              <Button variant='ghost' size='icon' className='text-muted-foreground'>
                <StarIcon className='size-4' />
                <span className='sr-only'>Favorite {team.title}</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant='ghost' size='icon' className='text-muted-foreground rounded-full' />}
                >
                  <EllipsisVerticalIcon className='size-4' />
                  <span className='sr-only'>Open {team.title} actions</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-40'>
                  <DropdownMenuGroup>
                    {teamCardActions.map(action => (
                      <DropdownMenuItem key={action} variant={action === 'Delete' ? 'destructive' : 'default'}>
                        {action}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
          <CardContent>
            <p className='text-muted-foreground text-base'>{team.description}</p>
          </CardContent>

          <CardContent className='mt-auto flex items-center justify-between gap-4'>
            <AvatarGroup className='*:data-[slot=avatar]:ring-background -space-x-3 *:data-[slot=avatar]:ring-2'>
              {team.members.map(member => (
                <Avatar key={`${team.id}-${member.name}`}>
                  {member.avatar ? <AvatarImage src={member.avatar} alt={member.name} /> : null}
                  <AvatarFallback>{member.initials}</AvatarFallback>
                </Avatar>
              ))}
              {team.extraMembersCount ? <AvatarGroupCount>+{team.extraMembersCount}</AvatarGroupCount> : null}
            </AvatarGroup>

            <div className='flex flex-wrap items-center justify-end gap-2'>
              {team.tags.map(tag => (
                <Badge key={`${team.id}-${tag.label}`} variant='outline' className='h-6 px-3 py-1'>
                  {tag.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default TeamsCard
