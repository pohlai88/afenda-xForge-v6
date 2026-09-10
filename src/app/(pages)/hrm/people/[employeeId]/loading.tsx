// Component Imports
import { Skeleton } from '@/components/ui/skeleton'

/**
 * The employee workspace shell: a back link, an identity row, a tab strip, and two fact cards.
 *
 * The geometry matches what it replaces so the page does not jump once the record arrives. No
 * placeholder values — a name or a salary that renders for half a second is one somebody may read.
 */
const Loading = () => (
  <div className='flex flex-col gap-6' aria-busy='true' aria-label='Loading employee'>
    <div className='flex flex-col gap-4'>
      <Skeleton className='h-8 w-32' />
      <div className='flex items-start gap-4'>
        <Skeleton className='size-14 shrink-0 rounded-full' />
        <div className='flex flex-1 flex-col gap-2'>
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-4 w-96' />
        </div>
        <Skeleton className='size-9 shrink-0 rounded-md' />
      </div>
    </div>

    <Skeleton className='h-9 w-[26rem]' />

    <div className='grid grid-cols-6 items-start gap-6'>
      {Array.from({ length: 2 }).map((_, card) => (
        <div key={card} className='bg-card col-span-full flex flex-col gap-4 rounded-lg border p-6 lg:col-span-3'>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='h-3 w-52' />
          <div className='flex flex-col gap-3 pt-2'>
            {Array.from({ length: 6 }).map((__, row) => (
              <Skeleton key={row} className='h-4 w-full' />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default Loading
