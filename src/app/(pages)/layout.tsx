'use client'

// React Imports
import { Suspense } from 'react'
import type { ReactNode } from 'react'

// Component Imports
import { SidebarInset } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import PropertiesShortcut from '@/components/layout/PropertiesShortcut'
import RecentRecorder from '@/components/layout/RecentRecorder'
import QueryPanel from '@/components/shared/QueryPanel'
import Sidebar from '@/components/layout/Sidebar'

// Hook Imports
import { useSettings } from '@/hooks/use-settings'

// Util Imports
import { cn } from '@/lib/utils'

const PagesLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  const { settings } = useSettings()

  return (
    <div className='bg-muted flex min-h-dvh w-full'>
      <Suspense>
        <Sidebar />
      </Suspense>
      <SidebarInset className='bg-muted flex flex-1 flex-col'>
        <Header />
        <RecentRecorder />
        <PropertiesShortcut />
        <div
          className={cn('mx-auto w-full px-4 pt-4 sm:px-6', settings.layout === 'compact' ? 'max-w-360' : undefined)}
        >
          <Suspense>
            <Breadcrumbs />
          </Suspense>
        </div>
        <main
          className={cn(
            'mx-auto size-full flex-1 px-4 py-6 sm:px-6',
            settings.layout === 'compact' ? 'mx-auto max-w-360' : 'w-full'
          )}
        >
          {children}
        </main>
        <Toaster />
        {/*
          360 Query lives in the shell, not in a page. It is opened with a subject a surface already
          holds, so mounting it once here is what lets a row deep inside a table ask a question
          without the panel being rebuilt per workspace — and what keeps it non-modal over whatever
          page is underneath.
        */}
        <Suspense>
          <QueryPanel />
        </Suspense>
        <Footer />
      </SidebarInset>
    </div>
  )
}

export default PagesLayout
