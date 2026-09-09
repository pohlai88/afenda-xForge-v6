// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { formatMoney } from '@/utils/money'
import { formatPeriod } from '@/utils/payroll-workspace'

type Props = {
  run: PayRun
  className?: string
}

/**
 * What this run contains, to the cent.
 *
 * These four figures used to sit in the state band, where they were the only piece of composition
 * in a band about condition. Someone reading them is reconciling a run rather than deciding what
 * to do about it, which is a different question and a different band — and it puts them directly
 * above the bridge that explains how the first becomes the last.
 */
const EntityRunTotals = ({ run, className }: Props) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
        Run totals
      </CardTitle>
      <CardDescription>
        {run.reference} · {formatPeriod(run.periodStart, run.periodEnd)}
      </CardDescription>
    </CardHeader>

    <CardContent>
      <dl className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
        {[
          { label: 'Gross', value: run.totals.grossPay },
          { label: 'Tax', value: run.totals.employeeTaxes },
          { label: 'Deductions', value: run.totals.employeeDeductions },
          { label: 'Net pay', value: run.totals.netPay }
        ].map(item => (
          <div key={item.label} className='flex flex-col gap-1'>
            <dt className='text-muted-foreground text-xs tracking-wide uppercase'>{item.label}</dt>
            <dd className='text-base font-semibold tabular-nums'>{formatMoney(item.value)}</dd>
          </div>
        ))}
      </dl>
    </CardContent>
  </Card>
)

export default EntityRunTotals
