// Component Imports
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'

// Type Imports
import type { StepperType } from './index'

const PublishedStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-5 flex flex-col gap-6 p-6 md:col-span-3'>
      <div className='flex flex-col items-start'>
        <h2 className='text-2xl font-semibold'>Product Published Successfully! 🎉</h2>
        <p className='text-muted-foreground'>Your product is now live on the marketplace.</p>
      </div>
      <div className='flex flex-col gap-6 rounded-lg border py-10'>
        <div className='flex flex-col items-center'>
          <h2 className='text-2xl font-semibold'>Product Submitted</h2>
          <p className='text-muted-foreground'>Thank you for your submission!</p>
        </div>
        <div className='flex justify-center'>
          <Button onClick={stepper.navigation.reset}>Reset</Button>
        </div>
      </div>
    </CardContent>
  )
}

export default PublishedStep
