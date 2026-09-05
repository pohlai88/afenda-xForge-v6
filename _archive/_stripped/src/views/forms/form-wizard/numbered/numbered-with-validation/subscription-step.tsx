'use client'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { usePaymentInputs } from 'react-payment-inputs'
import { ArrowLeftIcon } from 'lucide-react'

// Type Imports
import type * as Stepperize from '@stepperize/react'

import type { SubscriptionValues } from './index'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const FormSchema = z.object({
  plan: z.string().min(1, 'Please select a plan'),
  cardNumber: z.string().min(1, 'Card number is required'),
  cardholderName: z.string().min(1, 'Cardholder name is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  cvc: z.string().min(1, 'CVC is required')
})

const SubscriptionStep = ({
  stepper,
  defaultValues,
  onSave
}: {
  stepper: Stepperize.Stepper<any>
  defaultValues: SubscriptionValues
  onSave: (data: SubscriptionValues) => void
}) => {
  const { getCardNumberProps, getExpiryDateProps, getCVCProps } = usePaymentInputs()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues
  })

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    onSave(data)
    stepper.navigation.next()
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-start'>
        <h2 className='text-lg font-semibold'>Choose Your Plan</h2>
        <p className='text-muted-foreground'>Select the perfect plan for your business needs</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6'>
        <Controller
          control={form.control}
          name='plan'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <RadioGroup
                className='justify-items-center sm:grid-cols-3 md:gap-6'
                onValueChange={field.onChange}
                value={field.value}
              >
                <div className='border-input has-data-checked:border-primary/50 relative flex w-full flex-col items-center gap-3 rounded-lg border p-4 outline-none'>
                  <RadioGroupItem
                    value='starter'
                    id='billing-plan-starter'
                    className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5'
                    aria-describedby='starter-description'
                    aria-label='plan-radio-starter'
                  />
                  <div className='grid grow justify-items-center'>
                    <Label
                      htmlFor='billing-plan-starter'
                      className='mb-1 justify-center text-base font-medium after:absolute after:inset-0'
                    >
                      Starter
                    </Label>
                    <p className='text-muted-foreground mb-3 text-center text-sm'>
                      Up to 5 users, 10GB storage, email support
                    </p>
                    <div className='flex items-baseline'>
                      <span className='text-muted-foreground mb-auto text-sm font-medium'>$</span>
                      <span className='text-3xl font-bold'>29</span>
                      <span className='text-muted-foreground text-sm font-medium'>/month</span>
                    </div>
                  </div>
                </div>
                <div className='border-input has-data-checked:border-primary/50 relative flex w-full flex-col items-center gap-3 rounded-lg border p-4 outline-none'>
                  <RadioGroupItem
                    value='professional'
                    id='billing-plan-professional'
                    className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5'
                    aria-describedby='professional-description'
                    aria-label='plan-radio-professional'
                  />
                  <div className='grid grow justify-items-center'>
                    <Label
                      htmlFor='billing-plan-professional'
                      className='mb-1 justify-center text-base font-medium after:absolute after:inset-0'
                    >
                      Professional
                    </Label>
                    <p className='text-muted-foreground mb-3 text-center text-sm'>
                      Up to 25 users, 100GB storage, priority support
                    </p>
                    <div className='flex items-baseline'>
                      <span className='text-muted-foreground mb-auto text-sm font-medium'>$</span>
                      <span className='text-3xl font-bold'>99</span>
                      <span className='text-muted-foreground text-sm font-medium'>/month</span>
                    </div>
                  </div>
                </div>
                <div className='border-input has-data-checked:border-primary/50 relative flex w-full flex-col items-center gap-3 rounded-lg border p-4 outline-none'>
                  <RadioGroupItem
                    value='enterprise'
                    id='billing-plan-enterprise'
                    className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5'
                    aria-describedby='enterprise-description'
                    aria-label='plan-radio-enterprise'
                  />
                  <div className='grid grow justify-items-center'>
                    <Label
                      htmlFor='billing-plan-enterprise'
                      className='mb-1 justify-center text-base font-medium after:absolute after:inset-0'
                    >
                      Enterprise
                    </Label>
                    <p id='enterprise-description' className='text-muted-foreground mb-3 text-center text-sm'>
                      Unlimited users, 1TB storage, 24/7 support
                    </p>
                    <div className='flex items-baseline'>
                      <span className='text-muted-foreground mb-auto text-sm font-medium'>$</span>
                      <span className='text-3xl font-bold'>299</span>
                      <span className='text-muted-foreground text-sm font-medium'>/month</span>
                    </div>
                  </div>
                </div>
              </RadioGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className='flex flex-col items-start'>
          <h2 className='text-lg font-semibold'>Payment Details</h2>
          <p className='text-muted-foreground'>Secure payment processing with 256-bit encryption</p>
        </div>
        <div className='grid grid-cols-12 gap-6'>
          <Controller
            control={form.control}
            name='cardNumber'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='col-span-full gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Card Number
                </FieldLabel>
                <Input
                  {...getCardNumberProps({ onChange: field.onChange })}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder='4242 4242 4242 4242'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='cardholderName'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='col-span-12 gap-2 md:col-span-6'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Cardholder Name
                </FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder='Sarah Anderson' />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='expiryDate'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='col-span-6 gap-2 md:col-span-3'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Expiry Date
                </FieldLabel>
                <Input
                  {...getExpiryDateProps({ onChange: field.onChange })}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder='MM/YY'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='cvc'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='col-span-6 gap-2 md:col-span-3'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  CVC
                </FieldLabel>
                <Input
                  {...getCVCProps({ onChange: field.onChange })}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder='123'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        <div className='flex justify-between gap-4'>
          <Button
            type='button'
            variant='secondary'
            onClick={() => stepper.navigation.prev()}
            disabled={stepper.state.isFirst}
          >
            <ArrowLeftIcon />
            Previous
          </Button>
          <Button
            type='submit'
            className='bg-green-600 text-white hover:bg-green-600/90 focus-visible:ring-green-600/20 dark:bg-green-400/60 dark:hover:bg-green-400/50 dark:focus-visible:ring-green-400/40'
          >
            Complete Setup
          </Button>
        </div>
      </form>
    </div>
  )
}

export default SubscriptionStep
