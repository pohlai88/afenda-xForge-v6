// Third-party Imports
import { EllipsisVerticalIcon, ThumbsUpIcon, MessageSquareIcon } from 'lucide-react'

// Component Imports
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Util Imports
import { cn } from '@/lib/utils'

const listItems = ['Share', 'Update', 'Refresh']

const avatars = [
  {
    src: '/images/avatars/avatar-3.webp',
    fallback: 'OS',
    name: 'Olivia Sparks'
  },
  {
    src: '/images/avatars/avatar-6.webp',
    fallback: 'HL',
    name: 'Howard Lloyd'
  },
  {
    src: '/images/avatars/avatar-5.webp',
    fallback: 'HR',
    name: 'Hallie Richards'
  },
  {
    src: '/images/avatars/avatar-16.webp',
    fallback: 'JW',
    name: 'Jenny Wilson'
  }
]

const AdvertisementCard = ({ className }: { className?: string }) => {
  return (
    <Card className={cn('justify-between', className)}>
      <CardHeader className='flex justify-between'>
        <div className='flex items-center gap-4'>
          <Avatar className='size-10.5 rounded-full'>
            <AvatarImage src='/images/avatars/avatar-1.webp' alt='Hallie Richards' className='rounded-full' />
            <AvatarFallback className='text-xs'>JW</AvatarFallback>
          </Avatar>
          <div className='flex flex-col gap-1'>
            <span className='text-lg font-semibold'>Design strategy master class</span>
            <span className='text-muted-foreground text-sm'>07 Jun 2025 at 10:00 PM</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant='ghost' size='icon' className='text-muted-foreground size-6 rounded-full' />}
          >
            <EllipsisVerticalIcon />
            <span className='sr-only'>Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuGroup>
              {listItems.map((item, index) => (
                <DropdownMenuItem key={index}>{item}</DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <div className='flex flex-col gap-9'>
        <div className='relative'>
          <img src='/images/widgets/image-6.webp' alt='background image' />
          <div className='bg-card absolute -bottom-7 left-5.5 flex flex-col items-center rounded-md px-4 py-2 shadow-xl'>
            <span className='text-lg font-medium'>12</span>
            <span className='text-muted-foreground'>Dec</span>
          </div>
        </div>
        <CardContent className='space-y-2'>
          <p className='text-base'>How to improve you next design&apos;s strategy that works for user and business</p>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge className='bg-primary/10 text-primary h-6 rounded-sm px-3 py-1'>Technical</Badge>
            <Badge className='bg-primary/10 text-primary h-6 rounded-sm px-3 py-1'>User research</Badge>
            <Badge className='bg-primary/10 text-primary h-6 rounded-sm px-3 py-1'>Analytics</Badge>
          </div>
        </CardContent>
      </div>
      <CardContent className='flex items-center justify-between gap-2'>
        <AvatarGroup className='**:data-[slot=avatar]:ring-background -space-x-4 hover:space-x-1 **:data-[slot=avatar]:ring-2'>
          {avatars.map((avatar, index) => (
            <Tooltip key={index}>
              <TooltipTrigger className='transition-all duration-300 ease-in-out'>
                <Avatar className='ring-background ring-2 transition-all duration-300 ease-in-out'>
                  <AvatarImage src={avatar.src} alt={avatar.name} />
                  <AvatarFallback>{avatar.fallback}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{avatar.name}</TooltipContent>
            </Tooltip>
          ))}
        </AvatarGroup>
        <Button>Join now</Button>
      </CardContent>
      <CardContent className='flex items-center gap-4'>
        <div className='flex items-center gap-1'>
          <ThumbsUpIcon className='size-4' />
          <span className='text-sm'>56k</span>
        </div>
        <div className='flex items-center gap-1'>
          <MessageSquareIcon className='size-4' />
          <span className='text-sm'>2k</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdvertisementCard
