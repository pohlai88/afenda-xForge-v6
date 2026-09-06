'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { toast } from 'sonner'

// Type Imports
import type { PayComponentKind } from '@/types/payroll/pay-run-types'
import type { PayComponentDefinition } from '@/types/payroll/settings-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SettingsSection from './settings-section'

// Action Imports
import { savePayrollSettingsSection } from '@/app/server/actions'

const KIND_LABELS: Record<PayComponentKind, string> = {
  earning: 'Earning',
  deduction: 'Deduction',
  tax: 'Tax',
  employer_contribution: 'Employer contribution'
}

type Props = {
  components: PayComponentDefinition[]
}

/**
 * The lines a payslip can carry. Toggles act immediately with a toast, like the notification
 * preferences on the account page; there is no form to submit because each cell is one fact.
 */
const ComponentSettings = ({ components: initial }: Props) => {
  const [components, setComponents] = useState(initial)

  const update = async (code: string, patch: Partial<PayComponentDefinition>, message: string) => {
    const snapshot = components
    const next = components.map(c => (c.code === code ? { ...c, ...patch } : c))

    setComponents(next)

    const result = await savePayrollSettingsSection('components', next)

    if (!result.ok) {
      setComponents(snapshot)
      toast.error(result.message)

      return
    }

    toast.success(message)
  }

  return (
    <SettingsSection
      title='Pay components'
      description='Every line that can appear on a payslip, whether it is taxed, whether statutory contributions are calculated on it, and where it posts.'
      wide
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='h-9 pl-6 text-xs'>Component</TableHead>
            <TableHead className='h-9 text-xs'>Kind</TableHead>
            <TableHead className='h-9 text-xs'>GL account</TableHead>
            <TableHead className='h-9 text-center text-xs'>Taxable</TableHead>
            <TableHead className='h-9 text-center text-xs'>Contributable</TableHead>
            <TableHead className='h-9 pr-6 text-center text-xs'>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {components.map(component => {
            const statutory =
              component.kind === 'tax' || component.kind === 'deduction' || component.kind === 'employer_contribution'

            return (
              <TableRow key={component.code} className={component.active ? undefined : 'opacity-60'}>
                <TableCell className='py-2 pl-6'>
                  <span className='flex flex-col'>
                    <span className='font-medium'>{component.label}</span>
                    <span className='text-muted-foreground font-mono text-[11px]'>{component.code}</span>
                  </span>
                </TableCell>
                <TableCell className='py-2'>
                  <Badge variant='outline' className='text-xs'>
                    {KIND_LABELS[component.kind]}
                  </Badge>
                </TableCell>
                <TableCell className='text-muted-foreground py-2 font-mono text-xs'>{component.glAccount}</TableCell>
                <TableCell className='py-2 text-center'>
                  <Switch
                    size='sm'
                    checked={component.taxable}
                    disabled={statutory}
                    aria-label={`${component.label} taxable`}
                    onCheckedChange={checked =>
                      update(
                        component.code,
                        { taxable: checked },
                        `${component.label} is ${checked ? 'now' : 'no longer'} taxable`
                      )
                    }
                  />
                </TableCell>
                <TableCell className='py-2 text-center'>
                  <Switch
                    size='sm'
                    checked={component.contributable}
                    disabled={statutory}
                    aria-label={`${component.label} counts toward statutory contributions`}
                    onCheckedChange={checked =>
                      update(
                        component.code,
                        { contributable: checked },
                        `${component.label} ${checked ? 'now counts' : 'no longer counts'} toward contributions`
                      )
                    }
                  />
                </TableCell>
                <TableCell className='py-2 pr-6 text-center'>
                  <Switch
                    size='sm'
                    checked={component.active}
                    disabled={component.code === 'BASE'}
                    aria-label={`${component.label} active`}
                    onCheckedChange={checked =>
                      update(
                        component.code,
                        { active: checked },
                        `${component.label} ${checked ? 'enabled' : 'disabled'}`
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </SettingsSection>
  )
}

export default ComponentSettings
