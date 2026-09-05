// Third-party Imports
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Type Imports
import type { StepperType } from './index'

const PersonalInfoStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-start gap-1'>
        <h2 className='text-2xl font-semibold'>Personal Information</h2>
        <p className='text-muted-foreground'>Enter Your Personal Information</p>
      </div>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <div className='flex flex-col items-start gap-2'>
          <Label htmlFor='multi-step-personal-info-first-name' className='leading-5'>
            First Name
          </Label>
          <Input id='multi-step-personal-info-first-name' placeholder='John' />
        </div>
        <div className='flex flex-col items-start gap-2'>
          <Label htmlFor='multi-step-personal-info-last-name' className='leading-5'>
            Last Name
          </Label>
          <Input id='multi-step-personal-info-last-name' placeholder='Doe' />
        </div>
        <div className='flex flex-col items-start gap-2'>
          <Label htmlFor='multi-step-personal-info-mobile' className='leading-5'>
            Mobile
          </Label>
          <Input id='multi-step-personal-info-mobile' placeholder='+1 (555) 123-4567' />
        </div>
        <div className='flex flex-col items-start gap-2'>
          <Label htmlFor='multi-step-personal-info-pincode' className='leading-5'>
            Pincode
          </Label>
          <Input id='multi-step-personal-info-pincode' placeholder='Postal Code' />
        </div>
        <div className='flex flex-col items-start gap-2 sm:col-span-2'>
          <Label htmlFor='multi-step-personal-info-address' className='leading-5'>
            Address
          </Label>
          <Input id='multi-step-personal-info-address' placeholder='123 Main St' />
        </div>
        <div className='flex flex-col items-start gap-2 sm:col-span-2'>
          <Label htmlFor='multi-step-personal-info-landmark' className='leading-5'>
            Landmark
          </Label>
          <Input id='multi-step-personal-info-landmark' placeholder='Near Central Park, New York' />
        </div>
        <div className='flex flex-col items-start gap-2'>
          <Label htmlFor='multi-step-personal-info-city' className='leading-5'>
            City
          </Label>
          <Input id='multi-step-personal-info-city' placeholder='New York' />
        </div>
        <div className='flex flex-col items-start gap-2'>
          <Label htmlFor='multi-step-personal-info-state' className='leading-5'>
            State
          </Label>
          <Input id='multi-step-personal-info-state' placeholder='NY' />
        </div>
      </div>
      <div className='flex justify-between gap-4'>
        <Button variant='secondary' onClick={() => stepper.navigation.prev()} disabled={stepper.state.isFirst}>
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
