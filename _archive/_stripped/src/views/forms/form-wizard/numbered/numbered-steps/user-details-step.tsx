// Third-party Imports
import { ArrowRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

// Type Imports
import type { StepperType } from '@/views/forms/form-wizard/numbered/numbered-steps'

const UserDetailsStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-4 flex flex-col gap-5 p-6 md:col-span-3'>
      <div>
        <h3 className='font-semibold'>Invite Team Member</h3>
        <p className='text-muted-foreground text-sm'>Enter the basic details for the new admin user</p>
      </div>

      <FieldGroup className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
        <Field className='gap-2'>
          <FieldLabel htmlFor='admin-user-name'>Full Name</FieldLabel>
          <Input id='admin-user-name' placeholder='Alex Morgan' />
        </Field>
        <Field className='gap-2'>
          <FieldLabel htmlFor='admin-user-email'>Work Email</FieldLabel>
          <Input id='admin-user-email' type='email' placeholder='alex@company.com' />
        </Field>
        <Field className='gap-2 sm:col-span-2'>
          <FieldLabel htmlFor='admin-user-title'>Job Title</FieldLabel>
          <Input id='admin-user-title' placeholder='Product Manager' />
          <FieldDescription className='text-xs'>Optional: shown on the team directory page</FieldDescription>
        </Field>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button onClick={() => stepper.navigation.next()}>
          Next
          <ArrowRightIcon />
        </Button>
      </div>
    </CardContent>
  )
}

export default UserDetailsStep
