// Third-party Imports
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'

// Type Imports
import type { StepperType } from '@/views/forms/form-wizard/numbered/numbered-steps'

const moduleAccess = ['Dashboard', 'Users', 'Analytics', 'Settings', 'Billing']

const PermissionsStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-4 flex flex-col gap-5 p-6 md:col-span-3'>
      <div>
        <h3 className='font-semibold'>Module Permissions</h3>
        <p className='text-muted-foreground text-sm'>Choose which admin sections this user can access</p>
      </div>

      <FieldGroup className='gap-5'>
        <Field className='gap-3'>
          <FieldLabel className='font-medium'>Allowed Modules</FieldLabel>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {moduleAccess.map(module => (
              <Field key={module} orientation='horizontal' className='w-fit'>
                <Checkbox id={`module-${module}`} defaultChecked={module !== 'Billing'} />
                <FieldLabel htmlFor={`module-${module}`} className='font-normal'>
                  {module}
                </FieldLabel>
              </Field>
            ))}
          </div>
        </Field>

        <div className='grid gap-4 lg:grid-cols-2'>
          <Field orientation='horizontal' className='relative items-center justify-between rounded-lg border px-4 py-3'>
            <div className='flex flex-col gap-0.5'>
              <FieldLabel htmlFor='admin-user-active' className='before:absolute before:inset-0'>
                Active Account
              </FieldLabel>
              <span className='text-muted-foreground text-xs'>Allow immediate login after invite is accepted</span>
            </div>
            <Switch id='admin-user-active' defaultChecked className='shrink-0' />
          </Field>

          <Field orientation='horizontal' className='relative items-center justify-between rounded-lg border px-4 py-3'>
            <div className='flex flex-col gap-0.5'>
              <FieldLabel htmlFor='admin-welcome-email' className='before:absolute before:inset-0'>
                Send Welcome Email
              </FieldLabel>
              <span className='text-muted-foreground text-xs'>Include setup instructions in the invite email</span>
            </div>
            <Switch id='admin-welcome-email' defaultChecked />
          </Field>
        </div>
      </FieldGroup>

      <div className='flex justify-between gap-3'>
        <Button variant='secondary' onClick={() => stepper.navigation.prev()}>
          <ArrowLeftIcon />
          Back
        </Button>
        <Button onClick={() => stepper.navigation.next()}>
          Next
          <ArrowRightIcon />
        </Button>
      </div>
    </CardContent>
  )
}

export default PermissionsStep
