// Next Imports
import Link from 'next/link'

// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'
import type { SettlementBatch } from '@/types/payroll/settlement-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { BATCH_STATUS_LABELS, BATCH_STATUS_STYLES } from '@/utils/payroll-payments'
import { formatDate, formatInstant } from '@/utils/payroll-workspace'

type Props = {
  batches: SettlementBatch[]
  runs: PayRun[]
  className?: string
}

/** One row per run: the file that went (or will go) to the bank. Newest first. */
const SettlementBatches = ({ batches, runs, className }: Props) => {
  const runById = new Map(runs.map(r => [r.id, r]))
  const ordered = [...batches].sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor))

  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className='py-5'>
        <CardTitle className='text-lg font-semibold'>Payment batches</CardTitle>
        <CardDescription>One file per run, drawn on the payroll operating account</CardDescription>
      </CardHeader>
      <CardContent className='px-0 pb-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='h-9 pl-6 text-xs'>Run</TableHead>
              <TableHead className='h-9 text-xs'>Bank reference</TableHead>
              <TableHead className='h-9 text-right text-xs'>Payments</TableHead>
              <TableHead className='h-9 text-right text-xs'>Total</TableHead>
              <TableHead className='h-9 text-xs'>Released</TableHead>
              <TableHead className='h-9 pr-6 text-xs'>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.map(batch => {
              const run = runById.get(batch.payRunId)

              return (
                <TableRow key={batch.id}>
                  <TableCell className='py-2 pl-6'>
                    <Link
                      href={`/payroll/runs/${batch.payRunId}`}
                      className='font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
                    >
                      {run?.reference ?? batch.payRunId}
                    </Link>
                    <span className='text-muted-foreground block text-xs'>Payday {formatDate(batch.scheduledFor)}</span>
                  </TableCell>
                  <TableCell className='text-muted-foreground py-2 font-mono text-xs'>{batch.reference}</TableCell>
                  <TableCell className='py-2 text-right tabular-nums'>{batch.count}</TableCell>
                  <TableCell className='py-2 text-right font-medium tabular-nums'>{formatMoney(batch.total)}</TableCell>
                  <TableCell className='text-muted-foreground py-2 text-xs'>
                    {batch.releasedAt ? formatInstant(batch.releasedAt) : '—'}
                  </TableCell>
                  <TableCell className='py-2 pr-6'>
                    <Badge className={cn('text-xs', BATCH_STATUS_STYLES[batch.status])}>
                      {BATCH_STATUS_LABELS[batch.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default SettlementBatches
