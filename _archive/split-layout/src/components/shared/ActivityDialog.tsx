import type { ReactElement } from 'react'

import { ImageIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

type Props = {
  trigger: ReactElement
  defaultOpen?: boolean
  triggerClassName?: string
}

const ActivityDialog = ({ defaultOpen = false, trigger, triggerClassName }: Props) => {
  return (
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger render={trigger} className={triggerClassName} />
      <SheetContent className='gap-0 sm:data-[side=right]:max-w-md [&>button]:top-2 [&>button>svg]:size-5'>
        <SheetHeader className='border-b py-2.25'>
          <SheetTitle className='text-lg leading-6'>Activity</SheetTitle>
          <SheetDescription hidden />
        </SheetHeader>

        <div className='overflow-y-auto'>
          <div className='flex gap-4 px-4 py-3'>
            <Avatar>
              <AvatarImage src='/images/avatars/avatar-1.webp' />
              <AvatarFallback>JL</AvatarFallback>
            </Avatar>
            <div className='flex w-full flex-col items-start gap-2.5'>
              <div className='text-muted-foreground flex flex-col items-start text-sm'>
                <p>
                  <span className='text-foreground font-semibold'>Joe Lincoln</span> mentioned you in last trends topic
                </p>
                <p>18 mins ago</p>
              </div>
              <div className='bg-muted flex flex-col gap-4 rounded-md border px-4 py-2.5'>
                <p className='text-sm font-medium'>
                  @ShadcnStudio For an expert opinion, check out what Mike has to say on this topic!
                </p>
                <InputGroup className='bg-card'>
                  <InputGroupInput placeholder='Reply' />
                  <InputGroupAddon align='inline-end'>
                    <ImageIcon className='text-muted-foreground size-4' />
                    <span className='sr-only'>Email</span>
                  </InputGroupAddon>
                </InputGroup>
              </div>
            </div>
          </div>

          <Separator />

          <div className='flex gap-4 px-4 py-3'>
            <Avatar>
              <AvatarImage src='/images/avatars/avatar-2.webp' />
              <AvatarFallback>JP</AvatarFallback>
            </Avatar>
            <div className='flex w-full flex-col items-start gap-2.5'>
              <div className='text-muted-foreground flex flex-col items-start text-sm'>
                <p>
                  <span className='text-foreground font-semibold'>Jane Perez</span> invites you to review a file
                </p>
                <p>39 mins ago</p>
              </div>
              <div className='bg-muted flex items-center gap-1 rounded-md px-1.5 py-1'>
                <img src='/images/brands/pdf-icon.webp' alt='invoices.pdf' className='h-5' />
                <span className='text-sm font-medium'>invoices.pdf</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className='flex gap-4 px-4 py-3'>
            <Avatar>
              <AvatarImage src='/images/avatars/avatar-3.webp' />
              <AvatarFallback>TH</AvatarFallback>
            </Avatar>
            <div className='flex w-full flex-col items-start gap-2.5'>
              <div className='text-muted-foreground flex flex-col items-start text-sm'>
                <p>
                  <span className='text-foreground font-semibold'>Tyler Hero</span> wants to view your design project
                </p>
                <p>1 hour ago</p>
              </div>
              <div className='bg-muted flex w-full items-center gap-4 rounded-md border px-4 py-2.5'>
                <img
                  src='/images/brands/figma-icon-with-bg.webp'
                  alt='Launcher-Uikit.fig'
                  className='size-8 rounded-sm'
                />
                <span className='text-sm font-medium'>Launcher-Uikit.fig</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className='flex gap-4 px-4 py-3'>
            <Avatar>
              <AvatarImage src='/images/avatars/avatar-5.webp' />
              <AvatarFallback>D</AvatarFallback>
            </Avatar>
            <div className='text-muted-foreground flex flex-col items-start text-sm'>
              <p>
                <span className='text-foreground font-semibold'>Denial</span> invites you to review the new design
              </p>
              <p>3 hours ago</p>
            </div>
          </div>

          <Separator />

          <div className='flex gap-4 px-4 py-3'>
            <Avatar>
              <AvatarImage src='/images/avatars/avatar-6.webp' />
              <AvatarFallback>LA</AvatarFallback>
            </Avatar>
            <div className='flex w-full flex-col items-start gap-2.5'>
              <div className='text-muted-foreground flex flex-col items-start text-sm'>
                <p>
                  <span className='text-foreground font-semibold'>Leslie Alexander</span> new tags to Web Redesign
                </p>
                <p>8 hours ago</p>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge className='bg-primary/10 text-primary rounded-sm font-normal'>Client-Request</Badge>
                <Badge className='rounded-sm bg-sky-600/10 font-normal text-sky-600 dark:bg-sky-400/10 dark:text-sky-400'>
                  Figma
                </Badge>
                <Badge className='rounded-sm bg-amber-600/10 font-normal text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'>
                  Redesign
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className='flex gap-4 px-4 py-3'>
            <Avatar>
              <AvatarImage src='/images/avatars/avatar-8.webp' />
              <AvatarFallback>M</AvatarFallback>
            </Avatar>
            <div className='text-muted-foreground flex flex-col items-start text-sm'>
              <p>
                <span className='text-foreground font-semibold'>Miya</span> invites you to review a file
              </p>
              <p>10 hours ago</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ActivityDialog
