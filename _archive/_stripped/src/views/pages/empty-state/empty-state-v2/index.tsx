// Components Imports
import { Card, CardContent } from '@/components/ui/card'
import EmptyStateAllProjects from '@/views/pages/empty-state/empty-state-v2/empty-state-all-projects'
import EmptyStateProject from '@/views/pages/empty-state/empty-state-v2/empty-state-project'
import EmptyStateReport from '@/views/pages/empty-state/empty-state-v2/empty-state-report'

function EmptyStateV2() {
  return (
    <div className='space-y-6'>
      <div className='mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <Card>
          <CardContent className='h-full space-y-3'>
            <div className='h-22 rounded-md border bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)_1px,var(--card)_2px,var(--card)_15px)]' />
            <div>
              <h3 className='text-base font-medium'>Project Name</h3>
              <p className='text-muted-foreground text-sm'>Description</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='h-full space-y-3'>
            <div className='h-22 rounded-md border bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)_1px,var(--card)_2px,var(--card)_15px)]' />
            <div>
              <h3 className='text-base font-medium'>Project Name</h3>
              <p className='text-muted-foreground text-sm'>Description</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='h-full space-y-3'>
            <div className='h-22 rounded-md border bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)_1px,var(--card)_2px,var(--card)_15px)]' />
            <div>
              <h3 className='text-base font-medium'>Project Name</h3>
              <p className='text-muted-foreground text-sm'>Description</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <EmptyStateReport />
      <EmptyStateAllProjects />
      <EmptyStateProject />
    </div>
  )
}

export default EmptyStateV2
