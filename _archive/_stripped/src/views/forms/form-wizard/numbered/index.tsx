// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import FormWizardNumberedSteps from './numbered-steps'
import FormWizardWithValidation from './numbered-with-validation'

const FormWizardNumbered = () => {
  return (
    <div className='flex flex-col gap-8'>
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold'>Numbered Steps</h2>
        <FormWizardNumberedSteps />
      </div>

      <div className='space-y-4'>
        <h2 className='text-lg font-semibold'>Numbered Steps with Validation</h2>
        <Card>
          <CardContent>
            <FormWizardWithValidation />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FormWizardNumbered
