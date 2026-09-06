// Type Imports
import type { PayRunTotals } from '@/types/payroll/pay-run-types'

// Component Imports
import { Separator } from '@/components/ui/separator'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'

type Props = {
  totals: PayRunTotals
  className?: string
}

/**
 * Employer cost down to net pay as structured rows. The dashboard draws this as a bridge chart;
 * the workspace shows the figures, because the person here is reconciling to the cent.
 */
const GrossToNet = ({ totals, className }: Props) => {
  const rows: { label: string; amount: string; kind: 'total' | 'add' | 'deduct' }[] = [
    { label: 'Total employer cost', amount: formatMoney(totals.employerCost), kind: 'total' },
    { label: 'Employer contributions', amount: `−${formatMoney(totals.employerContributions)}`, kind: 'deduct' },
    { label: 'Gross pay', amount: formatMoney(totals.grossPay), kind: 'total' },
    { label: 'Employee statutory', amount: `−${formatMoney(totals.employeeDeductions)}`, kind: 'deduct' },
    { label: 'Income tax', amount: `−${formatMoney(totals.employeeTaxes)}`, kind: 'deduct' },
    { label: 'Net pay', amount: formatMoney(totals.netPay), kind: 'total' }
  ]

  return (
    <dl className={cn('flex flex-col text-sm', className)}>
      {rows.map((row, index) => (
        <div key={row.label} className='contents'>
          {row.kind === 'total' && index > 0 && <Separator className='my-1' />}
          <div
            className={cn(
              'flex items-baseline justify-between gap-4 py-1',
              row.kind === 'total' ? 'font-semibold' : 'text-muted-foreground pl-4'
            )}
          >
            <dt>{row.label}</dt>
            <dd className={cn('tabular-nums', row.kind === 'total' && 'text-foreground')}>{row.amount}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

export default GrossToNet
