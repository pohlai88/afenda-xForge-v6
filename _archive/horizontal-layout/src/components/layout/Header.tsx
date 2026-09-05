'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ActivityIcon, BellIcon, MenuIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import LogoSvg from '@/assets/svg/logo'
import ModeToggle from '@/components/layout/ModeToggle'
import ActivityDialog from '@/components/shared/ActivityDialog'
import NotificationDropdown from '@/components/shared/NotificationDropdown'
import ProfileDropdown from '@/components/shared/ProfileDropdown'
import CommandMenu from './CommandMenu'
import HorizontalNav from './HorizontalNav'
import MobileNav from './MobileNav'
import ThemeCustomizer from './ThemeCustomizer'

// Config Imports
import themeConfig from '@/configs/themeConfig'
import { useSettings } from '@/hooks/use-settings'

// Util Imports
import { cn } from '@/lib/utils'

const Header = () => {
  const { settings } = useSettings()

  const wrapperClass = cn(
    'mx-auto flex w-full items-center gap-4 px-4 sm:px-6',
    settings.layout === 'compact' ? 'max-w-360' : 'w-full'
  )

  return (
    <header className='bg-card sticky top-0 z-50 border-b'>
      {/* Top row: logo + global actions */}
      <div className='border-b'>
        <div className={cn(wrapperClass, 'justify-between py-3')}>
          <div className='flex flex-1 items-center gap-2 sm:gap-4'>
            <MobileNav
              trigger={
                <Button variant='outline' size='icon' className='md:hidden'>
                  <MenuIcon />
                  <span className='sr-only'>Menu</span>
                </Button>
              }
            />
            <Link href={themeConfig.homePageUrl} className='flex items-center gap-2.5'>
              <LogoSvg className='[&_rect]:fill-card [&_rect:first-child]:fill-primary size-8.5' />
              <span className='hidden text-xl font-semibold text-nowrap sm:block'>{themeConfig.templateName}</span>
            </Link>
          </div>
          <div className='flex flex-2 items-center justify-between gap-1.5'>
            <CommandMenu />
            <div className='flex items-center gap-1.5'>
              <ActivityDialog
                trigger={
                  <Button variant='ghost' size='icon'>
                    <ActivityIcon />
                  </Button>
                }
              />
              <NotificationDropdown
                trigger={
                  <Button variant='ghost' size='icon' className='relative'>
                    <BellIcon />
                    <span className='bg-destructive absolute top-2 right-2.5 size-2 rounded-full' />
                  </Button>
                }
              />
              <ModeToggle />
              <ThemeCustomizer />
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </div>
      {/* Bottom row: horizontal navigation */}
      <div className={cn(wrapperClass, 'py-1.5 max-md:hidden')}>
        <HorizontalNav />
      </div>
    </header>
  )
}

export default Header
