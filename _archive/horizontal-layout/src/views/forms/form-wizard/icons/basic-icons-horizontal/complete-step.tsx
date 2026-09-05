// Component Imports
import { Button } from '@/components/ui/button'

// Type Imports
import type { StepperType } from './index'

const CompleteStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <div className='flex flex-col gap-6 rounded-lg border py-8'>
      <div className='flex flex-col items-center'>
        <h2 className='text-2xl font-semibold'>Form Submitted</h2>
        <p className='text-muted-foreground'>Thank you for your submission!</p>
      </div>
      <div className='flex justify-center'>
        <Button onClick={stepper.navigation.reset}>Reset</Button>
      </div>
    </div>
  )
}

export default CompleteStep
