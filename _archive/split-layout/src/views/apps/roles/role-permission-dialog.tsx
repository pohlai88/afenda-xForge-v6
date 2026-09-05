'use client'

// React Imports
import { useEffect } from 'react'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Type Imports
import type { AppRoleWithUsers, ResourcePermissions, RoleDialogMode, RoleFormData } from '@/types/apps/role-types'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RolePermissionsTable } from './role-permissions-table'

// -------------------------------------------------------------------------------------------------

const resourcePermissionsSchema = z.object({
  resource: z.string(),
  read: z.boolean(),
  write: z.boolean(),
  create: z.boolean(),
  delete: z.boolean()
})

const roleFormSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  permissions: z.array(resourcePermissionsSchema)
})

const buildDefaultPermissions = (resources: string[]): ResourcePermissions[] =>
  resources.map(resource => ({ resource, read: false, write: false, create: false, delete: false }))

// -------------------------------------------------------------------------------------------------

interface RolePermissionDialogProps {
  dialogMode: RoleDialogMode | null
  editingRole: AppRoleWithUsers | null
  permissionResources: string[]
  onAddRole: (data: RoleFormData) => void
  onUpdateRole: (id: string, data: RoleFormData) => void
  onClose: () => void
}

export function RolePermissionDialog({
  dialogMode,
  editingRole,
  permissionResources,
  onAddRole,
  onUpdateRole,
  onClose
}: RolePermissionDialogProps) {
  // Vars
  const open = dialogMode !== null
  const isEdit = dialogMode === 'edit'

  // Hooks
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors }
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      permissions: buildDefaultPermissions(permissionResources)
    }
  })

  // Handlers
  const onSubmit = (data: RoleFormData) => {
    if (isEdit && editingRole) {
      onUpdateRole(editingRole.id, data)
    } else {
      onAddRole(data)
    }
  }

  // Effects
  useEffect(() => {
    if (dialogMode === 'add') {
      reset({ name: '', permissions: buildDefaultPermissions(permissionResources) })
    } else if (dialogMode === 'edit' && editingRole) {
      reset({ name: editingRole.name, permissions: editingRole.permissions })
    }
  }, [dialogMode, editingRole, permissionResources, reset])

  return (
    <Dialog open={open} onOpenChange={newOpen => !newOpen && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle className='text-base font-semibold'>{isEdit ? 'Edit Role' : 'Add New Role'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update role name and set resource permissions.'
              : 'Create a new role and configure its permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
          <Field>
            <FieldLabel>Role Name</FieldLabel>
            <Input placeholder='Enter role name' {...register('name')} />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>

          <div>
            <p className='text-foreground mb-3 text-sm font-medium'>Role Permissions</p>
            <div className='overflow-hidden rounded-lg border'>
              <RolePermissionsTable resources={permissionResources} control={control} watch={watch} />
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit'>Save Role</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
