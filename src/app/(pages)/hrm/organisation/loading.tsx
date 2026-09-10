// Component Imports
import { Skeleton } from '@/components/ui/skeleton'

/** The tab strip and one section card, at the geometry they resolve to. */
const Loading = () => (
  <div className='flex flex-col gap-6' aria-busy='true' aria-label='Loading organisation'>
    <div className='flex flex-col gap-2'>
      <Skeleton className='h-7 w-44' />
      <Skeleton className='h-4 w-[30rem]' />
    </div>

    <Skeleton className='h-9 w-96' />

    <div className='bg-card flex max-w-3xl flex-col gap-4 rounded-lg border p-6'>
      <Skeleton className='h-5 w-36' />
      <Skeleton className='h-3 w-72' />
      <div className='flex flex-col gap-4 pt-2'>
        {Array.from({ length: 6 }).map((_, row) => (
          <div key={row} className='flex items-center gap-3'>
            <div className='flex flex-1 flex-col gap-1.5'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-3 w-56' />
            </div>
            <Skeleton className='h-8 w-14' />
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default Loading
