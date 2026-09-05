'use client'

// React Imports
import { Suspense, useMemo, useState } from 'react'
import type { ComponentType, CSSProperties } from 'react'

import { useEffect } from 'react'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

// Third-party Imports
import * as Icon from 'lucide-react'
import { ChevronRightIcon, SquareArrowOutUpRightIcon, type LucideIcon } from 'lucide-react'

// Component Imports
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider
} from '@/components/ui/sidebar'
import LogoSvg from '@/assets/svg/logo'

// Config Imports
import themeConfig from '@/configs/themeConfig'
import type { MenuGroupSubItem, MenuItem, MenuSubItem } from '@/configs/navConfig'
import { navItems } from '@/configs/navConfig'

// Hook Imports
import { useRightPanel } from '@/hooks/use-right-panel'

// Util Imports
import { cn } from '@/lib/utils'

import { getNavApps } from '@/lib/nav-apps'

// Helpers

const isSubGroup = (item: MenuSubItem): item is MenuGroupSubItem => 'childItems' in item
const isExternalLink = (href: string) => href.startsWith('http://') || href.startsWith('https://')

function isLinkActive(
  href: string,
  activePath: string | undefined,
  pathname: string,
  searchParams: Pick<URLSearchParams, 'get'>
): boolean {
  if (activePath) return pathname.startsWith(activePath)

  if (href.includes('?')) {
    const [hrefPath, hrefQuery] = href.split('?')

    if (pathname !== hrefPath) return false
    const hrefParams = new URLSearchParams(hrefQuery)

    for (const [key, value] of hrefParams.entries()) {
      if (searchParams.get(key) !== value) return false
    }

    return true
  }

  return pathname === href
}

// Mobile full-nav (needs Suspense for useSearchParams)

const MobileNavGroup = ({
  data,
  groupLabel,
  pathname,
  searchParams
}: {
  data: MenuItem[]
  groupLabel?: string
  pathname: string
  searchParams: Pick<URLSearchParams, 'get'>
}) => (
  <SidebarGroup>
    {groupLabel && (
      <SidebarGroupLabel className='text-sidebar-foreground/50 tracking-wider uppercase'>
        {groupLabel}
      </SidebarGroupLabel>
    )}
    <SidebarGroupContent>
      <SidebarMenu>
        {data.map(item => {
          const Tag = item.icon ? (Icon[item.icon] as ComponentType) : null

          const isChildActive =
            item.childItems?.some(subItem =>
              isSubGroup(subItem)
                ? subItem.childItems.some(leaf => isLinkActive(leaf.href, leaf.activePath, pathname, searchParams))
                : isLinkActive(subItem.href, subItem.activePath, pathname, searchParams)
            ) ?? false

          return item.childItems ? (
            <Collapsible className='group/collapsible' key={item.label}>
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isChildActive}
                      className='data-active:bg-primary/5!'
                    />
                  }
                >
                  {Tag && <Tag />}
                  <span>{item.label}</span>
                  <ChevronRightIcon className='ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90' />
                </CollapsibleTrigger>
                <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                  <SidebarMenuSub>
                    {item.childItems.map(subItem =>
                      isSubGroup(subItem) ? (
                        <Collapsible className='group/subcollapsible' key={subItem.label}>
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger
                              nativeButton={false}
                              render={
                                <SidebarMenuSubButton
                                  className='data-active:bg-primary/10! justify-between'
                                  isActive={subItem.childItems.some(leaf =>
                                    isLinkActive(leaf.href, leaf.activePath, pathname, searchParams)
                                  )}
                                />
                              }
                            >
                              {subItem.label}
                              <ChevronRightIcon className='ml-auto shrink-0 transition-transform duration-200 group-data-open/subcollapsible:rotate-90' />
                            </CollapsibleTrigger>
                            <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                              <SidebarMenuSub className='mx-0'>
                                {subItem.childItems.map(leaf => (
                                  <SidebarMenuSubItem key={leaf.label}>
                                    <SidebarMenuSubButton
                                      className='data-active:bg-primary/10! justify-between'
                                      render={<Link href={leaf.href} target={leaf.target} />}
                                      isActive={isLinkActive(leaf.href, leaf.activePath, pathname, searchParams)}
                                    >
                                      {leaf.label}
                                      {isExternalLink(leaf.href) && (
                                        <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                                      )}
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuSubItem>
                        </Collapsible>
                      ) : (
                        <SidebarMenuSubItem key={subItem.label}>
                          <SidebarMenuSubButton
                            className='data-active:bg-primary/10! justify-between'
                            render={<Link href={subItem.href} target={subItem.target} />}
                            isActive={isLinkActive(subItem.href, subItem.activePath, pathname, searchParams)}
                          >
                            {subItem.label}
                            {isExternalLink(subItem.href) && (
                              <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                tooltip={item.label}
                render={<Link href={item.href} target={item.target} />}
                isActive={pathname === item.href}
                className='data-active:bg-primary/10!'
              >
                {Tag && <Tag />}
                <span>{item.label}</span>
                {isExternalLink(item.href) && (
                  <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                )}
              </SidebarMenuButton>
              {item.badge && (
                <SidebarMenuBadge className={cn('bg-primary/10 rounded-full px-1.5 font-normal', item.badgeClassName)}>
                  {item.badge}
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
)

const MobileFullNav = ({ navGroups }: { navGroups: typeof navItems }) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <>
      {navGroups.map((navItem, index) => (
        <MobileNavGroup
          key={navItem.groupLabel || index}
          data={navItem.items}
          groupLabel={navItem.groupLabel}
          pathname={pathname}
          searchParams={searchParams}
        />
      ))}
    </>
  )
}

// Right panel content (needs Suspense — uses useSearchParams)

const RightPanelContent = ({ activeGroup }: { activeGroup: (typeof navItems)[0] }) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (href: string, activePath?: string) => isLinkActive(href, activePath, pathname, searchParams)

  // Derived: which keys the current URL requires to be open — recomputed every render, no state
  const pathOpenKeys = new Set<string>()

  for (const item of activeGroup.items) {
    if (!item.childItems) continue

    if (
      item.childItems.some(sub =>
        isSubGroup(sub)
          ? sub.childItems.some(leaf => isActive(leaf.href, leaf.activePath))
          : isActive(sub.href, sub.activePath)
      )
    ) {
      pathOpenKeys.add(item.label)
    }

    for (const sub of item.childItems) {
      if (isSubGroup(sub) && sub.childItems.some(leaf => isActive(leaf.href, leaf.activePath))) {
        pathOpenKeys.add(sub.label)
      }
    }
  }

  // User-toggled open keys, seeded from the initial path state
  const [manualOpenKeys, setManualOpenKeys] = useState<Set<string>>(new Set(pathOpenKeys))

  // Final open state: path-required ∪ user-opened (path-active parents can never be collapsed)
  const openKeys = new Set([...manualOpenKeys, ...pathOpenKeys])

  const handleOpenChange = (key: string, open: boolean) => {
    setManualOpenKeys(prev => {
      const next = new Set(prev)

      if (open) {
        next.add(key)
      } else {
        next.delete(key)
      }

      return next
    })
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {activeGroup.items.map(item => {
            const ItemIcon = item.icon ? (Icon[item.icon] as LucideIcon) : null

            const childIsActive =
              item.childItems?.some(sub =>
                isSubGroup(sub)
                  ? sub.childItems.some(leaf => isActive(leaf.href, leaf.activePath))
                  : isActive(sub.href, sub.activePath)
              ) ?? false

            if (item.childItems) {
              return (
                <Collapsible
                  key={item.label}
                  className='group/collapsible'
                  open={openKeys.has(item.label)}
                  onOpenChange={open => handleOpenChange(item.label, open)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuButton isActive={childIsActive} className='data-active:bg-primary/5! text-nowrap' />
                      }
                    >
                      {ItemIcon && <ItemIcon />}
                      <span>{item.label}</span>
                      <ChevronRightIcon className='ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90' />
                    </CollapsibleTrigger>
                    <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                      <SidebarMenuSub>
                        {item.childItems.map(subItem =>
                          isSubGroup(subItem) ? (
                            <Collapsible
                              key={subItem.label}
                              className='group/subcollapsible'
                              open={openKeys.has(subItem.label)}
                              onOpenChange={open => handleOpenChange(subItem.label, open)}
                            >
                              <SidebarMenuSubItem>
                                <CollapsibleTrigger
                                  nativeButton={false}
                                  render={
                                    <SidebarMenuSubButton
                                      className='data-active:bg-primary/10! justify-between text-nowrap'
                                      isActive={subItem.childItems.some(leaf => isActive(leaf.href, leaf.activePath))}
                                    />
                                  }
                                >
                                  {subItem.label}
                                  <ChevronRightIcon className='ml-auto shrink-0 transition-transform duration-200 group-data-open/subcollapsible:rotate-90' />
                                </CollapsibleTrigger>
                                <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                                  <SidebarMenuSub className='mx-0'>
                                    {subItem.childItems.map(leaf => (
                                      <SidebarMenuSubItem key={leaf.label}>
                                        <SidebarMenuSubButton
                                          className='data-active:bg-primary/10! justify-between text-nowrap'
                                          render={<Link href={leaf.href} target={leaf.target} />}
                                          isActive={isActive(leaf.href, leaf.activePath)}
                                        >
                                          {leaf.label}
                                          {isExternalLink(leaf.href) && (
                                            <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                                          )}
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </SidebarMenuSubItem>
                            </Collapsible>
                          ) : (
                            <SidebarMenuSubItem key={subItem.label}>
                              <SidebarMenuSubButton
                                className='data-active:bg-primary/10! justify-between text-nowrap'
                                render={<Link href={subItem.href} target={subItem.target} />}
                                isActive={isActive(subItem.href, subItem.activePath)}
                              >
                                {subItem.label}
                                {isExternalLink(subItem.href) && (
                                  <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                                )}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  render={<Link href={item.href} target={item.target} />}
                  isActive={isActive(item.href)}
                  className='data-active:bg-primary/10! text-nowrap'
                >
                  {ItemIcon && <ItemIcon />}
                  <span>{item.label}</span>
                  {isExternalLink(item.href) && (
                    <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                  )}
                </SidebarMenuButton>
                {item.badge && (
                  <SidebarMenuBadge
                    className={cn('bg-primary/10 rounded-full px-1.5 font-normal', item.badgeClassName)}
                  >
                    {item.badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// Main dual sidebar

const matchGroupForPath = (path: string) => {
  for (let i = 0; i < navItems.length; i++) {
    const matched = navItems[i].items.some(item => {
      if (item.href && !isExternalLink(item.href)) {
        return path.startsWith(item.href.split('?')[0])
      }

      return (
        item.childItems?.some(sub => {
          if (isSubGroup(sub)) {
            return sub.childItems.some(leaf => !isExternalLink(leaf.href) && path.startsWith(leaf.href.split('?')[0]))
          }

          return !isExternalLink(sub.href) && path.startsWith(sub.href.split('?')[0])
        }) ?? false
      )
    })

    if (matched) return i
  }

  return -1
}

const DualSidebar = () => {
  const pathname = usePathname()

  // Which group the current URL belongs to — drives the left-icon active indicator
  const routeGroupIndex = useMemo(() => matchGroupForPath(pathname), [pathname])

  // Which group to show in the right panel — follows route by default, can be temporarily overridden by clicking
  const [manualGroupIndex, setManualGroupIndex] = useState<number | null>(null)
  const [manualPathname, setManualPathname] = useState(pathname)
  const { rightPanelOpen, toggleRightPanel } = useRightPanel()

  const activeGroupIndex =
    pathname === manualPathname && manualGroupIndex !== null
      ? manualGroupIndex
      : routeGroupIndex === -1
        ? 0
        : routeGroupIndex

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
  // Once external nav-apps have loaded, merge them into the "Apps" group.
  if (externalApps.length > 0) {
    navGroups = navItems.map(item =>
      item.groupLabel === 'Apps' ? { ...item, items: item.items.concat(externalApps) } : item
    )
  }

  const activeGroup = navGroups[activeGroupIndex]

  return (
    <>
      {/*
       * Single <Sidebar>:
       *  • xl+  → inline icon strip (group-icon buttons, open=false = icon mode)
       *  • <xl  → offcanvas Sheet showing the full navigation tree
       */}
      <Sidebar collapsible='icon' className='*:bg-background'>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size='lg'
                className='gap-2.5 bg-transparent! group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-1! [&>svg]:size-8'
                render={<Link href={themeConfig.homePageUrl} />}
              >
                <LogoSvg className='[&_rect]:fill-sidebar [&_rect:first-child]:fill-primary' />
                <div className='flex flex-col items-start'>
                  <span className='text-lg font-semibold text-nowrap'>{themeConfig.templateName}</span>
                  <span className='text-xs font-light text-nowrap'>Dashboard Template</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className='group-data-[collapsible=icon]:overflow-y-auto'>
          {/* Desktop: group-icon buttons (xl+) */}
          <div className='hidden xl:inline-block'>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navGroups.map((navItem, index) => {
                    let groupIconContent: React.ReactNode = null

                    if (typeof navItem.groupIcon === 'string') {
                      const Comp = Icon[navItem.groupIcon as keyof typeof Icon] as LucideIcon | undefined

                      groupIconContent = Comp ? <Comp /> : null
                    } else if (navItem.groupIcon) {
                      groupIconContent = navItem.groupIcon
                    }

                    return (
                      <SidebarMenuItem key={navItem.groupLabel || index}>
                        <SidebarMenuButton
                          tooltip={navItem.groupLabel}
                          isActive={routeGroupIndex === index}
                          className='data-active:[&>svg]:text-primary data-active:bg-primary/10! group-data-[collapsible=icon]:size-10! [&>svg]:size-6 [&>svg]:scale-90'
                          onClick={() => {
                            setManualGroupIndex(index)
                            setManualPathname(pathname)
                            if (!rightPanelOpen) toggleRightPanel()
                          }}
                        >
                          {groupIconContent}
                          <span>{navItem.groupLabel}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>

          {/* Mobile: full navigation tree (< xl, shown in Sheet) */}
          <div className='xl:hidden'>
            <Suspense fallback={null}>
              <MobileFullNav navGroups={navGroups} />
            </Suspense>
          </div>
        </SidebarContent>
      </Sidebar>

      {/* Right wide panel — desktop only (xl+) */}
      <div
        className={cn(
          'bg-sidebar sticky top-0 hidden h-dvh flex-col overflow-hidden border-r transition-[width] duration-200 ease-linear xl:flex',
          rightPanelOpen ? 'w-65' : 'w-0 border-r-0'
        )}
      >
        <div className='px-4 py-3.5 text-lg font-semibold text-nowrap'>{activeGroup.groupLabel}</div>
        <SidebarProvider
          open={true}
          style={{ '--sidebar-width': '100%', '--sidebar-width-icon': '0rem', minHeight: 0, flex: 1 } as CSSProperties}
        >
          <Sidebar collapsible='none'>
            <SidebarContent>
              <Suspense fallback={null}>
                <RightPanelContent key={activeGroup.groupLabel} activeGroup={activeGroup} />
              </Suspense>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </div>
    </>
  )
}

export default DualSidebar
