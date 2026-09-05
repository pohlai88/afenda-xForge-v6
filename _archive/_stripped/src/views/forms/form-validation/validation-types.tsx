'use client'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

const formSchema = z.object({
  requiredField: z.string().min(1, 'This field is required'),
  numericOnly: z.string().min(1, 'This field is required').regex(/^\d+$/, 'Must only consist of numbers'),
  alphabeticOnly: z
    .string()
    .min(1, 'This field is required')
    .regex(/^[a-zA-Z]+$/, 'Only alphabetic characters'),
  password: z.string().min(1, 'Password is required'),
  minMaxLength: z
    .string()
    .min(1, 'This field is required')
    .min(5, 'Must be between 5 and 10 characters')
    .max(10, 'Must be between 5 and 10 characters'),
  email: z.string().min(1, 'This field is required').email('Must be a valid email'),
  numberRange: z
    .number({
      required_error: 'This field is required',
      invalid_type_error: 'Enter Number between 10 & 20'
    })
    .min(10, 'Enter Number between 10 & 20')
    .max(20, 'Enter Number between 10 & 20'),
  regexPattern: z
    .string()
    .min(1, 'This field is required')
    .regex(/^[0-9]+$/, 'Must match the specified regular expression : ^([0-9]+)$ - numbers only'),
  exactLength: z.string().min(1, 'This field is required').length(3, 'Length must be exactly 3 characters.'),
  digitsField: z
    .string()
    .min(1, 'This field is required')
    .regex(/^\d{3}$/, 'The digits field must be numeric and exactly contain 3 digits'),
  alphanumericWithSymbols: z
    .string()
    .min(1, 'This field is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only alphabetic characters, numbers, dashes or underscores'),
  url: z.string().min(1, 'This field is required').url('Must be a valid url')
})

type FormValues = z.infer<typeof formSchema>

const defaultValues: FormValues = {
  requiredField: '',
  numericOnly: '',
  alphabeticOnly: '',
  password: '',
  minMaxLength: '',
  email: '',
  numberRange: undefined as unknown as number,
  regexPattern: '',
  exactLength: '',
  digitsField: '',
  alphanumericWithSymbols: '',
  url: ''
}

const ValidationTypes = () => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues
  })

  function onSubmit(data: FormValues) {
    console.log('Validation types form submitted:', data)
    alert('Form submitted successfully! Check the console for details.')
    form.reset()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
      <div className='grid gap-6 md:grid-cols-2'>
        <Controller
          name='requiredField'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>Required Field</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder='This field is required'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='numericOnly'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>Numeric Only</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder='Must only consist of numbers'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='alphabeticOnly'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>Alphabetic Only</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder='Only alphabetic characters'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='password'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type='password'
                aria-invalid={fieldState.invalid}
                placeholder='Password Input Field'
                autoComplete='new-password'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='minMaxLength'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>Min & Max Length</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder='Must be between 5 and 10 characters'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='email'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type='email'
                aria-invalid={fieldState.invalid}
                placeholder='Must be a valid email'
                autoComplete='email'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='numberRange'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>Number Range</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type='number'
                min={10}
                max={20}
                aria-invalid={fieldState.invalid}
                placeholder='Enter Number between 10 & 20'
                onChange={e => {
                  const value = e.target.value

                  field.onChange(value === '' ? undefined : parseInt(value, 10))
                }}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='regexPattern'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>Regex Pattern</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder='Must match regular expression : ^([0-9]+)$ - numbers only'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='exactLength'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>Exact Length</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder='Length must be exactly 3 characters.'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='digitsField'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>Digits</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder='The digits field must be numeric and exactly contain 3 digits'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='alphanumericWithSymbols'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>Alphanumeric & Symbols</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder='Only alphabetic characters, numbers, dashes or underscores'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='url'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name}>URL</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type='url'
                aria-invalid={fieldState.invalid}
                placeholder='Must be a valid url'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className='flex gap-3'>
        <Button type='submit'>Submit</Button>
        <Button type='button' variant='outline' onClick={() => form.reset()}>
          Reset
        </Button>
      </div>
    </form>
  )
}

export default ValidationTypes
