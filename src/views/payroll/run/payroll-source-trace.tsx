// Third-party Imports
import { AlertCircleIcon, ArrowRightLeftIcon, CheckIcon } from 'lucide-react'

// Type Imports
import type { PayrollInput, SourceTraceEntry } from '@/types/payroll/run-workspace-types'

// Component Imports
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { formatDate, formatInstant } from '@/utils/payroll-workspace'

const INPUT_STATUS: Record<PayrollInput['status'], { icon: typeof CheckIcon; label: string; className: string }> = {
  ok: { icon: CheckIcon, label: 'On file', className: 'text-success-strong' },
  changed: { icon: ArrowRightLeftIcon, label: 'Changed since last run', className: 'text-warning-strong' },
  missing: { icon: AlertCircleIcon, label: 'Missing', className: 'text-destructive-strong' }
}

/**
 * What the calculation read. Every value names where it came from, because "where did this
 * number come from" is the question every payroll query starts with.
 */
export const PayrollInputs = ({ inputs, className }: { inputs: PayrollInput[]; className?: string }) => (
  <dl className={cn('divide-y text-sm', className)}>
    {inputs.map(input => {
      const status = INPUT_STATUS[input.status]
      const Icon = status.icon

      return (
        <div key={input.label} className='grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 py-2'>
          <dt className='font-medium'>{input.label}</dt>
          <dd className={cn('flex items-center gap-1 text-xs', status.className)}>
            <Icon className='size-3.5' aria-hidden='true' />
            {status.label}
          </dd>
          <dd className={cn('tabular-nums', input.status === 'missing' && 'text-destructive-strong')}>{input.value}</dd>
          <dd className='text-muted-foreground col-span-2 text-xs'>
            {input.source}
            {input.effectiveFrom && ` · effective ${formatDate(input.effectiveFrom)}`}
          </dd>
        </div>
      )
    })}
  </dl>
)

/**
 * Line by line: this amount, from this record, by this rule, at this calculation. The table an
 * auditor asks for, so it is a table.
 */
const PayrollSourceTrace = ({ entries, className }: { entries: SourceTraceEntry[]; className?: string }) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='h-9 text-xs'>Line</TableHead>
          <TableHead className='h-9 text-right text-xs'>Amount</TableHead>
          <TableHead className='h-9 text-xs'>Source</TableHead>
          <TableHead className='h-9 text-xs'>Rule</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(entry => (
          <TableRow key={entry.code}>
            <TableCell className='py-2'>
              <span className='flex flex-col'>
                <span className='font-medium'>{entry.label}</span>
                <span className='text-muted-foreground font-mono text-[11px]'>{entry.code}</span>
              </span>
            </TableCell>
            <TableCell className='py-2 text-right tabular-nums'>{formatMoney(entry.amount)}</TableCell>
            <TableCell className='text-muted-foreground py-2 text-xs whitespace-normal'>{entry.source}</TableCell>
            <TableCell className='text-muted-foreground py-2 text-xs whitespace-normal'>{entry.rule}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    {entries[0] && <p className='text-muted-foreground text-xs'>Calculated {formatInstant(entries[0].calculatedAt)}</p>}
  </div>
)

export default PayrollSourceTrace
