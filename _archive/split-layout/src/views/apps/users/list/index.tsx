'use client'

// Component Imports
import { Card } from '@/components/ui/card'
import { AddEditUserSheet } from '@/views/apps/users/dialogs/add-edit-user-sheet'
import { ImportUsersDialog } from '@/views/apps/users/dialogs/import-users-dialog'
import { UserBulkActionBar } from './user-bulk-action-bar'
import { UserPagination } from './user-pagination'
import { UserStatsCards } from './user-stats-cards'
import { UserTable } from './user-table'
import { UserTableFilters } from './user-table-filters'
import { UserTableToolbar } from './user-table-toolbar'

// Hook Imports
import { useUserApp } from '@/hooks/use-user-app'

const UserListApp = () => {
  const {
    stats,
    filters,
    paginatedUsers,
    totalPages,
    totalFilteredCount,
    showingFrom,
    showingTo,
    rowsPerPage,
    currentPage,
    selectedUserIds,
    rowSelection,
    sorting,
    sheetMode,
    editingUser,
    isImportDialogOpen,
    handleFilterChange,
    handleSearchChange,
    handleRowsPerPageChange,
    handlePageChange,
    handleSortingChange,
    handleSelectUser,
    handleClearSelection,
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser,
    handleBulkDelete,
    handleUpdateStatus,
    handleBulkUpdateStatus,
    handleOpenAddSheet,
    handleOpenEditSheet,
    handleCloseSheet,
    handleOpenImportDialog,
    handleCloseImportDialog,
    handleImportUsers,
    handleExportCsv,
    handleExportExcel,
    handleExportJson
  } = useUserApp()

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <UserStatsCards stats={stats} />

      <Card className='py-0 shadow-none'>
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
            {selectedUserIds.length > 0 ? (
              <UserBulkActionBar
                selectedCount={selectedUserIds.length}
                onBulkDelete={handleBulkDelete}
                onBulkStatusChange={handleBulkUpdateStatus}
                onClearSelection={handleClearSelection}
              />
            ) : null}
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
      </Card>

      <AddEditUserSheet
        mode={sheetMode}
        user={editingUser}
        onClose={handleCloseSheet}
        onAdd={handleAddUser}
        onEdit={handleUpdateUser}
      />
      <ImportUsersDialog open={isImportDialogOpen} onClose={handleCloseImportDialog} onImport={handleImportUsers} />
    </div>
  )
}

export default UserListApp
