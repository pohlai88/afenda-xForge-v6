// React Imports
import type { ReactNode } from 'react'

// Component Imports
import { ThemeProvider } from './ThemeProvider'
import { SidebarProvider } from './ui/sidebar'
import { TooltipProvider } from './ui/tooltip'

// Context Imports
import type { Settings } from '@/contexts/settingsContext'
import { SettingsProvider } from '@/contexts/settingsContext'

type Props = {
  children: ReactNode
  settingsCookie?: Settings
}

const Providers = ({ children, settingsCookie }: Props) => {
  return (
    <ThemeProvider attribute='class' defaultTheme={settingsCookie?.mode ?? 'system'} enableSystem={true}>
      <SettingsProvider settingsCookie={settingsCookie}>
        <TooltipProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </TooltipProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}

export default Providers
