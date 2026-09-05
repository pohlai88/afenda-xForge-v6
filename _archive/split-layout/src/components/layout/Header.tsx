'use client'

// Third-party Imports
import { ActivityIcon, BellIcon, PanelLeftCloseIcon, PanelRightCloseIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import ModeToggle from '@/components/layout/ModeToggle'
import ThemeCustomizer from '@/components/layout/ThemeCustomizer'
import ActivityDialog from '@/components/shared/ActivityDialog'
import NotificationDropdown from '@/components/shared/NotificationDropdown'
import ProfileDropdown from '@/components/shared/ProfileDropdown'
import CommandMenu from './CommandMenu'

// Hook Imports
import { useSettings } from '@/hooks/use-settings'

const Header = () => {
  const { updateSettings } = useSettings()
  const { open, isMobile, openMobile, toggleSidebar } = useSidebar()

  const isOpen = isMobile ? openMobile : open

  return (
    <header className='text-primary-foreground'>
      <div className='mx-auto flex w-full items-center justify-between gap-6 px-4 max-md:gap-1.5 sm:px-6'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='icon-lg'
            onClick={() => {
              toggleSidebar()
              if (!isMobile) updateSettings({ sidebarOpen: !open })
            }}
            className='bg-primary-foreground! border-primary-foreground! text-primary! shadow-none'
          >
            {isOpen ? <PanelLeftCloseIcon /> : <PanelRightCloseIcon />}
          </Button>
          <div className='hidden sm:flex sm:flex-col sm:items-start'>
            <p className='text-lg font-semibold'>Hey, John</p>
            <p className='text-primary-foreground/50 md:max-lg:hidden'>Welcome back to dashboard</p>
          </div>
        </div>
        <CommandMenu />
        <div className='flex items-center gap-1.5'>
          <ActivityDialog
            trigger={
              <Button variant='ghost' size='icon-lg'>
                <ActivityIcon />
              </Button>
            }
            triggerClassName='max-md:hidden'
          />
          <NotificationDropdown
            trigger={
              <Button variant='ghost' size='icon-lg' className='relative'>
                <BellIcon />
                <span className='bg-destructive absolute top-[14%] right-[23%] size-2 rounded-full' />
              </Button>
            }
          />
          <ModeToggle />
          <ThemeCustomizer />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}

export default Header
