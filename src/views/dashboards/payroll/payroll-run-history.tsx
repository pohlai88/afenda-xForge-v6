// Type Imports
import type { PayRun, PayRunStatus } from '@/types/payroll/pay-run-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'

const STATUS_STYLES: Partial<Record<PayRunStatus, string>> = {
  pending_approval: 'bg-chart-5/15 text-chart-5',
  approved: 'bg-chart-2/15 text-chart-2',
  paid: 'bg-primary/10 text-primary',
  closed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  failed: 'bg-destructive/10 text-destructive'
}

const STATUS_LABELS: Partial<Record<PayRunStatus, string>> = {
  draft: 'Draft',
  calculating: 'Calculating',
  calculated: 'Calculated',
  pending_approval: 'Pending approval',
  approved: 'Approved',
  paid: 'Paid',
  closed: 'Closed',
  cancelled: 'Cancelled',
  failed: 'Failed'
}

type Props = {
  runs: PayRun[]
  className?: string
}

const PayrollRunHistory = ({ runs, className }: Props) => {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className='flex flex-col gap-1 py-6'>
        <span className='text-lg font-semibold'>Run history</span>
        <span className='text-muted-foreground text-sm'>Most recent first</span>
      </CardHeader>
      <CardContent className='px-0 pb-0'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Pay date</TableHead>
                <TableHead className='text-right'>Employees</TableHead>
                <TableHead className='text-right'>Gross</TableHead>
                <TableHead className='text-right'>Net</TableHead>
                <TableHead className='text-right'>Employer cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map(run => (
                <TableRow key={run.id}>
                  <TableCell className='font-medium'>{run.reference}</TableCell>
                  <TableCell className='text-muted-foreground whitespace-nowrap'>
                    {run.periodStart} – {run.periodEnd}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>{run.payDate}</TableCell>
                  <TableCell className='text-right'>{run.employeeCount}</TableCell>
                  <TableCell className='text-right'>{formatMoney(run.totals.grossPay)}</TableCell>
                  <TableCell className='text-right'>{formatMoney(run.totals.netPay)}</TableCell>
                  <TableCell className='text-right font-medium'>{formatMoney(run.totals.employerCost)}</TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs whitespace-nowrap', STATUS_STYLES[run.status])}>
                      {STATUS_LABELS[run.status] ?? run.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default PayrollRunHistory
