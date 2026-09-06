'use client'

// Third-party Imports
import { XIcon } from 'lucide-react'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'
import type { AuditEvent, PayrollRunRow } from '@/types/payroll/run-workspace-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExceptionBadge } from './exception-badge'
import ExceptionList, { type ExceptionListItem } from './exception-list'
import PayBreakdown from './pay-breakdown'
import PayVariance from './pay-variance'
import PayrollAuditTimeline from './payroll-audit-timeline'
import PayrollSourceTrace, { PayrollInputs } from './payroll-source-trace'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { EXCEPTION_SEVERITY_ORDER } from '@/utils/payroll-metrics'
import {
  EMPLOYEE_PAYROLL_STATUS_LABELS,
  EMPLOYEE_PAYROLL_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  formatSignedMoney,
  formatSignedPercent,
  initials,
  payrollInputs,
  sortExceptions,
  sourceTrace
} from '@/utils/payroll-workspace'

/** One earlier payslip for this person, for the History tab. */
export type PayHistoryPoint = {
  runId: string
  reference: string
  payDate: string
  gross: PayrollRunRow['gross']
  net: PayrollRunRow['net']
}

type Props = {
  row: PayrollRunRow
  run: PayRun
  previousReference?: string
  history: PayHistoryPoint[]

  /** Exceptions about this person, already carrying subject and avatar. */
  exceptions: ExceptionListItem[]
  audit: AuditEvent[]
  onSelectException: (exception: ExceptionListItem) => void
  onClose: () => void
  className?: string
}

/**
 * One employee's pay, in the panel beside the table. Six tabs so the approver can move from
 * "the number" to "why the number" to "where the number came from" without leaving the run.
 */
const PayrollEmployeeInspector = ({
  row,
  run,
  previousReference,
  history,
  exceptions,
  audit,
  onSelectException,
  onClose,
  className
}: Props) => {
  const openExceptions = exceptions.filter(e => !e.resolvedAt)
  const primary = sortExceptions(openExceptions, EXCEPTION_SEVERITY_ORDER)[0]

  return (
    <div className={cn('bg-card flex h-full min-h-0 flex-col', className)}>
      <div className='flex items-start gap-3 border-b p-4'>
        <Avatar className='size-10'>
          {row.avatar && <AvatarImage src={row.avatar} alt='' />}
          <AvatarFallback className='text-xs'>{initials(row.name)}</AvatarFallback>
        </Avatar>
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <h2 className='truncate text-base font-semibold'>{row.name}</h2>
          <p className='text-muted-foreground truncate text-xs'>
            {row.employeeNumber} · {row.positionTitle} · {row.departmentName}
          </p>
          <div className='mt-1 flex flex-wrap items-center gap-1.5'>
            <Badge
              className={cn(
                'h-auto rounded-sm px-1.5 py-0.5 text-xs',
                EMPLOYEE_PAYROLL_STATUS_STYLES[row.payrollStatus]
              )}
            >
              {EMPLOYEE_PAYROLL_STATUS_LABELS[row.payrollStatus]}
            </Badge>
            <Badge className={cn('h-auto rounded-sm px-1.5 py-0.5 text-xs', PAYMENT_STATUS_STYLES[row.paymentStatus])}>
              Payment · {PAYMENT_STATUS_LABELS[row.paymentStatus]}
            </Badge>
          </div>
        </div>
        <Button variant='ghost' size='icon-sm' onClick={onClose} aria-label='Close inspector'>
          <XIcon />
        </Button>
      </div>

      <dl className='grid grid-cols-2 gap-x-4 border-b px-4 py-3 text-sm'>
        <div className='flex flex-col'>
          <dt className='text-muted-foreground text-xs'>Net pay</dt>
          <dd className='text-xl font-semibold tabular-nums'>{formatMoney(row.net)}</dd>
        </div>
        <div className='flex flex-col'>
          <dt className='text-muted-foreground text-xs'>vs previous run</dt>
          <dd
            className={cn(
              'text-xl font-semibold tabular-nums',
              row.variance && row.variance.amount > 0 && 'text-success',
              row.variance && row.variance.amount < 0 && 'text-destructive'
            )}
          >
            {row.variance ? formatSignedMoney(row.variance) : 'New'}
            {row.variance && (
              <span className='text-muted-foreground ml-1 text-xs font-normal'>
                {formatSignedPercent(row.variancePercent)}
              </span>
            )}
          </dd>
        </div>
      </dl>

      {primary && (
        <Button
          variant='ghost'
          onClick={() => onSelectException(primary as ExceptionListItem)}
          className='h-auto justify-start gap-2 rounded-none border-b px-4 py-2.5 text-left font-normal whitespace-normal'
        >
          <ExceptionBadge severity={primary.severity} />
          <span className='min-w-0 flex-1 truncate text-sm'>{primary.title}</span>
          {openExceptions.length > 1 && (
            <span className='text-muted-foreground shrink-0 text-xs'>+{openExceptions.length - 1} more</span>
          )}
        </Button>
      )}

      <Tabs defaultValue='overview' className='min-h-0 flex-1 gap-0'>
        <TabsList variant='line' className='w-full justify-start overflow-x-auto rounded-none border-b px-2'>
          <TabsTrigger value='overview' className='flex-none'>
            Overview
          </TabsTrigger>
          <TabsTrigger value='pay' className='flex-none'>
            Pay
          </TabsTrigger>
          <TabsTrigger value='inputs' className='flex-none'>
            Inputs
          </TabsTrigger>
          <TabsTrigger value='exceptions' className='flex-none'>
            Exceptions
            {openExceptions.length > 0 && (
              <span className='bg-muted text-foreground rounded-full px-1.5 text-[10px] tabular-nums'>
                {openExceptions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value='history' className='flex-none'>
            History
          </TabsTrigger>
          <TabsTrigger value='audit' className='flex-none'>
            Audit
          </TabsTrigger>
        </TabsList>

        <ScrollArea className='min-h-0 flex-1'>
          <TabsContent value='overview' className='flex flex-col gap-4 p-4'>
            <PayVariance current={row.payslip} previous={row.previousPayslip} previousReference={previousReference} />
            <Separator />
            <dl className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
              <div>
                <dt className='text-muted-foreground text-xs'>Gross pay</dt>
                <dd className='tabular-nums'>{formatMoney(row.gross)}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-xs'>Location</dt>
                <dd>{row.locationName}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-xs'>Hours</dt>
                <dd className='tabular-nums'>
                  {row.payslip.hoursRegular ?? 0} regular
                  {row.payslip.hoursOvertime ? ` · ${row.payslip.hoursOvertime} overtime` : ''}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-xs'>Payment</dt>
                <dd>
                  {row.employee.payroll.paymentMethod === 'bank_transfer'
                    ? row.employee.payroll.bankAccountLast4
                      ? `Bank transfer ···· ${row.employee.payroll.bankAccountLast4}`
                      : 'Bank transfer — no account on file'
                    : row.employee.payroll.paymentMethod}
                </dd>
              </div>
            </dl>
          </TabsContent>

          <TabsContent value='pay' className='p-4'>
            <PayBreakdown payslip={row.payslip} />
          </TabsContent>

          <TabsContent value='inputs' className='p-4'>
            <PayrollInputs inputs={payrollInputs(row)} />
          </TabsContent>

          <TabsContent value='exceptions'>
            <ExceptionList
              exceptions={exceptions}
              onSelect={onSelectException}
              showSubject={false}
              emptyMessage='No exceptions for this employee on this run.'
            />
          </TabsContent>

          <TabsContent value='history' className='p-4'>
            {history.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No earlier payslips for this employee.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='h-9 text-xs'>Run</TableHead>
                    <TableHead className='h-9 text-right text-xs'>Gross</TableHead>
                    <TableHead className='h-9 text-right text-xs'>Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(point => (
                    <TableRow key={point.runId} data-state={point.runId === run.id ? 'selected' : undefined}>
                      <TableCell className='py-2'>
                        <span className='flex flex-col'>
                          <span className='font-medium'>{point.reference}</span>
                          <span className='text-muted-foreground text-xs'>{point.payDate}</span>
                        </span>
                      </TableCell>
                      <TableCell className='py-2 text-right tabular-nums'>{formatMoney(point.gross)}</TableCell>
                      <TableCell className='py-2 text-right font-medium tabular-nums'>
                        {formatMoney(point.net)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value='audit' className='flex flex-col gap-4 p-4'>
            <PayrollSourceTrace entries={sourceTrace(row, run)} />
            <Separator />
            <h3 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>Activity</h3>
            <PayrollAuditTimeline events={audit} emptyMessage='No activity recorded for this employee on this run.' />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export default PayrollEmployeeInspector
