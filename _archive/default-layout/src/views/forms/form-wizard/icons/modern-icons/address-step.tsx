// Third-party Imports
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Type Imports
import type { StepperType } from './index'

const states = [
  { value: null, label: 'Select State' },
  { value: 'ny', label: 'New York' },
  { value: 'ca', label: 'California' },
  { value: 'tx', label: 'Texas' },
  { value: 'fl', label: 'Florida' }
]

const AddressStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-start gap-1'>
        <h2 className='text-base font-semibold'>Address</h2>
        <p className='text-muted-foreground text-sm'>Enter Your Address Details.</p>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <div className='flex flex-col gap-2 sm:col-span-2'>
          <Label htmlFor='modern-address-line'>Address</Label>
          <Textarea id='modern-address-line' placeholder='123 Main St, Apt 4B' rows={3} />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-address-landmark'>Landmark</Label>
          <Input id='modern-address-landmark' placeholder='Near Central Park' />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-address-pincode'>Pincode</Label>
          <Input id='modern-address-pincode' placeholder='10001' />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-address-city'>City</Label>
          <Input id='modern-address-city' placeholder='New York' />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-address-state'>State</Label>
          <Select items={states}>
            <SelectTrigger id='modern-address-state' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {states.map(state => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
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

export default AddressStep
