// Type Imports
import type { Money } from '@/types/common/primitive-types'
import type { PayComponent, Payslip } from '@/types/payroll/pay-run-types'

// Component Imports
import { Separator } from '@/components/ui/separator'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'

type Props = {
  payslip: Payslip
  className?: string
}

const sum = (components: PayComponent[], currency: Money['currency']): Money => ({
  amount: components.reduce((total, c) => total + c.amount.amount, 0),
  currency
})

const Line = ({
  label,
  detail,
  amount,
  negative,
  emphasis
}: {
  label: string
  detail?: string
  amount: Money
  negative?: boolean
  emphasis?: boolean
}) => (
  <div className={cn('flex items-baseline justify-between gap-4 py-1', emphasis && 'font-semibold')}>
    <span className='flex min-w-0 flex-col'>
      <span className='truncate'>{label}</span>
      {detail && <span className='text-muted-foreground text-xs'>{detail}</span>}
    </span>
    <span className={cn('shrink-0 tabular-nums', negative && !emphasis && 'text-muted-foreground')}>
      {negative ? `−${formatMoney(amount)}` : formatMoney(amount)}
    </span>
  </div>
)

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className='flex flex-col'>
    <h4 className='text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase'>{title}</h4>
    {children}
  </section>
)

/**
 * The payslip as the employee would read it: what was earned, what came off, what they take
 * home — and then, under a rule, what the employer paid on top. Employer contributions sit
 * apart deliberately; folding them into the same column is how gross gets mistaken for cost.
 */
const PayBreakdown = ({ payslip, className }: Props) => {
  const currency = payslip.grossPay.currency
  const earnings = payslip.components.filter(c => c.kind === 'earning')
  const taxes = payslip.components.filter(c => c.kind === 'tax')
  const deductions = payslip.components.filter(c => c.kind === 'deduction')
  const employer = payslip.components.filter(c => c.kind === 'employer_contribution')

  const employerCost: Money = { amount: payslip.grossPay.amount + sum(employer, currency).amount, currency }

  return (
    <div className={cn('flex flex-col gap-4 text-sm', className)}>
      <Section title='Earnings'>
        {earnings.map(component => (
          <Line
            key={component.code}
            label={component.label}
            detail={
              component.quantity !== undefined && component.rate
                ? `${component.quantity} h × ${formatMoney(component.rate)}`
                : undefined
            }
            amount={component.amount}
          />
        ))}
        <Separator className='my-1' />
        <Line label='Gross pay' amount={payslip.grossPay} emphasis />
      </Section>

      <Section title='Deductions'>
        {[...taxes, ...deductions].map(component => (
          <Line key={component.code} label={component.label} amount={component.amount} negative />
        ))}
        <Separator className='my-1' />
        <Line label='Net pay' amount={payslip.netPay} emphasis />
      </Section>

      {employer.length > 0 && (
        <Section title='Employer contributions'>
          {employer.map(component => (
            <Line key={component.code} label={component.label} amount={component.amount} />
          ))}
          <Separator className='my-1' />
          <Line label='Total employer cost' amount={employerCost} emphasis />
        </Section>
      )}
    </div>
  )
}

export default PayBreakdown
