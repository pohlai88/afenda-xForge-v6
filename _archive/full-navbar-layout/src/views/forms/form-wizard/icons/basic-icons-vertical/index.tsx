'use client'

// Third-party Imports
import * as Stepperize from '@stepperize/react'
import { BoxIcon, PackageCheckIcon, SettingsIcon, RocketIcon, CheckCircleIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ProductTypeStep from './product-type-step'
import ProductDetailsStep from './product-details-step'
import PricingInventoryStep from './pricing-inventory-step'
import ReviewLaunchStep from './review-launch-step'
import PublishedStep from './published-step'

// Util Imports
import { cn } from '@/lib/utils'

const { useStepper } = Stepperize.defineStepper(
  {
    id: 'multi-step-2-product-type',
    title: 'Product Type',
    description: 'Select product category',
    icon: <BoxIcon />
  },
  {
    id: 'multi-step-2-product-details',
    title: 'Product Information',
    description: 'Add product details',
    icon: <PackageCheckIcon />
  },
  {
    id: 'multi-step-2-product-pricing',
    title: 'Pricing & Inventory',
    description: 'Set price & stock',
    icon: <SettingsIcon />
  },
  {
    id: 'multi-step-2-review-complete',
    title: 'Review & Launch',
    description: 'Publish product!',
    icon: <RocketIcon />
  },
  {
    id: 'multi-step-2-complete',
    title: 'Published',
    description: 'Product Live',
    icon: <CheckCircleIcon />
  }
)

export type StepperType = ReturnType<typeof useStepper>

const FormWizardBasicIconsVertical = () => {
  const stepper = useStepper()
  const currentStep = stepper.lookup.getIndex(stepper.state.current.data.id)

  return (
    <Card className='gap-0 p-0 md:grid md:max-lg:grid-cols-5 lg:grid-cols-4'>
      <CardContent className='col-span-5 p-6 max-md:border-b md:border-r md:max-lg:col-span-2 lg:col-span-1'>
        <nav aria-label='Multi Steps'>
          <ol className='flex flex-col justify-between gap-x-2 gap-y-6'>
            {stepper.state.all
              .filter(step => step.id !== 'multi-step-2-complete')
              .map((step, index) => (
                <li key={step.id}>
                  <Button
                    variant='ghost'
                    className='h-auto w-full shrink-0 cursor-pointer justify-start gap-2 rounded bg-transparent! px-0!'
                    onClick={() => stepper.navigation.goTo(step.id)}
                  >
                    <Avatar className='size-10.5'>
                      <AvatarFallback
                        className={cn('*:[svg]:size-5', {
                          'bg-primary text-primary-foreground shadow-sm': index <= currentStep
                        })}
                      >
                        {step.icon}
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
        'multi-step-2-product-type': () => <ProductTypeStep stepper={stepper} />,
        'multi-step-2-product-details': () => <ProductDetailsStep stepper={stepper} />,
        'multi-step-2-product-pricing': () => <PricingInventoryStep stepper={stepper} />,
        'multi-step-2-review-complete': () => <ReviewLaunchStep stepper={stepper} />,
        'multi-step-2-complete': () => <PublishedStep stepper={stepper} />
      })}
    </Card>
  )
}

export default FormWizardBasicIconsVertical
