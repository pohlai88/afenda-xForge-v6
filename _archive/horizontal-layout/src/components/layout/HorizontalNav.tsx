'use client'

// React Imports
import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

// Third-party Imports
import * as Icon from 'lucide-react'
import { ChevronDownIcon, SquareArrowOutUpRightIcon } from 'lucide-react'

// Type Imports
import type { MenuItem, MenuSubItem } from '@/configs/navConfig'

// Component Imports
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Config Imports
import { navItems } from '@/configs/navConfig'

// Util Imports
import { cn } from '@/lib/utils'
import { getNavApps } from '@/lib/nav-apps'
import { isExternalLink, isLinkActive, isMenuItemActive, isSubGroup, isSubItemActive } from './navUtils'

type ActiveProps = {
  pathname: string
  searchParams: Pick<URLSearchParams, 'get'>
}

const SubItemContent = ({ subItem, ...active }: { subItem: MenuSubItem } & ActiveProps) => {
  // Nested group (e.g. Authentication > Login > Login v1)
  if (isSubGroup(subItem)) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          className={cn(isSubItemActive(subItem, active.pathname, active.searchParams) && 'bg-accent')}
        >
          {subItem.label}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className='min-w-44'>
          {subItem.childItems.map(leaf => (
            <SubItemContent key={leaf.label} subItem={leaf} {...active} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  // Leaf link
  return (
    <DropdownMenuItem
      className={cn(
        'justify-between',
        isLinkActive(subItem.href, subItem.activePath, active.pathname, active.searchParams) && 'bg-primary/10!'
      )}
      render={<Link href={subItem.href} target={subItem.target} />}
    >
      <span>{subItem.label}</span>
      {isExternalLink(subItem.href) && <SquareArrowOutUpRightIcon className='size-3.5! shrink-0 opacity-50' />}
    </DropdownMenuItem>
  )
}

const MenuItemContent = ({ item, ...active }: { item: MenuItem } & ActiveProps) => {
  const Tag = item.icon ? (Icon[item.icon] as ComponentType<{ className?: string }>) : null

  // Item with children -> submenu
  if (item.childItems) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          className={cn('gap-2', isMenuItemActive(item, active.pathname, active.searchParams) && 'bg-accent')}
        >
          {Tag && <Tag className='size-4 shrink-0' />}
          <span>{item.label}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className='min-w-48'>
          {item.childItems.map(subItem => (
            <SubItemContent key={subItem.label} subItem={subItem} {...active} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  // Leaf link
  return (
    <DropdownMenuItem
      className={cn(
        'gap-2',
        isLinkActive(item.href, undefined, active.pathname, active.searchParams) && 'bg-primary/10!'
      )}
      render={<Link href={item.href} target={item.target} />}
    >
      {Tag && <Tag className='size-4 shrink-0' />}
      <span>{item.label}</span>
      {isExternalLink(item.href) && <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />}
    </DropdownMenuItem>
  )
}

const HorizontalNav = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const active: ActiveProps = { pathname, searchParams }

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

  return (
    <nav className='hidden md:block'>
      <ul className='flex flex-wrap items-center gap-1'>
        {navGroups.map((group, index) => {
          const isGroupActive = group.items.some(item => isMenuItemActive(item, pathname, searchParams))

          return (
            <li key={group.groupLabel || index}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    'group hover:bg-accent hover:text-accent-foreground data-popup-open:bg-accent inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors outline-none',
                    isGroupActive && 'text-primary bg-accent'
                  )}
                >
                  {group.groupLabel}
                  <ChevronDownIcon className='size-3.5 opacity-60 transition-transform duration-200 group-data-[popup-open]:rotate-180' />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='min-w-52'>
                  {group.items.map(item => (
                    <MenuItemContent key={item.label} item={item} {...active} />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default HorizontalNav
