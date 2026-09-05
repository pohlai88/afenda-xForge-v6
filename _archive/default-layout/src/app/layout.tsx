// React Imports
import type { ReactNode } from 'react'

// Next Imports
import { cookies } from 'next/headers'
import type { Metadata } from 'next'

// Third-party Imports
import { NuqsAdapter } from 'nuqs/adapters/next/app'

// Type Imports
import type { Settings } from '@/contexts/settingsContext'

// Component Imports
import Providers from '@/components/Providers'
import { TooltipProvider } from '@/components/ui/tooltip'

// Util Imports
import { cn } from '@/lib/utils'

// Config Imports
import themeConfig from '@/configs/themeConfig'

// Font Imports
import { allFonts, FONT_CONFIG, type FontKey } from '@/utils/fonts'

// Style Imports
import './globals.css'
import ScrollToTop from '@/components/layout/ScrollToTop'

export const metadata: Metadata = {
  title: 'AdminCN - Shadcn Admin Dashboard Template',
  description:
    'Launch powerful admin panels faster with AdminCN Shadcn Default Admin Dashboard Template, featuring modern UI, responsive layouts, and reusable components.',
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}`),
  openGraph: {
    title: 'AdminCN - Shadcn Admin Dashboard Template',
    description:
      'Launch powerful admin panels faster with AdminCN Shadcn Default Admin Dashboard Template, featuring modern UI, responsive layouts, and reusable components.',
    type: 'website',
    siteName: 'AdminCN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    images: [
      {
        url: '/images/og-image.png',
        type: 'image/png',
        width: 1200,
        height: 630,
        alt: 'AdminCN - Shadcn Admin Dashboard Template'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdminCN - Shadcn Admin Dashboard Template',
    description:
      'Launch powerful admin panels faster with AdminCN Shadcn Default Admin Dashboard Template, featuring modern UI, responsive layouts, and reusable components.'
  }
}

const RootLayout = async ({ children }: Readonly<{ children: ReactNode }>) => {
  // Get the settings cookie
  const cookieStore = await cookies()
  const settingsCookie = cookieStore.get(themeConfig.settingsCookieName)

  let settingsData: Settings | undefined

  if (settingsCookie) {
    try {
      settingsData = JSON.parse(settingsCookie.value) as Settings
    } catch (error) {
      console.error('Failed to parse settings cookie:', error)
    }
  }

  // Get the mode from settings or fall back to themeConfig default
  const mode = settingsData?.mode ?? themeConfig.mode

  // Get sidebar state from settings or fall back to themeConfig default
  const sidebarOpen = settingsData?.sidebarOpen ?? themeConfig.sidebarOpen

  const defaultOpen = sidebarOpen

  // Get the font from settings or fall back to themeConfig default, resolve its CSS variable
  const font = (settingsData?.font ?? themeConfig.font) as FontKey
  const fontVar = `var(${FONT_CONFIG[font]?.variable ?? FONT_CONFIG.geist.variable})`

  // Set font-family directly as an inline style (in addition to --font-sans) so it wins by
  // cascade over Tailwind's compiled utility classes and applies before first paint via SSR —
  // no flash of the default Geist font on refresh
  const fontStyle = { '--font-sans': fontVar, fontFamily: fontVar } as Record<string, string>

  return (
    <html
      lang='en'
      className={cn(...allFonts.map(f => f.variable), 'flex min-h-full w-full antialiased', mode)}
      style={fontStyle}
      data-scroll-behavior='smooth'
      suppressHydrationWarning
    >
      <body className='flex min-h-full w-full flex-auto flex-col'>
        <NuqsAdapter>
          <Providers settingsCookie={settingsData} sidebarDefaultOpen={defaultOpen}>
            <TooltipProvider>{children}</TooltipProvider>
          </Providers>
        </NuqsAdapter>

        <ScrollToTop />
      </body>
    </html>
  )
}

export default RootLayout
