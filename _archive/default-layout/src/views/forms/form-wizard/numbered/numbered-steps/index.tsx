'use client'

// Third-party Imports
import * as Stepperize from '@stepperize/react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import UserDetailsStep from './user-details-step'
import RoleAccessStep from './role-access-step'
import PermissionsStep from './permissions-step'
import ReviewStep from './review-step'
import InviteCompleteStep from './invite-complete-step'

// Util Imports
import { cn } from '@/lib/utils'

const { useStepper } = Stepperize.defineStepper(
  {
    id: 'multi-step-3-user-details',
    title: 'User Details',
    description: 'Basic information'
  },
  {
    id: 'multi-step-3-role-access',
    title: 'Role & Access',
    description: 'Assign role'
  },
  {
    id: 'multi-step-3-permissions',
    title: 'Permissions',
    description: 'Module access'
  },
  {
    id: 'multi-step-3-review',
    title: 'Review',
    description: 'Confirm invite'
  },
  {
    id: 'multi-step-3-complete',
    title: 'Complete',
    description: 'Invite sent'
  }
)

export type StepperType = ReturnType<typeof useStepper>

const FormWizardNumberedSteps = () => {
  const stepper = useStepper()
  const currentStep = stepper.lookup.getIndex(stepper.state.current.data.id)

  return (
    <Card className='gap-0 p-0 md:grid md:max-lg:grid-cols-5 lg:grid-cols-4'>
      <CardContent className='col-span-5 p-6 max-md:border-b md:border-r md:max-lg:col-span-2 lg:col-span-1'>
        <nav aria-label='Multi Steps'>
          <ol className='flex flex-col justify-between gap-x-2 gap-y-6'>
            {stepper.state.all
              .filter(step => step.id !== 'multi-step-3-complete')
              .map((step, index) => (
                <li key={step.id}>
                  <Button
                    variant='ghost'
                    className='h-auto w-full shrink-0 cursor-pointer justify-start gap-2 rounded bg-transparent! px-0!'
                    onClick={() => stepper.navigation.goTo(step.id)}
                  >
                    <Avatar className='size-10.5'>
                      <AvatarFallback
                        className={cn('text-sm font-semibold', {
                          'bg-primary text-primary-foreground shadow-sm': index <= currentStep
                        })}
                      >
                        {index + 1}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col items-start'>
                      <span className='text-base'>{step.title}</span>
                      <span className='text-muted-foreground text-sm'>{step.description}</span>
                    </div>
                  </Button>
                </li>
              ))}
          </ol>
        </nav>
      </CardContent>
      {stepper.flow.switch({
        'multi-step-3-user-details': () => <UserDetailsStep stepper={stepper} />,
        'multi-step-3-role-access': () => <RoleAccessStep stepper={stepper} />,
        'multi-step-3-permissions': () => <PermissionsStep stepper={stepper} />,
        'multi-step-3-review': () => <ReviewStep stepper={stepper} />,
        'multi-step-3-complete': () => <InviteCompleteStep stepper={stepper} />
      })}
    </Card>
  )
}

export default FormWizardNumberedSteps
