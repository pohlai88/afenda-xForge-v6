// Type Imports
import type { Money } from '@/types/common/primitive-types'
import type { Payslip } from '@/types/payroll/pay-run-types'

// Component Imports
import { Separator } from '@/components/ui/separator'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { formatSignedMoney, formatSignedPercent, payVariance } from '@/utils/payroll-workspace'

type Props = {
  current: Payslip
  previous?: Payslip

  /** Reference of the previous run, e.g. 'PR-2026-08', for the caption. */
  previousReference?: string
  className?: string
}

/**
 * Why this person's net pay moved. A table of lines, not a chart: the reader wants "overtime went
 * up S$820 and CPF took S$103 of it back", and a bar cannot say that.
 *
 * Deductions are shown with their effect on net — an increase in tax is a negative line — so the
 * column sums to the change in net pay and nobody has to flip signs in their head.
 */
const PayVariance = ({ current, previous, previousReference, className }: Props) => {
  const currency = current.netPay.currency

  if (!previous) {
    return (
      <div className={cn('flex flex-col gap-3 text-sm', className)}>
        <p className='text-muted-foreground'>
          First payslip for this employee. There is no previous run to compare against.
        </p>
        <div className='flex items-baseline justify-between font-semibold'>
          <span>Current net</span>
          <span className='tabular-nums'>{formatMoney(current.netPay)}</span>
        </div>
      </div>
    )
  }

  const lines = payVariance(current, previous, currency)
  const netDelta: Money = { amount: current.netPay.amount - previous.netPay.amount, currency }
  const netPercent = previous.netPay.amount === 0 ? null : (netDelta.amount / previous.netPay.amount) * 100

  // Employer lines do not move net pay; they are listed under their own heading.
  const netLines = lines.filter(line => line.direction !== 'employer' && line.delta.amount !== 0)
  const employerLines = lines.filter(line => line.direction === 'employer' && line.delta.amount !== 0)

  return (
    <div className={cn('flex flex-col gap-4 text-sm', className)}>
      <dl className='grid grid-cols-3 gap-3'>
        <div className='flex flex-col'>
          <dt className='text-muted-foreground text-xs'>
            Previous net{previousReference && ` · ${previousReference}`}
          </dt>
          <dd className='font-medium tabular-nums'>{formatMoney(previous.netPay)}</dd>
        </div>
        <div className='flex flex-col'>
          <dt className='text-muted-foreground text-xs'>Current net</dt>
          <dd className='font-medium tabular-nums'>{formatMoney(current.netPay)}</dd>
        </div>
        <div className='flex flex-col'>
          <dt className='text-muted-foreground text-xs'>Difference</dt>
          <dd
            className={cn(
              'font-semibold tabular-nums',
              netDelta.amount > 0 && 'text-success',
              netDelta.amount < 0 && 'text-destructive'
            )}
          >
            {formatSignedMoney(netDelta)}
            <span className='text-muted-foreground ml-1 text-xs font-normal'>{formatSignedPercent(netPercent)}</span>
          </dd>
        </div>
      </dl>

      {netLines.length === 0 ? (
        <p className='text-muted-foreground'>No component changed between the two runs.</p>
      ) : (
        <div className='flex flex-col'>
          <div className='text-muted-foreground grid grid-cols-[1fr_auto_auto_auto] gap-x-4 pb-1 text-xs'>
            <span>Component</span>
            <span className='text-right'>Previous</span>
            <span className='text-right'>Current</span>
            <span className='text-right'>Effect on net</span>
          </div>
          <Separator />
          {netLines.map(line => {
            // A larger deduction lowers net pay: flip the sign so the column reads as effect on net.
            const effect: Money = line.direction === 'deduction' ? { amount: -line.delta.amount, currency } : line.delta

            return (
              <div key={line.code} className='grid grid-cols-[1fr_auto_auto_auto] gap-x-4 py-1.5 tabular-nums'>
                <span className='truncate'>{line.label}</span>
                <span className='text-muted-foreground text-right'>{formatMoney(line.previous)}</span>
                <span className='text-right'>{formatMoney(line.current)}</span>
                <span
                  className={cn(
                    'text-right font-medium',
                    effect.amount > 0 && 'text-success',
                    effect.amount < 0 && 'text-destructive'
                  )}
                >
                  {formatSignedMoney(effect)}
                </span>
              </div>
            )
          })}
          <Separator />
          <div className='grid grid-cols-[1fr_auto] gap-x-4 py-1.5 font-semibold tabular-nums'>
            <span>Change in net pay</span>
            <span
              className={cn(
                'text-right',
                netDelta.amount > 0 && 'text-success',
                netDelta.amount < 0 && 'text-destructive'
              )}
            >
              {formatSignedMoney(netDelta)}
            </span>
          </div>
        </div>
      )}

      {employerLines.length > 0 && (
        <div className='flex flex-col'>
          <h4 className='text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase'>
            Employer contributions
          </h4>
          {employerLines.map(line => (
            <div key={line.code} className='flex items-baseline justify-between gap-4 py-1 tabular-nums'>
              <span>{line.label}</span>
              <span className='text-muted-foreground'>
                {formatMoney(line.previous)} → {formatMoney(line.current)}{' '}
                <span className='text-foreground font-medium'>({formatSignedMoney(line.delta)})</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PayVariance
