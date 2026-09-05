'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { PackageIcon, TruckIcon, ZapIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

const deliveryTypes = [
  {
    value: 'standard',
    title: 'Standard',
    description: 'Delivery in 3-5 days',
    icon: <PackageIcon />
  },
  {
    value: 'express',
    title: 'Express',
    description: 'Delivery within 2 days',
    icon: <TruckIcon />
  },
  {
    value: 'overnight',
    title: 'Overnight',
    description: 'Delivery within 1 day',
    icon: <ZapIcon />
  }
]

const promoCodes = [
  {
    code: 'TAKEITALL',
    description: 'Apply this code to get 15% discount on orders above 20$.',
    disabled: true,
    disabledMessage: 'Shop more to apply this offer'
  },
  {
    code: 'FESTIVE10',
    description: 'Apply this code to get 10% discount on all orders.',
    disabled: false
  },
  {
    code: 'MYSTERYEDEAL',
    description: 'Apply this code to get discount between 10%-30%.',
    disabled: false
  }
]

const states = [
  { value: null, label: 'Select State' },
  { value: 'ny', label: 'New York' },
  { value: 'ca', label: 'California' },
  { value: 'tx', label: 'Texas' },
  { value: 'fl', label: 'Florida' },
  { value: 'il', label: 'Illinois' },
  { value: 'pa', label: 'Pennsylvania' },
  { value: 'oh', label: 'Ohio' },
  { value: 'ga', label: 'Georgia' }
]

const StickyActionsForm = () => {
  const [useAsDefault, setUseAsDefault] = useState(false)
  const [selectedAddressType, setSelectedAddressType] = useState('home')
  const [selectedPayment, setSelectedPayment] = useState('card')
  const [promoCode, setPromoCode] = useState('')

  const handleApplyPromo = (code: string) => {
    setPromoCode(code)
  }

  return (
    <div className='bg-background min-h-screen'>
      <form>
        {/* Sticky Header */}
        <div className='bg-muted sticky top-16 z-10 border-b'>
          <div className='mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <h2 className='text-lg font-semibold'>Sticky Action Bar</h2>
              <div className='flex gap-3'>
                <Button variant='outline'>Back</Button>
                <Button type='submit'>Place Order</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
          <div className='space-y-8'>
            {/* Section 1: Delivery Address */}
            <div className='mb-6 space-y-1'>
              <h3 className='font-semibold'>1. Delivery Address</h3>
              <p className='text-muted-foreground text-sm'>Enter your delivery address details.</p>
            </div>

            <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
              <Field className='gap-2'>
                <FieldLabel htmlFor='fullName'>Full Name</FieldLabel>
                <Input id='fullName' placeholder='John Doe' />
              </Field>

              <Field className='gap-2'>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <Input id='email' type='email' placeholder='john@doe' />
              </Field>

              <Field className='gap-2'>
                <FieldLabel htmlFor='contactNumber'>Contact Number</FieldLabel>
                <Input id='contactNumber' type='tel' placeholder='658 123 4567' />
              </Field>

              <Field className='gap-2'>
                <FieldLabel htmlFor='alternateNumber'>Alternate Number</FieldLabel>
                <Input id='alternateNumber' type='tel' placeholder='658 123 4567' />
              </Field>

              <Field className='gap-2 sm:col-span-full'>
                <FieldLabel htmlFor='address'>Address</FieldLabel>
                <Textarea id='address' placeholder='Enter your full address' rows={3} />
              </Field>

              <Field className='gap-2'>
                <FieldLabel htmlFor='pincode'>Pincode</FieldLabel>
                <Input id='pincode' placeholder='658458' />
              </Field>

              <Field className='gap-2'>
                <FieldLabel htmlFor='landmark'>Landmark</FieldLabel>
                <Input id='landmark' placeholder='Nr. Wall Street' />
              </Field>

              <Field className='gap-2'>
                <FieldLabel htmlFor='city'>City</FieldLabel>
                <Input id='city' placeholder='Jackson' />
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

              <Field orientation='horizontal' className='col-span-full gap-2'>
                <Checkbox
                  id='defaultAddress'
                  checked={useAsDefault}
                  onCheckedChange={checked => setUseAsDefault(checked as boolean)}
                />
                <FieldLabel htmlFor='defaultAddress' className='text-sm font-normal'>
                  Use this as default delivery address
                </FieldLabel>
              </Field>

              <div className='col-span-full space-y-3'>
                <FieldLabel>Address Type</FieldLabel>
                <RadioGroup
                  value={selectedAddressType}
                  onValueChange={setSelectedAddressType}
                  className='flex gap-x-6 gap-y-3 max-sm:flex-col'
                >
                  <Field orientation='horizontal' className='w-fit items-center gap-2'>
                    <RadioGroupItem value='home' id='home' />
                    <FieldLabel htmlFor='home' className='font-normal'>
                      Home (All-day delivery)
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

            <Separator />

            {/* Section 2: Delivery Type */}
            <div className='mb-6 space-y-1'>
              <h3 className='font-semibold'>2. Delivery Type</h3>
              <p className='text-muted-foreground text-sm'>Choose your preferred delivery method.</p>
            </div>

            <RadioGroup className='w-full justify-items-center sm:grid-cols-3' defaultValue='1'>
              {deliveryTypes.map((type, index) => (
                <div
                  key={index}
                  className='border-input has-data-checked:border-primary/50 relative flex w-full flex-col items-center gap-3 rounded-lg border p-4 outline-none'
                >
                  <RadioGroupItem
                    value={type.value}
                    id={type.value}
                    className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5'
                    aria-describedby={`${type.value}-description`}
                    aria-label='plan-radio-basic'
                  />
                  <div className='grid grow justify-items-center gap-2'>
                    {type.icon}
                    <Label htmlFor={type.value} className='justify-center after:absolute after:inset-0'>
                      {type.title}
                    </Label>
                    <p id={`${type.value}-description`} className='text-muted-foreground text-center text-xs'>
                      {type.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <Separator />

            {/* Section 3: Apply Promo Code */}
            <div className='mb-6 space-y-1'>
              <h3 className='font-semibold'>3. Apply Promo Code</h3>
              <p className='text-muted-foreground text-sm'>Enter your promo code to get discounts.</p>
            </div>

            <div className='space-y-4'>
              <div className='flex gap-3'>
                <Input
                  placeholder='ENTER PROMO CODE'
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  className='uppercase'
                />
                <Button>Apply</Button>
              </div>

              <div className='flex items-center gap-4'>
                <Separator className='flex-1' />
                <p>or</p>
                <Separator className='flex-1' />
              </div>

              <div className='space-y-3'>
                {promoCodes.map((promo, index) => (
                  <div
                    key={index}
                    className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${
                      promo.disabled ? 'bg-muted/50 opacity-60' : ''
                    }`}
                  >
                    <div className='flex-1'>
                      <div className={`font-medium ${promo.disabled ? 'text-muted-foreground' : ''}`}>{promo.code}</div>
                      <p className='text-muted-foreground mt-1 text-xs'>{promo.description}</p>
                      {promo.disabled && promo.disabledMessage && (
                        <p className='text-destructive mt-2 text-xs font-medium'>{promo.disabledMessage}</p>
                      )}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleApplyPromo(promo.code)}
                      disabled={promo.disabled}
                    >
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Section 4: Payment Method */}
            <h3 className='mb-6 font-semibold'>4. Payment Method</h3>

            <div className='space-y-6'>
              <RadioGroup
                value={selectedPayment}
                onValueChange={setSelectedPayment}
                className='flex gap-x-6 gap-y-3 max-sm:flex-col'
              >
                <Field orientation='horizontal' className='w-fit items-center'>
                  <RadioGroupItem value='card' id='card' />
                  <FieldLabel htmlFor='card' className='font-normal'>
                    Credit/Debit/ATM Card
                  </FieldLabel>
                </Field>
                <Field orientation='horizontal' className='w-fit items-center'>
                  <RadioGroupItem value='cod' id='cod' />
                  <FieldLabel htmlFor='cod' className='font-normal'>
                    Cash On Delivery
                  </FieldLabel>
                </Field>
              </RadioGroup>

              {selectedPayment === 'card' && (
                <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
                  <Field className='gap-2 sm:col-span-full'>
                    <FieldLabel htmlFor='cardNumber'>Card Number</FieldLabel>
                    <Input id='cardNumber' placeholder='4242 4242 4242 4242' />
                  </Field>

                  <Field className='gap-2'>
                    <FieldLabel htmlFor='cardName'>Name</FieldLabel>
                    <Input id='cardName' placeholder='John Doe' />
                  </Field>

                  <Field className='gap-2'>
                    <FieldLabel htmlFor='expiryDate'>Exp. Date</FieldLabel>
                    <Input id='expiryDate' placeholder='MM/YY' />
                  </Field>

                  <Field className='gap-2'>
                    <FieldLabel htmlFor='cvv'>CVV Code</FieldLabel>
                    <Input id='cvv' placeholder='654' maxLength={3} />
                  </Field>
                </FieldGroup>
              )}

              {selectedPayment === 'cod' && (
                <div className='text-muted-foreground space-y-3 text-sm'>
                  <p>
                    Cash on delivery is a mode of payment where you make the payment after the goods/services are
                    received.
                  </p>
                  <p>You can pay cash or make the payment via debit/credit card directly to the delivery person.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default StickyActionsForm
