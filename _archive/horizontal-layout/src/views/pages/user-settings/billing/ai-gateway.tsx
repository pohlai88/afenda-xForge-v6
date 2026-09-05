'use client'

import { useState } from 'react'

import { ChevronDownIcon, HandCoinsIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

const presets = [20, 50, 100, 500]

const AiGateway = ({ defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  const [autoPayEnabled, setAutoPayEnabled] = useState(false)
  const [selected, setSelected] = useState<number>(500)
  const [customMode, setCustomMode] = useState(false)
  const [customValue, setCustomValue] = useState<string>('')

  const format = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const displayAmount = () => {
    if (customMode) {
      const parsed = parseFloat(customValue || '0')

      return isNaN(parsed) ? format(0) : format(parsed)
    }

    return format(selected)
  }

  const onSelectPreset = (amt: number) => {
    setSelected(amt)
    setCustomMode(false)
    setCustomValue('')
  }

  const onSelectCustom = () => {
    setCustomMode(true)
    setCustomValue('')
  }

  const onContinue = () => {
    const amount = customMode ? parseFloat(customValue || '0') : selected

    console.log('Continue to payment with amount:', amount)
    setOpen(false)
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>AI Gateway Credit</h3>
        <p className='text-muted-foreground text-sm'>
          Purchase credit for AI Gateway. These are separate from any credit included in your Pro plan.
        </p>
      </div>

      {/* Content */}
      <div className='lg:col-span-2'>
        <Card>
          <CardContent className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='border-primary bg-muted flex size-8 items-center justify-center rounded-full border'>
                <HandCoinsIcon className='size-4' />
              </div>
              <div className='flex flex-col'>
                <p className='text-muted-foreground text-sm'>Current Balance</p>
                <p className='text-sm font-medium'>$0.00</p>
              </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button />}>
                <span>Buy Credit</span>
              </DialogTrigger>
              <DialogContent className='sm:max-w-155 [&>[data-slot=dialog-close]>svg]:size-5'>
                <DialogHeader>
                  <div className='space-y-1'>
                    <DialogTitle className='m-0 text-lg'>Buy AI Gateway Credit</DialogTitle>
                    <DialogDescription className='text-sm'>
                      Purchase credit as a one time top-up to use for your team&apos;s AI Gateway usage. Credit expires
                      1 year after purchase and is only valid for use on AI Gateway.
                    </DialogDescription>
                  </div>
                </DialogHeader>

                <div className='mt-4 text-center'>
                  <div className='text-5xl font-extrabold tracking-tight'>{displayAmount()}</div>
                </div>

                <div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
                  {presets.map(p => (
                    <Button
                      key={p}
                      size='sm'
                      variant={customMode || selected !== p ? 'ghost' : 'default'}
                      onClick={() => onSelectPreset(p)}
                      className='rounded-md px-4 py-2'
                    >
                      ${p}
                    </Button>
                  ))}

                  <Button
                    size='sm'
                    variant={customMode ? 'default' : 'ghost'}
                    onClick={onSelectCustom}
                    className='rounded-md px-4 py-2'
                  >
                    Custom
                  </Button>
                </div>

                {customMode && (
                  <div className='mt-4 grid grid-cols-1 gap-2'>
                    <Label htmlFor='custom-amount'>Custom amount (USD)</Label>
                    <Input
                      id='custom-amount'
                      type='number'
                      step='0.01'
                      min='0'
                      max='999999'
                      value={customValue}
                      onChange={e => {
                        const val = e.target.value

                        if (
                          val === '' ||
                          (parseFloat(val) <= 999999 && val.replace('.', '').replace('-', '').length <= 9)
                        ) {
                          setCustomValue(val)
                        }
                      }}
                      placeholder='Enter amount'
                    />
                  </div>
                )}

                <div className='flex flex-col-reverse gap-4 sm:flex-row sm:justify-end'>
                  <DialogClose render={<Button variant='outline' />}>Cancel</DialogClose>
                  <Button onClick={onContinue}>Continue to Payment</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
          <CardContent>
            <Separator />
          </CardContent>
          <CardContent>
            <Collapsible className='flex flex-col gap-2'>
              <CollapsibleTrigger className='group flex w-full items-center justify-between gap-4'>
                <p className='text-sm font-semibold'>Auto Reload</p>
                <ChevronDownIcon className='text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180' />
                <span className='sr-only'>Toggle</span>
              </CollapsibleTrigger>
              <CollapsibleContent className='mt-3 flex h-(--collapsible-panel-height) flex-col gap-2 overflow-hidden transition-all duration-300 data-ending-style:h-0 data-starting-style:h-0'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm'>Auto pay</p>
                  <Switch checked={autoPayEnabled} onCheckedChange={setAutoPayEnabled} />
                </div>
                <div className={`mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 ${!autoPayEnabled ? 'opacity-60' : ''}`}>
                  <div className='w-full space-y-2'>
                    <Label htmlFor='amount' className={autoPayEnabled ? '' : 'cursor-not-allowed'}>
                      When balance falls below
                    </Label>
                    <InputGroup>
                      <InputGroupInput id='amount' type='number' placeholder='10' required disabled={!autoPayEnabled} />
                      <InputGroupAddon align='inline-end'>
                        <p className='text-sm'>USD</p>
                        <span className='sr-only'>USD</span>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                  <div className='w-full space-y-2'>
                    <Label htmlFor='set-amount' className={autoPayEnabled ? '' : 'cursor-not-allowed'}>
                      Recharge to target balance
                    </Label>
                    <InputGroup>
                      <InputGroupInput
                        id='set-amount'
                        type='number'
                        placeholder='30'
                        required
                        disabled={!autoPayEnabled}
                      />
                      <InputGroupAddon align='inline-end'>
                        <p className='text-sm'>USD</p>
                        <span className='sr-only'>USD</span>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                  <div className='w-full space-y-2 md:col-span-2'>
                    <Label htmlFor='set-amount' className={autoPayEnabled ? '' : 'cursor-not-allowed'}>
                      Maximum monthly spend
                    </Label>
                    <InputGroup>
                      <InputGroupInput id='amount' type='number' placeholder='30' required disabled={!autoPayEnabled} />
                      <InputGroupAddon align='inline-end'>
                        <p className='text-sm'>USD</p>
                        <span className='sr-only'>USD</span>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>
                <div className='mt-6 flex justify-end gap-4'>
                  <Button variant='outline' disabled={!autoPayEnabled}>
                    Cancel
                  </Button>
                  <Button type='submit' disabled={!autoPayEnabled}>
                    Save Changes
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AiGateway
