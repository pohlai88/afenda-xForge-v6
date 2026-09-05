'use client'

// React Import
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Import
import { EyeIcon, EyeOffIcon } from 'lucide-react'

// Component Import
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

const RegisterForm = () => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <form onSubmit={e => e.preventDefault()}>
      <FieldGroup className='gap-4'>
        {/* Name */}
        <Field className='gap-2'>
          <FieldLabel className='leading-5' htmlFor='username'>
            Name*
          </FieldLabel>
          <Input type='text' id='username' placeholder='Enter your name' />
        </Field>
        {/* Email */}
        <Field className='gap-2'>
          <FieldLabel className='leading-5' htmlFor='userEmail'>
            Email address*
          </FieldLabel>
          <Input type='email' id='userEmail' placeholder='Enter your email address' />
        </Field>
        {/* Password */}
        <Field className='w-full gap-2'>
          <FieldLabel className='leading-5' htmlFor='password'>
            Password*
          </FieldLabel>
          <InputGroup>
            <InputGroupInput id='password' type={isVisible ? 'text' : 'password'} placeholder='••••••••••••••••' />
            <InputGroupAddon align='inline-end' className='pr-1.5'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setIsVisible(prevState => !prevState)}
                className='text-muted-foreground rounded-l-none hover:bg-transparent'
              >
                {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        {/* Privacy policy */}
        <Field orientation='horizontal' className='flex items-center gap-2'>
          <Checkbox id='rememberMe' />
          <FieldLabel htmlFor='rememberMe'>
            <span className='text-muted-foreground'>I agree to all</span>{' '}
            <Link href='#'>Terms, Privacy Policy and Fees</Link>
          </FieldLabel>
        </Field>
        <Field>
          <Button className='w-full' type='submit'>
            Sign up to Shadcn Studio
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default RegisterForm
