'use client'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Type Imports
import type { PayrollGeneralSettings } from '@/types/payroll/settings-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SettingsSection from './settings-section'

// Action Imports
import { savePayrollSettingsSection } from '@/app/server/actions'

const CURRENCIES = ['SGD', 'MYR', 'USD', 'EUR', 'GBP', 'AUD', 'INR'] as const

const TIMEZONES = ['Asia/Singapore', 'Asia/Kuala_Lumpur', 'Asia/Kolkata', 'Australia/Sydney', 'Europe/London', 'UTC']

const schema = z.object({
  entityName: z.string().min(1, 'Entity name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  defaultCurrency: z.enum(CURRENCIES),
  timezone: z.string().min(1, 'Choose a timezone'),
  payslipSender: z.string().email('Enter a valid email address'),
  rounding: z.enum(['nearest_cent', 'nearest_dollar'])
})

type Values = z.infer<typeof schema>

type Props = {
  settings: PayrollGeneralSettings
}

const GeneralSettings = ({ settings }: Props) => {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: settings })

  const onSubmit = async (values: Values) => {
    const result = await savePayrollSettingsSection('general', values)

    if (!result.ok) {
      toast.error(result.message)

      return
    }

    form.reset(result.data)
    toast.success('General settings saved')
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <SettingsSection
        title='Legal entity'
        description='The employer on every payslip and statutory filing. Changing the currency affects new runs only.'
        footer={
          <>
            <Button
              type='button'
              variant='outline'
              onClick={() => form.reset(settings)}
              disabled={!form.formState.isDirty}
            >
              Discard
            </Button>
            <Button type='submit' disabled={!form.formState.isDirty}>
              Save changes
            </Button>
          </>
        }
      >
        <FieldGroup className='grid gap-6 sm:grid-cols-2'>
          <Controller
            name='entityName'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name}>Entity name</FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name='registrationNumber'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name}>Registration number</FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} className='font-mono' />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name='defaultCurrency'
            control={form.control}
            render={({ field }) => (
              <Field className='gap-2'>
                <FieldLabel htmlFor={field.name}>Default currency</FieldLabel>
                <Select value={field.value} onValueChange={value => value && field.onChange(value)}>
                  <SelectTrigger id={field.name} className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>One currency per run. A second currency means a second pay group.</FieldDescription>
              </Field>
            )}
          />
          <Controller
            name='timezone'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name}>Timezone</FieldLabel>
                <Select value={field.value} onValueChange={value => value && field.onChange(value)}>
                  <SelectTrigger id={field.name} className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(zone => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Cut-off times and paydays are evaluated in this zone.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name='payslipSender'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name}>Payslip sender</FieldLabel>
                <Input {...field} id={field.name} type='email' aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name='rounding'
            control={form.control}
            render={({ field }) => (
              <Field className='gap-2'>
                <FieldLabel htmlFor={field.name}>Rounding</FieldLabel>
                <Select value={field.value} onValueChange={value => value && field.onChange(value)}>
                  <SelectTrigger id={field.name} className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='nearest_cent'>Nearest cent</SelectItem>
                    <SelectItem value='nearest_dollar'>Nearest dollar</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Applied to each payslip line before totals, so totals always reconcile.
                </FieldDescription>
              </Field>
            )}
          />
        </FieldGroup>
      </SettingsSection>
    </form>
  )
}

export default GeneralSettings
