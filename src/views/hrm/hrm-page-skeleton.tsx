// Component Imports
import { Skeleton } from '@/components/ui/skeleton'

/**
 * The shape the HRM screens share: a title, a row of cards, and a panel with a toolbar over rows.
 *
 * A skeleton matches the geometry it replaces — same heights, same column count, the row count the
 * table actually pages at. The wrong shape trades a spinner for a layout shift, which is worse,
 * because the reader has already started reading.
 *
 * Figure slots are bars, never placeholder numbers. A headcount that reads 0 for half a second is
 * a number somebody may act on.
 */
const HrmPageSkeleton = ({ label = 'Loading people' }: { label?: string }) => (
  <div className='flex flex-col gap-6' aria-busy='true' aria-label={label}>
    <div className='flex flex-col gap-2'>
      <Skeleton className='h-7 w-40' />
      <Skeleton className='h-4 w-96' />
    </div>

    <div className='grid grid-cols-6 items-start gap-6'>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className='bg-card col-span-full flex flex-col gap-4 rounded-lg border p-6 lg:col-span-2'>
          <Skeleton className='h-5 w-44' />
          <Skeleton className='h-3 w-32' />
          <Skeleton className='h-10 w-24' />
          <div className='flex flex-col gap-2 pt-2'>
            {Array.from({ length: 3 }).map((__, row) => (
              <Skeleton key={row} className='h-4 w-full' />
            ))}
          </div>
        </div>
      ))}

      <div className='bg-card col-span-full rounded-lg border'>
        <div className='flex items-center gap-2 px-6 py-6'>
          <Skeleton className='h-6 w-28' />
          <Skeleton className='ml-auto h-9 w-64' />
        </div>
        <div className='flex gap-2 border-y px-6 py-3'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-8 w-48' />
          <Skeleton className='ml-auto h-8 w-32' />
        </div>
        <div className='flex flex-col divide-y'>
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className='flex h-14 items-center gap-4 px-6'>
              <Skeleton className='size-7 shrink-0 rounded-full' />
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-4 w-28 max-md:hidden' />
              <Skeleton className='h-4 w-32 max-lg:hidden' />
              <Skeleton className='ml-auto h-5 w-20 rounded-sm' />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default HrmPageSkeleton
