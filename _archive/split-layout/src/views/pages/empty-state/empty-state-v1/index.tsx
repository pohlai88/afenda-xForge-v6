// Components Imports
import EmptyStateAutomation from '@/views/pages/empty-state/empty-state-v1/empty-state-automation'
import EmptyStateFinance from '@/views/pages/empty-state/empty-state-v1/empty-state-finance'
import EmptyStateSale from '@/views/pages/empty-state/empty-state-v1/empty-state-sale'
import EmptyStateStats from '@/views/pages/empty-state/empty-state-v1/empty-state-stats'

function EmptyStateV1() {
  return (
    <div className='space-y-6'>
      <EmptyStateStats />
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <EmptyStateAutomation />
        <EmptyStateFinance />
      </div>
      <EmptyStateSale />
    </div>
  )
}

export default EmptyStateV1
