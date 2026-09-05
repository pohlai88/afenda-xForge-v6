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
    groupLabel: 'Dashboard & Layouts',
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
        icon: 'Truck',
        label: 'Logistics',
        href: '/dashboard/logistics'
      },
      {
        icon: 'Briefcase',
        label: 'Productivity',
        href: '/dashboard/productivity'
      },
      {
        icon: 'Megaphone',
        label: 'Campaign',
        href: '/dashboard/campaign'
      },
      {
        icon: 'BarChart3',
        label: 'Analytics',
        href: '/dashboard/analytics'
      },
      {
        icon: 'CreditCard',
        label: 'Payments',
        href: '/dashboard/payments'
      },
      {
        icon: 'ShoppingCart',
        label: 'eCommerce',
        href: '/dashboard/ecommerce'
      },
      {
        icon: 'Package',
        label: 'Orders',
        href: '/dashboard/orders'
      },
      {
        icon: 'LayoutTemplate',
        label: 'Layouts',
        childItems: [
          {
            label: 'Full Navbar',
            href: 'https://shadcn-nextjs-admincn-full-navbar-layout-admin-template.vercel.app/',
            target: '_blank'
          },
          {
            label: 'Horizontal',
            href: 'https://shadcn-nextjs-admincn-horizontal-layout-admin-template.vercel.app/',
            target: '_blank'
          },
          {
            label: 'Split',
            href: 'https://shadcn-nextjs-admincn-split-layout-admin-template.vercel.app/',
            target: '_blank'
          },
          {
            label: 'Icon Menu',
            href: 'https://shadcn-nextjs-admincn-icon-menu-layout-admin-template.vercel.app/',
            target: '_blank'
          },
          {
            label: 'Paper',
            href: 'https://shadcn-nextjs-admincn-paper-layout-admin-template.vercel.app/',
            target: '_blank'
          }
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
        icon: 'RocketIcon',
        label: 'Landing Page',
        href: 'https://shadcn-nextjs-flow-landing-page.vercel.app/',
        target: '_blank'
      },
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
        icon: 'DollarSignIcon',
        label: 'Pricing',
        href: '/pages/pricing'
      },
      {
        icon: 'CircleQuestionMarkIcon',
        label: 'FAQ',
        href: '/pages/faq'
      },
      {
        icon: 'FootprintsIcon',
        label: 'Onboarding',
        childItems: [
          { label: 'Onboarding v1', href: '/pages/onboarding-v1', target: '_blank' },
          { label: 'Onboarding v2', href: '/pages/onboarding-v2', target: '_blank' }
        ]
      },
      {
        icon: 'LockKeyholeIcon',
        label: 'Authentication',
        childItems: [
          {
            label: 'Login',
            childItems: [
              { label: 'Login v1', href: '/pages/auth/login-v1', target: '_blank' },
              { label: 'Login v2', href: '/pages/auth/login-v2', target: '_blank' },
              { label: 'Login v3', href: '/pages/auth/login-v3', target: '_blank' }
            ]
          },
          {
            label: 'Register',
            childItems: [
              { label: 'Register v1', href: '/pages/auth/register-v1', target: '_blank' },
              { label: 'Register v2', href: '/pages/auth/register-v2', target: '_blank' },
              { label: 'Register v3', href: '/pages/auth/register-v3', target: '_blank' }
            ]
          },
          {
            label: 'Forgot Password',
            childItems: [
              { label: 'Forgot Password v1', href: '/pages/auth/forgot-password-v1', target: '_blank' },
              { label: 'Forgot Password v2', href: '/pages/auth/forgot-password-v2', target: '_blank' },
              { label: 'Forgot Password v3', href: '/pages/auth/forgot-password-v3', target: '_blank' }
            ]
          },
          {
            label: 'Verify Email',
            childItems: [
              { label: 'Verify Email v1', href: '/pages/auth/verify-email-v1', target: '_blank' },
              { label: 'Verify Email v2', href: '/pages/auth/verify-email-v2', target: '_blank' },
              { label: 'Verify Email v3', href: '/pages/auth/verify-email-v3', target: '_blank' }
            ]
          },
          {
            label: 'Reset Password',
            childItems: [
              { label: 'Reset Password v1', href: '/pages/auth/reset-password-v1', target: '_blank' },
              { label: 'Reset Password v2', href: '/pages/auth/reset-password-v2', target: '_blank' },
              { label: 'Reset Password v3', href: '/pages/auth/reset-password-v3', target: '_blank' }
            ]
          },
          {
            label: 'Two Steps',
            childItems: [
              { label: 'Two Steps v1', href: '/pages/auth/two-steps-v1', target: '_blank' },
              { label: 'Two Steps v2', href: '/pages/auth/two-steps-v2', target: '_blank' },
              { label: 'Two Steps v3', href: '/pages/auth/two-steps-v3', target: '_blank' }
            ]
          }
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
      },
      {
        icon: 'FileIcon',
        label: 'Empty State',
        childItems: [
          { label: 'Empty State v1', href: '/pages/empty-state-v1' },
          { label: 'Empty State v2', href: '/pages/empty-state-v2' }
        ]
      }
    ]
  },
  {
    groupLabel: 'Forms & Tables',
    items: [
      {
        icon: 'LayoutTemplateIcon',
        label: 'Form Layouts',
        childItems: [
          { label: 'Vertical Layout', href: '/forms/form-layouts/vertical' },
          { label: 'Horizontal Layout', href: '/forms/form-layouts/horizontal' },
          { label: 'Sticky Actions', href: '/forms/form-layouts/sticky-actions' }
        ]
      },
      {
        icon: 'BadgeCheckIcon',
        label: 'Form Validation',
        href: '/forms/form-validation'
      },
      {
        icon: 'ListTodoIcon',
        label: 'Form Wizard',
        childItems: [
          { label: 'Icons', href: '/forms/form-wizard/icons' },
          { label: 'Numbered', href: '/forms/form-wizard/numbered' }
        ]
      },
      {
        icon: 'TableIcon',
        label: 'Data Table',
        href: '/datatable'
      }
    ]
  },
  {
    groupLabel: 'Components & Charts',
    items: [
      {
        icon: 'LayoutGrid',
        label: 'Components',
        href: 'https://shadcnstudio.com/components',
        target: '_blank'
      },
      {
        icon: 'LineChart',
        label: 'Charts',
        href: 'https://shadcnstudio.com/blocks/dashboard-and-application/charts-component',
        target: '_blank'
      },
      {
        icon: 'ChartNoAxesColumnIncreasing',
        label: 'Statistics',
        href: 'https://shadcnstudio.com/blocks/dashboard-and-application/statistics-component',
        target: '_blank'
      },
      {
        icon: 'PanelTop',
        label: 'Card Nav',
        href: 'https://shadcnstudio.com/blocks/dashboard-and-application/card-nav',
        target: '_blank'
      },
      {
        icon: 'Puzzle',
        label: 'Widgets',
        href: 'https://shadcnstudio.com/blocks/dashboard-and-application/widgets-component',
        target: '_blank'
      }
    ]
  },
  {
    groupLabel: 'Miscellaneous',
    items: [
      {
        icon: 'MenuIcon',
        label: 'Menu Level',
        childItems: [
          {
            label: 'Menu Item ',
            href: '#'
          },
          {
            label: 'Menu Level 1',
            childItems: [{ label: 'Menu Level 2', href: '#' }]
          }
        ]
      },
      {
        icon: 'InfoIcon',
        label: 'Support',
        href: 'https://shadcnstudio.com/support',
        target: '_blank'
      },
      {
        icon: 'BookOpenTextIcon',
        label: 'Documentation',
        href: 'https://shadcnstudio.com/docs/documentation-admin/getting-started',
        target: '_blank'
      }
    ]
  }
]
