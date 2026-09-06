'use client'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Type Imports
import { CURRENCY_CODES } from '@/types/common/primitive-types'
import { FX_BASES } from '@/types/payroll/group-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { PayrollGeneralSettings } from '@/types/payroll/settings-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SettingsSection from './settings-section'

// Action Imports
import { savePayrollSettingsSection } from '@/app/server/actions'

// Util Imports
import { FX_BASIS_LABELS } from '@/utils/payroll-group'


const schema = z.object({
  groupName: z.string().min(1, 'The group needs a name'),
  homeEntityId: z.string().min(1, 'Choose a home entity'),
  reportingCurrency: z.enum(CURRENCY_CODES),
  fxBasis: z.enum(FX_BASES),
  payslipSender: z.string().email('Enter a valid email address'),
  rounding: z.enum(['nearest_cent', 'nearest_dollar'])
})

type Values = z.infer<typeof schema>

type Props = {
  settings: PayrollGeneralSettings
  entities: LegalEntity[]
}

const GeneralSettings = ({ settings, entities }: Props) => {
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
        title='Group'
        description='How consolidated figures are stated. Each run is still calculated in its own entity&rsquo;s currency; these settings only decide how the group adds them up.'
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
            name='groupName'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2'>
                <FieldLabel htmlFor={field.name}>Group name</FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                <FieldDescription>Shown on Group payroll and on consolidated reports.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name='homeEntityId'
            control={form.control}
            render={({ field }) => (
              <Field className='gap-2'>
                <FieldLabel htmlFor={field.name}>Home entity</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={value => value && field.onChange(value)}
                  items={entities.map(entity => ({ value: entity.id, label: entity.name }))}
                >
                  <SelectTrigger id={field.name} className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  The company screens open to when no other is chosen. Registration numbers live on each entity.
                </FieldDescription>
              </Field>
            )}
          />
          <Controller
            name='reportingCurrency'
            control={form.control}
            render={({ field }) => (
              <Field className='gap-2'>
                <FieldLabel htmlFor={field.name}>Reporting currency</FieldLabel>
                <Select value={field.value} onValueChange={value => value && field.onChange(value)}>
                  <SelectTrigger id={field.name} className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_CODES.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  What consolidated figures are stated in. Runs are unaffected; each pays in its entity&rsquo;s currency.
                </FieldDescription>
              </Field>
            )}
          />
          <Controller
            name='fxBasis'
            control={form.control}
            render={({ field }) => (
              <Field className='gap-2'>
                <FieldLabel htmlFor={field.name}>Exchange rate basis</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={value => value && field.onChange(value)}
                  items={FX_BASES.map(basis => ({ value: basis, label: FX_BASIS_LABELS[basis] }))}
                >
                  <SelectTrigger id={field.name} className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FX_BASES.map(basis => (
                      <SelectItem key={basis} value={basis}>
                        {FX_BASIS_LABELS[basis]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Which rate consolidation translates at. The same payroll consolidates to a different total on a
                  different basis, so every group figure states the one it used.
                </FieldDescription>
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
