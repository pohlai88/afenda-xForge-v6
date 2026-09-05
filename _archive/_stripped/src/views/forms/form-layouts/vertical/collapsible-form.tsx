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
      {/* Delivery Address Section */}
      <AccordionItem value='delivery-address' className='bg-card rounded-lg border'>
        <AccordionTrigger className='px-6 py-4 hover:no-underline'>
          <h3 className='text-base font-semibold'>Delivery Address</h3>
        </AccordionTrigger>
        <AccordionContent className='border-t px-6 pt-6 pb-6'>
          <FieldGroup className='grid gap-6 sm:grid-cols-2'>
            <Field className='gap-2'>
              <FieldLabel htmlFor='fullName'>Full Name</FieldLabel>
              <Input id='fullName' placeholder='John Doe' />
            </Field>

            <Field className='gap-2'>
              <FieldLabel htmlFor='phoneNo'>Phone No.</FieldLabel>
              <Input id='phoneNo' type='tel' placeholder='+1 123 456 7890' />
            </Field>

            <Field className='gap-2 sm:col-span-full'>
              <FieldLabel htmlFor='address'>Address</FieldLabel>
              <Textarea id='address' placeholder='Enter your full address' rows={3} />
            </Field>

            <Field className='gap-2'>
              <FieldLabel htmlFor='pincode'>Pincode</FieldLabel>
              <Input id='pincode' placeholder='123456' />
            </Field>

            <Field className='gap-2'>
              <FieldLabel htmlFor='landmark'>Landmark</FieldLabel>
              <Input id='landmark' placeholder='Near City Mall' />
            </Field>

            <Field className='gap-2'>
              <FieldLabel htmlFor='city'>City</FieldLabel>
              <Input id='city' placeholder='New York' />
            </Field>

            <Field className='gap-2'>
              <FieldLabel htmlFor='state'>State</FieldLabel>
              <Select items={states}>
                <SelectTrigger id='state' className='w-full'>
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
            </Field>

            <div className='space-y-3 sm:col-span-full'>
              <FieldLabel>Address Type</FieldLabel>
              <RadioGroup
                value={selectedAddressType}
                onValueChange={setSelectedAddressType}
                className='flex flex-wrap gap-x-6 gap-y-2'
              >
                <Field orientation='horizontal' className='w-fit items-center gap-2'>
                  <RadioGroupItem value='home' id='home' />
                  <FieldLabel htmlFor='home' className='font-normal'>
                    Home (All day delivery)
                  </FieldLabel>
                </Field>
                <Field orientation='horizontal' className='w-fit items-center gap-2'>
                  <RadioGroupItem value='office' id='office' />
                  <FieldLabel htmlFor='office' className='font-normal'>
                    Office (Delivery between 10 AM - 5 PM)
                  </FieldLabel>
                </Field>
              </RadioGroup>
            </div>
          </FieldGroup>
        </AccordionContent>
      </AccordionItem>

      {/* Delivery Options Section */}
      <AccordionItem value='delivery-options' className='bg-card rounded-lg border'>
        <AccordionTrigger className='px-6 py-4 hover:no-underline'>
          <h3 className='text-base font-semibold'>Delivery Options</h3>
        </AccordionTrigger>
        <AccordionContent className='border-t px-6 pt-6 pb-6'>
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
                  id={option.value}
                  aria-describedby={`${option.value}-description`}
                />
                <div className='grid grow gap-2'>
                  <Label htmlFor={option.value} className='justify-between after:absolute after:inset-0'>
                    {option.title} <span className='font-semibold'>{option.price}</span>
                  </Label>
                  <p id={`${option.value}-description`} className='text-muted-foreground text-sm'>
                    {option.date}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </AccordionContent>
      </AccordionItem>

      {/* Payment Method Section */}
      <AccordionItem value='payment-method' className='bg-card rounded-lg border border-b!'>
        <AccordionTrigger className='px-6 py-4 hover:no-underline'>
          <h3 className='text-base font-semibold'>Payment Method</h3>
        </AccordionTrigger>
        <AccordionContent className='border-t px-6 pt-6 pb-6'>
          <form className='space-y-6'>
            <RadioGroup
              value={selectedPayment}
              onValueChange={setSelectedPayment}
              className='flex gap-6 max-sm:flex-col'
            >
              <Field orientation='horizontal' className='w-fit items-center gap-2'>
                <RadioGroupItem value='card' id='card' />
                <FieldLabel htmlFor='card' className='flex items-center gap-1.5 font-normal'>
                  <CreditCardIcon className='size-4' />
                  Credit/Debit/ATM Card
                </FieldLabel>
              </Field>

              <Field orientation='horizontal' className='w-fit items-center gap-2'>
                <RadioGroupItem value='cod' id='cod' />
                <FieldLabel htmlFor='cod' className='flex items-center gap-1.5 font-normal'>
                  <InfoIcon className='size-4' />
                  Cash On Delivery
                </FieldLabel>
              </Field>
            </RadioGroup>

            {selectedPayment === 'card' && (
              <FieldGroup className='gap-6 lg:w-1/2'>
                <Field className='gap-2'>
                  <FieldLabel htmlFor='cardNumber'>Card Number</FieldLabel>
                  <Input id='cardNumber' placeholder='4242 4242 4242 4242' />
                </Field>

                <div className='grid gap-6 sm:grid-cols-3'>
                  <Field className='gap-2'>
                    <FieldLabel htmlFor='cardName'>Name</FieldLabel>
                    <Input id='cardName' placeholder='John Doe' />
                  </Field>

                  <Field className='gap-2'>
                    <FieldLabel htmlFor='expiryDate'>Expiry Date</FieldLabel>
                    <Input id='expiryDate' placeholder='MM/YY' />
                  </Field>

                  <Field className='gap-2'>
                    <FieldLabel htmlFor='cvv'>CVV Code</FieldLabel>
                    <Input id='cvv' placeholder='123' maxLength={3} />
                  </Field>
                </div>
              </FieldGroup>
            )}

            {selectedPayment === 'cod' && (
              <p className='text-muted-foreground text-sm'>
                Cash on Delivery is a type of payment method where the recipient makes payment at the time of delivery
                rather than in advance.
              </p>
            )}

            <div className='flex gap-3'>
              <Button type='submit'>Place Order</Button>
              <Button variant='outline'>Cancel</Button>
            </div>
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default CollapsibleForm
