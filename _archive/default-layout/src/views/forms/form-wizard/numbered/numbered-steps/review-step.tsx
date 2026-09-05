// Third-party Imports
import { ArrowLeftIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

// Type Imports
import type { StepperType } from '@/views/forms/form-wizard/numbered/numbered-steps'

const ReviewStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-4 flex flex-col gap-5 p-6 md:col-span-3'>
      <div>
        <h3 className='font-semibold'>Review Invitation</h3>
        <p className='text-muted-foreground text-sm'>Confirm the details before sending the invite</p>
      </div>

      <div className='bg-muted/40 flex flex-col gap-3 rounded-lg border p-4 text-sm'>
        <div className='flex justify-between gap-4'>
          <span className='text-muted-foreground'>Name</span>
          <span className='font-medium'>Alex Morgan</span>
        </div>
        <Separator />
        <div className='flex justify-between gap-4'>
          <span className='text-muted-foreground'>Email</span>
          <span className='font-medium'>alex@company.com</span>
        </div>
        <Separator />
        <div className='flex justify-between gap-4'>
          <span className='text-muted-foreground'>Role</span>
          <span className='font-medium'>Admin</span>
        </div>
        <Separator />
        <div className='flex justify-between gap-4'>
          <span className='text-muted-foreground'>Department</span>
          <span className='font-medium'>Operations</span>
        </div>
        <Separator />
        <div className='flex justify-between gap-4'>
          <span className='text-muted-foreground'>Modules</span>
          <span className='text-right font-medium'>Dashboard, Users, Analytics, Settings</span>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Switch id='confirm-invite' />
        <Label htmlFor='confirm-invite' className='text-sm font-normal'>
          I confirm this user should be added to the admin panel
        </Label>
      </div>

      <div className='flex justify-between gap-3'>
        <Button variant='secondary' onClick={() => stepper.navigation.prev()}>
          <ArrowLeftIcon />
          Back
        </Button>
        <Button onClick={() => stepper.navigation.next()}>Send Invite</Button>
      </div>
    </CardContent>
  )
}

export default ReviewStep
