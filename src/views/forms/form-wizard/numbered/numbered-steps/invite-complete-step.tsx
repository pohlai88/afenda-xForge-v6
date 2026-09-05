// Component Imports
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'

// Type Imports
import type { StepperType } from '@/views/forms/form-wizard/numbered/numbered-steps'

const InviteCompleteStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-5 flex flex-col gap-6 p-6 md:col-span-3'>
      <div className='flex flex-col items-start'>
        <h2 className='text-2xl font-semibold'>Invitation Sent Successfully! 🎉</h2>
        <p className='text-muted-foreground'>
          Alex Morgan will receive an invite at alex@company.com with Admin access to Operations.
        </p>
      </div>
      <div className='flex flex-col gap-6 rounded-lg border py-10'>
        <div className='flex flex-col items-center'>
          <h2 className='text-2xl font-semibold'>Invite Sent</h2>
          <p className='text-muted-foreground'>Thank you for sending the invitation!</p>
        </div>
        <div className='flex justify-center'>
          <Button onClick={stepper.navigation.reset}>Invite Another User</Button>
        </div>
      </div>
    </CardContent>
  )
}

export default InviteCompleteStep
