// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import FormWizardBasicIconsHorizontal from './basic-icons-horizontal'
import FormWizardBasicIconsVertical from './basic-icons-vertical'
import FormWizardModernIcons from './modern-icons'

const FormWizardIcons = () => {
  return (
    <div className='flex flex-col gap-8'>
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold'>Modern Icons</h2>
        <FormWizardModernIcons />
      </div>

      <div className='space-y-4'>
        <h2 className='text-lg font-semibold'>Basic Icons - Vertical</h2>
        <FormWizardBasicIconsVertical />
      </div>

      <div className='space-y-4'>
        <h2 className='text-lg font-semibold'>Basic Icons - Horizontal</h2>
        <Card>
          <CardContent>
            <FormWizardBasicIconsHorizontal />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FormWizardIcons
