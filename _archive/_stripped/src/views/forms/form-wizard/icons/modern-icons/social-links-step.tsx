// Third-party Imports
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'

// Type Imports
import type { StepperType } from './index'

const SocialLinksStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-start gap-1'>
        <h2 className='text-base font-semibold'>Social Links</h2>
        <p className='text-muted-foreground text-sm'>Connect Your Social Accounts.</p>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-social-twitter'>X</Label>
          <InputGroup>
            <InputGroupAddon className='text-foreground font-normal'>https://x.com/</InputGroupAddon>
            <InputGroupInput id='modern-social-twitter' placeholder='username' />
          </InputGroup>
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-social-facebook'>Facebook</Label>
          <InputGroup>
            <InputGroupAddon className='text-foreground font-normal'>https://facebook.com/</InputGroupAddon>
            <InputGroupInput id='modern-social-facebook' placeholder='username' />
          </InputGroup>
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-social-linkedin'>LinkedIn</Label>
          <InputGroup>
            <InputGroupAddon className='text-foreground font-normal'>https://linkedin.com/</InputGroupAddon>
            <InputGroupInput id='modern-social-linkedin' placeholder='username' />
          </InputGroup>
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-social-instagram'>Instagram</Label>
          <InputGroup>
            <InputGroupAddon className='text-foreground font-normal'>https://instagram.com/</InputGroupAddon>
            <InputGroupInput id='modern-social-instagram' placeholder='username' />
          </InputGroup>
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

export default SocialLinksStep
