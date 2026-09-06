// Type Imports
import type { ReportExport } from '@/types/payroll/report-types'

/**
 * Exports people have already made. A small trail so the reports page opens with history, the way
 * it will once exports are recorded server-side.
 */
export const recentExports: ReportExport[] = [
  {
    id: 'export-2026-09-01-summary',
    reportKey: 'run_summary',
    format: 'csv',
    rowCount: 6,
    fileName: 'payroll-run-summary.csv',
    createdAt: '2026-09-01T02:15:00.000Z',
    createdBy: 'emp-020'
  },
  {
    id: 'export-2026-08-29-register',
    reportKey: 'register',
    runReference: 'PR-2026-08',
    format: 'xlsx',
    rowCount: 31,
    fileName: 'PR-2026-08-payroll-register.xlsx',
    createdAt: '2026-08-29T06:40:00.000Z',
    createdBy: 'emp-020'
  },
  {
    id: 'export-2026-08-27-bank',
    reportKey: 'bank_file',
    runReference: 'PR-2026-08',
    format: 'csv',
    rowCount: 31,
    fileName: 'PR-2026-08-bank-file.csv',
    createdAt: '2026-08-27T01:05:00.000Z',
    createdBy: 'emp-022'
  },
  {
    id: 'export-2026-08-10-statutory',
    reportKey: 'statutory',
    runReference: 'PR-2026-07',
    format: 'csv',
    rowCount: 32,
    fileName: 'PR-2026-07-statutory-summary.csv',
    createdAt: '2026-08-10T03:30:00.000Z',
    createdBy: 'emp-022'
  }
]
