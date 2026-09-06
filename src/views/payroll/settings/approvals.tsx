'use client'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Type Imports
import type { ApprovalSettings } from '@/types/payroll/settings-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import SettingsSection from './settings-section'

// Action Imports
import { savePayrollSettingsSection } from '@/app/server/actions'

const ROLES = ['Finance lead', 'Payroll manager', 'HR director', 'Managing director']

const schema = z.object({
  thresholdEnabled: z.boolean(),
  secondApproverAboveMajor: z.coerce.number().min(0, 'Cannot be negative'),
  approverRoles: z.array(z.string()).min(1, 'At least one role must be able to approve'),
  requireWarningsAcknowledged: z.boolean(),
  blockOnErrors: z.boolean(),
  lockInputsOnApproval: z.boolean()
})

type Values = z.infer<typeof schema>

type Props = {
  settings: ApprovalSettings
}

const toValues = (settings: ApprovalSettings): Values => ({
  thresholdEnabled: settings.secondApproverAbove !== null,
  secondApproverAboveMajor: (settings.secondApproverAbove?.amount ?? 0) / 100,
  approverRoles: settings.approverRoles,
  requireWarningsAcknowledged: settings.requireWarningsAcknowledged,
  blockOnErrors: settings.blockOnErrors,
  lockInputsOnApproval: settings.lockInputsOnApproval
})

const Toggle = ({
  label,
  description,
  checked,
  onChange,
  id
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <Field orientation='horizontal' className='items-center justify-between gap-4 py-2'>
    <span className='flex flex-col gap-0.5'>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FieldDescription>{description}</FieldDescription>
    </span>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </Field>
)

/** Who can sign a run, and what has to be true before they can. */
const ApprovalSettingsSection = ({ settings }: Props) => {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(settings) })
  const thresholdEnabled = useWatch({ control: form.control, name: 'thresholdEnabled' })

  const onSubmit = async (values: Values) => {
    const result = await savePayrollSettingsSection('approvals', {
      approverRoles: values.approverRoles,
      secondApproverAbove: values.thresholdEnabled
        ? {
            amount: Math.round(values.secondApproverAboveMajor * 100),
            currency: settings.secondApproverAbove?.currency ?? 'SGD'
          }
        : null,
      requireWarningsAcknowledged: values.requireWarningsAcknowledged,
      blockOnErrors: values.blockOnErrors,
      lockInputsOnApproval: values.lockInputsOnApproval
    })

    if (!result.ok) {
      toast.error(result.message)

      return
    }

    form.reset(toValues(result.data))
    toast.success('Approval rules saved', { description: 'Applies to runs not yet approved.' })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <SettingsSection
        title='Approval rules'
        description='Blockers always stop approval. These settings decide what else does, and who may sign.'
        footer={
          <>
            <Button
              type='button'
              variant='outline'
              onClick={() => form.reset(toValues(settings))}
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
        <FieldGroup className='gap-2 divide-y'>
          <Controller
            name='approverRoles'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='gap-2 pb-4'>
                <FieldLabel>Who can approve</FieldLabel>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {ROLES.map(role => {
                    const id = `approver-${role.toLowerCase().replace(/\s+/g, '-')}`
                    const checked = field.value.includes(role)

                    return (
                      <label key={role} htmlFor={id} className='flex items-center gap-2 text-sm'>
                        <Checkbox
                          id={id}
                          checked={checked}
                          onCheckedChange={value =>
                            field.onChange(value ? [...field.value, role] : field.value.filter(r => r !== role))
                          }
                        />
                        {role}
                      </label>
                    )
                  })}
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='thresholdEnabled'
            control={form.control}
            render={({ field }) => (
              <Toggle
                id='threshold-enabled'
                label='Second approver above a threshold'
                description='Runs whose net pay exceeds the amount need two signatures.'
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {thresholdEnabled && (
            <Controller
              name='secondApproverAboveMajor'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className='gap-2 py-2'>
                  <FieldLabel htmlFor={field.name}>Threshold, net pay</FieldLabel>
                  <InputGroup className='w-56'>
                    <InputGroupAddon>
                      <InputGroupText>S$</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      {...field}
                      id={field.name}
                      type='number'
                      min={0}
                      step='1000'
                      value={String(field.value)}
                      className='tabular-nums'
                      aria-invalid={fieldState.invalid}
                    />
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          )}

          <Controller
            name='requireWarningsAcknowledged'
            control={form.control}
            render={({ field }) => (
              <Toggle
                id='require-warnings-acknowledged'
                label='Warnings must be acknowledged'
                description='An open, unacknowledged warning stops approval until someone has looked at it.'
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name='blockOnErrors'
            control={form.control}
            render={({ field }) => (
              <Toggle
                id='block-on-errors'
                label='Errors stop approval'
                description='Treat calculation errors like blockers. Turning this off lets an approver sign over them.'
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name='lockInputsOnApproval'
            control={form.control}
            render={({ field }) => (
              <Toggle
                id='lock-inputs-on-approval'
                label='Lock inputs on approval'
                description='After approval, changes go through an off-cycle run rather than editing the approved one.'
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FieldGroup>
      </SettingsSection>
    </form>
  )
}

export default ApprovalSettingsSection
