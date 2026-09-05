'use client'

// React Imports
import { useState, type ChangeEvent } from 'react'

// Third-party Imports
import Papa from 'papaparse'

// Type Imports
import type { AppUser } from '@/types/apps/user-types'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const PREVIEW_ROW_LIMIT = 5

const REQUIRED_FIELDS = ['name', 'email'] as const

const getRowValue = (row: Record<string, string>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = row[key]?.trim()

    if (value) {
      return value
    }
  }

  return undefined
}

export interface ImportUsersDialogProps {
  open: boolean
  onClose: () => void
  onImport: (users: Partial<AppUser>[]) => void
}

export function ImportUsersDialog({ open, onClose, onImport }: ImportUsersDialogProps) {
  // States
  const [parsedUsers, setParsedUsers] = useState<Partial<AppUser>[]>([])
  const [errorCount, setErrorCount] = useState(0)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleClose = () => {
    setParsedUsers([])
    setErrorCount(0)
    setFileName(null)
    onClose()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setFileName(file.name)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        let invalidRows = 0

        const users = results.data.map(row => {
          const name = getRowValue(row, ['name', 'Name', 'full_name', 'Full Name'])
          const email = getRowValue(row, ['email', 'Email'])

          if (!name || !email) {
            invalidRows += 1
          }

          return {
            name,
            email,
            role: getRowValue(row, ['role', 'Role']) as AppUser['role'] | undefined,
            plan: getRowValue(row, ['plan', 'Plan']) as AppUser['plan'] | undefined,
            status: getRowValue(row, ['status', 'Status']) as AppUser['status'] | undefined,
            billing: getRowValue(row, ['billing', 'Billing']) as AppUser['billing'] | undefined,
            company: getRowValue(row, ['company', 'Company']),
            country: getRowValue(row, ['country', 'Country']),
            contact: getRowValue(row, ['contact', 'Contact'])
          } satisfies Partial<AppUser>
        })

        setParsedUsers(users)
        setErrorCount(invalidRows)
      }
    })

    event.target.value = ''
  }

  const handleImport = () => {
    const validUsers = parsedUsers.filter(user => {
      return REQUIRED_FIELDS.every(field => Boolean(user[field]?.toString().trim()))
    })

    if (validUsers.length === 0) {
      return
    }

    onImport(validUsers)
    handleClose()
  }

  const previewRows = parsedUsers.slice(0, PREVIEW_ROW_LIMIT)

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && handleClose()}>
      <DialogContent className='flex max-h-[min(90vh,720px)] w-[90vw] max-w-2xl flex-col overflow-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Import Users</DialogTitle>
          <DialogDescription>Upload a CSV file to preview and import users into the list.</DialogDescription>
        </DialogHeader>

        <div className='min-h-0 flex-1 space-y-4 overflow-y-auto pr-1'>
          <Input type='file' accept='.csv,text/csv' onChange={handleFileChange} />

          {fileName ? <p className='text-muted-foreground text-sm'>Selected file: {fileName}</p> : null}

          {errorCount > 0 ? (
            <p className='text-destructive text-sm'>
              {errorCount} row{errorCount === 1 ? '' : 's'} missing required fields (name, email).
            </p>
          ) : null}

          {previewRows.length > 0 ? (
            <div className='overflow-hidden rounded-md border'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='whitespace-nowrap'>Name</TableHead>
                      <TableHead className='whitespace-nowrap'>Email</TableHead>
                      <TableHead className='whitespace-nowrap'>Role</TableHead>
                      <TableHead className='whitespace-nowrap'>Plan</TableHead>
                      <TableHead className='whitespace-nowrap'>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((user, index) => (
                      <TableRow key={`${user.email}-${index}`}>
                        <TableCell className='max-w-40 truncate whitespace-nowrap'>{user.name ?? '—'}</TableCell>
                        <TableCell className='max-w-52 truncate whitespace-nowrap'>{user.email ?? '—'}</TableCell>
                        <TableCell className='whitespace-nowrap'>{user.role ?? '—'}</TableCell>
                        <TableCell className='whitespace-nowrap'>{user.plan ?? '—'}</TableCell>
                        <TableCell className='whitespace-nowrap'>{user.status ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedUsers.length > PREVIEW_ROW_LIMIT ? (
                <p className='text-muted-foreground border-t px-4 py-2 text-sm'>
                  Showing first {PREVIEW_ROW_LIMIT} of {parsedUsers.length} rows.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={parsedUsers.length === 0 || parsedUsers.length === errorCount}>
            Confirm Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
