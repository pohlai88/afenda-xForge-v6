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
import type { FundingAccount } from '@/types/payroll/settlement-types'

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

const CURRENCIES = ['SGD', 'MYR', 'USD', 'EUR', 'GBP', 'AUD', 'INR'] as const

const schema = z.object({
  name: z.string().min(1, 'Give the account a name people will recognise'),
  bankName: z.string().min(1, 'Bank is required'),
  accountLast4: z.string().regex(/^\d{4}$/, 'Enter the last four digits only'),
  currency: z.enum(CURRENCIES)
})

type Values = z.infer<typeof schema>

type Props = {
  accounts: FundingAccount[]
}

/**
 * Where payroll is drawn from. Only the last four digits are ever shown or stored here; the full
 * account number lives behind the server boundary with its own access control.
 */
const BankingSettings = ({ accounts: initial }: Props) => {
  const [accounts, setAccounts] = useState(initial)
  const [adding, setAdding] = useState(false)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', bankName: '', accountLast4: '', currency: 'SGD' }
  })

  const makeDefault = async (id: string) => {
    const snapshot = accounts

    setAccounts(current => current.map(account => ({ ...account, isDefault: account.id === id })))

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
                  {account.isDefault && <Badge className='bg-success/15 text-success text-xs'>Default</Badge>}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {account.bankName} ···· {account.accountLast4} · {account.currency}
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
                          {CURRENCIES.map(currency => (
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
