// Component Imports
import { Skeleton } from '@/components/ui/skeleton'

/**
 * The workspace's shape while it loads. Every money slot is a bar, never a placeholder amount: a
 * figure that reads S$0.00 for half a second is a figure someone may act on.
 */
const PayrollRunSkeleton = () => (
  <div className='flex flex-col gap-4' aria-busy='true' aria-label='Loading payroll run'>
    <div className='flex flex-col gap-3'>
      <Skeleton className='h-4 w-16' />
      <div className='flex items-center gap-3'>
        <Skeleton className='h-8 w-56' />
        <Skeleton className='h-5 w-24 rounded-4xl' />
      </div>
      <Skeleton className='h-4 w-72' />
      <Skeleton className='h-4 w-96' />
    </div>

    <div className='flex gap-2'>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className='h-7 w-24' />
      ))}
    </div>

    <div className='bg-card grid grid-cols-2 gap-px rounded-lg border sm:grid-cols-3 lg:grid-cols-6'>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className='flex flex-col gap-2 px-4 py-3'>
          <Skeleton className='h-3 w-20' />
          <Skeleton className='h-6 w-28' />
          <Skeleton className='h-3 w-16' />
        </div>
      ))}
    </div>

    <div className='flex gap-4 border-b pb-2'>
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className='h-5 w-24' />
      ))}
    </div>

    <div className='bg-card rounded-lg border'>
      <div className='flex gap-2 border-b px-4 py-2'>
        <Skeleton className='h-8 w-60' />
        <Skeleton className='h-8 w-24' />
        <Skeleton className='h-8 w-28' />
        <Skeleton className='h-8 w-32' />
      </div>
      <div className='flex flex-col divide-y'>
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className='flex h-11 items-center gap-4 px-4'>
            <Skeleton className='size-4' />
            <Skeleton className='size-7 rounded-full' />
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='ml-auto h-4 w-20' />
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-5 w-20 rounded-sm' />
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default PayrollRunSkeleton
