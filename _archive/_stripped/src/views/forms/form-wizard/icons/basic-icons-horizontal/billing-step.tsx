'use client'

// Third-party Imports
import { usePaymentInputs } from 'react-payment-inputs'
import { ArrowLeftIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

// Type Imports
import type { StepperType } from './index'

const BillingStep = ({ stepper }: { stepper: StepperType }) => {
  const { getCardNumberProps, getExpiryDateProps, getCVCProps } = usePaymentInputs()

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-start gap-1'>
        <h2 className='text-2xl font-semibold'>Select Plan</h2>
        <p className='text-muted-foreground'>Select Plan as per Your Requirements</p>
      </div>
      <RadioGroup className='justify-items-center gap-4 sm:grid-cols-3 md:gap-6' defaultValue='basic'>
        <div className='border-input has-data-checked:border-primary relative flex w-full flex-col items-center gap-3 rounded-md border p-4 outline-none'>
          <RadioGroupItem
            value='basic'
            id='billing-plan-basic'
            className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-3'
            aria-describedby='basic-description'
            aria-label='plan-radio-basic'
          />
          <div className='grid grow justify-items-center'>
            <Label
              htmlFor='billing-plan-basic'
              className='text-foreground mb-1 text-base font-medium after:absolute after:inset-0'
            >
              Basic
            </Label>
            <p id='basic-description' className='text-muted-foreground mb-3 text-center text-sm'>
              Get 1 project with 1 team member.
            </p>
            <div className='flex items-center'>
              <span className='text-muted-foreground mb-auto text-sm font-medium'>$</span>
              <span className='text-3xl font-bold'>0</span>
              <span className='text-muted-foreground text-sm font-medium'>/month</span>
            </div>
          </div>
        </div>
        <div className='border-input has-data-checked:border-primary relative flex w-full flex-col items-center gap-3 rounded-md border p-4 outline-none'>
          <RadioGroupItem
            value='pro'
            id='billing-plan-pro'
            className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-3'
            aria-describedby='pro-description'
            aria-label='plan-radio-pro'
          />
          <div className='grid grow justify-items-center'>
            <Label
              htmlFor='billing-plan-pro'
              className='text-foreground mb-1 text-base font-medium after:absolute after:inset-0'
            >
              Pro
            </Label>
            <p id='pro-description' className='text-muted-foreground mb-3 text-center text-sm'>
              Get 5 projects with 5 team members.
            </p>
            <div className='flex items-center'>
              <span className='text-muted-foreground mb-auto text-sm font-medium'>$</span>
              <span className='text-3xl font-bold'>99</span>
              <span className='text-muted-foreground text-sm font-medium'>/month</span>
            </div>
          </div>
        </div>
        <div className='border-input has-data-checked:border-primary relative flex w-full flex-col items-center gap-3 rounded-md border p-4 outline-none'>
          <RadioGroupItem
            value='elite'
            id='billing-plan-elite'
            className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-3'
            aria-describedby='elite-description'
            aria-label='plan-radio-elite'
          />
          <div className='grid grow justify-items-center'>
            <Label
              htmlFor='billing-plan-elite'
              className='text-foreground mb-1 text-base font-medium after:absolute after:inset-0'
            >
              Elite
            </Label>
            <p id='elite-description' className='text-muted-foreground mb-3 text-center text-sm'>
              Get 25 projects with 25 team members.
            </p>
            <div className='flex items-baseline'>
              <span className='text-muted-foreground mb-auto text-sm font-medium'>$</span>
              <span className='text-3xl font-bold'>299</span>
              <span className='text-muted-foreground text-sm font-medium'>/year</span>
            </div>
          </div>
        </div>
      </RadioGroup>
      <div className='flex flex-col items-start gap-1'>
        <h2 className='text-2xl font-semibold'>Payment Information</h2>
        <p className='text-muted-foreground'>Enter Your Card Information</p>
      </div>
      <div className='grid grid-cols-12 gap-6'>
        <div className='col-span-12 flex flex-col items-start gap-2'>
          <Label htmlFor='multi-step-billing-card-number' className='leading-5'>
            Card Number
          </Label>
          <Input {...getCardNumberProps()} id='multi-step-billing-card-number' placeholder='1234 5678 9012 3456' />
        </div>
        <div className='col-span-12 flex flex-col items-start gap-2 md:col-span-6'>
          <Label htmlFor='multi-step-billing-name' className='leading-5'>
            Name on Card
          </Label>
          <Input id='multi-step-billing-name' placeholder='John Doe' />
        </div>
        <div className='col-span-6 flex flex-col items-start gap-2 md:col-span-3'>
          <Label htmlFor='multi-step-billing-expiry-date' className='leading-5'>
            Expiry Date
          </Label>
          <Input {...getExpiryDateProps()} id='multi-step-billing-expiry-date' placeholder='MM/YY' />
        </div>
        <div className='col-span-6 flex flex-col items-start gap-2 md:col-span-3'>
          <Label htmlFor='multi-step-billing-cvc' className='leading-5'>
            CVC
          </Label>
          <Input {...getCVCProps()} id='multi-step-billing-cvc' placeholder='123' />
        </div>
      </div>
      <div className='flex justify-between gap-4'>
        <Button variant='secondary' onClick={() => stepper.navigation.prev()} disabled={stepper.state.isFirst}>
          <ArrowLeftIcon />
          Previous
        </Button>
        <Button
          onClick={() => stepper.navigation.next()}
          className='bg-green-600 text-white hover:bg-green-600/90 focus-visible:ring-green-600/20 dark:bg-green-400/60 dark:hover:bg-green-400/50 dark:focus-visible:ring-green-400/40'
        >
          Submit
        </Button>
      </div>
    </div>
  )
}

export default BillingStep
