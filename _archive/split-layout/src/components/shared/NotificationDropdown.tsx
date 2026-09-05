import type { ReactElement } from 'react'

import { SettingsIcon, XIcon, LinkIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'

type Props = {
  trigger: ReactElement
  defaultOpen?: boolean
  align?: 'start' | 'center' | 'end'
}

const NotificationDropdown = ({ trigger, defaultOpen, align = 'end' }: Props) => {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent className='w-full max-w-xs sm:max-w-122' align={align || 'end'}>
        <Tabs defaultValue='inbox' className='gap-0'>
          <DropdownMenuGroup>
            <DropdownMenuLabel className='flex flex-col pb-0'>
              <div className='flex items-center justify-between gap-6 pb-2.5'>
                <span className='text-muted-foreground text-sm font-normal uppercase'>Notifications</span>
                <Badge variant='secondary' className='bg-primary/10 text-primary font-normal'>
                  8 New
                </Badge>
              </div>
              <div className='-mb-0.5 flex items-center justify-between gap-4'>
                <TabsList variant='line'>
                  <TabsTrigger value='inbox' className='group-data-horizontal/tabs:after:-bottom-1'>
                    Inbox
                  </TabsTrigger>
                  <TabsTrigger value='general' className='group-data-horizontal/tabs:after:-bottom-1'>
                    General
                  </TabsTrigger>
                </TabsList>
                <a href='#'>
                  <SettingsIcon className='text-foreground size-5' />
                </a>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className='mt-0 h-0.5' />

          <TabsContent value='inbox'>
            <DropdownMenuItem className='gap-3 px-2 py-3 text-base not-data-[variant=destructive]:focus:**:text-[revert-rule]'>
              <Avatar className='size-9.5'>
                <AvatarImage src='/images/avatars/avatar-19.webp' />
                <AvatarFallback>MB</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Mark Bush</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>12 Minutes ago</span>
                  <div className='bg-primary/30 size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New post</span>
                </div>
              </div>
              <div className='flex flex-col items-center gap-3'>
                <XIcon className='text-foreground size-3.5' />
                <div className='bg-primary size-1.5 rounded-full' />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-3 px-2 py-3 text-base not-data-[variant=destructive]:focus:**:text-[revert-rule]'>
              <Avatar className='size-9.5'>
                <AvatarImage src='/images/avatars/avatar-5.webp' />
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Aaron Black</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>27 Minutes ago</span>
                  <div className='bg-primary/30 size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New comment</span>
                </div>
              </div>
              <div className='flex flex-col items-center gap-3'>
                <XIcon className='text-foreground size-3.5' />
                <div className='bg-primary size-1.5 rounded-full' />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='items-start gap-3 px-2 py-3 text-base not-data-[variant=destructive]:focus:**:text-[revert-rule]'>
              <Avatar className='size-9.5'>
                <AvatarImage src='/images/avatars/avatar-2.webp' />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Anna has applied to create an ad for your campaign</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>2 hours ago</span>
                  <div className='bg-primary/30 size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New request for campaign</span>
                </div>
                <div className='mt-3 flex items-center gap-4'>
                  <Button variant='secondary' size='sm'>
                    Decline
                  </Button>
                  <Button className='text-primary-foreground!' size='sm'>
                    Accept
                  </Button>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='items-start gap-3 px-2 py-3 text-base not-data-[variant=destructive]:focus:**:text-[revert-rule]'>
              <Avatar className='size-9.5'>
                <AvatarImage src='/images/avatars/avatar-3.webp' />
                <AvatarFallback>J</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Jason attached the file</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>6 hours ago</span>
                  <div className='bg-primary/30 size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>Attached files</span>
                </div>
                <div className='mt-3 flex items-center gap-1.5'>
                  <LinkIcon className='text-foreground' />
                  <span className='text-sm'>Work examples.com</span>
                </div>
              </div>
            </DropdownMenuItem>
          </TabsContent>

          <TabsContent value='general'>
            <DropdownMenuItem className='gap-3 px-2 py-3 text-base not-data-[variant=destructive]:focus:**:text-[revert-rule]'>
              <Avatar className='size-9.5'>
                <AvatarImage src='/images/avatars/avatar-7.webp' />
                <AvatarFallback>FC</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Fred Campbell</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>39 Minutes ago</span>
                  <div className='bg-primary/30 size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New comment</span>
                </div>
              </div>
              <div className='flex flex-col items-center gap-3'>
                <XIcon className='text-foreground size-3.5' />
                <div className='bg-primary size-1.5 rounded-full' />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='items-start gap-3 px-2 py-3 text-base not-data-[variant=destructive]:focus:**:text-[revert-rule]'>
              <Avatar className='size-9.5'>
                <AvatarImage src='/images/avatars/avatar-15.webp' />
                <AvatarFallback>S</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Scott attached the file</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>3 hours ago</span>
                  <div className='bg-primary/30 size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>Attached files</span>
                </div>
                <div className='mt-3 flex items-center gap-1.5'>
                  <LinkIcon className='text-foreground' />
                  <span className='text-sm'>Work examples.com</span>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-3 px-2 py-3 text-base not-data-[variant=destructive]:focus:**:text-[revert-rule]'>
              <Avatar className='size-9.5'>
                <AvatarImage src='/images/avatars/avatar-11.webp' />
                <AvatarFallback>HL</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Harold Larson</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>5 hours ago</span>
                  <div className='bg-primary/30 size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New post</span>
                </div>
              </div>
              <div className='flex flex-col items-center gap-3'>
                <XIcon className='text-foreground size-3.5' />
                <div className='bg-primary size-1.5 rounded-full' />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='items-start gap-3 px-2 py-3 text-base not-data-[variant=destructive]:focus:**:text-[revert-rule]'>
              <Avatar className='size-9.5'>
                <AvatarImage src='/images/avatars/avatar-6.webp' />
                <AvatarFallback>R</AvatarFallback>
              </Avatar>
              <div className='flex w-full flex-col items-start'>
                <span className='text-base font-medium'>Rosie has applied to create an ad for your campaign</span>
                <div className='flex items-center gap-2.5'>
                  <span className='text-muted-foreground text-sm'>8 hours ago</span>
                  <div className='bg-primary/30 size-1.5 rounded-full' />
                  <span className='text-muted-foreground text-sm'>New request for campaign</span>
                </div>
                <div className='mt-3 flex items-center gap-4'>
                  <Button variant='secondary' size='sm'>
                    Decline
                  </Button>
                  <Button className='text-primary-foreground!' size='sm'>
                    Accept
                  </Button>
                </div>
              </div>
            </DropdownMenuItem>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationDropdown
