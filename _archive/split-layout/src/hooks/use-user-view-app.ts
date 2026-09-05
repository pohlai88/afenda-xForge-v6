'use client'

// React Imports
import { useCallback, useMemo, useState } from 'react'

// Type Imports
import type { UserFormData } from '@/types/apps/user-types'

// Store Imports
import { useUserStore } from '@/store/use-user-store'

export function useUserViewApp(userId: string) {
  const users = useUserStore(state => state.users)
  const updateUser = useUserStore(state => state.updateUser)
  const updateUserStatus = useUserStore(state => state.updateUserStatus)

  const user = useMemo(() => users.find(u => u.id === userId) ?? null, [users, userId])

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  const handleOpenEditSheet = useCallback(() => setIsEditSheetOpen(true), [])
  const handleCloseEditSheet = useCallback(() => setIsEditSheetOpen(false), [])

  const handleUpdateUser = useCallback(
    (id: string, data: Partial<UserFormData>) => {
      updateUser(id, data)
      setIsEditSheetOpen(false)
    },
    [updateUser]
  )

  const handleToggleSuspend = useCallback(() => {
    if (!user) {
      return
    }

    const nextStatus = user.status === 'Suspended' ? 'Active' : 'Suspended'

    updateUserStatus(user.id, nextStatus)
  }, [user, updateUserStatus])

  return {
    user,
    isEditSheetOpen,
    handleOpenEditSheet,
    handleCloseEditSheet,
    handleUpdateUser,
    handleToggleSuspend
  }
}
