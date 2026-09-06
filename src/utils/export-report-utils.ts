// Third-party Imports
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// Type Imports
import type { ReportFormat, ReportTable } from '@/types/payroll/report-types'

/** The table with its column labels as headers, the way both file formats want it. */
const toRecords = (table: ReportTable) =>
  table.rows.map(row => Object.fromEntries(table.columns.map(column => [column.label, row[column.key] ?? ''])))

const download = (blob: Blob, fileName: string) => {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', fileName)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * A report as a file. CSV through papaparse, the same as the register and run exports; Excel
 * through the xlsx package, which was already a dependency and had no caller until now.
 */
export const exportReportTable = (table: ReportTable, format: ReportFormat, fileName: string): void => {
  const records = toRecords(table)

  if (format === 'xlsx') {
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(records), 'Report')
    XLSX.writeFile(workbook, fileName)

    return
  }

  download(new Blob([Papa.unparse(records, { header: true })], { type: 'text/csv;charset=utf-8;' }), fileName)
}
