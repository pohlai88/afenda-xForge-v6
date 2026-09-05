// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import RegistrationForm from './registration-form'
import ValidationModesDemo from './validation-demos'
import ValidationTypes from './validation-types'

const FormValidation = () => {
  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <div className='space-y-3'>
          <h2 className='text-lg font-semibold'>Validation Types</h2>
          <Card>
            <CardContent>
              <ValidationTypes />
            </CardContent>
          </Card>
        </div>

        <ValidationModesDemo />

        <div className='space-y-3'>
          <h2 className='text-lg font-semibold'>Registration Form</h2>
          <Card>
            <CardContent>
              <RegistrationForm />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

export default FormValidation
