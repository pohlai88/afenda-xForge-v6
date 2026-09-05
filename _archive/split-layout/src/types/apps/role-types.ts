// Type Imports
import type { AppUser } from '@/types/apps/user-types'

export interface ResourcePermissions {
  resource: string
  read: boolean
  write: boolean
  create: boolean
  delete: boolean
}

export interface AppRole {
  id: string
  name: string
  permissions: ResourcePermissions[]
}

export interface AppRoleWithUsers extends AppRole {
  users: Pick<AppUser, 'id' | 'name' | 'avatar'>[]
}

export interface RoleFormData {
  name: string
  permissions: ResourcePermissions[]
}

export type RoleDialogMode = 'add' | 'edit'

export type PermissionKey = 'read' | 'write' | 'create' | 'delete'
