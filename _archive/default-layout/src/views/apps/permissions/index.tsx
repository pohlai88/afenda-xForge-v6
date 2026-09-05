'use client'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'

// Hook Imports
import { useRolesApp } from '@/hooks/use-roles-app'

// Component Imports
import { PermissionsTable } from './permissions-table'

// -------------------------------------------------------------------------------------------------

const PERMISSION_KEYS = ['read', 'write', 'create', 'delete'] as const

export function PermissionsApp() {
  // Hooks
  const { rolesWithUsers, permissionResources, handlePermissionChange } = useRolesApp()

  // Vars
  const activePermissions = rolesWithUsers.reduce((total, role) => {
    return (
      total +
      role.permissions.reduce((sum, perm) => {
        return sum + PERMISSION_KEYS.filter(k => perm[k]).length
      }, 0)
    )
  }, 0)

  return (
    <div className='flex flex-col gap-3 md:gap-6'>
      <div>
        <h1 className='font-heading text-xl font-semibold'>Permissions</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Overview of all roles and their associated resource permissions.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-6'>
        {[
          { label: 'Roles', value: rolesWithUsers.length },
          { label: 'Resources', value: permissionResources.length },
          { label: 'Active Permissions', value: activePermissions }
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className='flex flex-col gap-1'>
              <span className='text-2xl font-semibold'>{stat.value}</span>
              <span className='text-muted-foreground text-sm'>{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='gap-0 p-0 shadow-none'>
        <CardContent className='p-0'>
          <PermissionsTable
            roles={rolesWithUsers}
            resources={permissionResources}
            onPermissionChange={handlePermissionChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
