'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { ChevronDownIcon } from 'lucide-react'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const PersonalInfoStep = () => {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex gap-6 max-sm:flex-col sm:items-center'>
        <Avatar className='size-23 shrink-0 rounded-lg after:border-0'>
          <AvatarImage src='/images/avatars/avatar-1.webp' alt='john doe' className='rounded-lg' />
          <AvatarFallback className='text-xs'>JD</AvatarFallback>
        </Avatar>

        <div className='grid flex-1 grid-cols-2 gap-4'>
          <Input type='text' placeholder='Employee name' />
          <Input type='text' placeholder='Designation' />
          <Input type='email' placeholder='employee@mail.com' className='col-span-2' />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='space-y-1'>
          <Label htmlFor='division' className='leading-5'>
            Division
          </Label>
          <Input id='division' type='text' placeholder='e.g. Sales' />
        </div>

        <div>
          <Label htmlFor='gender' className='mb-1 leading-5'>
            Gender
          </Label>
          <Select>
            <SelectTrigger id='gender' className='w-full'>
              <SelectValue placeholder='Select a gender' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value='male'>Male</SelectItem>
                <SelectItem value='female'>Female</SelectItem>
                <SelectItem value='other'>Other</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1'>
          <Label htmlFor='age' className='leading-5'>
            Age
          </Label>
          <Input id='age' type='number' placeholder='e.g. 30' />
        </div>

        <div className='space-y-1'>
          <Label htmlFor='city' className='leading-5'>
            City
          </Label>
          <Input id='city' type='text' placeholder='e.g. New York' />
        </div>

        <div className='space-y-1'>
          <Label htmlFor='emp-id' className='leading-5'>
            Employee ID
          </Label>
          <Input id='emp-id' type='text' placeholder='e.g. EMP-254875269-54214' />
        </div>

        <div className='space-y-1'>
          <Label htmlFor='address' className='leading-5'>
            Address
          </Label>
          <Input id='address' type='text' placeholder='e.g. 123 Main St, City, Country' />
        </div>

        <div className='space-y-1'>
          <Label htmlFor='phone' className='leading-5'>
            Phone Number
          </Label>
          <Input id='phone' type='tel' maxLength={10} placeholder='e.g. 9868666480' />
        </div>

        <div className='space-y-1'>
          <Label htmlFor='joining-date' className='leading-5'>
            Joining Date
          </Label>
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger
              render={<Button variant='outline' id='joining-date' className='w-full justify-between font-normal' />}
            >
              {date ? date.toLocaleDateString('en-US') : <span className='text-muted-foreground'>Joining date</span>}
              <ChevronDownIcon />
            </PopoverTrigger>
            <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
              <Calendar
                mode='single'
                selected={date}
                onSelect={date => {
                  setDate(date)
                  setDatePopoverOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className='space-y-1 sm:col-span-2'>
          <Label htmlFor='onboarding-workspace-description' className='leading-5'>
            Description <span className='text-muted-foreground font-normal'>(optional)</span>
          </Label>
          <Textarea
            id='onboarding-workspace-description'
            placeholder='What does your team work on?'
            className='min-h-24'
          />
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoStep
