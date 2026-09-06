// Type Imports
import type { IsoDateTime } from '@/types/common/primitive-types'

/**
 * The reports domain: a fixed catalogue of tables finance and auditors ask for, each computed
 * from the same aggregations the dashboards use, so a report never disagrees with a screen.
 */

export type ReportKey =
  | 'register'
  | 'run_summary'
  | 'gross_to_net'
  | 'cost_by_department'
  | 'variance'
  | 'overtime'
  | 'statutory'
  | 'bank_file'

export type ReportGroup = 'operations' | 'finance' | 'statutory' | 'banking'

export type ReportFormat = 'csv' | 'xlsx'

export interface ReportDefinition {
  key: ReportKey
  name: string

  /** One line on what question it answers, in the reader's words. */
  purpose: string
  group: ReportGroup

  /** Whether the report is about one run (and so takes a run parameter) or about all of them. */
  perRun: boolean
  formats: ReportFormat[]
}

export type ReportCell = string | number

export interface ReportColumn {
  key: string
  label: string
  align?: 'left' | 'right'
}

/** A report, rendered: what the preview shows and what the file contains. */
export interface ReportTable {
  columns: ReportColumn[]
  rows: Record<string, ReportCell>[]

  /** e.g. 'PR-2026-09 · September 2026 · 31 employees'. */
  caption: string
}

/**
 * Every report for every run, computed once on the server. Keyed by report, then by run id, with
 * 'all' for the reports that are not about one run.
 */
export type ReportTables = Record<ReportKey, Record<string, ReportTable>>

export interface ReportExport {
  id: string
  reportKey: ReportKey
  runReference?: string
  format: ReportFormat
  rowCount: number
  fileName: string
  createdAt: IsoDateTime

  /** Employee id of whoever exported it. */
  createdBy: string
}
