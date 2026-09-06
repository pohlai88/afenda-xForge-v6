// Component Imports
import { Skeleton } from '@/components/ui/skeleton'

/**
 * The shape every payroll screen except the run workspace shares: a title, a strip of figures, and
 * a panel with a toolbar over rows. Overview, runs, payments, compliance and reports all resolve to
 * that, so one skeleton covers them rather than five near-identical files.
 *
 * The run workspace keeps its own (`payroll-run-skeleton.tsx`) because it is the one screen with a
 * different shape and the longest wait — it joins payslips across every earlier run.
 *
 * Money slots are bars, never placeholder amounts. A figure that reads S$0.00 for half a second is
 * a figure someone may act on.
 */
const PayrollPageSkeleton = () => (
  <div className='flex flex-col gap-4' aria-busy='true' aria-label='Loading payroll'>
    <div className='flex flex-col gap-2'>
      <Skeleton className='h-7 w-52' />
      <Skeleton className='h-4 w-80' />
    </div>

    <div className='bg-card grid grid-cols-2 gap-px rounded-lg border sm:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className='flex flex-col gap-2 px-4 py-3'>
          <Skeleton className='h-3 w-20' />
          <Skeleton className='h-6 w-28' />
        </div>
      ))}
    </div>

    <div className='bg-card rounded-lg border'>
      <div className='flex gap-2 border-b px-4 py-2'>
        <Skeleton className='h-8 w-60' />
        <Skeleton className='h-8 w-24' />
        <Skeleton className='ml-auto h-8 w-28' />
      </div>
      <div className='flex flex-col divide-y'>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className='flex h-11 items-center gap-4 px-4'>
            <Skeleton className='h-4 w-44' />
            <Skeleton className='h-4 w-28' />
            <Skeleton className='ml-auto h-4 w-20' />
            <Skeleton className='h-5 w-20 rounded-sm' />
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default PayrollPageSkeleton
