// Type Imports
import type { MenuGroupSubItem, MenuItem, MenuSubItem } from '@/configs/navConfig'

export const isSubGroup = (item: MenuSubItem): item is MenuGroupSubItem => 'childItems' in item

export const isExternalLink = (href: string) => href.startsWith('http://') || href.startsWith('https://')

export function isLinkActive(
  href: string,
  activePath: string | undefined,
  pathname: string,
  searchParams: Pick<URLSearchParams, 'get'>
): boolean {
  if (activePath) {
    return pathname.startsWith(activePath)
  }

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

// Recursively determine whether any descendant link of a menu item is active
export function isSubItemActive(
  subItem: MenuSubItem,
  pathname: string,
  searchParams: Pick<URLSearchParams, 'get'>
): boolean {
  if (isSubGroup(subItem)) {
    return subItem.childItems.some(leaf => isLinkActive(leaf.href, leaf.activePath, pathname, searchParams))
  }

  return isLinkActive(subItem.href, subItem.activePath, pathname, searchParams)
}

export function isMenuItemActive(
  item: MenuItem,
  pathname: string,
  searchParams: Pick<URLSearchParams, 'get'>
): boolean {
  if (item.childItems) {
    return item.childItems.some(subItem => isSubItemActive(subItem, pathname, searchParams))
  }

  return isLinkActive(item.href, undefined, pathname, searchParams)
}
