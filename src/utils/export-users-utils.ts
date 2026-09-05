import { format } from 'date-fns'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

import type { AppUser } from '@/types/apps/user-types'

type UserExportRow = {
  Name: string
  Email: string
  Role: string
  Plan: string
  Billing: string
  Status: string
  'Joined Date': string
}

const toExportRows = (users: AppUser[]): UserExportRow[] =>
  users.map(user => ({
    Name: user.name,
    Email: user.email,
    Role: user.role,
    Plan: user.plan,
    Billing: user.billing,
    Status: user.status,
    'Joined Date': format(new Date(user.joinedDate), 'dd MMM yyyy')
  }))

const getExportFilename = (extension: string): string =>
  `users-export-${new Date().toISOString().split('T')[0]}.${extension}`

export function exportUsersToCSV(users: AppUser[]): void {
  const csv = Papa.unparse(toExportRows(users), { header: true })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', getExportFilename('csv'))
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportUsersToExcel(users: AppUser[]): void {
  const worksheet = XLSX.utils.json_to_sheet(toExportRows(users))
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')
  worksheet['!cols'] = [{ wch: 24 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 14 }]

  XLSX.writeFile(workbook, getExportFilename('xlsx'))
}

export function exportUsersToJSON(users: AppUser[]): void {
  const json = JSON.stringify(toExportRows(users), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', getExportFilename('json'))
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
