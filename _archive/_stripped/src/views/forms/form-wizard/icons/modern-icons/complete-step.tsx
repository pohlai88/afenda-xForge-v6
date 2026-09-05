// Component Imports
import { Button } from '@/components/ui/button'

// Type Imports
import type { StepperType } from './index'

const CompleteStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <div className='flex flex-col items-center gap-6 py-8 text-center'>
      <div className='flex flex-col gap-1'>
        <h2 className='text-xl font-semibold'>Form Submitted Successfully</h2>
        <p className='text-muted-foreground text-sm'>Thank you! Your registration has been received.</p>
      </div>
      <Button onClick={stepper.navigation.reset}>Submit Another</Button>
    </div>
  )
}

export default CompleteStep
