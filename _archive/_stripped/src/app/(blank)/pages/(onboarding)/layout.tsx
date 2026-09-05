// React Imports
import type { ReactNode } from 'react'

// Next Imports
import Link from 'next/link'

// Component Imports
import Logo from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { SidebarInset } from '@/components/ui/sidebar'

const OnboardingLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <div className='flex h-full w-full min-w-0'>
      <SidebarInset className='flex flex-1 flex-col bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-size-[20px_20px] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.15)_1px,transparent_1px)]'>
        <header className='bg-background sticky top-0 z-50 shadow-sm'>
          <div className='mx-auto flex max-w-360 items-center justify-between gap-6 px-4 py-6 max-sm:flex-col'>
            <Link href='/'>
              <Logo />
            </Link>

            <Link href='/' className='max-sm:w-full'>
              <Button variant='outline' className='max-sm:w-full'>
                Skip to Dashboard
              </Button>
            </Link>
          </div>
        </header>
        <main className='mx-auto flex size-full max-w-360 flex-1 items-center justify-center px-4 py-6 sm:px-6'>
          {children}
        </main>
      </SidebarInset>
    </div>
  )
}

export default OnboardingLayout
