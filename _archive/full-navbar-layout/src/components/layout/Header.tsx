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

// Util Imports
import { cn } from '@/lib/utils'

const Header = () => {
  const { settings, updateSettings } = useSettings()
  const { open, isMobile } = useSidebar()

  return (
    <header
      className={cn(
        'bg-background sticky top-0 z-50 border-b px-4 sm:px-6',
        settings.variant === 'inset' && 'rounded-t-xl',
        settings.variant === 'floating' &&
          'border-b-0 bg-transparent before:absolute before:inset-0 before:rounded-t-xl before:mask-[linear-gradient(var(--card),var(--card)_18%,transparent_100%)] before:backdrop-blur-md'
      )}
    >
      <div
        className={cn(
          'relative z-51 mx-auto flex w-full items-center justify-between py-2',
          settings.layout === 'compact' ? 'max-w-348' : 'w-full',
          settings.variant === 'floating' && 'bg-card mt-2 rounded-xl border px-6'
        )}
      >
        <div className='flex items-center gap-1.5 sm:gap-4'>
          <SidebarTrigger
            className='[&_svg]:size-5!'
            onClick={() => {
              // On mobile, the trigger only opens/closes the off-canvas sheet
              if (!isMobile) updateSettings({ sidebarOpen: !open })
            }}
          />
          <Separator orientation='vertical' className='hidden h-4! self-center! sm:block' />
          <CommandMenu />
        </div>
        <div className='flex items-center gap-1.5'>
          <ActivityDialog
            trigger={
              <Button variant='ghost' size='icon'>
                <ActivityIcon />
              </Button>
            }
            triggerClassName='max-md:hidden'
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
