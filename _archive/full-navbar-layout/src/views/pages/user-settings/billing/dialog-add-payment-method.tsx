'use client'

// React Imports
import { useState, type ReactElement } from 'react'

// Third-party Imports
import Cards from 'react-19-credit-card'

import { usePaymentInputs } from 'react-payment-inputs'

import { CreditCardIcon } from 'lucide-react'

// Component Imports
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Util Imports
import { cn } from '@/lib/utils'

// Style Imports
import 'react-19-credit-card/dist/es/index.css'

type Props = {
  trigger: ReactElement
  defaultOpen?: boolean
  className?: string
}

const AddPaymentMethodDialog = ({ defaultOpen = false, trigger, className }: Props) => {
  const [open, setOpen] = useState(defaultOpen)

  const [state, setState] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    focus: ''
  })

  //@ts-expect-error untyped event from payment input
  const handleInputChange = evt => {
    const { name, value } = evt.target

    setState(prev => ({ ...prev, [name]: value }))
  }

  //@ts-expect-error untyped event from payment input
  const handleInputFocus = evt => {
    setState(prev => ({ ...prev, focus: evt.target.name }))
  }

  const { getCardNumberProps, getExpiryDateProps, getCVCProps } = usePaymentInputs()

  // Transform expiry for Cards component - remove spaces and ensure MM/YY format
  const getFormattedExpiry = (expiry: string) => {
    const cleanExpiry = expiry.replace(/\s/g, '') // Remove spaces

    return cleanExpiry
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} onClick={() => setOpen(true)} />
      <DialogContent className={cn('sm:max-w-155 [&>[data-slot=dialog-close]>svg]:size-5', className)}>
        <DialogHeader className='flex-row items-center gap-4 text-left'>
          <Avatar className='size-11 shrink-0 rounded-md after:rounded-md'>
            <AvatarFallback className='text-foreground rounded-md border bg-transparent'>
              <CreditCardIcon className='size-6' />
            </AvatarFallback>
          </Avatar>
          <div className='space-y-2'>
            <DialogTitle className='m-0 text-lg'>Add Payment Method</DialogTitle>
            <DialogDescription className='text-sm'>Add a payment method to active plan</DialogDescription>
          </div>
        </DialogHeader>

        {/* Credit card */}
        <div className='bg-muted flex items-center justify-center rounded-lg p-6 max-[420px]:p-2 sm:min-h-82.5 max-[420px]:[&>div]:!w-full max-[420px]:[&>div>div]:!w-full'>
          <Cards
            number={state.number}
            expiry={getFormattedExpiry(state.expiry)}
            cvc={state.cvc}
            name={state.name}
            focused={state.focus as 'name' | 'number' | 'expiry' | 'cvc' | undefined}
          />
        </div>

        <div className='grid grid-cols-4 gap-4'>
          <div className='col-span-3 space-y-2 max-sm:col-span-4'>
            <Label htmlFor='username'>Name on card</Label>
            <Input
              id='username'
              type='text'
              name='name'
              placeholder='John Doe'
              value={state.name}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
            />
          </div>

          <div className='space-y-2 max-sm:col-span-4'>
            <Label htmlFor='expiry-date'>Expiry</Label>
            <Input
              {...getExpiryDateProps({ onChange: handleInputChange, onFocus: handleInputFocus })}
              id='expiry-date'
              name='expiry'
              value={state.expiry}
              placeholder='MM/YY'
            />
          </div>

          <div className='col-span-3 space-y-2 max-sm:col-span-4'>
            <Label htmlFor='card-number'>Card number</Label>
            <Input
              {...getCardNumberProps()}
              id='card-number'
              name='number'
              value={state.number}
              placeholder='1234 5678 9012 3456'
              onChange={handleInputChange}
              onFocus={handleInputFocus}
            />
          </div>

          <div className='space-y-2 max-sm:col-span-4'>
            <Label htmlFor='cvc'>CVC</Label>
            <Input
              {...getCVCProps()}
              id='cvc'
              name='cvc'
              placeholder='CVC'
              value={state.cvc}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
            />
          </div>
        </div>

        <div className='flex flex-col-reverse gap-4 sm:flex-row sm:justify-end'>
          <DialogClose render={<Button variant='outline' size='lg' />}>Cancel</DialogClose>
          <Button size='lg'>Add card details</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddPaymentMethodDialog
