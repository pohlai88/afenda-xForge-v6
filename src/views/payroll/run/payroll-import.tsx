'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckIcon,
  FileSpreadsheetIcon,
  UploadCloudIcon,
  XIcon
} from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// Type Imports
import type { CurrencyCode } from '@/types/common/primitive-types'

// Component Imports
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Hook Imports
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'

const STEPS = ['Upload', 'Validate', 'Review', 'Import'] as const

const PREVIEW_LIMIT = 50

/** Above this, a single input line is more likely a typo than a payment. */
const LARGE_AMOUNT_MAJOR = 10_000

type RowStatus = 'valid' | 'warning' | 'error'

export type ImportRow = {
  line: number
  employeeNumber: string
  component: string
  amount: number | null
  note?: string
  status: RowStatus
  message?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  runReference: string

  /** Employee numbers on this run, so a row for someone not on it is rejected rather than paid. */
  employeeNumbers: Set<string>

  /** Component codes the calculation knows. */
  componentCodes: Set<string>
  currency: CurrencyCode
  onImport: (rows: ImportRow[]) => void
}

const readValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const match = Object.keys(record).find(
      k =>
        k
          .trim()
          .toLowerCase()
          .replace(/[\s_-]/g, '') === key
    )

    if (
      match !== undefined &&
      record[match] !== undefined &&
      record[match] !== null &&
      String(record[match]).trim() !== ''
    ) {
      return String(record[match]).trim()
    }
  }

  return undefined
}

const validate = (
  records: Record<string, unknown>[],
  employeeNumbers: Set<string>,
  componentCodes: Set<string>
): ImportRow[] => {
  const seen = new Set<string>()

  return records.map((record, index) => {
    const employeeNumber = readValue(record, ['employeenumber', 'employee', 'employeeid', 'empno']) ?? ''
    const component = (readValue(record, ['component', 'code', 'componentcode']) ?? '').toUpperCase()
    const rawAmount = readValue(record, ['amount', 'value'])
    const note = readValue(record, ['note', 'notes', 'reason'])
    const amount = rawAmount === undefined ? null : Number(rawAmount.replace(/[^0-9.-]/g, ''))

    const row: ImportRow = { line: index + 2, employeeNumber, component, amount, note, status: 'valid' }

    if (!employeeNumber) return { ...row, status: 'error', message: 'No employee number' }
    if (!employeeNumbers.has(employeeNumber))
      return { ...row, status: 'error', message: `${employeeNumber} is not on this run` }
    if (!component) return { ...row, status: 'error', message: 'No component code' }
    if (!componentCodes.has(component)) return { ...row, status: 'error', message: `Unknown component ${component}` }
    if (amount === null || Number.isNaN(amount)) return { ...row, status: 'error', message: 'Amount is not a number' }
    if (amount === 0) return { ...row, status: 'error', message: 'Amount is zero' }

    const key = `${employeeNumber}:${component}`

    if (seen.has(key))
      return { ...row, status: 'warning', message: 'Duplicate of an earlier line — both will be imported' }
    seen.add(key)

    if (Math.abs(amount) > LARGE_AMOUNT_MAJOR) return { ...row, status: 'warning', message: 'Unusually large amount' }
    if (amount < 0) return { ...row, status: 'warning', message: 'Negative amount will reduce pay' }

    return row
  })
}

const STATUS_STYLES: Record<RowStatus, string> = {
  valid: 'bg-success/15 text-success-strong',
  warning: 'bg-warning/15 text-warning-strong',
  error: 'bg-destructive/10 text-destructive-strong'
}

const STATUS_LABELS: Record<RowStatus, string> = { valid: 'Valid', warning: 'Warning', error: 'Error' }

/**
 * Upload → Validate → Review → Import. Nothing is committed on drop: the file is parsed and
 * checked, the person sees every problem with its line number, and only then chooses to import
 * the rows that passed. Errors are never imported; warnings are, visibly.
 */
const PayrollImport = ({
  open,
  onOpenChange,
  runReference,
  employeeNumbers,
  componentCodes,
  currency,
  onImport
}: Props) => {
  const [step, setStep] = useState(0)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [problemsOnly, setProblemsOnly] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const [
    { files, isDragging, errors },
    { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, getInputProps }
  ] = useFileUpload({
    accept: '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    maxSize: 5 * 1024 * 1024,
    multiple: false
  })

  const file = files[0]?.file instanceof File ? files[0].file : undefined

  const reset = () => {
    setStep(0)
    setRows([])
    setParseError(null)
    setProblemsOnly(false)
    if (files[0]) removeFile(files[0].id)
  }

  const close = () => {
    reset()
    onOpenChange(false)
  }

  const parse = async () => {
    if (!file) return

    setParseError(null)

    try {
      let records: Record<string, unknown>[]

      if (file.name.toLowerCase().endsWith('.xlsx')) {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      } else {
        const text = await file.text()
        const result = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true })

        records = result.data
      }

      if (records.length === 0) {
        setParseError('The file has a header row but no data rows.')

        return
      }

      setRows(validate(records, employeeNumbers, componentCodes))
      setStep(1)
    } catch {
      setParseError('The file could not be read. Export it again as CSV or XLSX and retry.')
    }
  }

  const counts = {
    total: rows.length,
    valid: rows.filter(r => r.status === 'valid').length,
    warnings: rows.filter(r => r.status === 'warning').length,
    errors: rows.filter(r => r.status === 'error').length
  }

  const importable = rows.filter(r => r.status !== 'error')
  const visible = (problemsOnly ? rows.filter(r => r.status !== 'valid') : rows).slice(0, PREVIEW_LIMIT)

  const handleImport = () => {
    onImport(importable)
    close()
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && close()}>
      <DialogContent className='flex max-h-[min(90vh,760px)] w-[92vw] flex-col gap-4 sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Import payroll inputs</DialogTitle>
          <DialogDescription>
            {runReference} · one line per employee and component: employee_number, component, amount, note.
          </DialogDescription>
        </DialogHeader>

        <ol className='flex items-center gap-1 text-xs' aria-label='Import steps'>
          {STEPS.map((label, index) => {
            const done = index < step
            const active = index === step

            return (
              <li key={label} className='flex items-center gap-1'>
                <span
                  className={cn(
                    'flex h-6 items-center gap-1.5 rounded-md px-2 font-medium',
                    active && 'bg-primary text-primary-foreground',
                    done && 'text-muted-foreground',
                    !active && !done && 'text-muted-foreground/60'
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? (
                    <CheckIcon className='text-success-strong size-3' aria-hidden='true' />
                  ) : (
                    <span className='tabular-nums'>{index + 1}</span>
                  )}
                  {label}
                </span>
                {index < STEPS.length - 1 && <span className='bg-border h-px w-4' aria-hidden='true' />}
              </li>
            )
          })}
        </ol>

        <div className='min-h-0 flex-1 overflow-y-auto'>
          {step === 0 && (
            <div className='flex flex-col gap-3'>
              <div
                role='button'
                tabIndex={0}
                aria-label='Drop a CSV or XLSX file, or press Enter to choose one'
                onClick={openFileDialog}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openFileDialog()
                  }
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                  'focus-visible:ring-ring/50 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors focus-visible:ring-3 focus-visible:outline-none',
                  isDragging ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                )}
              >
                <input {...getInputProps()} className='sr-only' />
                <span className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full'>
                  <UploadCloudIcon className='size-5' />
                </span>
                <span className='text-sm font-medium'>Drag a file here or choose one</span>
                <span className='text-muted-foreground text-xs'>
                  CSV or XLSX, up to 5 MB. Nothing is imported until you confirm.
                </span>
              </div>

              {file && (
                <div className='flex items-center gap-3 rounded-md border p-3'>
                  <FileSpreadsheetIcon className='text-muted-foreground size-5 shrink-0' aria-hidden='true' />
                  <span className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate text-sm font-medium'>{file.name}</span>
                    <span className='text-muted-foreground text-xs'>{formatBytes(file.size)}</span>
                  </span>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label='Remove file'
                    onClick={() => removeFile(files[0].id)}
                  >
                    <XIcon />
                  </Button>
                </div>
              )}

              {(errors.length > 0 || parseError) && (
                <Alert variant='destructive'>
                  <AlertCircleIcon />
                  <AlertTitle>The file was not accepted.</AlertTitle>
                  <AlertDescription>{parseError ?? errors[0]}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {step >= 1 && (
            <div className='flex flex-col gap-4'>
              <dl className='grid grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-5'>
                {[
                  { label: 'Total', value: counts.total, tone: 'text-foreground' },
                  { label: 'Valid', value: counts.valid, tone: 'text-success-strong' },
                  {
                    label: 'Warnings',
                    value: counts.warnings,
                    tone: counts.warnings ? 'text-warning-strong' : 'text-foreground'
                  },
                  {
                    label: 'Errors',
                    value: counts.errors,
                    tone: counts.errors ? 'text-destructive-strong' : 'text-foreground'
                  },
                  {
                    label: 'Rejected',
                    value: counts.errors,
                    tone: counts.errors ? 'text-destructive-strong' : 'text-foreground'
                  }
                ].map(item => (
                  <div key={item.label} className='bg-card flex flex-col px-3 py-2'>
                    <dt className='text-muted-foreground text-xs'>{item.label}</dt>
                    <dd className={cn('text-lg font-semibold tabular-nums', item.tone)}>{item.value}</dd>
                  </div>
                ))}
              </dl>

              {counts.errors > 0 && (
                <Alert variant='destructive'>
                  <AlertTriangleIcon />
                  <AlertTitle>
                    {counts.errors} {counts.errors === 1 ? 'line' : 'lines'} will not be imported.
                  </AlertTitle>
                  <AlertDescription>
                    Fix them in the file and upload again, or import the {importable.length} that passed and add the
                    rest by hand.
                  </AlertDescription>
                </Alert>
              )}

              {step >= 2 && (
                <>
                  <div className='flex items-center justify-between gap-4'>
                    <p className='text-muted-foreground text-xs'>
                      Showing {visible.length} of {problemsOnly ? counts.warnings + counts.errors : counts.total} lines
                    </p>
                    <Label className='flex items-center gap-2 text-xs'>
                      <Switch size='sm' checked={problemsOnly} onCheckedChange={setProblemsOnly} />
                      Problems only
                    </Label>
                  </div>
                  <div className='overflow-hidden rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='h-9 text-xs'>Line</TableHead>
                          <TableHead className='h-9 text-xs'>Employee</TableHead>
                          <TableHead className='h-9 text-xs'>Component</TableHead>
                          <TableHead className='h-9 text-right text-xs'>Amount</TableHead>
                          <TableHead className='h-9 text-xs'>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visible.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className='text-muted-foreground h-16 text-center text-sm'>
                              No problems. Every line passed validation.
                            </TableCell>
                          </TableRow>
                        ) : (
                          visible.map(row => (
                            <TableRow key={row.line}>
                              <TableCell className='text-muted-foreground py-1.5 text-xs tabular-nums'>
                                {row.line}
                              </TableCell>
                              <TableCell className='py-1.5 font-mono text-xs'>{row.employeeNumber || '—'}</TableCell>
                              <TableCell className='py-1.5 font-mono text-xs'>{row.component || '—'}</TableCell>
                              <TableCell className='py-1.5 text-right tabular-nums'>
                                {row.amount === null || Number.isNaN(row.amount)
                                  ? '—'
                                  : formatMoney({ amount: Math.round(row.amount * 100), currency })}
                              </TableCell>
                              <TableCell className='py-1.5 whitespace-normal'>
                                <span className='flex flex-wrap items-center gap-1.5'>
                                  <Badge
                                    className={cn('h-auto rounded-sm px-1.5 py-0.5 text-xs', STATUS_STYLES[row.status])}
                                  >
                                    {STATUS_LABELS[row.status]}
                                  </Badge>
                                  {row.message && <span className='text-muted-foreground text-xs'>{row.message}</span>}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className='sm:justify-between'>
          <Button variant='ghost' onClick={step === 0 ? close : reset}>
            {step === 0 ? 'Cancel' : 'Start over'}
          </Button>
          <div className='flex gap-2'>
            {step === 0 && (
              <Button onClick={parse} disabled={!file}>
                Validate file
              </Button>
            )}
            {step === 1 && <Button onClick={() => setStep(2)}>Review lines</Button>}
            {step === 2 && (
              <Button onClick={() => setStep(3)} disabled={importable.length === 0}>
                Continue to import
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleImport} disabled={importable.length === 0}>
                <CheckIcon />
                Import {importable.length} {importable.length === 1 ? 'line' : 'lines'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PayrollImport
