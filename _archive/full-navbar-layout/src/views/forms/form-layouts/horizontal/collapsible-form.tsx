'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { CreditCardIcon, InfoIcon } from 'lucide-react'

// Component Imports
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const deliveryOptions = [
  {
    value: 'standard',
    title: 'Standard 3-5 Days',
    date: 'Friday, 15 Nov - Monday, 18 Nov',
    price: 'Free'
  },
  {
    value: 'express',
    title: 'Express',
    date: 'Friday, 15 Nov - Sunday, 17 Nov',
    price: '$5.00'
  },
  {
    value: 'overnight',
    title: 'Overnight',
    date: 'Friday, 15 Nov - Saturday, 16 Nov',
    price: '$10.00'
  }
]

const states = [
  { value: null, label: 'Select State' },
  { value: 'ny', label: 'New York' },
  { value: 'ca', label: 'California' },
  { value: 'tx', label: 'Texas' },
  { value: 'fl', label: 'Florida' },
  { value: 'il', label: 'Illinois' },
  { value: 'pa', label: 'Pennsylvania' }
]

const CollapsibleForm = () => {
  const [selectedDelivery, setSelectedDelivery] = useState('standard')
  const [selectedAddressType, setSelectedAddressType] = useState('home')
  const [selectedPayment, setSelectedPayment] = useState('card')

  return (
    <Accordion defaultValue={['delivery-address']} className='space-y-4 overflow-visible border-0'>
      <AccordionItem value='delivery-address' className='bg-card rounded-lg border'>
        <AccordionTrigger className='px-6 py-4 hover:no-underline'>
          <h3 className='text-base font-semibold'>Delivery Address</h3>
        </AccordionTrigger>
        <AccordionContent className='border-t px-6 pt-6 pb-6'>
          <FieldGroup className='gap-6'>
            <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
              <FieldLabel htmlFor='horizontal-collapsible-fullName'>Full Name</FieldLabel>
              <Input id='horizontal-collapsible-fullName' className='sm:col-span-5' placeholder='John Doe' />
            </Field>

            <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
              <FieldLabel htmlFor='horizontal-collapsible-phoneNo'>Phone No.</FieldLabel>
              <Input
                id='horizontal-collapsible-phoneNo'
                className='sm:col-span-5'
                type='tel'
                placeholder='+1 123 456 7890'
              />
            </Field>

            <Field className='grid grid-cols-1 items-start gap-2 sm:grid-cols-6'>
              <FieldLabel htmlFor='horizontal-collapsible-address'>Address</FieldLabel>
              <Textarea
                id='horizontal-collapsible-address'
                className='sm:col-span-5'
                placeholder='Enter your full address'
                rows={3}
              />
            </Field>

            <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
              <FieldLabel htmlFor='horizontal-collapsible-pincode'>Pincode</FieldLabel>
              <Input id='horizontal-collapsible-pincode' className='sm:col-span-5' placeholder='123456' />
            </Field>

            <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
              <FieldLabel htmlFor='horizontal-collapsible-landmark'>Landmark</FieldLabel>
              <Input id='horizontal-collapsible-landmark' className='sm:col-span-5' placeholder='Near City Mall' />
            </Field>

            <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
              <FieldLabel htmlFor='horizontal-collapsible-city'>City</FieldLabel>
              <Input id='horizontal-collapsible-city' className='sm:col-span-5' placeholder='New York' />
            </Field>

            <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
              <FieldLabel htmlFor='horizontal-collapsible-state'>State</FieldLabel>
              <div className='sm:col-span-5'>
                <Select items={states}>
                  <SelectTrigger id='horizontal-collapsible-state' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {states.map(state => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </Field>

            <Field className='grid grid-cols-1 items-start gap-2 sm:grid-cols-6'>
              <FieldLabel>Address Type</FieldLabel>
              <RadioGroup
                value={selectedAddressType}
                onValueChange={setSelectedAddressType}
                className='flex flex-wrap gap-x-6 gap-y-2 sm:col-span-5'
              >
                <Field orientation='horizontal' className='w-fit items-center gap-2'>
                  <RadioGroupItem value='home' id='horizontal-collapsible-home' />
                  <FieldLabel htmlFor='horizontal-collapsible-home' className='font-normal'>
                    Home (All day delivery)
                  </FieldLabel>
                </Field>
                <Field orientation='horizontal' className='w-fit items-center gap-2'>
                  <RadioGroupItem value='office' id='horizontal-collapsible-office' />
                  <FieldLabel htmlFor='horizontal-collapsible-office' className='font-normal'>
                    Office (Delivery between 10 AM - 5 PM)
                  </FieldLabel>
                </Field>
              </RadioGroup>
            </Field>
          </FieldGroup>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value='delivery-options' className='bg-card rounded-lg border'>
        <AccordionTrigger className='px-6 py-4 hover:no-underline'>
          <h3 className='text-base font-semibold'>Delivery Options</h3>
        </AccordionTrigger>
        <AccordionContent className='border-t px-6 pt-6 pb-6'>
          <Field>
            <FieldLabel>Shipping</FieldLabel>
            <RadioGroup
              value={selectedDelivery}
              onValueChange={setSelectedDelivery}
              className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
            >
              {deliveryOptions.map(option => (
                <div
                  key={option.value}
                  className='border-input has-data-checked:border-primary/50 relative flex w-full items-center gap-2 rounded-lg border p-4 outline-none'
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`horizontal-collapsible-${option.value}`}
                    aria-describedby={`horizontal-collapsible-${option.value}-description`}
                  />
                  <div className='grid grow gap-2'>
                    <Label
                      htmlFor={`horizontal-collapsible-${option.value}`}
                      className='justify-between after:absolute after:inset-0'
                    >
                      {option.title} <span className='font-semibold'>{option.price}</span>
                    </Label>
                    <p
                      id={`horizontal-collapsible-${option.value}-description`}
                      className='text-muted-foreground text-sm'
                    >
                      {option.date}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </Field>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value='payment-method' className='bg-card rounded-lg border border-b!'>
        <AccordionTrigger className='px-6 py-4 hover:no-underline'>
          <h3 className='text-base font-semibold'>Payment Method</h3>
        </AccordionTrigger>
        <AccordionContent className='border-t px-6 pt-6 pb-6'>
          <form>
            <FieldGroup className='gap-6'>
              <Field className='grid grid-cols-1 items-start gap-2 sm:grid-cols-6'>
                <FieldLabel>Payment</FieldLabel>
                <RadioGroup
                  value={selectedPayment}
                  onValueChange={setSelectedPayment}
                  className='flex gap-6 max-sm:flex-col sm:col-span-5'
                >
                  <Field orientation='horizontal' className='w-fit items-center gap-2'>
                    <RadioGroupItem value='card' id='horizontal-collapsible-card' />
                    <FieldLabel htmlFor='horizontal-collapsible-card' className='flex items-center gap-1.5 font-normal'>
                      <CreditCardIcon className='size-4' />
                      Credit/Debit/ATM Card
                    </FieldLabel>
                  </Field>
                  <Field orientation='horizontal' className='w-fit items-center gap-2'>
                    <RadioGroupItem value='cod' id='horizontal-collapsible-cod' />
                    <FieldLabel htmlFor='horizontal-collapsible-cod' className='flex items-center gap-1.5 font-normal'>
                      <InfoIcon className='size-4' />
                      Cash On Delivery
                    </FieldLabel>
                  </Field>
                </RadioGroup>
              </Field>

              {selectedPayment === 'card' && (
                <>
                  <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
                    <FieldLabel htmlFor='horizontal-collapsible-cardNumber'>Card Number</FieldLabel>
                    <Input
                      id='horizontal-collapsible-cardNumber'
                      className='sm:col-span-5'
                      placeholder='4242 4242 4242 4242'
                    />
                  </Field>

                  <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
                    <FieldLabel htmlFor='horizontal-collapsible-cardName'>Name</FieldLabel>
                    <Input id='horizontal-collapsible-cardName' className='sm:col-span-5' placeholder='John Doe' />
                  </Field>

                  <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
                    <FieldLabel htmlFor='horizontal-collapsible-expiryDate'>Expiry Date</FieldLabel>
                    <Input id='horizontal-collapsible-expiryDate' className='sm:col-span-5' placeholder='MM/YY' />
                  </Field>

                  <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
                    <FieldLabel htmlFor='horizontal-collapsible-cvv'>CVV Code</FieldLabel>
                    <Input id='horizontal-collapsible-cvv' className='sm:col-span-5' placeholder='123' maxLength={3} />
                  </Field>
                </>
              )}

              {selectedPayment === 'cod' && (
                <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
                  <div className='shrink-0' />
                  <p className='text-muted-foreground text-sm sm:col-span-5'>
                    Cash on Delivery is a type of payment method where the recipient makes payment at the time of
                    delivery rather than in advance.
                  </p>
                </Field>
              )}

              <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
                <div className='flex gap-3 sm:col-span-5 sm:col-start-2'>
                  <Button type='submit'>Place Order</Button>
                  <Button variant='outline'>Cancel</Button>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default CollapsibleForm
