// Next Import
import Link from 'next/link'

// Component Imports
import { DotGrid } from '@/components/ui/bg-dot-grid'
import { Button } from '@/components/ui/button'
import { MorphingText } from '@/components/ui/morphing-text'

const ServerError = () => {
  return (
    <div className='grid min-h-screen grid-cols-1 lg:grid-cols-2'>
      <div className='flex flex-col items-center justify-center px-4 py-8 text-center'>
        <h2 className='mb-6 text-5xl font-semibold'>500 - Server Error</h2>
        <h3 className='mb-1.5 text-3xl font-semibold'>Something went wrong</h3>
        <p className='text-muted-foreground mb-6 max-w-sm'>
          The server encountered an error. Please try again later or contact support if the issue persists.
        </p>
        <Button render={<Link href='/' />} nativeButton={false} size='lg'>
          Back to home page
        </Button>
      </div>

      {/* Right Section: Illustration */}
      <div className='relative max-h-screen w-full p-2 max-lg:hidden'>
        <div className='relative h-full w-full overflow-hidden rounded-2xl bg-black'>
          <DotGrid
            dotSize={1.9}
            gap={22}
            baseColor='var(--muted-foreground)'
            activeColor='#10B981'
            radius={160}
            displacement={14}
            maxScale={4}
          />

          <div className='absolute inset-0 z-10 flex items-center justify-center'>
            <MorphingText
              className='text-7xl font-bold text-white xl:text-9xl'
              texts={['500', 'Server Error', 'Try Again']}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerError
