'use client'

// Third-party Imports
import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon } from 'lucide-react'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'
import type { AuditEvent, PayrollRunRow } from '@/types/payroll/run-workspace-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ExceptionList, { type ExceptionListItem } from './exception-list'
import PayBreakdown from './pay-breakdown'
import PayVariance from './pay-variance'
import PayrollAuditTimeline from './payroll-audit-timeline'
import PayrollSourceTrace, { PayrollInputs } from './payroll-source-trace'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import {
  EMPLOYEE_PAYROLL_STATUS_LABELS,
  EMPLOYEE_PAYROLL_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  formatDate,
  formatSignedMoney,
  formatSignedPercent,
  initials,
  payrollInputs,
  sourceTrace
} from '@/utils/payroll-workspace'

/** One earlier payslip for this person, for the pay history. */
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

  /** Neighbours in the table's current order, so an approver can walk the list without leaving. */
  previousEmployeeId?: string
  nextEmployeeId?: string
  position: { index: number; total: number }
  onSelectException: (exception: ExceptionListItem) => void
  onSelectEmployee: (employeeId: string) => void
  onFilterDepartment: (departmentId: string) => void

  /** Absent when the actor may not recalculate, or the run is locked. */
  onRecalculate?: () => void
  onBack: () => void
  className?: string
}

const Tile = ({ label, value, detail }: { label: string; value: React.ReactNode; detail?: React.ReactNode }) => (
  <div className='bg-muted/40 flex flex-col gap-0.5 rounded-md p-3'>
    <dt className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</dt>
    <dd className='font-semibold tabular-nums'>{value}</dd>
    {detail && <dd className='text-muted-foreground text-xs'>{detail}</dd>}
  </div>
)

/**
 * One employee's pay, full width, in place of the table. The side panel it replaces was capped
 * by the table's height and squeezed a payslip into a third of the screen; here the number, why
 * it moved, what fed it and who touched it each get a card, and the reader walks the list with
 * previous/next instead of going back to the table each time. `?employee=` in the URL keeps the
 * position shareable, and Back returns to the same filters and sort.
 */
const PayrollEmployeeDrilldown = ({
  row,
  run,
  previousReference,
  history,
  exceptions,
  audit,
  previousEmployeeId,
  nextEmployeeId,
  position,
  onSelectException,
  onSelectEmployee,
  onFilterDepartment,
  onRecalculate,
  onBack,
  className
}: Props) => {
  const openExceptions = exceptions.filter(e => !e.resolvedAt)
  const currency = row.net.currency

  const employerContributions = {
    amount: row.payslip.components
      .filter(c => c.kind === 'employer_contribution')
      .reduce((total, c) => total + c.amount.amount, 0),
    currency
  }

  const employerCost = { amount: row.gross.amount + employerContributions.amount, currency }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className='bg-card flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex min-w-0 items-center gap-3'>
          <Button variant='outline' size='sm' onClick={onBack}>
            <ChevronLeftIcon />
            Employees
          </Button>
          <Avatar className='size-10'>
            {row.avatar && <AvatarImage src={row.avatar} alt='' />}
            <AvatarFallback className='text-xs'>{initials(row.name)}</AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-col'>
            <h2 className='truncate text-base font-semibold'>{row.name}</h2>
            <p className='text-muted-foreground truncate text-xs'>
              {row.employeeNumber} · {row.positionTitle} ·{' '}
              <Button
                variant='link'
                size='xs'
                className='h-auto p-0 text-xs font-normal'
                onClick={() => onFilterDepartment(row.departmentId)}
              >
                {row.departmentName}
              </Button>{' '}
              · {row.locationName}
            </p>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Badge
            className={cn('h-auto rounded-sm px-1.5 py-0.5 text-xs', EMPLOYEE_PAYROLL_STATUS_STYLES[row.payrollStatus])}
          >
            {EMPLOYEE_PAYROLL_STATUS_LABELS[row.payrollStatus]}
          </Badge>
          <Badge className={cn('h-auto rounded-sm px-1.5 py-0.5 text-xs', PAYMENT_STATUS_STYLES[row.paymentStatus])}>
            Payment · {PAYMENT_STATUS_LABELS[row.paymentStatus]}
          </Badge>
          {onRecalculate && (
            <Button variant='outline' size='sm' onClick={onRecalculate}>
              <RefreshCwIcon />
              Recalculate
            </Button>
          )}
          <nav className='flex shrink-0 items-center gap-1' aria-label='Walk the employee list'>
            <span className='text-muted-foreground mr-1 text-xs whitespace-nowrap tabular-nums'>
              {position.index + 1} of {position.total}
            </span>
            <Button
              variant='outline'
              size='icon-sm'
              disabled={!previousEmployeeId}
              onClick={() => previousEmployeeId && onSelectEmployee(previousEmployeeId)}
              aria-label='Previous employee'
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant='outline'
              size='icon-sm'
              disabled={!nextEmployeeId}
              onClick={() => nextEmployeeId && onSelectEmployee(nextEmployeeId)}
              aria-label='Next employee'
            >
              <ChevronRightIcon />
            </Button>
          </nav>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
        <div className='flex min-w-0 flex-col gap-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>Pay</CardTitle>
              <CardDescription>
                {run.reference} · calculation #{run.calculationVersion}
                {run.payDate && ` · payday ${formatDate(run.payDate)}`}
              </CardDescription>
              <CardAction className='flex flex-col items-end'>
                <span className='text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl'>
                  {formatMoney(row.net)}
                </span>
                <span
                  className={cn(
                    'text-sm tabular-nums',
                    row.variance && row.variance.amount > 0 && 'text-success',
                    row.variance && row.variance.amount < 0 && 'text-destructive',
                    !row.variance && 'text-muted-foreground'
                  )}
                >
                  {row.variance
                    ? `${formatSignedMoney(row.variance)} (${formatSignedPercent(row.variancePercent)}) vs ${previousReference ?? 'previous run'}`
                    : 'New this run'}
                </span>
              </CardAction>
            </CardHeader>
            <CardContent className='flex flex-col gap-5'>
              <dl className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                <Tile label='Gross' value={formatMoney(row.gross)} />
                <Tile
                  label='Employer cost'
                  value={formatMoney(employerCost)}
                  detail={`${formatMoney(employerContributions)} contributions`}
                />
                <Tile
                  label='Hours'
                  value={`${row.payslip.hoursRegular ?? 0} h`}
                  detail={row.payslip.hoursOvertime ? `${row.payslip.hoursOvertime} h overtime` : 'No overtime'}
                />
                <Tile
                  label='Paid by'
                  value={
                    row.employee.payroll.paymentMethod === 'bank_transfer'
                      ? row.employee.payroll.bankAccountLast4
                        ? `···· ${row.employee.payroll.bankAccountLast4}`
                        : 'No account'
                      : row.employee.payroll.paymentMethod
                  }
                  detail={
                    row.employee.payroll.paymentMethod === 'bank_transfer' && !row.employee.payroll.bankAccountLast4
                      ? 'Bank transfer, nothing on file'
                      : 'Bank transfer'
                  }
                />
              </dl>
              <PayBreakdown payslip={row.payslip} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>Why it changed</CardTitle>
              <CardDescription>
                {previousReference ? `Line by line against ${previousReference}` : 'No previous payslip to compare'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayVariance current={row.payslip} previous={row.previousPayslip} previousReference={previousReference} />
            </CardContent>
          </Card>

          <Card className='gap-0 py-0'>
            <CardHeader className='py-5'>
              <CardTitle className='text-lg font-semibold'>Pay history</CardTitle>
              <CardDescription>
                {history.length} {history.length === 1 ? 'run' : 'runs'} on record
              </CardDescription>
            </CardHeader>
            <CardContent className='px-0 pb-0'>
              {history.length === 0 ? (
                <p className='text-muted-foreground px-6 pb-5 text-sm'>No earlier payslips for this employee.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='h-9 pl-6 text-xs'>Run</TableHead>
                      <TableHead className='h-9 text-xs'>Payday</TableHead>
                      <TableHead className='h-9 text-right text-xs'>Gross</TableHead>
                      <TableHead className='h-9 pr-6 text-right text-xs'>Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...history].reverse().map(point => (
                      <TableRow key={point.runId} data-state={point.runId === run.id ? 'selected' : undefined}>
                        <TableCell className='py-2 pl-6 font-medium'>{point.reference}</TableCell>
                        <TableCell className='text-muted-foreground py-2 text-xs'>
                          {formatDate(point.payDate)}
                        </TableCell>
                        <TableCell className='py-2 text-right tabular-nums'>{formatMoney(point.gross)}</TableCell>
                        <TableCell className='py-2 pr-6 text-right font-medium tabular-nums'>
                          {formatMoney(point.net)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='flex min-w-0 flex-col gap-4'>
          <Card className='gap-0 py-0'>
            <CardHeader className='py-5'>
              <CardTitle className='text-lg font-semibold'>Exceptions</CardTitle>
              <CardDescription>
                {openExceptions.length === 0
                  ? 'Nothing open for this employee'
                  : `${openExceptions.length} open · ${exceptions.length - openExceptions.length} resolved`}
              </CardDescription>
            </CardHeader>
            <CardContent className='px-0 pb-0'>
              <ExceptionList
                exceptions={exceptions}
                onSelect={onSelectException}
                showSubject={false}
                emptyMessage='No exceptions for this employee on this run.'
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>Inputs</CardTitle>
              <CardDescription>What calculation #{run.calculationVersion} read for this person</CardDescription>
            </CardHeader>
            <CardContent>
              <PayrollInputs inputs={payrollInputs(row)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>Source trace</CardTitle>
              <CardDescription>Where each payslip line came from, and the rule that produced it</CardDescription>
            </CardHeader>
            <CardContent>
              <PayrollSourceTrace entries={sourceTrace(row, run)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>Activity</CardTitle>
              <CardDescription>Who did what to this payslip, newest first</CardDescription>
            </CardHeader>
            <CardContent>
              <PayrollAuditTimeline events={audit} emptyMessage='No activity recorded for this employee on this run.' />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PayrollEmployeeDrilldown
