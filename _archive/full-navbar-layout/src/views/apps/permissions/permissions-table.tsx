'use client'

// Third-party Imports
import { EyeIcon, PencilLineIcon, PlusIcon, Trash2Icon } from 'lucide-react'

// Type Imports
import type { AppRoleWithUsers, PermissionKey } from '@/types/apps/role-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Util Imports
import { cn } from '@/lib/utils'

// -------------------------------------------------------------------------------------------------

interface PermissionsTableProps {
  roles: AppRoleWithUsers[]
  resources: string[]
  onPermissionChange: (roleId: string, resource: string, action: PermissionKey, value: boolean) => void
}

const ACTIONS: { key: PermissionKey; Icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { key: 'read', Icon: EyeIcon, label: 'Read' },
  { key: 'write', Icon: PencilLineIcon, label: 'Write' },
  { key: 'create', Icon: PlusIcon, label: 'Create' },
  { key: 'delete', Icon: Trash2Icon, label: 'Delete' }
]

interface PermissionChipProps {
  Icon: React.ComponentType<{ className?: string }>
  label: string
  allowed: boolean
  onChange: (value: boolean) => void
}

function PermissionChip({ Icon, label, allowed, onChange }: PermissionChipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <Button
          type='button'
          onClick={() => onChange(!allowed)}
          aria-label={`Toggle ${label}`}
          variant={allowed ? 'default' : 'outline'}
          size='icon-sm'
          className={cn(
            'text-muted-foreground hover:text-foreground',
            allowed && 'bg-primary/10 text-primary hover:bg-primary/20'
          )}
        >
          <Icon className='size-3' />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function PermissionsTable({ roles, resources, onPermissionChange }: PermissionsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='p-4 font-semibold'>Resource</TableHead>
          {roles.map(role => (
            <TableHead key={role.id} className='p-4'>
              <span className='block font-semibold'>{role.name}</span>
              <span className='text-muted-foreground block text-xs font-normal'>
                {role.users.length} {role.users.length === 1 ? 'user' : 'users'}
              </span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.map(resource => (
          <TableRow key={resource}>
            <TableCell className='p-4 font-medium'>{resource}</TableCell>
            {roles.map(role => {
              const perm = role.permissions.find(p => p.resource === resource)

              return (
                <TableCell key={role.id} className='px-4'>
                  <div className='flex gap-1'>
                    {ACTIONS.map(({ key, Icon, label }) => (
                      <PermissionChip
                        key={key}
                        Icon={Icon}
                        label={label}
                        allowed={perm?.[key] ?? false}
                        onChange={val => onPermissionChange(role.id, resource, key, val)}
                      />
                    ))}
                  </div>
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
