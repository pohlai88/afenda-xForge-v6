// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import BasicForm from './basic-form'
import BasicFormWithIcon from './basic-form-with-icon'
import FormWithTabs from './form-with-tabs'
import MultiColumnWithSeparator from './multi-column-with-separator'
import CollapsibleForm from './collapsible-form'
import ModernForm from './modern-form'

const VerticalForm = () => {
  return (
    <div className='flex flex-col gap-6'>
      <div className='grid gap-6 lg:grid-cols-2'>
        <div className='space-y-3'>
          <h2 className='text-lg font-semibold'>Basic Form</h2>
          <Card>
            <CardContent>
              <BasicForm />
            </CardContent>
          </Card>
        </div>

        <div className='space-y-3'>
          <h2 className='text-lg font-semibold'>Basic Form with Icon</h2>
          <Card>
            <CardContent>
              <BasicFormWithIcon />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className='space-y-3'>
        <h2 className='text-lg font-semibold'>Multi Column with Separator</h2>
        <Card>
          <CardContent>
            <MultiColumnWithSeparator />
          </CardContent>
        </Card>
      </div>

      <div className='space-y-3'>
        <h2 className='text-lg font-semibold'>Form with Tabs</h2>
        <FormWithTabs />
      </div>

      <div className='space-y-3'>
        <h2 className='text-lg font-semibold'>Collapsible Form</h2>
        <CollapsibleForm />
      </div>

      <div className='space-y-3'>
        <h2 className='text-lg font-semibold'>Modern Form</h2>
        <Card>
          <CardContent>
            <ModernForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default VerticalForm
