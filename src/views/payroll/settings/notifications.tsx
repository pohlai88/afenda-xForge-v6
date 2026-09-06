'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { toast } from 'sonner'

// Type Imports
import type { NotificationPreference } from '@/types/payroll/settings-types'

// Component Imports
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SettingsSection from './settings-section'

// Action Imports
import { savePayrollSettingsSection } from '@/app/server/actions'

type Props = {
  preferences: NotificationPreference[]
}

/** Which payroll events reach you, and how. Each switch saves on its own. */
const NotificationSettings = ({ preferences: initial }: Props) => {
  const [preferences, setPreferences] = useState(initial)

  const update = async (key: string, channel: 'email' | 'inApp', checked: boolean) => {
    const snapshot = preferences
    const next = preferences.map(p => (p.key === key ? { ...p, [channel]: checked } : p))

    setPreferences(next)

    const result = await savePayrollSettingsSection('notifications', next)

    if (!result.ok) {
      setPreferences(snapshot)
      toast.error(result.message)

      return
    }

    const preference = preferences.find(p => p.key === key)

    toast.success(
      `${preference?.label ?? 'Notification'} ${checked ? 'on' : 'off'} for ${channel === 'email' ? 'email' : 'in-app'}`
    )
  }

  return (
    <SettingsSection
      title='Notifications'
      description='Critical conditions — blockers, returned payments — stay visible in the app until resolved regardless of these settings. This controls what is also pushed to you.'
      wide
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='h-9 pl-6 text-xs'>Event</TableHead>
            <TableHead className='h-9 w-28 text-center text-xs'>Email</TableHead>
            <TableHead className='h-9 w-28 pr-6 text-center text-xs'>In app</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preferences.map(preference => (
            <TableRow key={preference.key}>
              <TableCell className='py-2.5 pl-6 whitespace-normal'>
                <span className='flex flex-col gap-0.5'>
                  <span className='font-medium'>{preference.label}</span>
                  <span className='text-muted-foreground text-xs'>{preference.description}</span>
                </span>
              </TableCell>
              <TableCell className='py-2.5 text-center'>
                <Switch
                  size='sm'
                  checked={preference.email}
                  aria-label={`${preference.label} by email`}
                  onCheckedChange={checked => update(preference.key, 'email', checked)}
                />
              </TableCell>
              <TableCell className='py-2.5 pr-6 text-center'>
                <Switch
                  size='sm'
                  checked={preference.inApp}
                  aria-label={`${preference.label} in app`}
                  onCheckedChange={checked => update(preference.key, 'inApp', checked)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SettingsSection>
  )
}

export default NotificationSettings
