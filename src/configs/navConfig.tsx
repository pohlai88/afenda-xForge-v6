// Third-party Imports
import type * as Icon from 'lucide-react'

type IconName = keyof typeof Icon

export type MenuLeafSubItem = {
  label: string
  href: string
  activePath?: string
  badge?: string
  badgeClassName?: string
  target?: '_blank' | '_self' | '_parent' | '_top'
}

export type MenuGroupSubItem = {
  label: string
  childItems: MenuLeafSubItem[]
}

export type MenuSubItem = MenuLeafSubItem | MenuGroupSubItem

export type MenuItem = {
  icon: IconName
  label: string
} & (
  | {
      href: string
      badge?: string
      badgeClassName?: string
      childItems?: never
      target?: '_blank' | '_self' | '_parent' | '_top'
    }
  | { href?: never; badge?: never; childItems: MenuSubItem[] }
)

export type NavItem = {
  groupLabel?: string
  items: MenuItem[]
}

export const navItems: NavItem[] = [
  {
    groupLabel: 'Dashboards',
    items: [
      {
        icon: 'TrendingUp',
        label: 'Sales',
        href: '/dashboard/sales'
      },
      {
        icon: 'Wallet',
        label: 'Finance',
        href: '/dashboard/finance'
      },
      {
        icon: 'Package',
        label: 'Orders',
        href: '/dashboard/orders'
      },
      {
        icon: 'CreditCard',
        label: 'Payments',
        href: '/dashboard/payments'
      },
      {
        icon: 'Truck',
        label: 'Logistics',
        href: '/dashboard/logistics'
      },
      {
        icon: 'ShoppingCart',
        label: 'eCommerce',
        href: '/dashboard/ecommerce'
      }
    ]
  },
  {
    groupLabel: 'Payroll',
    items: [
      {
        icon: 'Banknote',
        label: 'Payroll',
        childItems: [
          { label: 'Group', href: '/payroll' },
          { label: 'Companies', href: '/payroll/entities/ent-sg', activePath: '/payroll/entities' },
          { label: 'Runs', href: '/payroll/runs', activePath: '/payroll/runs' },
          { label: 'Payments', href: '/payroll/payments' },
          { label: 'Compliance', href: '/payroll/compliance' },
          { label: 'Reports', href: '/payroll/reports' },
          { label: 'Settings', href: '/payroll/settings', activePath: '/payroll/settings' }
        ]
      }
    ]
  },
  {
    groupLabel: 'Apps',
    items: [
      {
        icon: 'MailIcon',
        label: 'Mail',
        href: '/apps/mail'
      },
      {
        icon: 'MessageCircleIcon',
        label: 'Chat',
        href: '/apps/chat'
      },
      {
        icon: 'SquareKanbanIcon',
        label: 'Kanban',
        href: '/apps/kanban'
      },
      {
        icon: 'CalendarIcon',
        label: 'Calendar',
        href: '/apps/calendar'
      },
      {
        icon: 'ContactIcon',
        label: 'Contact',
        href: '/apps/contact'
      },
      {
        icon: 'UsersIcon',
        label: 'Users',
        childItems: [
          { label: 'List', href: '/apps/users/list' },
          { label: 'View', href: '/apps/users/view/user-001', activePath: '/apps/users/view/' }
        ]
      },
      {
        icon: 'ShieldCheckIcon',
        label: 'Roles & Permissions',
        childItems: [
          { label: 'Roles', href: '/apps/roles' },
          { label: 'Permissions', href: '/apps/permissions' }
        ]
      }
    ]
  },
  {
    groupLabel: 'Pages',
    items: [
      {
        icon: 'UserCogIcon',
        label: 'User Settings',
        childItems: [
          { label: 'General', href: '/pages/user-settings?setting=general' },
          { label: 'Notifications', href: '/pages/user-settings?setting=notifications' },
          { label: 'Workspace', href: '/pages/user-settings?setting=workspace' },
          { label: 'Integrations', href: '/pages/user-settings?setting=integrations' },
          { label: 'Members', href: '/pages/user-settings?setting=members' },
          { label: 'Security', href: '/pages/user-settings?setting=security' },
          { label: 'Billing & Usage', href: '/pages/user-settings?setting=billing' }
        ]
      },
      {
        icon: 'UserIcon',
        label: 'User Profile',
        childItems: [
          { label: 'Profile', href: '/pages/user-profile?view=profile' },
          { label: 'Teams', href: '/pages/user-profile?view=teams' },
          { label: 'Projects', href: '/pages/user-profile?view=projects' },
          { label: 'Connections', href: '/pages/user-profile?view=connections' }
        ]
      },
      {
        icon: 'LockKeyholeIcon',
        label: 'Authentication',
        childItems: [
          { label: 'Login', href: '/pages/auth/login-v1', target: '_blank' },
          { label: 'Register', href: '/pages/auth/register-v1', target: '_blank' },
          { label: 'Forgot Password', href: '/pages/auth/forgot-password-v1', target: '_blank' },
          { label: 'Reset Password', href: '/pages/auth/reset-password-v1', target: '_blank' },
          { label: 'Verify Email', href: '/pages/auth/verify-email-v1', target: '_blank' },
          { label: 'Two Steps', href: '/pages/auth/two-steps-v1', target: '_blank' }
        ]
      },
      {
        icon: 'BugIcon',
        label: 'Error Pages',
        childItems: [
          { label: 'Error Page - 404', href: '/pages/misc/error-page-404', target: '_blank' },
          { label: 'Not Authorized - 401', href: '/pages/misc/unauthorized-access-401', target: '_blank' },
          { label: 'Forbidden - 403', href: '/pages/misc/forbidden-403', target: '_blank' },
          { label: 'Server Error - 500', href: '/pages/misc/server-error-500', target: '_blank' },
          { label: 'Under Maintenance', href: '/pages/misc/maintenance-page', target: '_blank' }
        ]
      }
    ]
  }
]
