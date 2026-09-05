// React Imports
import type { ReactElement } from 'react'

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
  groupIcon?: string | ReactElement
  items: MenuItem[]
}

export const navItems: NavItem[] = [
  {
    groupLabel: 'Dashboard & Layouts',
    groupIcon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='64'
        height='64'
        color='currentColor'
        fill='none'
        viewBox='0 0 24 24'
      >
        <path
          opacity='0.5'
          d='M2.5 6.5C2.5 4.61438 2.5 3.67157 3.08579 3.08579C3.67157 2.5 4.61438 2.5 6.5 2.5C8.38562 2.5 9.32843 2.5 9.91421 3.08579C10.5 3.67157 10.5 4.61438 10.5 6.5V17.5C10.5 19.3856 10.5 20.3284 9.91421 20.9142C9.32843 21.5 8.38562 21.5 6.5 21.5C4.61438 21.5 3.67157 21.5 3.08579 20.9142C2.5 20.3284 2.5 19.3856 2.5 17.5V6.5Z'
          stroke='currentColor'
          strokeWidth='1.5'
        ></path>
        <path
          d='M13.5 15.5C13.5 13.6144 13.5 12.6716 14.0858 12.0858C14.6716 11.5 15.6144 11.5 17.5 11.5C19.3856 11.5 20.3284 11.5 20.9142 12.0858C21.5 12.6716 21.5 13.6144 21.5 15.5V17.5C21.5 19.3856 21.5 20.3284 20.9142 20.9142C20.3284 21.5 19.3856 21.5 17.5 21.5C15.6144 21.5 14.6716 21.5 14.0858 20.9142C13.5 20.3284 13.5 19.3856 13.5 17.5V15.5Z'
          stroke='currentColor'
          strokeWidth='1.5'
        ></path>
        <path
          d='M13.5 5.5C13.5 4.56812 13.5 4.10218 13.6522 3.73463C13.8552 3.24458 14.2446 2.85523 14.7346 2.65224C15.1022 2.5 15.5681 2.5 16.5 2.5H18.5C19.4319 2.5 19.8978 2.5 20.2654 2.65224C20.7554 2.85523 21.1448 3.24458 21.3478 3.73463C21.5 4.10218 21.5 4.56812 21.5 5.5C21.5 6.43188 21.5 6.89782 21.3478 7.26537C21.1448 7.75542 20.7554 8.14477 20.2654 8.34776C19.8978 8.5 19.4319 8.5 18.5 8.5H16.5C15.5681 8.5 15.1022 8.5 14.7346 8.34776C14.2446 8.14477 13.8552 7.75542 13.6522 7.26537C13.5 6.89782 13.5 6.43188 13.5 5.5Z'
          stroke='currentColor'
          strokeWidth='1.5'
        ></path>
      </svg>
    ),
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
            label: 'Default',
            href: 'https://shadcn-nextjs-admincn-admin-template.vercel.app/',
            target: '_blank'
          },
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
    groupIcon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='64'
        height='64'
        color='currentColor'
        fill='none'
        viewBox='0 0 24 24'
      >
        <path
          d='M15.5777 3.38197L17.5777 4.43152C19.7294 5.56066 20.8052 6.12523 21.4026 7.13974C22 8.15425 22 9.41667 22 11.9415V12.0585C22 14.5833 22 15.8458 21.4026 16.8603C20.8052 17.8748 19.7294 18.4393 17.5777 19.5685L15.5777 20.618C13.8221 21.5393 12.9443 22 12 22C11.0557 22 10.1779 21.5393 8.42229 20.618L6.42229 19.5685C4.27063 18.4393 3.19479 17.8748 2.5974 16.8603C2 15.8458 2 14.5833 2 12.0585V11.9415C2 9.41667 2 8.15425 2.5974 7.13974C3.19479 6.12523 4.27063 5.56066 6.42229 4.43152L8.42229 3.38197C10.1779 2.46066 11.0557 2 12 2C12.9443 2 13.8221 2.46066 15.5777 3.38197Z'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        ></path>
        <path
          opacity='0.5'
          d='M21 7.5L12 12M12 12L3 7.5M12 12V21.5'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        ></path>
      </svg>
    ),
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
    groupIcon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='64'
        height='64'
        color='currentColor'
        fill='none'
        viewBox='0 0 24 24'
      >
        <path
          opacity='0.5'
          d='M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z'
          stroke='currentColor'
          strokeWidth='1.5'
        ></path>
        <path d='M8 12H16' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'></path>
        <path d='M8 8H16' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'></path>
        <path d='M8 16H13' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'></path>
      </svg>
    ),
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
    groupIcon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='64'
        height='64'
        color='currentColor'
        fill='none'
        viewBox='0 0 24 24'
      >
        <path
          opacity='0.5'
          d='M16 4.00195C18.175 4.01406 19.3529 4.11051 20.1213 4.87889C21 5.75757 21 7.17179 21 10.0002V16.0002C21 18.8286 21 20.2429 20.1213 21.1215C19.2426 22.0002 17.8284 22.0002 15 22.0002H9C6.17157 22.0002 4.75736 22.0002 3.87868 21.1215C3 20.2429 3 18.8286 3 16.0002V10.0002C3 7.17179 3 5.75757 3.87868 4.87889C4.64706 4.11051 5.82497 4.01406 8 4.00195'
          stroke='currentColor'
          strokeWidth='1.5'
        ></path>
        <path d='M10.5 14L17 14' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'></path>
        <path d='M7 14H7.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'></path>
        <path d='M7 10.5H7.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'></path>
        <path d='M7 17.5H7.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'></path>
        <path d='M10.5 10.5H17' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'></path>
        <path d='M10.5 17.5H17' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'></path>
        <path
          d='M8 3.5C8 2.67157 8.67157 2 9.5 2H14.5C15.3284 2 16 2.67157 16 3.5V4.5C16 5.32843 15.3284 6 14.5 6H9.5C8.67157 6 8 5.32843 8 4.5V3.5Z'
          stroke='currentColor'
          strokeWidth='1.5'
        ></path>
      </svg>
    ),
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
    groupIcon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='64'
        height='64'
        color='currentColor'
        fill='none'
        viewBox='0 0 24 24'
      >
        <path d='M22 22H2' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'></path>
        <path
          opacity='0.5'
          d='M21 22V14.5C21 13.6716 20.3284 13 19.5 13H16.5C15.6716 13 15 13.6716 15 14.5V22'
          stroke='currentColor'
          strokeWidth='1.5'
        ></path>
        <path
          d='M15 22V5C15 3.58579 15 2.87868 14.5607 2.43934C14.1213 2 13.4142 2 12 2C10.5858 2 9.87868 2 9.43934 2.43934C9 2.87868 9 3.58579 9 5V22'
          stroke='currentColor'
          strokeWidth='1.5'
        ></path>
        <path
          opacity='0.5'
          d='M9 22V9.5C9 8.67157 8.32843 8 7.5 8H4.5C3.67157 8 3 8.67157 3 9.5V22'
          stroke='currentColor'
          strokeWidth='1.5'
        ></path>
      </svg>
    ),
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
    groupIcon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='64'
        height='64'
        color='currentColor'
        fill='none'
        viewBox='0 0 24 24'
      >
        <circle cx='5' cy='12' r='2' stroke='currentColor' strokeWidth='1.5'></circle>
        <circle opacity='0.5' cx='12' cy='12' r='2' stroke='currentColor' strokeWidth='1.5'></circle>
        <circle cx='19' cy='12' r='2' stroke='currentColor' strokeWidth='1.5'></circle>
      </svg>
    ),
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
