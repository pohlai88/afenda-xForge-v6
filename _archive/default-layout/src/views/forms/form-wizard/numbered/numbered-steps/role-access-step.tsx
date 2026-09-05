// Third-party Imports
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Type Imports
import type { StepperType } from '@/views/forms/form-wizard/numbered/numbered-steps'

const roleItems = [
  { label: 'Select role', value: null },
  { label: 'Super Admin', value: 'super-admin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' }
]

const departmentItems = [
  { label: 'Select department', value: null },
  { label: 'Operations', value: 'operations' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Support', value: 'support' }
]

const RoleAccessStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-4 flex flex-col gap-5 p-6 md:col-span-3'>
      <div>
        <h3 className='font-semibold'>Role & Access</h3>
        <p className='text-muted-foreground text-sm'>Define the user&apos;s role and department in the admin panel</p>
      </div>

      <FieldGroup className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
        <Field className='gap-2'>
          <FieldLabel htmlFor='admin-user-role'>Role</FieldLabel>
          <Select items={roleItems}>
            <SelectTrigger id='admin-user-role' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {roleItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='admin-user-department'>Department</FieldLabel>
          <Select items={departmentItems}>
            <SelectTrigger id='admin-user-department' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {departmentItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
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

export default RoleAccessStep
