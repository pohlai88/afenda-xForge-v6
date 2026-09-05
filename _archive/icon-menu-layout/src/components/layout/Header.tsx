'use client'

// Third-party Imports
import { BellIcon, ActivityIcon, PanelLeftIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import ModeToggle from '@/components/layout/ModeToggle'
import ThemeCustomizer from '@/components/layout/ThemeCustomizer'
import CommandMenu from '@/components/layout/CommandMenu'
import ActivityDialog from '@/components/shared/ActivityDialog'
import NotificationDropdown from '@/components/shared/NotificationDropdown'
import ProfileDropdown from '@/components/shared/ProfileDropdown'
import { Separator } from '@/components/ui/separator'

// Hook Imports
import { useSettings } from '@/hooks/use-settings'
import { useRightPanel } from '@/hooks/use-right-panel'

// Util Imports
import { cn } from '@/lib/utils'

const Header = () => {
  const { toggleRightPanel } = useRightPanel()
  const { settings } = useSettings()

  return (
    <header className='bg-card sticky top-0 z-50 border-b px-4 py-2 sm:px-6'>
      <div
        className={cn(
          'mx-auto flex items-center justify-between gap-4',
          settings.layout === 'compact' ? 'max-w-348' : 'w-full'
        )}
      >
        <div className='flex items-center gap-1.5 sm:gap-4'>
          {/* Mobile: toggles the sidebar sheet */}
          <SidebarTrigger className='xl:hidden [&_svg]:size-5!' />
          {/* Desktop (xl+): toggles the right nav panel */}
          <Button variant='ghost' size='icon-sm' className='hidden xl:flex' onClick={toggleRightPanel}>
            <PanelLeftIcon className='size-5' />
          </Button>
          <Separator orientation='vertical' className='hidden h-4! self-center! sm:block' />
          <CommandMenu />
        </div>

        <div className='flex items-center gap-1.5 sm:gap-3'>
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
    </header>
  )
}

export default Header
