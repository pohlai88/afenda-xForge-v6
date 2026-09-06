// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon } from 'lucide-react'

// Type Imports
import type { AccessRole } from '@/types/payroll/settings-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SettingsSection from './settings-section'

type Props = {
  roles: AccessRole[]
}

/**
 * Who can do what in payroll. Read-only here: roles and their members are managed in the app's
 * Roles & Permissions area, and this section only shows the payroll slice of them so an admin
 * does not have to leave settings to check who can approve.
 */
const AccessSettings = ({ roles }: Props) => (
  <SettingsSection
    title='Access'
    description='Payroll permissions by role. Membership and the roles themselves are managed under Roles & Permissions.'
    wide
    footer={
      <Button variant='outline' render={<Link href='/apps/roles' />} nativeButton={false}>
        Manage roles
        <ArrowRightIcon />
      </Button>
    }
  >
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='h-9 pl-6 text-xs'>Role</TableHead>
          <TableHead className='h-9 text-right text-xs'>Members</TableHead>
          <TableHead className='h-9 pr-6 text-xs'>Payroll permissions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map(role => (
          <TableRow key={role.id}>
            <TableCell className='py-2.5 pl-6 whitespace-normal'>
              <span className='flex flex-col gap-0.5'>
                <span className='font-medium'>{role.name}</span>
                <span className='text-muted-foreground text-xs'>{role.description}</span>
              </span>
            </TableCell>
            <TableCell className='py-2.5 text-right tabular-nums'>{role.memberCount}</TableCell>
            <TableCell className='py-2.5 pr-6 whitespace-normal'>
              <span className='flex flex-wrap gap-1'>
                {role.permissions.map(permission => (
                  <Badge key={permission} variant='outline' className='text-xs'>
                    {permission}
                  </Badge>
                ))}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </SettingsSection>
)

export default AccessSettings
