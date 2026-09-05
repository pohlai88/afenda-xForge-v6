'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { EyeOffIcon, EyeIcon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

// Type Imports
import type * as Stepperize from '@stepperize/react'

import type { AccountSetupValues } from './index'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const timezoneItems = [
  { label: 'America/New York (EST)', value: 'america-new-york' },
  { label: 'America/Los Angeles (PST)', value: 'america-los-angeles' },
  { label: 'America/Chicago (CST)', value: 'america-chicago' },
  { label: 'Europe/London (GMT)', value: 'europe-london' },
  { label: 'Europe/Paris (CET)', value: 'europe-paris' },
  { label: 'Asia/Tokyo (JST)', value: 'asia-tokyo' },
  { label: 'Asia/Singapore (SGT)', value: 'asia-singapore' },
  { label: 'Australia/Sydney (AEST)', value: 'australia-sydney' }
]

const FormSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().min(1, 'Email is required').email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Please enter a valid phone number'),
    timezone: z.string().min(1, 'Please select your timezone')
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  })

const AccountSetupStep = ({
  stepper,
  defaultValues,
  onSave
}: {
  stepper: Stepperize.Stepper<any>
  defaultValues: AccountSetupValues
  onSave: (data: AccountSetupValues) => void
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues
  })

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    onSave(data)
    stepper.navigation.next()
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-start'>
        <h2 className='text-lg font-semibold'>Create Your Account</h2>
        <p className='text-muted-foreground'>Let&apos;s get started with your account credentials</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6'>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Controller
            control={form.control}
            name='fullName'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Full Name
                </FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder='Sarah Anderson' />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='email'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Work Email
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type='email'
                  aria-invalid={fieldState.invalid}
                  placeholder='sarah.anderson@company.com'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='password'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Password
                </FieldLabel>
                <InputGroup className='w-full'>
                  <InputGroupInput
                    {...field}
                    id={field.name}
                    type={isPasswordVisible ? 'text' : 'password'}
                    aria-invalid={fieldState.invalid}
                    placeholder='Password'
                  />
                  <InputGroupAddon align='inline-end'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => setIsPasswordVisible(prevState => !prevState)}
                      className='text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent'
                    >
                      {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                      <span className='sr-only'>{isPasswordVisible ? 'Hide password' : 'Show password'}</span>
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='confirmPassword'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Confirm Password
                </FieldLabel>
                <InputGroup className='w-full'>
                  <InputGroupInput
                    {...field}
                    id={field.name}
                    type={isConfirmPasswordVisible ? 'text' : 'password'}
                    aria-invalid={fieldState.invalid}
                    placeholder='Confirm Password'
                  />
                  <InputGroupAddon align='inline-end'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => setIsConfirmPasswordVisible(prevState => !prevState)}
                      className='text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent'
                    >
                      {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                      <span className='sr-only'>{isConfirmPasswordVisible ? 'Hide password' : 'Show password'}</span>
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name='phone'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Phone Number
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type='tel'
                  aria-invalid={fieldState.invalid}
                  placeholder='+1 (555) 000-0000'
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9+\s()\-./]/g, '')

                    field.onChange(value)
                  }}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='timezone'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Timezone
                </FieldLabel>
                <Select onValueChange={field.onChange} value={field.value} items={timezoneItems}>
                  <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className='w-full'>
                    <SelectValue placeholder='Select timezone' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {timezoneItems.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        <div className='flex justify-between gap-4'>
          <Button
            type='button'
            variant='secondary'
            onClick={() => stepper.navigation.prev()}
            disabled={stepper.state.isFirst}
          >
            <ArrowLeftIcon />
            Previous
          </Button>
          <Button type='submit'>
            Next
            <ArrowRightIcon />
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AccountSetupStep
