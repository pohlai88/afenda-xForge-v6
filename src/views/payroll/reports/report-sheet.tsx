'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { DownloadIcon } from 'lucide-react'

// Type Imports
import type { ReportDefinition, ReportFormat, ReportTable } from '@/types/payroll/report-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// Util Imports
import { cn } from '@/lib/utils'
import { REPORT_FORMAT_LABELS } from '@/utils/payroll-reports'

/** How many rows the preview shows. Enough to check the parameters are right; the file has them all. */
const PREVIEW_ROWS = 25

export type RunOption = { id: string; reference: string; label: string }

type Props = {
  report: ReportDefinition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  runs: RunOption[]

  /** Run id -> rendered table for this report ('all' for run-independent reports). */
  tables: Record<string, ReportTable>
  defaultRunId: string
  onExport: (report: ReportDefinition, runId: string, format: ReportFormat, table: ReportTable) => void
}

type BodyProps = Omit<Props, 'open' | 'onOpenChange' | 'report'> & { report: ReportDefinition }

/**
 * Parameters, a preview, one button. The preview is the point: it is how someone checks they
 * picked the right run before a file with the wrong month lands in an auditor's inbox.
 */
const ReportSheetBody = ({ report, runs, tables, defaultRunId, onExport }: BodyProps) => {
  const [runId, setRunId] = useState(defaultRunId)
  const [format, setFormat] = useState<ReportFormat>(report.formats[0])

  const tableKey = report.perRun ? runId : 'all'
  const table = tables[tableKey]
  const run = runs.find(candidate => candidate.id === runId)

  return (
    <>
      <div className='flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4'>
        <div className='grid gap-4 sm:grid-cols-2'>
          {report.perRun && (
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='report-run'>Run</Label>
              {/* `items` gives the trigger the label to show; without it Base UI renders the raw id. */}
              <Select
                value={runId}
                onValueChange={value => value && setRunId(value)}
                items={runs.map(option => ({ value: option.id, label: `${option.reference} · ${option.label}` }))}
              >
                <SelectTrigger id='report-run' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {runs.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.reference} · {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className='flex flex-col gap-1.5'>
            <span className='text-sm font-medium' id='report-format-label'>
              Format
            </span>
            <ToggleGroup
              variant='outline'
              spacing={0}
              value={[format]}
              onValueChange={value => value[0] && setFormat(value[0] as ReportFormat)}
              aria-labelledby='report-format-label'
            >
              {report.formats.map(option => (
                <ToggleGroupItem key={option} value={option} className='flex-1'>
                  {REPORT_FORMAT_LABELS[option]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        {table ? (
          <section className='flex flex-col gap-2'>
            <div className='flex items-baseline justify-between gap-3'>
              <h3 className='text-sm font-semibold'>Preview</h3>
              <p className='text-muted-foreground text-xs'>
                {table.rows.length > PREVIEW_ROWS
                  ? `First ${PREVIEW_ROWS} of ${table.rows.length} rows`
                  : `${table.rows.length} ${table.rows.length === 1 ? 'row' : 'rows'}`}
                {' · '}
                {table.caption}
              </p>
            </div>
            <div className='overflow-x-auto rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    {table.columns.map(column => (
                      <TableHead
                        key={column.key}
                        className={cn('text-xs whitespace-nowrap', column.align === 'right' && 'text-right')}
                      >
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={table.columns.length} className='text-muted-foreground h-20 text-center'>
                        Nothing to report for {run?.reference ?? 'this selection'}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.rows.slice(0, PREVIEW_ROWS).map((row, index) => (
                      <TableRow key={index} className='h-9'>
                        {table.columns.map(column => (
                          <TableCell
                            key={column.key}
                            className={cn(
                              'py-1.5 text-xs whitespace-nowrap',
                              column.align === 'right' && 'text-right tabular-nums'
                            )}
                          >
                            {row[column.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : (
          <p className='text-muted-foreground text-sm'>This report is not available for the selected run.</p>
        )}
      </div>

      <SheetFooter className='flex-row justify-end border-t'>
        <Button
          disabled={!table || table.rows.length === 0}
          onClick={() => table && onExport(report, runId, format, table)}
        >
          <DownloadIcon />
          Export {REPORT_FORMAT_LABELS[format]}
        </Button>
      </SheetFooter>
    </>
  )
}

const ReportSheet = ({ report, open, onOpenChange, ...rest }: Props) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className='flex flex-col gap-0 sm:max-w-2xl'>
      {report && (
        <>
          <SheetHeader className='pr-12'>
            <SheetTitle className='text-base'>{report.name}</SheetTitle>
            <SheetDescription>{report.purpose}</SheetDescription>
          </SheetHeader>
          {/* Keyed by report so run and format start fresh for each one. */}
          <ReportSheetBody key={report.key} report={report} {...rest} />
        </>
      )}
    </SheetContent>
  </Sheet>
)

export default ReportSheet
