// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import FormWizardNumberedSteps from './numbered-steps'
import FormWizardWithValidation from './numbered-with-validation'

const FormWizardNumbered = () => {
  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <div className='space-y-3'>
          <h2 className='text-lg font-semibold'>Numbered Steps</h2>
          <FormWizardNumberedSteps />
        </div>

        <div className='space-y-3'>
          <h2 className='text-lg font-semibold'>Numbered Steps with Validation</h2>
          <Card>
            <CardContent>
              <FormWizardWithValidation />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

export default FormWizardNumbered
