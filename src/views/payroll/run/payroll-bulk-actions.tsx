'use client'

// Third-party Imports
import { DownloadIcon, EyeIcon, RefreshCwIcon, XIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

type Props = {
  selectedCount: number

  /** Every employee matching the current filters, across pages. */
  filteredCount: number

  /** Open warnings across the selected employees; the acknowledge action is hidden at zero. */
  acknowledgeableCount: number

  /** Once approved, inputs and exceptions are frozen; only export remains. */
  locked: boolean

  /** Absent when the actor may not recalculate. */
  onRecalculate?: () => void
  onAcknowledgeWarnings?: () => void
  onExportSelected: () => void
  onSelectAllFiltered: () => void
  onClearSelection: () => void
}

/**
 * Appears only while rows are selected, in the space the toolbar already occupies. Nothing here
 * is destructive: payroll bulk actions re-run, acknowledge or export — they never delete.
 *
 * The header checkbox selects a page. When that leaves matching employees unselected on other
 * pages, the bar says so and offers all of them, so "recalculate the selection" never silently
 * means "the 25 I could see".
 */
const PayrollBulkActions = ({
  selectedCount,
  filteredCount,
  acknowledgeableCount,
  locked,
  onRecalculate,
  onAcknowledgeWarnings,
  onExportSelected,
  onSelectAllFiltered,
  onClearSelection
}: Props) => (
  <div className='bg-muted/40 flex flex-wrap items-center gap-2 border-b px-4 py-2' role='region' aria-live='polite'>
    <span className='mr-2 text-sm font-medium tabular-nums'>
      {selectedCount === filteredCount
        ? `All ${selectedCount} ${selectedCount === 1 ? 'employee' : 'employees'} selected`
        : `${selectedCount} ${selectedCount === 1 ? 'employee' : 'employees'} selected`}
      {selectedCount < filteredCount && (
        <>
          <span className='text-muted-foreground font-normal'> · </span>
          <Button variant='link' size='xs' className='h-auto p-0' onClick={onSelectAllFiltered}>
            Select all {filteredCount} matching these filters
          </Button>
        </>
      )}
    </span>

    {!locked && onRecalculate && (
      <Button variant='outline' size='sm' onClick={onRecalculate}>
        <RefreshCwIcon />
        Recalculate
      </Button>
    )}

    {!locked && onAcknowledgeWarnings && acknowledgeableCount > 0 && (
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
