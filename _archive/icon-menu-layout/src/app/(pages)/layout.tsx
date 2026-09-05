'use client'

// React Imports
import type { CSSProperties, ReactNode } from 'react'
import { Suspense } from 'react'

// Component Imports
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import DualSidebar from '@/components/layout/DualSidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { RightPanelProvider } from '@/hooks/use-right-panel'
import { Toaster } from '@/components/ui/sonner'

// Hook Imports
import { useSettings } from '@/hooks/use-settings'

// Util Imports
import { cn } from '@/lib/utils'

const PagesLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  const { settings } = useSettings()

  return (
    <SidebarProvider defaultOpen={false} style={{ '--sidebar-width-icon': '3.5625rem' } as CSSProperties}>
      <RightPanelProvider>
        <div className='flex h-full w-full min-w-0'>
          <Suspense>
            <DualSidebar />
          </Suspense>
          <SidebarInset className='flex flex-1 flex-col'>
            <Header />
            <main
              className={cn(
                'mx-auto size-full flex-1 p-4 sm:p-6',
                settings.layout === 'compact' ? 'mx-auto max-w-360' : 'w-full'
              )}
            >
              {children}
            </main>
            <Toaster />
            <Footer />
          </SidebarInset>
        </div>
      </RightPanelProvider>
    </SidebarProvider>
  )
}

export default PagesLayout
