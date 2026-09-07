'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { LandmarkIcon, PlusIcon, StarIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Type Imports
import { CURRENCY_CODES } from '@/types/common/primitive-types'
import type { FundingAccount } from '@/types/payroll/settlement-types'
import type { LegalEntity } from '@/types/hrm/entity-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import SettingsSection from './settings-section'

// Action Imports
import { addFundingAccount, setDefaultFundingAccount } from '@/app/server/actions'

// Util Imports
import { formatMoney } from '@/utils/money'


const schema = z.object({
  entityId: z.string().min(1, 'Choose the company that holds this account'),
  name: z.string().min(1, 'Give the account a name people will recognise'),
  bankName: z.string().min(1, 'Bank is required'),
  accountLast4: z.string().regex(/^\d{4}$/, 'Enter the last four digits only'),
  currency: z.enum(CURRENCY_CODES)
})

type Values = z.infer<typeof schema>

type Props = {
  accounts: FundingAccount[]
  entities: LegalEntity[]
}

/**
 * Where payroll is drawn from. Only the last four digits are ever shown or stored here; the full
 * account number lives behind the server boundary with its own access control.
 */
const BankingSettings = ({ accounts: initial, entities }: Props) => {
  const [accounts, setAccounts] = useState(initial)
  const [adding, setAdding] = useState(false)
  const entityById = new Map(entities.map(entity => [entity.id, entity]))
  const homeEntity = entities[0]

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      entityId: homeEntity?.id ?? '',
      name: '',
      bankName: '',
      accountLast4: '',
      currency: homeEntity?.currency ?? 'SGD'
    }
  })

  const makeDefault = async (id: string) => {
    const snapshot = accounts

    const target = accounts.find(account => account.id === id)

    setAccounts(current =>
      current.map(account =>
        account.entityId === target?.entityId ? { ...account, isDefault: account.id === id } : account
      )
    )

    const result = await setDefaultFundingAccount(id)

    if (!result.ok) {
      setAccounts(snapshot)
      toast.error(result.message)

      return
    }

    toast.success('Default funding account changed')
  }

  const onSubmit = async (values: Values) => {
    const result = await addFundingAccount(values)

    if (!result.ok) {
      toast.error(result.message)

      return
    }

    setAccounts(current => [...current, result.data])
    setAdding(false)
    form.reset()
    toast.success(`${result.data.name} added`, { description: 'Balance will show after the first bank sync.' })
  }

  return (
    <>
      <SettingsSection
        title='Funding accounts'
        description='Payment batches are drawn on the default account. Balances come from the bank feed and are read-only here.'
        footer={
          <Button onClick={() => setAdding(true)}>
            <PlusIcon />
            Add account
          </Button>
        }
      >
        <ul className='flex flex-col gap-3'>
          {accounts.map(account => (
            <li key={account.id} className='flex flex-wrap items-center gap-3 rounded-md border p-3'>
              <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-sm'>
                <LandmarkIcon className='size-4.5' />
              </span>
              <div className='flex min-w-0 flex-1 flex-col'>
                <span className='flex items-center gap-2 text-sm font-medium'>
                  {account.name}
                  {account.isDefault && <Badge className='bg-success/15 text-success-strong text-xs'>Default</Badge>}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {entityById.get(account.entityId)?.name ?? 'Unknown entity'} · {account.bankName} ···· {account.accountLast4} · {account.currency}
                </span>
              </div>
              <span className='text-sm font-medium tabular-nums'>{formatMoney(account.balance)}</span>
              {!account.isDefault && (
                <Button variant='outline' size='sm' onClick={() => makeDefault(account.id)}>
                  <StarIcon />
                  Make default
                </Button>
              )}
            </li>
          ))}
        </ul>
      </SettingsSection>

      <Sheet open={adding} onOpenChange={setAdding}>
        <SheetContent className='gap-0 sm:max-w-md'>
          <SheetHeader>
            <SheetTitle>Add funding account</SheetTitle>
            <SheetDescription>Enter only what the payments page needs to recognise the account.</SheetDescription>
          </SheetHeader>
          <form
            id='funding-account-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4 px-4 pb-4'
          >
            <FieldGroup className='gap-4'>
              <Controller
                name='entityId'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor={field.name}>Company</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={value => {
                        if (!value) return

                        field.onChange(value)

                        // An account holds the currency its company pays in. Choosing the company
                        // settles it, so nobody can register a ringgit account for a dong payroll.
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
              <Controller
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor={field.name}>Account name</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder='Payroll operating account'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name='bankName'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className='gap-2'>
                    <FieldLabel htmlFor={field.name}>Bank</FieldLabel>
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <Controller
                  name='accountLast4'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className='gap-2'>
                      <FieldLabel htmlFor={field.name}>Last four digits</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        inputMode='numeric'
                        maxLength={4}
                        placeholder='4471'
                        aria-invalid={fieldState.invalid}
                        className='font-mono'
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name='currency'
                  control={form.control}
                  render={({ field }) => (
                    <Field className='gap-2'>
                      <FieldLabel htmlFor={field.name}>Currency</FieldLabel>
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
                    </Field>
                  )}
                />
              </div>
              <FieldDescription>
                The full account number is entered by Finance in the bank portal, never here.
              </FieldDescription>
            </FieldGroup>
          </form>
          <SheetFooter className='flex-row justify-end border-t'>
            <Button type='button' variant='outline' onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type='submit' form='funding-account-form'>
              Add account
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default BankingSettings
