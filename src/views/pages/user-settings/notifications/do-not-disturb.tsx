'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { BellIcon, BellOffIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// Util Imports
import { cn } from '@/lib/utils'

const DoNotDisturb = () => {
  const [isDark, setIsDark] = useState(false)

  return (
    <Card className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <CardContent className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>Do Not Disturb</h3>
        <p className='text-muted-foreground text-sm'>Adjust your Do Not Disturb settings and preferences.</p>
      </CardContent>

      {/* Content */}
      <CardContent className='space-y-4 lg:col-span-2'>
        <Card>
          <CardContent className='flex flex-wrap items-center gap-4'>
            <div className='flex flex-col gap-3'>
              <Label className='px-1'>Notifications</Label>
              <Button
                variant='outline'
                onClick={() => setIsDark(!isDark)}
                aria-label='Toggle dark mode'
                className={cn(
                  isDark
                    ? 'border-info text-info-strong! hover:bg-info/10 focus-visible:border-info focus-visible:ring-info/20!'
                    : ''
                )}
              >
                {isDark ? <BellOffIcon /> : <BellIcon />}
                {isDark ? 'Disable Notifications' : 'Enable Notifications'}
              </Button>
            </div>
            <div className='flex gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='time-from' className='px-1'>
                  From
                </Label>
                <Input
                  type='time'
                  id='time-from'
                  step='1'
                  defaultValue='01:30:00'
                  className='appearance-none max-sm:text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='time-to' className='px-1'>
                  To
                </Label>
                <Input
                  type='time'
                  id='time-to'
                  step='1'
                  defaultValue='02:30:00'
                  className='appearance-none max-sm:text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                />
              </div>
            </div>
          </CardContent>
          <CardContent>
            <Separator />
          </CardContent>
          <CardContent className='flex w-full flex-col gap-3'>
            <Label className='px-1'>Do not disturb me on my days off</Label>
            <div className='col-span-2 md:col-span-3'>
              <ToggleGroup
                defaultValue={['saturday']}
                multiple
                className='*:data-[slot=toggle-group-item]:bg-muted *:aria-[pressed=true]:bg-primary! *:aria-[pressed=true]:text-primary-foreground gap-2 *:data-[slot=toggle-group-item]:rounded-full!'
              >
                <ToggleGroupItem value='sunday'>S</ToggleGroupItem>
                <ToggleGroupItem value='monday'>M</ToggleGroupItem>
                <ToggleGroupItem value='tuesday'>T</ToggleGroupItem>
                <ToggleGroupItem value='wednesday'>W</ToggleGroupItem>
                <ToggleGroupItem value='thursday'>T</ToggleGroupItem>
                <ToggleGroupItem value='friday'>F</ToggleGroupItem>
                <ToggleGroupItem value='saturday'>S</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

export default DoNotDisturb
