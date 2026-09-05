// Type Imports
import type * as Stepperize from '@stepperize/react'

// Component Imports
import { Button } from '@/components/ui/button'

const WelcomeStep = ({ stepper, onReset }: { stepper: Stepperize.Stepper<any>; onReset: () => void }) => {
  const handleReset = () => {
    onReset()
    stepper.navigation.reset()
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-start'>
        <h2 className='text-2xl font-semibold'>Welcome Aboard! 🎉</h2>
        <p className='text-muted-foreground'>
          Your account has been successfully created. Check your email for next steps.
        </p>
      </div>
      <div className='flex flex-col gap-6 rounded-lg border py-10'>
        <div className='flex flex-col items-center'>
          <h2 className='text-2xl font-semibold'>Account Created</h2>
          <p className='text-muted-foreground'>Thank you for signing up!</p>
        </div>
        <div className='flex justify-center'>
          <Button onClick={handleReset}>Reset</Button>
        </div>
      </div>
    </div>
  )
}

export default WelcomeStep
