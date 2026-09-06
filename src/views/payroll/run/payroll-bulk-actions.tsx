'use client'

// Third-party Imports
import { DownloadIcon, EyeIcon, RefreshCwIcon, XIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

type Props = {
  selectedCount: number

  /** Open warnings across the selected employees; the acknowledge action is hidden at zero. */
  acknowledgeableCount: number

  /** Once approved, inputs and exceptions are frozen; only export remains. */
  locked: boolean
  onRecalculate: () => void
  onAcknowledgeWarnings: () => void
  onExportSelected: () => void
  onClearSelection: () => void
}

/**
 * Appears only while rows are selected, in the space the toolbar already occupies. Nothing here
 * is destructive: payroll bulk actions re-run, acknowledge or export — they never delete.
 */
const PayrollBulkActions = ({
  selectedCount,
  acknowledgeableCount,
  locked,
  onRecalculate,
  onAcknowledgeWarnings,
  onExportSelected,
  onClearSelection
}: Props) => (
  <div className='bg-muted/40 flex flex-wrap items-center gap-2 border-b px-4 py-2' role='region' aria-live='polite'>
    <span className='mr-2 text-sm font-medium tabular-nums'>
      {selectedCount} {selectedCount === 1 ? 'employee' : 'employees'} selected
    </span>

    {!locked && (
      <Button variant='outline' size='sm' onClick={onRecalculate}>
        <RefreshCwIcon />
        Recalculate
      </Button>
    )}

    {!locked && acknowledgeableCount > 0 && (
      <Button variant='outline' size='sm' onClick={onAcknowledgeWarnings}>
        <EyeIcon />
        Acknowledge {acknowledgeableCount} {acknowledgeableCount === 1 ? 'warning' : 'warnings'}
      </Button>
    )}

    <Button variant='outline' size='sm' onClick={onExportSelected}>
      <DownloadIcon />
      Export selected
    </Button>

    <Button variant='ghost' size='sm' className='ml-auto' onClick={onClearSelection}>
      <XIcon />
      Clear selection
    </Button>
  </div>
)

export default PayrollBulkActions
