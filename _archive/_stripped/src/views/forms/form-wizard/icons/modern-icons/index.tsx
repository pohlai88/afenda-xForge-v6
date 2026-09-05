'use client'

// React Imports
import { Fragment } from 'react'

// Third-party Imports
import * as Stepperize from '@stepperize/react'
import { ChevronRightIcon } from 'lucide-react'

// Component Imports
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import AccountDetailsStep from './account-details-step'
import PersonalInfoStep from './personal-info-step'
import AddressStep from './address-step'
import SocialLinksStep from './social-links-step'
import ReviewSubmitStep from './review-submit-step'
import CompleteStep from './complete-step'

// Util Imports
import { cn } from '@/lib/utils'

// SVG Imports
import FormWizardAccountSVG from '@/assets/svg/form-wizard-account'
import FormWizardPersonalInfoSVG from '@/assets/svg/form-wizard-personal-info'
import FormWizardAddressSVG from '@/assets/svg/form-wizard-address'
import FormWizardSocialLinkSVG from '@/assets/svg/form-wizard-social-link'
import FormWizardReviewSVG from '@/assets/svg/form-wizard-review'

const { useStepper } = Stepperize.defineStepper(
  { id: 'multi-step-modern-account', title: 'Account Details', icon: FormWizardAccountSVG },
  { id: 'multi-step-modern-personal-info', title: 'Personal Info', icon: FormWizardPersonalInfoSVG },
  { id: 'multi-step-modern-address', title: 'Address Info', icon: FormWizardAddressSVG },
  { id: 'multi-step-modern-social-links', title: 'Social Links', icon: FormWizardSocialLinkSVG },
  { id: 'multi-step-modern-review', title: 'Review & Submit', icon: FormWizardReviewSVG },
  { id: 'multi-step-modern-complete', title: 'Submitted', icon: FormWizardReviewSVG }
)

export type StepperType = ReturnType<typeof useStepper>

const FormWizardModernIcons = () => {
  const stepper = useStepper()
  const currentStep = stepper.lookup.getIndex(stepper.state.current.data.id)

  return (
    <Card>
      <CardContent>
        <nav aria-label='Multi Steps'>
          <ol className='flex justify-center gap-x-6 gap-y-6 max-md:flex-col md:items-center lg:gap-x-12'>
            {stepper.state.all
              .filter(step => step.id !== 'multi-step-modern-complete')
              .map((step, index, array) => (
                <Fragment key={step.id}>
                  <li>
                    <div
                      className={cn(
                        'flex h-auto w-full shrink-0 cursor-pointer items-center justify-start gap-5 md:flex-col',
                        {
                          'text-muted-foreground hover:text-muted-foreground': index > currentStep,
                          'text-foreground': index <= currentStep
                        }
                      )}
                      onClick={() => stepper.navigation.goTo(step.id)}
                    >
                      <step.icon className='size-15' />
                      <span className='text-center text-base font-medium'>{step.title}</span>
                    </div>
                  </li>
                  {index < array.length - 1 && (
                    <li className='max-md:hidden'>
                      <ChevronRightIcon className='size-4.5 shrink-0' />
                    </li>
                  )}
                </Fragment>
              ))}
          </ol>
        </nav>
        <Separator className='my-6' />
        <form>
          {stepper.flow.switch({
            'multi-step-modern-account': () => <AccountDetailsStep stepper={stepper} />,
            'multi-step-modern-personal-info': () => <PersonalInfoStep stepper={stepper} />,
            'multi-step-modern-address': () => <AddressStep stepper={stepper} />,
            'multi-step-modern-social-links': () => <SocialLinksStep stepper={stepper} />,
            'multi-step-modern-review': () => <ReviewSubmitStep stepper={stepper} />,
            'multi-step-modern-complete': () => <CompleteStep stepper={stepper} />
          })}
        </form>
      </CardContent>
    </Card>
  )
}

export default FormWizardModernIcons
