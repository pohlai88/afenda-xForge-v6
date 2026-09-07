'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { PencilIcon, PlusIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Type Imports
import { CURRENCY_CODES } from '@/types/common/primitive-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { PayGroup } from '@/types/payroll/settings-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SettingsSection from './settings-section'

// Action Imports
import { savePayGroup } from '@/app/server/actions'

// Util Imports
import { cn } from '@/lib/utils'
import { PAY_FREQUENCY_LABELS } from '@/utils/payroll-workspace'

const FREQUENCIES = ['weekly', 'biweekly', 'semi_monthly', 'monthly'] as const

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  entityId: z.string().min(1, 'Choose the legal entity that employs this group'),
  currency: z.enum(CURRENCY_CODES),
  frequency: z.enum(FREQUENCIES),
  paydayRule: z.string().min(1, 'Describe when this group is paid'),
  cutoffDaysBeforePayday: z.coerce
    .number()
    .int()
    .min(0, 'Cannot be negative')
    .max(20, 'Cut-off more than 20 days early makes no sense'),
  active: z.boolean()
})

type Values = z.infer<typeof schema>

const EMPTY: Values = {
  name: '',
  entityId: '',
  currency: 'SGD',
  frequency: 'monthly',
  paydayRule: '',
  cutoffDaysBeforePayday: 4,
  active: true
}

type Props = {
  payGroups: PayGroup[]
  entities: LegalEntity[]
}

/**
 * Who gets paid together. The list is the settings surface; the Sheet is the form, the way the
 * users list edits a user. Saving goes through `savePayGroup`; the list adopts the record the
 * server returns.
 */
const PayGroupSettings = ({ payGroups: initial, entities }: Props) => {
  const [payGroups, setPayGroups] = useState(initial)
  const entityById = new Map(entities.map(entity => [entity.id, entity]))
  const [editing, setEditing] = useState<PayGroup | 'new' | null>(null)

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: EMPTY })

  const open = (target: PayGroup | 'new') => {
    form.reset(target === 'new' ? EMPTY : { ...target })
    setEditing(target)
  }

  const onSubmit = async (values: Values) => {
    const creating = editing === 'new'
    const result = await savePayGroup({ ...values, id: editing && editing !== 'new' ? editing.id : undefined })

    if (!result.ok) {
      toast.error(result.message)

      return
    }

    const saved = result.data

    setPayGroups(current =>
      creating ? [...current, saved] : current.map(group => (group.id === saved.id ? saved : group))
    )
    toast.success(creating ? `Pay group ${saved.name} created` : `Pay group ${saved.name} saved`)
    setEditing(null)
  }

  return (
    <>
      <SettingsSection
        title='Pay groups'
        description='Employees paid on the same schedule, in the same currency, by the same entity. A run belongs to exactly one pay group.'
        wide
        footer={
          <Button onClick={() => open('new')}>
            <PlusIcon />
            Add pay group
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='h-9 pl-6 text-xs'>Pay group</TableHead>
              <TableHead className='h-9 text-xs'>Frequency</TableHead>
              <TableHead className='h-9 text-xs'>Payday</TableHead>
              <TableHead className='h-9 text-right text-xs'>Cut-off</TableHead>
              <TableHead className='h-9 text-right text-xs'>Employees</TableHead>
              <TableHead className='h-9 text-xs'>Status</TableHead>
              <TableHead className='h-9 pr-6 text-right text-xs'>
                <span className='sr-only'>Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payGroups.map(group => (
              <TableRow key={group.id}>
                <TableCell className='py-2 pl-6'>
                  <span className='flex flex-col'>
                    <span className='font-medium'>{group.name}</span>
                    <span className='text-muted-foreground text-xs'>
                      {entityById.get(group.entityId)?.name ?? 'Unknown entity'} · {group.currency}
                    </span>
                  </span>
                </TableCell>
                <TableCell className='py-2'>{PAY_FREQUENCY_LABELS[group.frequency]}</TableCell>
                <TableCell className='text-muted-foreground py-2 whitespace-normal'>{group.paydayRule}</TableCell>
                <TableCell className='py-2 text-right tabular-nums'>
                  {group.cutoffDaysBeforePayday} days before
                </TableCell>
                <TableCell className='py-2 text-right tabular-nums'>{group.employeeCount}</TableCell>
                <TableCell className='py-2'>
                  <Badge
                    className={cn(
                      'text-xs',
                      group.active ? 'bg-success/15 text-success-strong' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {group.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className='py-2 pr-6 text-right'>
                  <Button variant='ghost' size='icon-sm' aria-label={`Edit ${group.name}`} onClick={() => open(group)}>
                    <PencilIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SettingsSection>

      <Sheet open={editing !== null} onOpenChange={isOpen => !isOpen && setEditing(null)}>
        <SheetContent className='gap-0 sm:max-w-md'>
          <SheetHeader>
            <SheetTitle>{editing === 'new' ? 'Add pay group' : 'Edit pay group'}</SheetTitle>
            <SheetDescription>Schedule changes apply to runs that have not yet been opened.</SheetDescription>
          </SheetHeader>
          <form
            id='pay-group-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4'
          >
            <FieldGroup className='gap-4'>
              <Controller
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input {...field} id={field.name} placeholder='SG Monthly' aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name='entityId'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor={field.name}>Legal entity</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={value => {
                        if (!value) return

                        field.onChange(value)

                        // The entity decides the currency it pays in, so choosing one settles it.
                        // Leaving the two independent lets someone save a Malaysian pay group
                        // priced in dollars, which no account could fund.
                        const entity = entityById.get(value)

                        if (entity) form.setValue('currency', entity.currency, { shouldDirty: true })
                      }}
                      items={entities.map(entity => ({ value: entity.id, label: entity.name }))}
                    >
                      <SelectTrigger id={field.name} className='w-full' aria-invalid={fieldState.invalid}>
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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <Controller
                  name='currency'
                  control={form.control}
                  render={({ field }) => (
                    <Field className='gap-2'>
                      <FieldLabel htmlFor={field.name}>Currency</FieldLabel>
                      <Input {...field} id={field.name} readOnly tabIndex={-1} className='bg-muted/50' />
                      <FieldDescription>Set by the legal entity. A second currency means a second entity.</FieldDescription>
                    </Field>
                  )}
                />
                <Controller
                  name='frequency'
                  control={form.control}
                  render={({ field }) => (
                    <Field className='gap-2'>
                      <FieldLabel htmlFor={field.name}>Frequency</FieldLabel>
                      <Select value={field.value} onValueChange={value => value && field.onChange(value)}>
                        <SelectTrigger id={field.name} className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map(frequency => (
                            <SelectItem key={frequency} value={frequency}>
                              {PAY_FREQUENCY_LABELS[frequency]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>
              <Controller
                name='paydayRule'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor={field.name}>Payday</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder='28th, or the previous working day'
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>Written the way you would explain it to a new hire.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name='cutoffDaysBeforePayday'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor={field.name}>Cut-off, days before payday</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type='number'
                      min={0}
                      max={20}
                      value={String(field.value)}
                      aria-invalid={fieldState.invalid}
                      className='w-28 tabular-nums'
                    />
                    <FieldDescription>
                      After cut-off, inputs are accepted only through an off-cycle run.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name='active'
                control={form.control}
                render={({ field }) => (
                  <Field orientation='horizontal' className='items-center justify-between gap-4'>
                    <span className='flex flex-col gap-0.5'>
                      <FieldLabel htmlFor={field.name}>Active</FieldLabel>
                      <FieldDescription>Inactive groups keep their history but cannot open new runs.</FieldDescription>
                    </span>
                    <Switch id={field.name} checked={field.value} onCheckedChange={field.onChange} />
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
          <SheetFooter className='flex-row justify-end border-t'>
            <Button type='button' variant='outline' onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type='submit' form='pay-group-form'>
              {editing === 'new' ? 'Create pay group' : 'Save changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default PayGroupSettings
