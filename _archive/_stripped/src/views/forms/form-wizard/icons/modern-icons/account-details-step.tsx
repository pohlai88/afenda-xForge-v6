'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { EyeOffIcon, EyeIcon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'

// Type Imports
import type { StepperType } from './index'

const AccountDetailsStep = ({ stepper }: { stepper: StepperType }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-start gap-1'>
        <h2 className='text-base font-semibold'>Account Details</h2>
        <p className='text-muted-foreground text-sm'>Enter Your Account Details.</p>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-account-username'>Username</Label>
          <Input id='modern-account-username' placeholder='johndoe' autoComplete='username' />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-account-email'>Email</Label>
          <Input id='modern-account-email' type='email' placeholder='john.doe@email.com' />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-account-password'>Password</Label>
          <InputGroup>
            <InputGroupInput
              id='modern-account-password'
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder='••••••••••'
              autoComplete='new-password'
            />
            <InputGroupAddon align='inline-end'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setIsPasswordVisible(prev => !prev)}
                className='text-muted-foreground hover:bg-transparent'
              >
                {isPasswordVisible ? <EyeOffIcon className='size-4' /> : <EyeIcon className='size-4' />}
                <span className='sr-only'>{isPasswordVisible ? 'Hide password' : 'Show password'}</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='modern-account-confirm-password'>Confirm Password</Label>
          <InputGroup>
            <InputGroupInput
              id='modern-account-confirm-password'
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              placeholder='••••••••••'
              autoComplete='new-password'
            />
            <InputGroupAddon align='inline-end'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setIsConfirmPasswordVisible(prev => !prev)}
                className='text-muted-foreground hover:bg-transparent'
              >
                {isConfirmPasswordVisible ? <EyeOffIcon className='size-4' /> : <EyeIcon className='size-4' />}
                <span className='sr-only'>{isConfirmPasswordVisible ? 'Hide password' : 'Show password'}</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      <div className='flex justify-between gap-4'>
        <Button variant='secondary' disabled={stepper.state.isFirst} onClick={() => stepper.navigation.prev()}>
          <ArrowLeftIcon />
          Previous
        </Button>
        <Button onClick={() => stepper.navigation.next()}>
          Next
          <ArrowRightIcon />
        </Button>
      </div>
    </div>
  )
}

export default AccountDetailsStep
