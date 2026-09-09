// Next Imports
import Link from 'next/link'

// Third-party Imports
import {
  AlertOctagonIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  DownloadIcon,
  FileCheckIcon
} from 'lucide-react'

// Type Imports
import type { FilingRow } from '@/types/payroll/compliance-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import FilingStageRail from './filing-stage-rail'
import FilingStatusBadge from './filing-status-badge'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { DUE_SOON_DAYS, FILING_AUTHORITIES, FILING_KIND_LABELS } from '@/utils/payroll-compliance'
import { formatDate, formatPeriod } from '@/utils/payroll-workspace'

export type InspectorMode = 'view' | 'submit' | 'respond'

type Props = {
  row: FilingRow

  /** Opens the filing inspector, optionally straight into a form. */
  onOpen: (mode: InspectorMode) => void
  onPrepare: () => void
  onDownload: () => void
  className?: string
}

/** The countdown is the page's one large figure: how long until the authority expects the file. */
const Countdown = ({ row }: { row: FilingRow }) => {
  const days = row.daysToDue

  if (days === null) {
    return (
      <>
        <span className='text-3xl leading-none font-semibold tracking-tight sm:text-4xl'>
          {formatDate(row.respondedAt?.slice(0, 10) ?? row.dueDate)}
        </span>
        <span className='text-muted-foreground text-sm'>Accepted</span>
      </>
    )
  }

  const overdue = days < 0
  const tone = overdue ? 'text-destructive-strong' : days <= DUE_SOON_DAYS ? 'text-warning-strong' : 'text-foreground'

  return (
    <>
      <span className={cn('text-5xl leading-none font-semibold tracking-tight tabular-nums sm:text-6xl', tone)}>
        {days === 0 ? 'Today' : Math.abs(days)}
      </span>
      <span className={cn('text-sm', overdue ? 'text-destructive-strong' : 'text-muted-foreground')}>
        {days === 0
          ? `Due · ${formatDate(row.dueDate)}`
          : overdue
            ? `${Math.abs(days) === 1 ? 'day' : 'days'} overdue · was due ${formatDate(row.dueDate)}`
            : `${days === 1 ? 'day' : 'days'} to file · due ${formatDate(row.dueDate)}`}
      </span>
    </>
  )
}

/**
 * The filing that needs working, first on the page. What it is, who it goes to, how much, how
 * long there is, and the one action that moves it on.
 */
const ComplianceFocus = ({ row, onOpen, onPrepare, onDownload, className }: Props) => {
  const authority = FILING_AUTHORITIES[row.kind]

  const gate = {
    not_started: {
      tone: 'text-muted-foreground',
      Icon: ClockIcon,
      text: `Not prepared yet. Prepare it from ${row.runReference ?? `${row.periodStart.slice(0, 4)}'s`} payslips.`
    },
    prepared: {
      tone: 'text-info-strong',
      Icon: FileCheckIcon,
      text: `Prepared${row.calculationVersion ? ` from calculation #${row.calculationVersion}` : ''}. Submit to ${authority} by ${formatDate(row.dueDate)}.`
    },
    submitted: {
      tone: 'text-warning-strong',
      Icon: ClockIcon,
      text: `Submitted ${formatDate(row.submittedAt?.slice(0, 10) ?? row.dueDate)}${row.reference ? ` · ${row.reference}` : ''}. Awaiting ${authority}'s response.`
    },
    rejected: {
      tone: 'text-destructive-strong',
      Icon: AlertOctagonIcon,
      text: `Rejected by ${authority}: ${row.rejectionReason ?? 'no reason given.'} Fix the records and prepare it again.`
    },
    accepted: {
      tone: 'text-success-strong',
      Icon: CheckCircle2Icon,
      text: `Accepted by ${authority}${row.respondedAt ? ` on ${formatDate(row.respondedAt.slice(0, 10))}` : ''}.`
    }
  }[row.status]

  const primary = {
    not_started: <Button onClick={onPrepare}>Prepare filing</Button>,
    prepared: <Button onClick={() => onOpen('submit')}>Mark as submitted</Button>,
    submitted: <Button onClick={() => onOpen('respond')}>Record response</Button>,
    rejected: <Button onClick={onPrepare}>Prepare again</Button>,
    accepted: (
      <Button onClick={onDownload}>
        <DownloadIcon />
        Download file
      </Button>
    )
  }[row.status]

  const amountTint =
    row.status === 'rejected' ? 'bg-destructive/5' : row.status === 'accepted' ? 'bg-success/10' : 'bg-muted/50'

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2 text-lg font-semibold'>
          <span className='whitespace-nowrap'>{FILING_KIND_LABELS[row.kind]}</span>
          <FilingStatusBadge status={row.status} />
        </CardTitle>
        <CardDescription>
          {row.runReference ? `${row.runReference} · ` : ''}
          {formatPeriod(row.periodStart, row.periodEnd)} · {authority} · {row.employeeCount} employees
        </CardDescription>
        <CardAction className='flex flex-col items-end gap-1 text-right'>
          <Countdown row={row} />
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-5'>
        <FilingStageRail status={row.status} />

        <dl className='grid gap-3 sm:grid-cols-3'>
          <div className={cn('flex flex-col gap-1 rounded-lg px-4 py-3', amountTint)}>
            <dt className='text-muted-foreground text-sm'>Amount due</dt>
            <dd className='text-xl font-semibold tabular-nums'>{formatMoney(row.amount)}</dd>
          </div>
          {/* A filing with one line would show the same amount twice, so it shows who and when instead. */}
          {row.lines.length > 1 ? (
            row.lines.slice(0, 2).map(line => (
              <div key={line.code} className='bg-muted/50 flex flex-col gap-1 rounded-lg px-4 py-3'>
                <dt className='text-muted-foreground text-sm'>{line.label}</dt>
                <dd className='text-xl font-semibold tabular-nums'>{formatMoney(line.amount)}</dd>
              </div>
            ))
          ) : (
            <>
              <div className='bg-muted/50 flex flex-col gap-1 rounded-lg px-4 py-3'>
                <dt className='text-muted-foreground text-sm'>Employees</dt>
                <dd className='text-xl font-semibold tabular-nums'>{row.employeeCount}</dd>
              </div>
              <div className='bg-muted/50 flex flex-col gap-1 rounded-lg px-4 py-3'>
                <dt className='text-muted-foreground text-sm'>Due</dt>
                <dd className='text-xl font-semibold tabular-nums'>{formatDate(row.dueDate)}</dd>
              </div>
            </>
          )}
        </dl>

        <div className='mt-auto flex flex-wrap items-center justify-between gap-3'>
          <p className={cn('flex items-center gap-1.5 text-sm', gate.tone)} role='status'>
            <gate.Icon className='size-4 shrink-0' aria-hidden='true' />
            {gate.text}
          </p>

          <div className='flex flex-wrap items-center gap-2'>
            {row.payRunId && (
              <Button variant='outline' render={<Link href={`/payroll/runs/${row.payRunId}`} />} nativeButton={false}>
                Open run
                <ArrowRightIcon />
              </Button>
            )}
            <Button variant='outline' onClick={() => onOpen('view')}>
              Open filing
            </Button>
            {primary}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ComplianceFocus
