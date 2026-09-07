'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon, DownloadIcon } from 'lucide-react'

// Type Imports
import type { FilingRow } from '@/types/payroll/compliance-types'
import type { StatutoryRule } from '@/types/payroll/settings-types'

// Component Imports
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import AuditTimeline from '@/components/shared/AuditTimeline'
import type { InspectorMode } from './compliance-focus'
import FilingStageRail from './filing-stage-rail'
import FilingStatusBadge from './filing-status-badge'

// Util Imports
import { formatMoney } from '@/utils/money'
import {
  FILING_AUTHORITIES,
  FILING_KIND_LABELS,
  filingAuditEvents,
  type FilingAction
} from '@/utils/payroll-compliance'
import { formatDate, formatPeriod } from '@/utils/payroll-workspace'

type Props = {
  filing: FilingRow | null
  open: boolean
  mode: InspectorMode
  onOpenChange: (open: boolean) => void

  /** The statutory rules the figures were calculated under, for the "rates applied" section. */
  rules: StatutoryRule[]
  nameOf: (employeeId: string) => string
  onAction: (action: FilingAction) => void
  onDownload: () => void
}

/** Which rules explain a filing kind. The annual return reports pay, not contributions. */
const RULE_PREFIX: Record<FilingRow['kind'], string | null> = {
  cpf_contribution: 'stat-cpf',
  tax_withholding: 'stat-tax',
  annual_return: null
}

type FormProps = {
  filing: FilingRow
  mode: InspectorMode
  onAction: (action: FilingAction) => void
  onDownload: () => void
}

/**
 * The action row, keyed by status so a filing only ever offers the moves it can make. Submitting
 * asks for the authority's reference; rejecting asks for the reason — both are what the audit
 * trail needs later, so they are collected now rather than left as a note.
 */
const FilingActions = ({ filing, mode, onAction, onDownload }: FormProps) => {
  const [reference, setReference] = useState('')
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const authority = FILING_AUTHORITIES[filing.kind]

  const download = (
    <Button variant='outline' onClick={onDownload}>
      <DownloadIcon />
      Download file
    </Button>
  )

  switch (filing.status) {
    case 'not_started':
    case 'rejected':
      return (
        <div className='flex flex-wrap items-center justify-end gap-2'>
          <Button onClick={() => onAction({ type: 'prepare' })}>
            {filing.status === 'rejected' ? 'Prepare again' : 'Prepare filing'}
          </Button>
        </div>
      )

    case 'prepared':
      return (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='filing-reference'>{authority} reference</Label>
            <Input
              id='filing-reference'
              value={reference}
              onChange={event => setReference(event.target.value)}
              placeholder='The acknowledgement number from the portal'
              autoFocus={mode === 'submit'}
            />
          </div>
          <div className='flex flex-wrap items-center justify-end gap-2'>
            {download}
            <Button
              disabled={reference.trim().length === 0}
              onClick={() => onAction({ type: 'submit', reference: reference.trim() })}
            >
              Mark as submitted
            </Button>
          </div>
        </div>
      )

    case 'submitted':
      return (
        <div className='flex flex-col gap-3'>
          {rejecting && (
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='filing-reason'>What {authority} said</Label>
              <Textarea
                id='filing-reason'
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder='The reason given for the rejection, so whoever fixes it knows what to change'
                rows={3}
                autoFocus
              />
            </div>
          )}
          <div className='flex flex-wrap items-center justify-end gap-2'>
            {rejecting ? (
              <>
                <Button variant='outline' onClick={() => setRejecting(false)}>
                  Cancel
                </Button>
                <Button
                  variant='destructive'
                  disabled={reason.trim().length === 0}
                  onClick={() => onAction({ type: 'reject', reason: reason.trim() })}
                >
                  Record rejection
                </Button>
              </>
            ) : (
              <>
                <Button variant='outline' onClick={() => setRejecting(true)} autoFocus={mode === 'respond'}>
                  Record rejection
                </Button>
                <Button onClick={() => onAction({ type: 'accept' })}>Record acceptance</Button>
              </>
            )}
          </div>
        </div>
      )

    case 'accepted':
      return <div className='flex flex-wrap items-center justify-end gap-2'>{download}</div>
  }
}

/**
 * One filing, in full: its progress, the lines that make up the amount, the rates behind them,
 * and everything that has happened to it. The actions sit at the bottom, keyed by status.
 */
const FilingInspector = ({ filing, open, mode, onOpenChange, rules, nameOf, onAction, onDownload }: Props) => {
  if (!filing) return null

  const authority = FILING_AUTHORITIES[filing.kind]
  const prefix = RULE_PREFIX[filing.kind]
  const appliedRules = prefix ? rules.filter(rule => rule.id.startsWith(prefix)) : []
  const events = filingAuditEvents(filing, nameOf)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col gap-0 overflow-y-auto sm:max-w-lg'>
        <SheetHeader className='pr-12'>
          <div className='flex flex-wrap items-center gap-2'>
            <FilingStatusBadge status={filing.status} />
            <span className='text-muted-foreground text-xs'>{authority}</span>
          </div>
          <SheetTitle className='text-base'>
            {FILING_KIND_LABELS[filing.kind]} · {formatMoney(filing.amount)}
          </SheetTitle>
          <SheetDescription>
            {filing.runReference ? `${filing.runReference} · ` : ''}
            {formatPeriod(filing.periodStart, filing.periodEnd)} · due {formatDate(filing.dueDate)} ·{' '}
            {filing.employeeCount} employees
          </SheetDescription>
        </SheetHeader>

        <div className='flex flex-1 flex-col gap-5 px-4 pb-4'>
          <FilingStageRail status={filing.status} />

          {filing.status === 'rejected' && (
            <Alert variant='destructive'>
              <AlertTitle>Rejected by {authority}</AlertTitle>
              <AlertDescription>
                {filing.rejectionReason ?? 'No reason was recorded.'} Fix the records, then prepare the filing again.
              </AlertDescription>
            </Alert>
          )}

          <section className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold'>What is in the amount</h3>
            <div className='overflow-hidden rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className='text-right'>Employees</TableHead>
                    <TableHead className='text-right'>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filing.lines.map(line => (
                    <TableRow key={line.code}>
                      <TableCell>
                        {line.label}
                        <span className='text-muted-foreground ml-1.5 text-xs'>{line.code}</span>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>{line.employeeCount}</TableCell>
                      <TableCell className='text-right tabular-nums'>{formatMoney(line.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className='font-medium'>Total</TableCell>
                    <TableCell className='text-right tabular-nums'>{filing.employeeCount}</TableCell>
                    <TableCell className='text-right font-medium tabular-nums'>{formatMoney(filing.amount)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            {filing.calculationVersion && filing.payRunId && (
              <p className='text-muted-foreground text-xs'>
                From calculation #{filing.calculationVersion} of {filing.runReference}. Recalculating the run means
                preparing this filing again.
              </p>
            )}
          </section>

          {appliedRules.length > 0 && (
            <section className='flex flex-col gap-2'>
              <h3 className='text-sm font-semibold'>Rates applied</h3>
              <dl className='flex flex-col divide-y rounded-lg border text-sm'>
                {appliedRules.map(rule => (
                  <div key={rule.id} className='flex items-baseline justify-between gap-3 px-3 py-2'>
                    <dt className='text-muted-foreground'>{rule.name}</dt>
                    <dd className='shrink-0 tabular-nums'>
                      {rule.rate}%
                      {rule.ceiling && (
                        <span className='text-muted-foreground'> · capped at {formatMoney(rule.ceiling)}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className='text-muted-foreground text-xs'>
                In force from {formatDate(appliedRules[0].effectiveFrom)}. Change them under Payroll settings →
                Statutory.
              </p>
            </section>
          )}

          <Separator />

          <section className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold'>History</h3>
            <AuditTimeline events={events} emptyMessage='Nothing has happened on this filing yet.' />
          </section>

          {filing.payRunId && (
            <Button
              variant='link'
              size='sm'
              className='w-fit px-0'
              render={<Link href={`/payroll/runs/${filing.payRunId}`} />}
              nativeButton={false}
            >
              Open {filing.runReference}
              <ArrowRightIcon />
            </Button>
          )}
        </div>

        <SheetFooter className='border-t'>
          {/* Keyed by id and status so the reference and reason fields start empty for each move. */}
          <FilingActions
            key={`${filing.id}-${filing.status}`}
            filing={filing}
            mode={mode}
            onAction={onAction}
            onDownload={onDownload}
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default FilingInspector
