'use client'

// React Imports
import { Suspense } from 'react'
import type { ReactNode } from 'react'

// Component Imports
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { Toaster } from '@/components/ui/sonner'

// Hook Imports
import { useSettings } from '@/hooks/use-settings'

// Util Imports
import { cn } from '@/lib/utils'

const PagesLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  const { settings } = useSettings()

  return (
    <div className='flex min-h-dvh w-full min-w-0 flex-col'>
      <Suspense>
        <Header />
      </Suspense>
      <main
        className={cn(
          'mx-auto size-full flex-1 px-4 py-6 sm:px-6',
          settings.layout === 'compact' ? 'max-w-360' : 'w-full'
        )}
      >
        {children}
      </main>
      <Toaster />
      <Footer />
    </div>
  )
}

export default PagesLayout
