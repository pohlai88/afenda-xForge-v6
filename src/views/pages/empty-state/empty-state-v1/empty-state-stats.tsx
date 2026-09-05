// Next Imports
import Link from 'next/link'

// Third-party Imports
import { MoveRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CircularProgress } from '@/components/ui/circular-progress'

const Metrics = [
  { label: '0/10GB', desc: 'Storage used' },
  { label: '0/50', desc: 'Members' },
  { label: '0/100K', desc: 'API requests' },
  { label: '0/70K', desc: 'Web Analytics' }
]

function EmptyStateStats() {
  return (
    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
      {Metrics.map(metrics => (
        <Card key={metrics.desc} className='gap-0 pb-0'>
          <CardHeader className='flex items-center gap-2 border-b'>
            <CircularProgress
              value={0}
              size={52}
              strokeWidth={5}
              showLabel
              labelClassName='text-xs'
              className='stroke-border'
            />
            <div className='flex flex-col items-start'>
              <p className='text-xl'>{metrics.label}</p>
              <p className='text-muted-foreground text-sm'>{metrics.desc}</p>
            </div>
          </CardHeader>
          <CardContent className='flex justify-end'>
            <Button
              variant='link'
              size='lg'
              className='after:bg-primary relative no-underline! after:absolute after:bottom-2 after:h-px after:w-3/4 after:origin-bottom-right after:scale-x-0 after:transition-transform after:duration-300 after:ease-in-out hover:after:origin-bottom-left hover:after:scale-x-100'
              render={<Link href='#' />}
              nativeButton={false}
            >
              View more <MoveRightIcon className='inline-block' />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default EmptyStateStats
