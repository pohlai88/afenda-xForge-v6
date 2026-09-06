'use client'

// Third-party Imports
import { ActivityIcon, BellIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import ModeToggle from '@/components/layout/ModeToggle'
import ActivityDialog from '@/components/shared/ActivityDialog'
import NotificationDropdown from '@/components/shared/NotificationDropdown'
import ProfileDropdown from '@/components/shared/ProfileDropdown'
import { Separator } from '@/components/ui/separator'
import CommandMenu from './CommandMenu'

// Hook Imports
import { useSettings } from '@/hooks/use-settings'
import ThemeCustomizer from './ThemeCustomizer'

const Header = () => {
  const { updateSettings } = useSettings()
  const { open, isMobile } = useSidebar()

  return (
    <header className='bg-muted sticky top-0 z-50 flex items-center justify-between gap-6 px-4 py-2 sm:px-6'>
      <div className='flex items-center gap-4'>
        <SidebarTrigger
          className='[&_svg]:size-5!'
          onClick={() => {
            // On mobile, the trigger only opens/closes the off-canvas sheet
            if (!isMobile) updateSettings({ sidebarOpen: !open })
          }}
        />
        <Separator orientation='vertical' className='hidden h-4! data-vertical:self-center sm:block' />
        <CommandMenu />
      </div>
      <div className='flex items-center gap-1.5'>
        <ActivityDialog
          trigger={
            <Button variant='ghost' size='icon' aria-label='Activity'>
              <ActivityIcon />
            </Button>
          }
          triggerClassName='max-md:hidden'
        />
        <NotificationDropdown
          trigger={
            <Button variant='ghost' size='icon' className='relative' aria-label='Notifications'>
              <BellIcon />
              <span className='bg-destructive absolute top-[14%] right-[23%] size-2 rounded-full' />
            </Button>
          }
        />
        <ModeToggle />
        <ThemeCustomizer />
        <ProfileDropdown />
      </div>
    </header>
  )
}

export default Header
