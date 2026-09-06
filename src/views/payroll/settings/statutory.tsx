'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { toast } from 'sonner'

// Type Imports
import type { StatutoryRule } from '@/types/payroll/settings-types'

// Component Imports
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SettingsSection from './settings-section'

// Action Imports
import { savePayrollSettingsSection } from '@/app/server/actions'

// Util Imports
import { currencySymbol, formatMoney, fromMajorUnits, toMajorUnits } from '@/utils/money'
import { COUNTRY_LABELS } from '@/utils/payroll-group'
import { formatDate } from '@/utils/payroll-workspace'

type Props = {
  rules: StatutoryRule[]
}

/**
 * Rates and ceilings. Edited in place with a single save, because a change to one rate is
 * usually a change to its pair (employee and employer move together at each budget).
 */
const StatutorySettings = ({ rules: initial }: Props) => {
  const [rules, setRules] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [dirty, setDirty] = useState(false)

  const save = async () => {
    const result = await savePayrollSettingsSection('statutory', rules)

    if (!result.ok) {
      toast.error(result.message)

      return
    }

    setRules(result.data)
    setSaved(result.data)
    setDirty(false)
    toast.success('Statutory rates saved', { description: 'Open runs need recalculating before approval.' })
  }

  const updateRate = (id: string, rate: number) => {
    setRules(current => current.map(rule => (rule.id === id ? { ...rule, rate } : rule)))
    setDirty(true)
  }

  const updateCeiling = (id: string, major: number | null) => {
    setRules(current =>
      current.map(rule =>
        rule.id === id
          ? {
              ...rule,
              ceiling: major === null ? null : fromMajorUnits(major, rule.ceiling?.currency ?? rule.currency)
            }
          : rule
      )
    )
    setDirty(true)
  }

  return (
    <SettingsSection
      title='Statutory contributions'
      description='The rates the calculation applies, per country. A change here re-flags every open run for recalculation; closed runs keep the rates they were paid under.'
      wide
      footer={
        <>
          <Button
            variant='outline'
            disabled={!dirty}
            onClick={() => {
              setRules(saved)
              setDirty(false)
            }}
          >
            Discard
          </Button>
          <Button disabled={!dirty} onClick={save}>
            Save changes
          </Button>
        </>
      }
    >
      <div className='px-6'>
        <Alert>
          <AlertTitle>These are simplified illustrative rates, not managed law.</AlertTitle>
          <AlertDescription>
            Real contribution schemes are banded by age, wage and residency, and withholding follows a published
            table. Managed statutory packs, effective dates and governed overrides arrive with the Statutory Pack
            Center. Until then a rate entered here is a number someone typed.
          </AlertDescription>
        </Alert>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='h-9 pl-6 text-xs'>Rule</TableHead>
            <TableHead className='h-9 text-xs'>Country</TableHead>
            <TableHead className='h-9 text-xs'>Paid by</TableHead>
            <TableHead className='h-9 text-xs'>Rate</TableHead>
            <TableHead className='h-9 text-xs'>Wage ceiling</TableHead>
            <TableHead className='h-9 pr-6 text-xs'>Effective from</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map(rule => (
            <TableRow key={rule.id}>
              <TableCell className='py-2 pl-6 font-medium whitespace-normal'>{rule.name}</TableCell>
              <TableCell className='text-muted-foreground py-2 text-sm'>
                {COUNTRY_LABELS[rule.countryCode]}
              </TableCell>
              <TableCell className='py-2'>
                <Badge variant='outline' className='text-xs capitalize'>
                  {rule.party}
                </Badge>
              </TableCell>
              <TableCell className='py-2'>
                <Label htmlFor={`${rule.id}-rate`} className='sr-only'>
                  {rule.name} rate
                </Label>
                <InputGroup className='h-8 w-28'>
                  <InputGroupInput
                    id={`${rule.id}-rate`}
                    type='number'
                    step='0.5'
                    min={0}
                    max={100}
                    value={rule.rate}
                    onChange={event => updateRate(rule.id, Number(event.target.value))}
                    className='tabular-nums'
                  />
                  <InputGroupAddon align='inline-end'>
                    <InputGroupText>%</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </TableCell>
              <TableCell className='py-2'>
                {rule.ceiling ? (
                  <>
                    <Label htmlFor={`${rule.id}-ceiling`} className='sr-only'>
                      {rule.name} wage ceiling
                    </Label>
                    <InputGroup className='h-8 w-40'>
                      <InputGroupAddon>
                        <InputGroupText>{currencySymbol(rule.ceiling.currency)}</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id={`${rule.id}-ceiling`}
                        type='number'
                        min={0}
                        step='100'
                        value={toMajorUnits(rule.ceiling)}
                        onChange={event => updateCeiling(rule.id, Number(event.target.value))}
                        className='tabular-nums'
                      />
                    </InputGroup>
                    <span className='text-muted-foreground mt-0.5 block text-xs'>
                      per month · {formatMoney(rule.ceiling)}
                    </span>
                  </>
                ) : (
                  <span className='text-muted-foreground text-sm'>No ceiling</span>
                )}
              </TableCell>
              <TableCell className='py-2 pr-6'>
                <Label htmlFor={`${rule.id}-from`} className='sr-only'>
                  {rule.name} effective from
                </Label>
                <Input
                  id={`${rule.id}-from`}
                  type='date'
                  defaultValue={rule.effectiveFrom}
                  className='h-8 w-40 tabular-nums'
                />
                <span className='text-muted-foreground mt-0.5 block text-xs'>{formatDate(rule.effectiveFrom)}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SettingsSection>
  )
}

export default StatutorySettings
