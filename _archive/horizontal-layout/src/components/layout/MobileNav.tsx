'use client'

// React Imports
import { useEffect, useState } from 'react'
import type { ComponentType, ReactElement } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

// Third-party Imports
import * as Icon from 'lucide-react'
import { ChevronRightIcon, CircleSmallIcon, SquareArrowOutUpRightIcon } from 'lucide-react'

// Type Imports
import type { MenuItem, MenuSubItem } from '@/configs/navConfig'

// Component Imports
import LogoSvg from '@/assets/svg/logo'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

// Config Imports
import { navItems } from '@/configs/navConfig'
import themeConfig from '@/configs/themeConfig'

// Util Imports
import { cn } from '@/lib/utils'
import { getNavApps } from '@/lib/nav-apps'
import { isExternalLink, isLinkActive, isMenuItemActive, isSubGroup, isSubItemActive } from './navUtils'

type Props = {
  trigger: ReactElement
}

type RenderProps = {
  pathname: string
  searchParams: Pick<URLSearchParams, 'get'>
  onLinkClick: () => void
}

const leafLinkClasses = (active: boolean) =>
  cn('hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm', active && 'bg-primary/10 text-primary')

const triggerClasses = (active: boolean) =>
  cn(
    'hover:bg-accent group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm data-panel-open:bg-primary/10 data-panel-open:text-primary',
    active && 'bg-primary/10 text-primary'
  )

const SubItemRow = ({ subItem, depth, ...rest }: { subItem: MenuSubItem; depth: number } & RenderProps) => {
  if (isSubGroup(subItem)) {
    const groupActive = isSubItemActive(subItem, rest.pathname, rest.searchParams)

    return (
      <Collapsible className='w-full' defaultOpen={groupActive}>
        <CollapsibleTrigger className={triggerClasses(groupActive)}>
          <span style={{ paddingInlineStart: depth * 12 }}>{subItem.label}</span>
          <ChevronRightIcon className='size-4 shrink-0 transition-transform duration-300 group-data-panel-open:rotate-90' />
        </CollapsibleTrigger>
        <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-300 data-ending-style:h-0 data-starting-style:h-0'>
          <div
            className='border-border/60 mt-1 flex flex-col gap-1 border-l'
            style={{ marginInlineStart: depth * 12 + 6, paddingInlineStart: 8 }}
          >
            {subItem.childItems.map(leaf => (
              <SubItemRow key={leaf.label} subItem={leaf} depth={depth + 1} {...rest} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  const active = isLinkActive(subItem.href, subItem.activePath, rest.pathname, rest.searchParams)

  return (
    <Link href={subItem.href} target={subItem.target} className={leafLinkClasses(active)} onClick={rest.onLinkClick}>
      <CircleSmallIcon className='size-4 shrink-0' style={{ marginInlineStart: depth * 12 }} />
      <span>{subItem.label}</span>
      {isExternalLink(subItem.href) && <SquareArrowOutUpRightIcon className='ml-auto size-3.5 shrink-0 opacity-50' />}
    </Link>
  )
}

const MenuItemRow = ({ item, ...rest }: { item: MenuItem } & RenderProps) => {
  const Tag = item.icon ? (Icon[item.icon] as ComponentType<{ className?: string }>) : null

  if (item.childItems) {
    const groupActive = isMenuItemActive(item, rest.pathname, rest.searchParams)

    return (
      <Collapsible className='w-full' defaultOpen={groupActive}>
        <CollapsibleTrigger className={triggerClasses(groupActive)}>
          <span className='flex items-center gap-2'>
            {Tag && <Tag className='size-4 shrink-0' />}
            {item.label}
          </span>
          <ChevronRightIcon className='size-4 shrink-0 transition-transform duration-300 group-data-panel-open:rotate-90' />
        </CollapsibleTrigger>
        <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-300 data-ending-style:h-0 data-starting-style:h-0'>
          <div
            className='border-border/60 mt-1 flex flex-col gap-1 border-l'
            style={{ marginInlineStart: 10, paddingInlineStart: 8 }}
          >
            {item.childItems.map(subItem => (
              <SubItemRow key={subItem.label} subItem={subItem} depth={1} {...rest} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  const active = isLinkActive(item.href, undefined, rest.pathname, rest.searchParams)

  return (
    <Link href={item.href} target={item.target} className={leafLinkClasses(active)} onClick={rest.onLinkClick}>
      {Tag && <Tag className='size-4 shrink-0' />}
      <span>{item.label}</span>
      {isExternalLink(item.href) && <SquareArrowOutUpRightIcon className='ml-auto size-3.5 shrink-0 opacity-50' />}
    </Link>
  )
}

const MobileNav = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')

    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false)
    }

    mql.addEventListener('change', handler)

    return () => mql.removeEventListener('change', handler)
  }, [])

  // Remove this state when the nav-apps API is removed. Until then, this state is used to hold the external nav-apps fetched from the API JSON.
  const [externalApps, setExternalApps] = useState<MenuItem[]>([])

  useEffect(() => {
    let mounted = true

    getNavApps().then(data => {
      if (!mounted) return

      setExternalApps(
        data.map(app => ({
          icon: app.icon as MenuItem['icon'],
          label: app.name,
          href: app.href,
          ...(app.openInNewTab ? { target: '_blank' as const } : {})
        }))
      )
    })

    return () => {
      mounted = false
    }
  }, [])

  // Nav groups rendered in the sidebar.
  let navGroups = navItems

  // Remove this condition when the nav-apps API is removed. Until then, this is used to merge external nav-apps into the "Apps" group.
  if (externalApps.length > 0) {
    navGroups = navItems.map(item =>
      item.groupLabel === 'Apps' ? { ...item, items: item.items.concat(externalApps) } : item
    )
  }

  const renderProps: RenderProps = { pathname, searchParams, onLinkClick: () => setOpen(false) }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent side='left' className='w-75 gap-0 p-0'>
        <SheetHeader className='border-b p-4'>
          <SheetTitle hidden />
          <SheetDescription hidden />
          <Link href={themeConfig.homePageUrl} onClick={() => setOpen(false)} className='self-start'>
            <div className='flex items-center gap-2.5'>
              <LogoSvg className='[&_rect]:fill-sidebar [&_rect:first-child]:fill-primary size-8.5' />
              <span className='text-xl font-semibold'>{themeConfig.templateName}</span>
            </div>
          </Link>
        </SheetHeader>
        <div className='flex flex-col gap-2 overflow-y-auto p-2'>
          {navGroups.map((group, index) => (
            <div key={group.groupLabel || index} className='flex flex-col'>
              {group.groupLabel && (
                <span className='text-muted-foreground/70 px-3 py-1.5 text-xs font-medium tracking-wider uppercase'>
                  {group.groupLabel}
                </span>
              )}
              {group.items.map(item => (
                <MenuItemRow key={item.label} item={item} {...renderProps} />
              ))}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MobileNav
