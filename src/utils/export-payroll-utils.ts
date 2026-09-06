// Third-party Imports
import Papa from 'papaparse'

// Type Imports
import type { PayrollRunRow } from '@/types/payroll/run-workspace-types'

// Util Imports
import { formatMoney } from '@/utils/money'
import { EMPLOYEE_PAYROLL_STATUS_LABELS, PAYMENT_STATUS_LABELS, formatSignedMoney } from '@/utils/payroll-workspace'

const toExportRows = (rows: PayrollRunRow[]) =>
  rows.map(row => ({
    'Employee number': row.employeeNumber,
    Employee: row.name,
    Position: row.positionTitle,
    Department: row.departmentName,
    Location: row.locationName,
    Gross: formatMoney(row.gross),
    Net: formatMoney(row.net),
    'Previous net': row.previousNet ? formatMoney(row.previousNet) : '',
    Variance: row.variance ? formatSignedMoney(row.variance) : 'New',
    'Payroll status': EMPLOYEE_PAYROLL_STATUS_LABELS[row.payrollStatus],
    'Open exceptions': row.exceptions.filter(e => !e.resolvedAt).length,
    Payment: PAYMENT_STATUS_LABELS[row.paymentStatus]
  }))

/**
 * The payroll register as CSV. Same download mechanics as the users export, so the browser
 * behaviour is identical across the app.
 */
export const exportPayrollRegisterToCsv = (rows: PayrollRunRow[], runReference: string): void => {
  const csv = Papa.unparse(toExportRows(rows), { header: true })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${runReference}-register.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
