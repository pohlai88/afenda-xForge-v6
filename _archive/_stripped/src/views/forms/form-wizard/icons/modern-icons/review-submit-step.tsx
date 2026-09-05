// Third-party Imports
import { ArrowLeftIcon } from 'lucide-react'

// Type Imports
import type { StepperType } from './index'

// Component Imports
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

// SVG Imports
import MultiStepReviewCompleteSVG from '@/assets/svg/review-complete'

const reviewSections = [
  {
    title: 'Account Details',
    items: [
      { label: 'Username', value: 'johndoe' },
      { label: 'Email', value: 'john.doe@email.com' }
    ]
  },
  {
    title: 'Personal Info',
    items: [
      { label: 'Name', value: 'John Doe' },
      { label: 'Phone', value: '+1 123 456 7890' },
      { label: 'Country', value: 'United States' }
    ]
  },
  {
    title: 'Address',
    items: [{ label: 'Delivery Address', value: '123 Main St, New York, NY 10001' }]
  },
  {
    title: 'Social Links',
    items: [
      { label: 'X', value: 'x.com/johndoe' },
      { label: 'Facebook', value: 'facebook.com/johndoe' },
      { label: 'LinkedIn', value: 'linkedin.com/in/johndoe' }
    ]
  }
]

const ReviewSubmitStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <div className='flex flex-col gap-5'>
      <div className='flex flex-col gap-0.5'>
        <h2 className='text-base font-semibold'>Review & Submit</h2>
        <p className='text-muted-foreground text-sm'>Confirm your details before submitting.</p>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='divide-border divide-y rounded-lg border text-sm'>
          {reviewSections.map(section => (
            <div key={section.title} className='px-4 py-3'>
              <p className='mb-2 text-sm font-medium'>{section.title}</p>
              <dl className='space-y-1.5'>
                {section.items.map(item => (
                  <div key={item.label} className='flex items-start justify-between gap-3'>
                    <dt className='text-muted-foreground shrink-0'>{item.label}</dt>
                    <dd className='text-right font-medium'>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className='flex items-center justify-center max-md:hidden'>
          <MultiStepReviewCompleteSVG className='opacity-70' />
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Switch id='modern-review-confirm' />
        <Label htmlFor='modern-review-confirm' className='text-sm font-normal'>
          I confirm all information provided is accurate
        </Label>
      </div>

      <div className='flex justify-between gap-4'>
        <Button variant='secondary' onClick={() => stepper.navigation.prev()}>
          <ArrowLeftIcon />
          Previous
        </Button>
        <Button onClick={() => stepper.navigation.next()}>Submit</Button>
      </div>
    </div>
  )
}

export default ReviewSubmitStep
