'use client'

// Component imports
import LeftPanel from './left-panel'
import MidPanel from './mid-panel'
import RightPanel from './right-panel'

// Store imports
import { useContactStore } from '@/store/use-contact-store'

// Utils imports
import { cn } from '@/lib/utils'

const Contact = () => {
  const selectedContactPhone = useContactStore(state => state.selectedContactPhone)
  const isCreatingContact = useContactStore(state => state.isCreatingContact)
  const isEditingContact = useContactStore(state => state.isEditingContact)

  const showDetailPanel = isCreatingContact || isEditingContact || selectedContactPhone !== null

  return (
    <div className='bg-card grid h-[calc(100dvh-11rem)] min-h-130 grid-cols-12 overflow-hidden rounded-lg border'>
      <div className='col-span-4 hidden min-h-0 overflow-hidden border-r md:block lg:col-span-3 2xl:col-span-2'>
        <LeftPanel />
      </div>

      <div
        className={cn(
          'col-span-12 flex min-h-0 flex-col overflow-hidden md:col-span-8 lg:col-span-9 2xl:col-span-5 2xl:border-r',
          showDetailPanel && 'max-2xl:hidden'
        )}
      >
        <MidPanel />
      </div>

      <div
        className={cn(
          'col-span-12 min-h-0 overflow-hidden md:col-span-8 lg:col-span-9 2xl:col-span-5',
          !showDetailPanel && 'max-2xl:hidden'
        )}
      >
        <RightPanel />
      </div>
    </div>
  )
}

export default Contact
