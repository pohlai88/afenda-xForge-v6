'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { toast } from 'sonner'

// Type Imports
import type { GlMapping, PayComponentDefinition } from '@/types/payroll/settings-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SettingsSection from './settings-section'

// Action Imports
import { savePayrollSettingsSection } from '@/app/server/actions'

type Props = {
  mappings: GlMapping[]
  components: PayComponentDefinition[]
}

/**
 * Where each payslip line posts. A grid of inputs rather than a form per row: an accountant
 * maps a chart of accounts by scanning down a column, and a row-per-dialog would make that ten
 * round trips.
 */
const AccountingSettings = ({ mappings: initial, components }: Props) => {
  const [mappings, setMappings] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const labels = new Map(components.map(c => [c.code, c.label]))

  const save = async () => {
    const result = await savePayrollSettingsSection('accounting', mappings)

    if (!result.ok) {
      toast.error(result.message)

      return
    }

    setMappings(result.data)
    setSaved(result.data)
    setDirty(false)
    toast.success('Ledger mapping saved')
  }

  const update = (code: string, patch: Partial<GlMapping>) => {
    setMappings(current => current.map(m => (m.componentCode === code ? { ...m, ...patch } : m)))
    setDirty(true)
  }

  return (
    <SettingsSection
      title='General ledger mapping'
      description='The journal each run posts on approval. Cost-centre split follows the employee’s department; unsplit lines post to one account.'
      wide
      footer={
        <>
          <Button
            variant='outline'
            disabled={!dirty}
            onClick={() => {
              setMappings(saved)
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='h-9 pl-6 text-xs'>Component</TableHead>
            <TableHead className='h-9 text-xs'>Debit</TableHead>
            <TableHead className='h-9 text-xs'>Credit</TableHead>
            <TableHead className='h-9 pr-6 text-center text-xs'>Split by cost centre</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mappings.map(mapping => (
            <TableRow key={mapping.componentCode}>
              <TableCell className='py-2 pl-6'>
                <span className='flex flex-col'>
                  <span className='font-medium'>{labels.get(mapping.componentCode) ?? mapping.componentCode}</span>
                  <span className='text-muted-foreground font-mono text-[11px]'>{mapping.componentCode}</span>
                </span>
              </TableCell>
              <TableCell className='py-2'>
                <Label htmlFor={`${mapping.componentCode}-debit`} className='sr-only'>
                  Debit account for {mapping.componentCode}
                </Label>
                <Input
                  id={`${mapping.componentCode}-debit`}
                  value={mapping.debitAccount}
                  onChange={event => update(mapping.componentCode, { debitAccount: event.target.value })}
                  className='h-8 w-56 font-mono text-xs'
                />
              </TableCell>
              <TableCell className='py-2'>
                <Label htmlFor={`${mapping.componentCode}-credit`} className='sr-only'>
                  Credit account for {mapping.componentCode}
                </Label>
                <Input
                  id={`${mapping.componentCode}-credit`}
                  value={mapping.creditAccount}
                  onChange={event => update(mapping.componentCode, { creditAccount: event.target.value })}
                  className='h-8 w-56 font-mono text-xs'
                />
              </TableCell>
              <TableCell className='py-2 pr-6 text-center'>
                <Switch
                  size='sm'
                  checked={mapping.splitByCostCentre}
                  aria-label={`Split ${mapping.componentCode} by cost centre`}
                  onCheckedChange={checked => update(mapping.componentCode, { splitByCostCentre: checked })}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SettingsSection>
  )
}

export default AccountingSettings
