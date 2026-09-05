'use client'

// React Imports
import type { CSSProperties, ReactNode } from 'react'
import { Suspense, useEffect } from 'react'

// Next Imports
import { usePathname } from 'next/navigation'

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
  const pathname = usePathname()

  const contentClass = settings.layout === 'compact' ? 'max-w-360' : 'w-full'

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div
      className='bg-muted before:bg-primary relative flex min-h-dvh w-full before:fixed before:inset-x-0 before:top-0 before:h-105'
      style={
        {
          '--sidebar': 'var(--card)',
          '--sidebar-width': '17.5rem',
          '--sidebar-width-icon': '3.375rem'
        } as CSSProperties
      }
    >
      <Suspense>
        <Sidebar />
      </Suspense>
      <SidebarInset className={cn('z-1 mx-auto flex flex-1 flex-col bg-transparent py-6', contentClass)}>
        <Header />
        <main className='size-full flex-1 px-4 py-6 sm:px-6'>{children}</main>
        <Toaster />
        <Footer />
      </SidebarInset>
    </div>
  )
}

export default PagesLayout
