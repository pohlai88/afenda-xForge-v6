'use client'

// React Imports
import { Suspense } from 'react'
import type { ReactNode } from 'react'

// Component Imports
import { SidebarInset } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'

// Hook Imports
import { useSettings } from '@/hooks/use-settings'

// Util Imports
import { cn } from '@/lib/utils'

const PagesLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  const { settings } = useSettings()

  return (
    <div className='flex h-full w-full min-w-0'>
      <Suspense>
        <Sidebar />
      </Suspense>
      <SidebarInset className='flex flex-1 flex-col'>
        <Header />
        <main
          className={cn(
            'mx-auto size-full flex-1 px-4 py-6 sm:px-6',
            settings.layout === 'compact' ? 'mx-auto max-w-360' : 'w-full'
          )}
        >
          {children}
        </main>
        <Toaster />
        <Footer />
      </SidebarInset>
    </div>
  )
}

export default PagesLayout
