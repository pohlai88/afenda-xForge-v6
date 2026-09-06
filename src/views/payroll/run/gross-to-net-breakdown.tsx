// Type Imports
import type { PayRunTotals } from '@/types/payroll/pay-run-types'

// Component Imports
import { Separator } from '@/components/ui/separator'

// Util Imports
import { formatMoney } from '@/utils/money'

type Props = {
  totals: PayRunTotals
}

/**
 * How gross became net, in the four steps `PayRunTotals` already documents.
 *
 * Read straight off the totals the run has loaded — no second figure to keep in step with the
 * tile above it, and nothing fetched to open a popover. Deductions are shown as subtractions
 * without a warning colour: money leaving gross on its way to net is the arithmetic working,
 * not something going wrong.
 */
const GrossToNetBreakdown = ({ totals }: Props) => {
  const steps = [
    { label: 'Gross', value: formatMoney(totals.grossPay), sign: '' },
    { label: 'Tax', value: formatMoney(totals.employeeTaxes), sign: '−' },
    { label: 'Deductions', value: formatMoney(totals.employeeDeductions), sign: '−' }
  ]

  return (
    <div className='flex flex-col gap-1 text-sm'>
      <p className='text-muted-foreground text-xs'>How gross became net</p>
      <dl className='flex flex-col'>
        {steps.map(step => (
          <div key={step.label} className='flex items-baseline justify-between gap-4 py-1'>
            <dt className='text-muted-foreground'>{step.label}</dt>
            <dd className='tabular-nums'>
              {step.sign}
              {step.value}
            </dd>
          </div>
        ))}
        <Separator className='my-1' />
        <div className='flex items-baseline justify-between gap-4 py-1 font-medium'>
          <dt>Net</dt>
          <dd className='tabular-nums'>{formatMoney(totals.netPay)}</dd>
        </div>
      </dl>
    </div>
  )
}

export default GrossToNetBreakdown
