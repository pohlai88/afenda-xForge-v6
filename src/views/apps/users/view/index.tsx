'use client'

// Next Imports
import Link from 'next/link'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddEditUserSheet } from '@/views/apps/users/dialogs/add-edit-user-sheet'
import { UserViewLeftPanel } from './user-view-left-panel'
import { UserViewTabs } from './user-view-tabs'

// Hook Imports
import { useUserViewApp } from '@/hooks/use-user-view-app'

export interface UserViewAppProps {
  userId: string
}

const UserViewApp = ({ userId }: UserViewAppProps) => {
  const { user, isEditSheetOpen, handleOpenEditSheet, handleCloseEditSheet, handleUpdateUser, handleToggleSuspend } =
    useUserViewApp(userId)

  if (!user) {
    return (
      <Card className='mx-auto max-w-md'>
        <CardHeader>
          <CardTitle>User not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground mb-4 text-sm'>
            The user you are looking for does not exist or may have been removed.
          </p>
          <Button render={<Link href='/apps/users' />} nativeButton={false}>
            Back to Users List
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className='relative grid grid-cols-1 gap-6 lg:grid-cols-[350px_minmax(0,1fr)]'>
        <UserViewLeftPanel user={user} onEdit={handleOpenEditSheet} onToggleSuspend={handleToggleSuspend} />
        <UserViewTabs user={user} />
      </div>

      <AddEditUserSheet
        mode={isEditSheetOpen ? 'edit' : null}
        user={user}
        onClose={handleCloseEditSheet}
        onAdd={() => undefined}
        onEdit={handleUpdateUser}
      />
    </>
  )
}

export default UserViewApp
