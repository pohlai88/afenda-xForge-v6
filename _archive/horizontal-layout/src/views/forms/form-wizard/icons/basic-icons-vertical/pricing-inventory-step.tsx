'use client'

// Third-party Imports
import { Button as AriaButton, Group, Input as AriaInput, NumberField } from 'react-aria-components'
import { MinusIcon, PlusIcon, DollarSignIcon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

// Component Imports
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Type Imports
import type { StepperType } from './index'

const targetAudienceItems = [
  { label: 'Select Target Audience', value: null },
  { label: 'All Customers', value: 'all' },
  { label: 'New Customers', value: 'new' },
  { label: 'Returning Customers', value: 'returning' },
  { label: 'Premium Members', value: 'premium' },
  { label: 'Enterprise Clients', value: 'enterprise' }
]

const paymentMethodItems = [
  { label: 'Select Payment Methods', value: null },
  { label: 'All Payment Methods', value: 'all' },
  { label: 'Credit/Debit Cards Only', value: 'credit-debit' },
  { label: 'Digital Wallets Only', value: 'digital-wallet' },
  { label: 'Bank Transfer Only', value: 'bank-transfer' },
  { label: 'Cryptocurrency', value: 'crypto' }
]

const productStatusItems = [
  { label: 'Select Status', value: null },
  { label: 'Active - Available Now', value: 'active' },
  { label: 'Pre-Order', value: 'pre-order' },
  { label: 'Coming Soon', value: 'coming-soon' },
  { label: 'Out of Stock', value: 'out-of-stock' },
  { label: 'Discontinued', value: 'discontinued' }
]

const PricingInventoryStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-5 flex flex-col gap-6 p-6 md:col-span-3'>
      <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <Field className='gap-2 md:max-lg:col-span-2'>
          <FieldLabel htmlFor='multi-step-product-pricing-user-type'>Target Audience</FieldLabel>
          <Select items={targetAudienceItems}>
            <SelectTrigger id='multi-step-product-pricing-user-type' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {targetAudienceItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <NumberField
          defaultValue={150}
          minValue={0}
          className='flex flex-col gap-2 md:max-lg:col-span-2'
          aria-labelledby='quantity'
        >
          <Label className='text-sm'>Stock Quantity</Label>
          <Group className='input-default border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:border-destructive data-focus-within:has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-focus-within:has-aria-invalid:ring-destructive/40 relative inline-flex w-full min-w-0 items-center overflow-hidden rounded-md border bg-transparent text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px] md:text-sm'>
            <AriaInput className='selection:bg-primary selection:text-primary-foreground w-full grow px-3 text-center tabular-nums outline-none' />
            <AriaButton
              slot='decrement'
              className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground mr-1.5 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <MinusIcon className='size-3' />
              <span className='sr-only'>Decrement</span>
            </AriaButton>
            <AriaButton
              slot='increment'
              className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground mr-2 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <PlusIcon className='size-3' />
              <span className='sr-only'>Increment</span>
            </AriaButton>
          </Group>
        </NumberField>

        <NumberField
          defaultValue={999}
          minValue={0}
          className='flex flex-col items-start gap-2 md:max-lg:col-span-2'
          aria-labelledby='regular-price'
        >
          <Label className='text-sm'>Regular Price</Label>
          <Group className='input-default border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:border-destructive data-focus-within:has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-focus-within:has-aria-invalid:ring-destructive/40 relative inline-flex w-full min-w-0 items-center overflow-hidden rounded-md border bg-transparent text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px] md:text-sm'>
            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3'>
              <DollarSignIcon className='size-4' />
            </div>
            <AriaInput className='selection:bg-primary selection:text-primary-foreground w-full grow px-3 py-2 pl-9 text-center tabular-nums outline-none' />
            <AriaButton
              slot='decrement'
              className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground mr-1.5 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <MinusIcon className='size-3' />
              <span className='sr-only'>Decrement</span>
            </AriaButton>
            <AriaButton
              slot='increment'
              className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground mr-2 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <PlusIcon className='size-3' />
              <span className='sr-only'>Increment</span>
            </AriaButton>
          </Group>
        </NumberField>

        <NumberField
          defaultValue={899}
          minValue={0}
          className='flex flex-col items-start gap-2 md:max-lg:col-span-2'
          aria-labelledby='sale-price'
        >
          <Label className='text-sm'>Sale Price</Label>
          <Group className='input-default border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:border-destructive data-focus-within:has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-focus-within:has-aria-invalid:ring-destructive/40 relative inline-flex w-full min-w-0 items-center overflow-hidden rounded-md border bg-transparent text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px] md:text-sm'>
            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3'>
              <DollarSignIcon className='size-4' />
            </div>
            <AriaInput className='selection:bg-primary selection:text-primary-foreground w-full grow px-3 py-2 pl-9 text-center tabular-nums outline-none' />
            <AriaButton
              slot='decrement'
              className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground mr-1.5 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <MinusIcon className='size-3' />
              <span className='sr-only'>Decrement</span>
            </AriaButton>
            <AriaButton
              slot='increment'
              className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground mr-2 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              <PlusIcon className='size-3' />
              <span className='sr-only'>Increment</span>
            </AriaButton>
          </Group>
        </NumberField>

        <Field className='gap-2 md:max-lg:col-span-2'>
          <FieldLabel htmlFor='multi-step-product-pricing-payment-method'>Accepted Payments</FieldLabel>
          <Select items={paymentMethodItems}>
            <SelectTrigger id='multi-step-product-pricing-payment-method' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {paymentMethodItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field className='gap-2 md:max-lg:col-span-2'>
          <FieldLabel htmlFor='multi-step-product-pricing-product-status'>Product Status</FieldLabel>
          <Select items={productStatusItems}>
            <SelectTrigger id='multi-step-product-pricing-product-status' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {productStatusItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field orientation='horizontal' className='sm:col-span-2'>
          <Switch id='limit-single-use' />
          <FieldLabel htmlFor='limit-single-use'>Limit purchase to one per customer</FieldLabel>
        </Field>
      </FieldGroup>
      <div className='flex justify-between gap-4'>
        <Button variant='secondary' onClick={() => stepper.navigation.prev()}>
          <ArrowLeftIcon />
          Previous
        </Button>
        <Button onClick={() => stepper.navigation.next()}>
          Next
          <ArrowRightIcon />
        </Button>
      </div>
    </CardContent>
  )
}

export default PricingInventoryStep
