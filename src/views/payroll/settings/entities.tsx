'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { PencilIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Type Imports
import type { LegalEntity } from '@/types/hrm/entity-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SettingsSection from './settings-section'

// Action Imports
import { saveLegalEntity } from '@/app/server/actions'

// Util Imports
import { COUNTRY_LABELS } from '@/utils/payroll-group'

const schema = z.object({
  name: z.string().min(1, 'The company needs its registered name'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  timezone: z.string().min(1, 'Choose a timezone')
})

type Values = z.infer<typeof schema>

type Props = {
  entities: LegalEntity[]

  /** Employees and runs per entity, so the list says how much each company actually carries. */
  employeeCounts: Record<string, number>
  runCounts: Record<string, number>
}

/**
 * The companies payroll runs for.
 *
 * Read-mostly on purpose. A legal entity's country and currency decide which statutory rules
 * apply and which bank account can pay it, so they are fixed once it has run payroll — changing
 * them would silently re-price history. What can be corrected here is the paperwork: the
 * registered name, the registration number, and the zone its cut-off is evaluated in.
 */
const EntitySettings = ({ entities, employeeCounts, runCounts }: Props) => {
  const [rows, setRows] = useState(entities)
  const [editing, setEditing] = useState<LegalEntity | null>(null)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', registrationNumber: '', timezone: '' }
  })

  const open = (entity: LegalEntity) => {
    form.reset({
      name: entity.name,
      registrationNumber: entity.registrationNumber,
      timezone: entity.timezone
    })
    setEditing(entity)
  }

  const onSubmit = async (values: Values) => {
    if (!editing) return

    const result = await saveLegalEntity({ ...values, id: editing.id })

    if (!result.ok) {
      toast.error(result.message)

      return
    }

    const saved = result.data

    setRows(current => current.map(row => (row.id === saved.id ? saved : row)))
    setEditing(null)
    toast.success(`${saved.name} saved`)
  }

  return (
    <>
      <SettingsSection
        title='Legal entities'
        description='Every company the group runs payroll for. A company&rsquo;s country and currency decide which statutory rules apply and which account can pay it, so they are set when it is created and fixed once it has run payroll.'
        wide
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='h-9 pl-6 text-xs'>Company</TableHead>
              <TableHead className='h-9 text-xs'>Country</TableHead>
              <TableHead className='h-9 text-xs'>Currency</TableHead>
              <TableHead className='h-9 text-xs'>Registration</TableHead>
              <TableHead className='h-9 text-xs'>Statutory profile</TableHead>
              <TableHead className='h-9 text-right text-xs'>Employees</TableHead>
              <TableHead className='h-9 text-right text-xs'>Runs</TableHead>
              <TableHead className='h-9 pr-6 text-xs'>
                <span className='sr-only'>Edit</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(entity => (
              <TableRow key={entity.id}>
                <TableCell className='py-2 pl-6'>
                  <span className='flex flex-col'>
                    <span className='font-medium'>{entity.name}</span>
                    <span className='text-muted-foreground font-mono text-xs'>{entity.code}</span>
                  </span>
                </TableCell>
                <TableCell className='py-2 text-sm'>{COUNTRY_LABELS[entity.countryCode]}</TableCell>
                <TableCell className='py-2'>
                  <Badge variant='outline' className='text-xs'>
                    {entity.currency}
                  </Badge>
                </TableCell>
                <TableCell className='text-muted-foreground py-2 font-mono text-xs'>
                  {entity.registrationNumber}
                </TableCell>
                <TableCell className='text-muted-foreground py-2 text-sm'>{entity.statutoryProfileId}</TableCell>
                <TableCell className='py-2 text-right tabular-nums'>{employeeCounts[entity.id] ?? 0}</TableCell>
                <TableCell className='py-2 text-right tabular-nums'>{runCounts[entity.id] ?? 0}</TableCell>
                <TableCell className='py-2 pr-6 text-right'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    onClick={() => open(entity)}
                    aria-label={`Edit ${entity.name}`}
                  >
                    <PencilIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SettingsSection>

      <Sheet open={Boolean(editing)} onOpenChange={value => !value && setEditing(null)}>
        <SheetContent className='flex flex-col gap-0 sm:max-w-md'>
          <SheetHeader>
            <SheetTitle>{editing?.name}</SheetTitle>
            <SheetDescription>
              {editing ? `${COUNTRY_LABELS[editing.countryCode]} · pays in ${editing.currency}` : null}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className='flex min-h-0 flex-1 flex-col'>
            <FieldGroup className='flex-1 gap-6 overflow-y-auto px-4'>
              <Controller
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor={field.name}>Registered name</FieldLabel>
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                    <FieldDescription>Appears on every payslip and statutory filing.</FieldDescription>
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
                name='timezone'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor={field.name}>Timezone</FieldLabel>
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                    <FieldDescription>Cut-off and payday are evaluated here, in local business hours.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Field className='gap-2'>
                <FieldLabel>Country and currency</FieldLabel>
                <p className='text-muted-foreground text-sm'>
                  {editing ? `${COUNTRY_LABELS[editing.countryCode]} · ${editing.currency}` : null}
                </p>
                <FieldDescription>
                  Fixed for a company that has run payroll. A second currency is a second entity, not a setting.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <SheetFooter className='flex-row justify-end border-t'>
              <Button type='button' variant='outline' onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type='submit' disabled={!form.formState.isDirty}>
                Save changes
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default EntitySettings
