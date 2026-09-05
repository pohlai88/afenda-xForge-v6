'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { EyeOffIcon, EyeIcon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'

// Type Imports
import type { StepperType } from './index'

const AccountDetailsStep = ({ stepper }: { stepper: StepperType }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-start gap-1'>
        <h2 className='text-2xl font-semibold'>Account Information</h2>
        <p className='text-muted-foreground'>Enter Your Account Details</p>
      </div>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <div className='flex flex-col items-start gap-2'>
          <Label htmlFor='multi-step-account-username' className='leading-5'>
            Username
          </Label>
          <Input id='multi-step-account-username' placeholder='John Doe' autoComplete='username' />
        </div>
        <div className='flex flex-col items-start gap-2'>
          <Label htmlFor='multi-step-account-email' className='leading-5'>
            Email
          </Label>
          <Input id='multi-step-account-email' type='email' placeholder='john.doe@example.com' />
        </div>
        <div className='flex flex-col items-start gap-2'>
          <Label htmlFor='multi-step-account-password' className='leading-5'>
            Password
          </Label>
          <InputGroup className='h-9 w-full'>
            <InputGroupInput
              id='multi-step-account-password'
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder='Password'
              autoComplete='new-password'
            />
            <InputGroupAddon align='inline-end' className='pr-1.5'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsPasswordVisible(prevState => !prevState)}
                className='text-muted-foreground focus-visible:ring-ring/50 hover:bg-transparent'
              >
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                <span className='sr-only'>{isPasswordVisible ? 'Hide password' : 'Show password'}</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className='flex flex-col items-start gap-2'>
          <Label htmlFor='multi-step-account-confirm-password' className='leading-5'>
            Confirm Password
          </Label>
          <InputGroup className='h-9 w-full'>
            <InputGroupInput
              id='multi-step-account-confirm-password'
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              placeholder='Confirm Password'
              autoComplete='new-password'
            />
            <InputGroupAddon align='inline-end' className='pr-1.5'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsConfirmPasswordVisible(prevState => !prevState)}
                className='text-muted-foreground focus-visible:ring-ring/50 hover:bg-transparent'
              >
                {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                <span className='sr-only'>{isConfirmPasswordVisible ? 'Hide password' : 'Show password'}</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className='flex flex-col items-start gap-2 sm:col-span-2'>
          <Label htmlFor='multi-step-account-profile-link' className='leading-5'>
            Profile Link
          </Label>
          <Input id='multi-step-account-profile-link' type='url' placeholder='johndoe/profile' />
        </div>
      </div>
      <div className='flex justify-between gap-4'>
        <Button variant='secondary' onClick={() => stepper.navigation.prev()} disabled={stepper.state.isFirst}>
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
