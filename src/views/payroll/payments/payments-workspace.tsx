'use client'

// React Imports
import { useState, useTransition } from 'react'

// Third-party Imports
import { AlertTriangleIcon, CheckCircle2Icon, RotateCcwIcon } from 'lucide-react'
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import { toast } from 'sonner'

// Type Imports
import type { EmployeePaymentStatus } from '@/types/payroll/run-workspace-types'
import type { SettlementBatch } from '@/types/payroll/settlement-types'
import type { SettlementRow } from '@/utils/payroll-payments'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import SettlementInspector from './settlement-inspector'
import SettlementStatusBadge from './settlement-status-badge'
import SettlementTable from './settlement-table'

// Action Imports
import { reissueSettlement } from '@/app/server/actions'

// Util Imports
import { formatMoney } from '@/utils/money'
import { openFailures, settlementCounts } from '@/utils/payroll-payments'
import { PAYMENT_STATUS_LABELS, formatDate, initials } from '@/utils/payroll-workspace'

const STATUS_FILTERS = [
  'ready',
  'released',
  'processing',
  'paid',
  'returned',
  'failed',
  'action_required'
] as const satisfies readonly EmployeePaymentStatus[]

type Props = {
  rows: SettlementRow[]
  batches: SettlementBatch[]
  runs: { id: string; reference: string }[]

  /** Whether the signed-in person may re-issue. The server enforces it too. */
  mayReissue: boolean
}

/**
 * The working half of the payments page: what needs attention, then every payment. Re-issuing
 * adds the new settlement locally at once, then adopts the record `reissueSettlement` returns,
 * or drops it and shows the refusal.
 */
const PaymentsWorkspace = ({ rows: initialRows, batches, runs, mayReissue }: Props) => {
  const [rows, setRows] = useState(initialRows)

  /*
   * Which payment the inspector is showing, in the URL beside the filter that is already there.
   *
   * Same shape as the run workspace's `?employee=` and compliance's `?filing=`: a payment read in a
   * sheet held only in React state is unreachable from Find, unlinkable, and lost on reload. The
   * selection is identity, so it belongs in the address.
   */
  const [selectedId, setSelectedId] = useQueryState(
    'payment',
    parseAsString.withOptions({ clearOnDefault: true, history: 'replace' })
  )

  const [statusFilter] = useQueryState('status', parseAsStringLiteral(STATUS_FILTERS))

  const selected = selectedId ? (rows.find(row => row.id === selectedId) ?? null) : null
  const batchById = new Map(batches.map(b => [b.id, b]))
  const failures = openFailures(rows)
  const counts = settlementCounts(rows.filter(row => !row.superseded))

  const [, startTransition] = useTransition()

  /**
   * Re-issue at once on screen, then let the server's record replace the provisional one. If the
   * server refuses — already re-issued elsewhere, or not actually failed — the rows go back as
   * they were and the refusal is shown as-is.
   */
  const handleReissue = (row: SettlementRow) => {
    const snapshot = rows
    const now = new Date().toISOString()
    const provisionalId = `${row.id}-retry-pending`

    setRows(current => [
      ...current.map(r => (r.id === row.id ? { ...r, superseded: true } : r)),
      {
        ...row,
        id: provisionalId,
        status: 'released',
        reference: row.reference ? `${row.reference}R` : undefined,
        releasedAt: now,
        settledAt: undefined,
        returnedAt: undefined,
        failedAt: undefined,
        reason: undefined,
        retryOfId: row.id,
        superseded: false
      }
    ])
    void setSelectedId(null)

    startTransition(async () => {
      const result = await reissueSettlement(row.id)

      if (!result.ok) {
        setRows(snapshot)
        toast.error(result.message)

        return
      }

      setRows(current => current.map(r => (r.id === provisionalId ? { ...r, ...result.data, superseded: false } : r)))
      toast.success(`Payment re-issued to ${row.employeeName}`, {
        description: `${formatMoney(result.data.amount)} released · ${row.runReference}`
      })
    })
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='bg-card rounded-lg border'>
        <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-3'>
          <h2 className='flex items-center gap-2 text-sm font-semibold'>
            {failures.length > 0 ? (
              <AlertTriangleIcon className='text-destructive size-4' aria-hidden='true' />
            ) : (
              <CheckCircle2Icon className='text-success size-4' aria-hidden='true' />
            )}
            {failures.length === 0
              ? 'No returned or failed payments outstanding'
              : `${failures.length} ${failures.length === 1 ? 'payment needs' : 'payments need'} re-issuing`}
          </h2>
          <dl className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums'>
            {STATUS_FILTERS.filter(status => counts[status] > 0).map(status => (
              <div key={status} className='flex gap-1'>
                <dd className='text-foreground font-medium'>{counts[status]}</dd>
                <dt>{PAYMENT_STATUS_LABELS[status].toLowerCase()}</dt>
              </div>
            ))}
          </dl>
        </div>

        {failures.length > 0 && (
          <ul className='divide-y border-t'>
            {failures.map(row => (
              <li key={row.id} className='flex flex-wrap items-center gap-3 px-4 py-2.5'>
                <Avatar className='size-8'>
                  {row.avatar && <AvatarImage src={row.avatar} alt='' />}
                  <AvatarFallback className='text-xs'>{initials(row.employeeName)}</AvatarFallback>
                </Avatar>
                <div className='flex min-w-0 flex-1 flex-col'>
                  <span className='flex items-center gap-2 text-sm font-medium'>
                    <Button
                      variant='link'
                      className='h-auto p-0 text-sm font-medium'
                      onClick={() => void setSelectedId(row.id)}
                    >
                      {row.employeeName}
                    </Button>
                    <SettlementStatusBadge status={row.status} />
                  </span>
                  <span className='text-muted-foreground truncate text-xs'>
                    {row.runReference} · payday {formatDate(row.payDate)} · {row.reason}
                  </span>
                </div>
                <span className='text-sm font-medium tabular-nums'>{formatMoney(row.amount)}</span>
                <Button size='sm' variant='outline' onClick={() => handleReissue(row)}>
                  <RotateCcwIcon />
                  Re-issue
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SettlementTable
        rows={rows}
        runs={runs}
        selectedId={selectedId}
        onSelect={row => void setSelectedId(row.id)}
        initialStatus={statusFilter}
      />

      <SettlementInspector
        row={selected}
        batch={selected ? batchById.get(selected.batchId) : undefined}
        open={!!selected}
        onOpenChange={open => {
          if (!open) void setSelectedId(null)
        }}
        onReissue={mayReissue ? handleReissue : undefined}
      />
    </div>
  )
}

export default PaymentsWorkspace
