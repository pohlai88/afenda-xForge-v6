'use client'

// Third-party Imports
import { ArrowUpRightIcon } from 'lucide-react'

// Type Imports
import type { Department } from '@/types/hrm/employee-types'
import type { PayRun, Payslip } from '@/types/payroll/pay-run-types'
import type { PayrollRunRow } from '@/types/payroll/run-workspace-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import GrossToNet from './gross-to-net'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { changeVsPrevious, costByDepartment } from '@/utils/payroll-metrics'
import {
  formatSignedMoney,
  formatSignedPercent,
  initials,
  largestMovers,
  newJoiners,
  reconciliationHeadcount,
  reconciliationLines
} from '@/utils/payroll-workspace'

type Props = {
  run: PayRun
  previousRun?: PayRun
  rows: PayrollRunRow[]
  previousSlips: Payslip[]
  departments: Department[]

  /** Switch to the employee table sorted by a column — the drill-down from a run-level figure. */
  onDrillDown: (sortBy: string, desc: boolean) => void

  /** Switch to the employee table filtered to one department. */
  onFilterDepartment: (departmentId: string) => void

  /** Open one employee in the inspector. */
  onSelectEmployee: (employeeId: string) => void
  className?: string
}

const SectionTitle = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
  <div className='flex items-center justify-between gap-4 px-4 py-3'>
    <h3 className='text-sm font-semibold'>{children}</h3>
    {action}
  </div>
)

const Delta = ({ current, previous }: { current: number; previous: number | null }) => {
  if (previous === null) return <span className='text-muted-foreground'>—</span>

  const delta = current - previous
  const percent = previous === 0 ? null : (delta / previous) * 100

  return (
    <span className='tabular-nums'>
      {delta > 0 ? '+' : ''}
      {delta}
      {percent !== null && <span className='text-muted-foreground ml-1 text-xs'>{formatSignedPercent(percent)}</span>}
    </span>
  )
}

/**
 * Current run against the previous one, then the people behind the difference. Every number
 * that can be drilled into is a control; a reconciliation figure you cannot open is a claim.
 */
const PayrollReconciliation = ({
  run,
  previousRun,
  rows,
  previousSlips,
  departments,
  onDrillDown,
  onFilterDepartment,
  onSelectEmployee,
  className
}: Props) => {
  const lines = reconciliationLines(run, previousRun)
  const headcount = reconciliationHeadcount(run, previousRun)
  const movers = largestMovers(rows)
  const joiners = newJoiners(rows)

  const employees = rows.map(row => row.employee)

  const currentByDepartment = costByDepartment(
    rows.map(row => row.payslip),
    employees,
    departments,
    run.currency
  )

  const previousByDepartment = previousRun
    ? new Map(
        costByDepartment(previousSlips, employees, departments, previousRun.currency).map(d => [d.departmentId, d.cost])
      )
    : null

  return (
    <div className={cn('grid gap-4 xl:grid-cols-3', className)}>
      <div className='bg-card rounded-lg border xl:col-span-2'>
        <SectionTitle>
          Current vs previous
          {previousRun && <span className='text-muted-foreground font-normal'> · {previousRun.reference}</span>}
        </SectionTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='h-9 pl-4 text-xs'>Measure</TableHead>
              <TableHead className='h-9 text-right text-xs'>Current</TableHead>
              <TableHead className='h-9 text-right text-xs'>Previous</TableHead>
              <TableHead className='h-9 pr-4 text-right text-xs'>Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className='py-2 pl-4 font-medium'>Employees</TableCell>
              <TableCell className='py-2 text-right tabular-nums'>{headcount.current}</TableCell>
              <TableCell className='text-muted-foreground py-2 text-right tabular-nums'>
                {headcount.previous ?? '—'}
              </TableCell>
              <TableCell className='py-2 pr-4 text-right'>
                <Delta current={headcount.current} previous={headcount.previous} />
              </TableCell>
            </TableRow>
            {lines.map(line => {
              const change = changeVsPrevious(line.current, line.previous ?? undefined)
              const delta = line.previous ? line.current.amount - line.previous.amount : null

              return (
                <TableRow key={line.key}>
                  <TableCell className='py-2 pl-4 font-medium'>
                    {line.drillDown ? (
                      <Button
                        variant='link'
                        className='h-auto p-0 font-medium'
                        onClick={() => onDrillDown(line.drillDown!.sortBy, line.drillDown!.desc)}
                      >
                        {line.label}
                        <ArrowUpRightIcon className='size-3.5' />
                      </Button>
                    ) : (
                      line.label
                    )}
                  </TableCell>
                  <TableCell className='py-2 text-right tabular-nums'>{formatMoney(line.current)}</TableCell>
                  <TableCell className='text-muted-foreground py-2 text-right tabular-nums'>
                    {line.previous ? formatMoney(line.previous) : '—'}
                  </TableCell>
                  <TableCell className='py-2 pr-4 text-right tabular-nums'>
                    {delta === null ? (
                      <span className='text-muted-foreground'>—</span>
                    ) : (
                      <span className='tabular-nums'>
                        {delta !== 0 && (
                          <span aria-hidden='true' className='text-muted-foreground'>
                            {delta > 0 ? '↑' : '↓'}{' '}
                          </span>
                        )}
                        {formatSignedMoney({ amount: delta, currency: run.currency })}
                        <span className='text-muted-foreground ml-1 text-xs'>{formatSignedPercent(change)}</span>
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className='bg-card rounded-lg border'>
        <SectionTitle>Gross to net</SectionTitle>
        <GrossToNet totals={run.totals} className='px-4 pb-4' />
      </div>

      <div className='bg-card rounded-lg border xl:col-span-2'>
        <SectionTitle>Employer cost by department</SectionTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='h-9 pl-4 text-xs'>Department</TableHead>
              <TableHead className='h-9 text-right text-xs'>Employees</TableHead>
              <TableHead className='h-9 text-right text-xs'>Current</TableHead>
              <TableHead className='h-9 text-right text-xs'>Previous</TableHead>
              <TableHead className='h-9 pr-4 text-right text-xs'>Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentByDepartment.map(department => {
              const previous = previousByDepartment?.get(department.departmentId) ?? null
              const delta = previous ? department.cost.amount - previous.amount : null

              return (
                <TableRow key={department.departmentId}>
                  <TableCell className='py-2 pl-4'>
                    <Button
                      variant='link'
                      className='h-auto p-0 font-medium'
                      onClick={() => onFilterDepartment(department.departmentId)}
                    >
                      {department.name}
                      <ArrowUpRightIcon className='size-3.5' />
                    </Button>
                    <span className='text-muted-foreground ml-2 text-xs'>{department.share.toFixed(1)}%</span>
                  </TableCell>
                  <TableCell className='py-2 text-right tabular-nums'>{department.employees}</TableCell>
                  <TableCell className='py-2 text-right tabular-nums'>{formatMoney(department.cost)}</TableCell>
                  <TableCell className='text-muted-foreground py-2 text-right tabular-nums'>
                    {previous ? formatMoney(previous) : '—'}
                  </TableCell>
                  <TableCell className='py-2 pr-4 text-right tabular-nums'>
                    {delta === null ? (
                      <span className='text-muted-foreground'>—</span>
                    ) : (
                      <span className='tabular-nums'>
                        {delta !== 0 && (
                          <span aria-hidden='true' className='text-muted-foreground'>
                            {delta > 0 ? '↑' : '↓'}{' '}
                          </span>
                        )}
                        {formatSignedMoney({ amount: delta, currency: run.currency })}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className='bg-card rounded-lg border'>
        <SectionTitle
          action={
            <Button variant='link' size='xs' className='px-0' onClick={() => onDrillDown('variance', true)}>
              All employees
              <ArrowUpRightIcon />
            </Button>
          }
        >
          Largest movers
        </SectionTitle>
        <ul className='divide-y'>
          {movers.map(row => (
            <li key={row.employeeId}>
              <Button
                variant='ghost'
                onClick={() => onSelectEmployee(row.employeeId)}
                className='h-auto w-full justify-start gap-3 rounded-none px-4 py-2 text-left font-normal'
              >
                <Avatar className='size-7'>
                  {row.avatar && <AvatarImage src={row.avatar} alt='' />}
                  <AvatarFallback className='text-[10px]'>{initials(row.name)}</AvatarFallback>
                </Avatar>
                <span className='flex min-w-0 flex-1 flex-col'>
                  <span className='truncate text-sm font-medium'>{row.name}</span>
                  <span className='text-muted-foreground truncate text-xs'>{row.departmentName}</span>
                </span>
                <span
                  className={cn(
                    'text-sm font-medium tabular-nums',
                    'text-muted-foreground'
                  )}
                >
                  {formatSignedMoney(row.variance!)}
                </span>
              </Button>
            </li>
          ))}
          {joiners.length > 0 && (
            <li className='text-muted-foreground px-4 py-2 text-xs'>
              {joiners.length === 1 ? '1 new joiner' : `${joiners.length} new joiners`} with no previous payslip:{' '}
              {joiners.map(j => j.name).join(', ')}
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default PayrollReconciliation
