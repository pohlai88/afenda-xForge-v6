'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { format } from 'date-fns'
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon } from 'lucide-react'

// Type Imports
import type { StepperType } from './index'

// Component Imports
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Util Imports
import { cn } from '@/lib/utils'

const countries = [
  { value: null, label: 'Select Country' },
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'in', label: 'India' },
  { value: 'ca', label: 'Canada' }
]

const languages = [
  { value: null, label: 'Select Language' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' }
]

const PersonalInfoStep = ({ stepper }: { stepper: StepperType }) => {
  const [birthDate, setBirthDate] = useState<Date>()
  const [birthDateOpen, setBirthDateOpen] = useState(false)

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-start gap-1'>
        <h2 className='text-base font-semibold'>Personal Info</h2>
        <p className='text-muted-foreground text-sm'>Enter Your Personal Information.</p>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-personal-first-name'>First Name</Label>
          <Input id='modern-personal-first-name' placeholder='John' />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-personal-last-name'>Last Name</Label>
          <Input id='modern-personal-last-name' placeholder='Doe' />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-personal-country'>Country</Label>
          <Select items={countries}>
            <SelectTrigger id='modern-personal-country' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {countries.map(country => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-personal-phone'>Phone No.</Label>
          <Input id='modern-personal-phone' type='tel' placeholder='+1 123 456 7890' />
        </div>
        <div className='flex flex-col gap-2'>
          <Label>Birth Date</Label>
          <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant='outline'
                  className={cn('w-full justify-start font-normal', !birthDate && 'text-muted-foreground')}
                />
              }
            >
              <CalendarIcon className='mr-2 size-4' />
              {birthDate ? format(birthDate, 'PPP') : 'Select Birth Date'}
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={birthDate}
                onSelect={date => {
                  setBirthDate(date)
                  setBirthDateOpen(false)
                }}
                captionLayout='dropdown'
                defaultMonth={birthDate}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-personal-language'>Language</Label>
          <Select items={languages}>
            <SelectTrigger id='modern-personal-language' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {languages.map(language => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='flex justify-between gap-4'>
        <Button variant='secondary' onClick={() => stepper.navigation.prev()}>
          <ArrowLeftIcon />
          Previous
        </Button>
        <Button onClick={() => stepper.navigation.next()}>
          Next
          <ArrowRightIcon />
        </Button>
      </div>
    </div>
  )
}

export default PersonalInfoStep
