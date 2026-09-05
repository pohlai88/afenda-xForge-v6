// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import FormWizardBasicIconsHorizontal from './basic-icons-horizontal'
import FormWizardBasicIconsVertical from './basic-icons-vertical'
import FormWizardModernIcons from './modern-icons'

const FormWizardIcons = () => {
  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <div className='space-y-3'>
          <h2 className='text-lg font-semibold'>Modern Icons</h2>
          <FormWizardModernIcons />
        </div>

        <div className='space-y-3'>
          <h2 className='text-lg font-semibold'>Basic Icons - Vertical</h2>
          <FormWizardBasicIconsVertical />
        </div>

        <div className='space-y-3'>
          <h2 className='text-lg font-semibold'>Basic Icons - Horizontal</h2>
          <Card>
            <CardContent>
              <FormWizardBasicIconsHorizontal />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

export default FormWizardIcons
