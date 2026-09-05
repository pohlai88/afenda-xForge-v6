'use client'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AddEditUserSheet } from '@/views/apps/users/dialogs/add-edit-user-sheet'
import { UserPagination } from '@/views/apps/users/list/user-pagination'
import { UserTable } from '@/views/apps/users/list/user-table'
import { UserTableFilters } from '@/views/apps/users/list/user-table-filters'
import { UserTableToolbar } from '@/views/apps/users/list/user-table-toolbar'

// Hook Imports
import { useRolesApp } from '@/hooks/use-roles-app'
import { useUserApp } from '@/hooks/use-user-app'

// Component Imports
import { RolePermissionDialog } from './role-permission-dialog'
import { RolesGrid } from './roles-grid'

// -------------------------------------------------------------------------------------------------

export function RolesApp() {
  // Hooks
  const {
    rolesWithUsers,
    dialogMode,
    editingRole,
    permissionResources,
    handleAddRole,
    handleUpdateRole,
    handleDeleteRole,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseDialog
  } = useRolesApp()

  const {
    filters,
    paginatedUsers,
    totalPages,
    totalFilteredCount,
    showingFrom,
    showingTo,
    rowsPerPage,
    currentPage,
    rowSelection,
    sorting,
    sheetMode,
    editingUser,
    handleFilterChange,
    handleSearchChange,
    handleRowsPerPageChange,
    handlePageChange,
    handleSortingChange,
    handleSelectUser,
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser,
    handleUpdateStatus,
    handleOpenEditSheet,
    handleCloseSheet,
    handleExportCsv,
    handleExportExcel,
    handleExportJson,
    handleOpenAddSheet,
    handleOpenImportDialog
  } = useUserApp()

  return (
    <div className='flex flex-col gap-6'>
      <RolesGrid roles={rolesWithUsers} onEdit={handleOpenEdit} onDelete={handleDeleteRole} onAddNew={handleOpenAdd} />

      <RolePermissionDialog
        dialogMode={dialogMode}
        editingRole={editingRole}
        permissionResources={permissionResources}
        onAddRole={handleAddRole}
        onUpdateRole={handleUpdateRole}
        onClose={handleCloseDialog}
      />

      <Card className='gap-0 py-0 shadow-none'>
        <CardHeader className='border-b px-6 py-5'>
          <CardTitle className='text-lg font-medium'>Total users with their roles</CardTitle>
          <CardDescription>
            Find all of your company&apos;s administrator accounts and their associate roles.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='w-full'>
            <div className='border-b'>
              <UserTableFilters filters={filters} onFilterChange={handleFilterChange} />
              <UserTableToolbar
                search={filters.search}
                rowsPerPage={rowsPerPage}
                onSearch={handleSearchChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                onExportCsv={handleExportCsv}
                onExportExcel={handleExportExcel}
                onExportJson={handleExportJson}
                onOpenAddSheet={handleOpenAddSheet}
                onOpenImportDialog={handleOpenImportDialog}
              />
              <UserTable
                paginatedUsers={paginatedUsers}
                totalPages={totalPages}
                rowSelection={rowSelection}
                sorting={sorting}
                onSelectUser={handleSelectUser}
                onSortingChange={handleSortingChange}
                onEditUser={handleOpenEditSheet}
                onDeleteUser={handleDeleteUser}
                onStatusChange={handleUpdateStatus}
              />
            </div>

            <UserPagination
              showingFrom={showingFrom}
              showingTo={showingTo}
              total={totalFilteredCount}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>

      <AddEditUserSheet
        mode={sheetMode}
        user={editingUser}
        onClose={handleCloseSheet}
        onAdd={handleAddUser}
        onEdit={handleUpdateUser}
      />
    </div>
  )
}
