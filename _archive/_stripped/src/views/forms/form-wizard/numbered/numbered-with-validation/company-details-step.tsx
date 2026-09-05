'use client'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

// Type Imports
import type * as Stepperize from '@stepperize/react'

import type { CompanyDetailsValues } from './index'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const industryItems = [
  { label: 'Technology & Software', value: 'technology' },
  { label: 'Healthcare & Life Sciences', value: 'healthcare' },
  { label: 'Finance & Banking', value: 'finance' },
  { label: 'E-commerce & Retail', value: 'ecommerce' },
  { label: 'Education & Training', value: 'education' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'Consulting & Professional Services', value: 'consulting' },
  { label: 'Media & Entertainment', value: 'media' },
  { label: 'Real Estate', value: 'real-estate' },
  { label: 'Other', value: 'other' }
]

const companySizeItems = [
  { label: '1-10 employees', value: '1-10' },
  { label: '11-50 employees', value: '11-50' },
  { label: '51-200 employees', value: '51-200' },
  { label: '201-500 employees', value: '201-500' },
  { label: '501-1,000 employees', value: '501-1000' },
  { label: '1,001+ employees', value: '1001+' }
]

const countryItems = [
  { label: 'United States', value: 'united-states' },
  { label: 'Canada', value: 'canada' },
  { label: 'United Kingdom', value: 'united-kingdom' },
  { label: 'Germany', value: 'germany' },
  { label: 'France', value: 'france' },
  { label: 'Australia', value: 'australia' },
  { label: 'Japan', value: 'japan' },
  { label: 'Singapore', value: 'singapore' },
  { label: 'India', value: 'india' },
  { label: 'Other', value: 'other' }
]

const FormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.string().min(1, 'Company size is required'),
  website: z.string().min(1, 'Website is required').url({ message: 'Please enter a valid URL.' }),
  address: z.string().min(1, 'Business address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  zipCode: z.string().min(1, 'ZIP/Postal code is required'),
  country: z.string().min(1, 'Country is required')
})

const CompanyDetailsStep = ({
  stepper,
  defaultValues,
  onSave
}: {
  stepper: Stepperize.Stepper<any>
  defaultValues: CompanyDetailsValues
  onSave: (data: CompanyDetailsValues) => void
}) => {
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
        <h2 className='text-lg font-semibold'>Company Information</h2>
        <p className='text-muted-foreground'>Tell us about your organization</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6'>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Controller
            control={form.control}
            name='companyName'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Company Name
                </FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder='Acme Corporation' />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='website'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Company Website
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type='url'
                  aria-invalid={fieldState.invalid}
                  placeholder='https://acmecorp.com'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='industry'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Industry
                </FieldLabel>
                <Select onValueChange={field.onChange} value={field.value} items={industryItems}>
                  <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className='w-full'>
                    <SelectValue placeholder='Select industry' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {industryItems.map(item => (
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
          <Controller
            control={form.control}
            name='companySize'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Company Size
                </FieldLabel>
                <Select onValueChange={field.onChange} value={field.value} items={companySizeItems}>
                  <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className='w-full'>
                    <SelectValue placeholder='Select company size' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {companySizeItems.map(item => (
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
          <Controller
            control={form.control}
            name='address'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2 sm:col-span-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Business Address
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder='123 Innovation Drive, Suite 400'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='city'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  City
                </FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder='San Francisco' />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='state'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  State / Province
                </FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder='CA' />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='zipCode'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  ZIP / Postal Code
                </FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder='94105' />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='country'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name} className='leading-none'>
                  Country
                </FieldLabel>
                <Select onValueChange={field.onChange} value={field.value} items={countryItems}>
                  <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className='w-full'>
                    <SelectValue placeholder='Select country' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {countryItems.map(item => (
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

export default CompanyDetailsStep
