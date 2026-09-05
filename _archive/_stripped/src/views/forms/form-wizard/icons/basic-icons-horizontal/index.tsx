'use client'

// React Imports
import { Fragment } from 'react'

// Third-party Imports
import * as Stepperize from '@stepperize/react'
import { HomeIcon, UserIcon, LinkIcon, CheckCircleIcon, ChevronRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import AccountDetailsStep from './account-details-step'
import PersonalInfoStep from './personal-info-step'
import BillingStep from './billing-step'
import CompleteStep from './complete-step'

// Util Imports
import { cn } from '@/lib/utils'

const { useStepper } = Stepperize.defineStepper(
  {
    id: 'multi-step-1-account-details',
    title: 'Account Details',
    description: 'Setup Account Details',
    icon: <HomeIcon />
  },
  {
    id: 'multi-step-1-personal-info',
    title: 'Personal Information',
    description: 'Add Personal Info',
    icon: <UserIcon />
  },
  {
    id: 'multi-step-1-billing',
    title: 'Billing',
    description: 'Payment Details',
    icon: <LinkIcon />
  },
  {
    id: 'multi-step-1-complete',
    title: 'Submitted',
    description: 'Form Submitted',
    icon: <CheckCircleIcon />
  }
)

export type StepperType = ReturnType<typeof useStepper>

const FormWizardBasicIconsHorizontal = () => {
  const stepper = useStepper()
  const currentStep = stepper.lookup.getIndex(stepper.state.current.data.id)

  return (
    <div className='mx-auto flex w-full max-w-200 flex-col gap-12'>
      <nav aria-label='Multi Steps'>
        <ScrollArea className='relative w-full'>
          <ol className='flex items-center justify-between gap-y-4 max-md:flex-col max-md:items-start xl:gap-x-8'>
            {stepper.state.all
              .filter(step => step.id !== 'multi-step-1-complete')
              .map((step, index, array) => (
                <Fragment key={step.id}>
                  <li>
                    <Button
                      variant='ghost'
                      className='h-auto shrink-0 cursor-pointer gap-2 rounded-md bg-transparent! p-0!'
                      onClick={() => stepper.navigation.goTo(step.id)}
                    >
                      <Avatar className='size-9.5 after:border-none'>
                        <AvatarFallback
                          className={cn('text-foreground *:[svg]:size-4', {
                            'bg-primary text-primary-foreground shadow-sm': index <= currentStep
                          })}
                        >
                          {step.icon}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex flex-col items-start'>
                        <span className='text-base font-medium'>{step.title}</span>
                        <span className='text-muted-foreground text-sm'>{step.description}</span>
                      </div>
                    </Button>
                  </li>
                  {index < array.length - 1 && (
                    <li className='max-md:hidden'>
                      <ChevronRightIcon className='text-foreground size-4' />
                    </li>
                  )}
                </Fragment>
              ))}
          </ol>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>
      </nav>
      <form className='flex flex-col gap-6'>
        {stepper.flow.switch({
          'multi-step-1-account-details': () => <AccountDetailsStep stepper={stepper} />,
          'multi-step-1-personal-info': () => <PersonalInfoStep stepper={stepper} />,
          'multi-step-1-billing': () => <BillingStep stepper={stepper} />,
          'multi-step-1-complete': () => <CompleteStep stepper={stepper} />
        })}
      </form>
    </div>
  )
}

export default FormWizardBasicIconsHorizontal
