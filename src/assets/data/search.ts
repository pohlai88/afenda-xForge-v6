// React Imports
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

// Third-party Imports
import {
  BanIcon,
  BanknoteIcon,
  CalendarIcon,
  CircleAlertIcon,
  ConstructionIcon,
  ContactIcon,
  CreditCardIcon,
  FileTextIcon,
  HouseIcon,
  LockIcon,
  LogInIcon,
  MailCheckIcon,
  MailIcon,
  MessageCircleIcon,
  PackageIcon,
  RepeatIcon,
  ServerOffIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SquareKanbanIcon,
  TabletSmartphoneIcon,
  TrendingUpIcon,
  TruckIcon,
  UserCogIcon,
  UserIcon,
  UserRoundPlusIcon,
  UsersIcon,
  UserXIcon,
  WalletIcon,
  type LucideProps
} from 'lucide-react'

export type SearchData = {
  title: string
  data: {
    icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>

    /**
     * What this destination *is*, independent of where it currently lives.
     *
     * A favourite has to survive the page being moved, so it stores this and never the path.
     * Authored once and then left alone: the whole point is that changing `href` must not change
     * what a pinned route means. Dotted, lower case, and unique across this file.
     */
    key: string
    name: string
    href: string
    shortcut?: string
    openInNewTab?: boolean
    tags?: string[]
  }[]
}

export const searchData: SearchData[] = [
  {
    title: 'Dashboard',
    data: [
      {
        icon: HouseIcon,
        name: 'Home',
        key: 'home',
        href: '/'
      },
      {
        icon: TrendingUpIcon,
        name: 'Sales Dashboard',
        key: 'dashboard.sales',
        href: '/dashboard/sales'
      },
      {
        icon: WalletIcon,
        name: 'Finance Dashboard',
        key: 'dashboard.finance',
        href: '/dashboard/finance'
      },
      {
        icon: PackageIcon,
        name: 'Orders Dashboard',
        key: 'dashboard.orders',
        href: '/dashboard/orders'
      },
      {
        icon: CreditCardIcon,
        name: 'Payments Dashboard',
        key: 'dashboard.payments',
        href: '/dashboard/payments'
      },
      {
        icon: TruckIcon,
        name: 'Logistics Dashboard',
        key: 'dashboard.logistics',
        href: '/dashboard/logistics'
      },
      {
        icon: BanknoteIcon,
        name: 'Group Payroll',
        key: 'payroll',
        href: '/payroll',
        tags: ['payroll', 'salary', 'pay run']
      },
      {
        icon: BanknoteIcon,
        name: 'Payroll Runs',
        key: 'payroll.runs',
        href: '/payroll/runs',
        tags: ['payroll', 'pay run', 'register']
      },
      {
        icon: CreditCardIcon,
        name: 'Payroll Payments',
        key: 'payroll.payments',
        href: '/payroll/payments',
        tags: ['payroll', 'settlement', 'funding', 'bank', 'returned', 'failed']
      },
      {
        icon: ShieldCheckIcon,
        name: 'Payroll Compliance',
        key: 'payroll.compliance',
        href: '/payroll/compliance',
        tags: ['payroll', 'compliance', 'cpf', 'iras', 'filing', 'statutory', 'due']
      },
      {
        icon: FileTextIcon,
        name: 'Payroll Reports',
        key: 'payroll.reports',
        href: '/payroll/reports',
        tags: ['payroll', 'report', 'register', 'export', 'gross to net', 'bank file']
      },
      {
        icon: UserCogIcon,
        name: 'Payroll Settings',
        key: 'payroll.settings',
        href: '/payroll/settings',
        tags: ['payroll', 'pay group', 'schedule', 'statutory', 'cpf', 'banking', 'approvals']
      },
      {
        icon: ShoppingCartIcon,
        name: 'eCommerce Dashboard',
        key: 'dashboard.ecommerce',
        href: '/dashboard/ecommerce'
      }
    ]
  },
  {
    title: 'Apps',
    data: [
      {
        icon: MailIcon,
        name: 'Mail',
        key: 'apps.mail',
        href: '/apps/mail'
      },
      {
        icon: MessageCircleIcon,
        name: 'Chat',
        key: 'apps.chat',
        href: '/apps/chat'
      },
      {
        icon: SquareKanbanIcon,
        name: 'Kanban',
        key: 'apps.kanban',
        href: '/apps/kanban'
      },
      {
        icon: CalendarIcon,
        name: 'Calendar',
        key: 'apps.calendar',
        href: '/apps/calendar'
      },
      {
        icon: ContactIcon,
        name: 'Contact',
        key: 'apps.contact',
        href: '/apps/contact'
      },
      {
        icon: UsersIcon,
        name: 'User List',
        key: 'apps.users.list',
        href: '/apps/users/list'
      },
      {
        icon: UserIcon,
        name: 'User View',
        key: 'apps.users.view.user_001',
        href: '/apps/users/view/user-001'
      },
      {
        icon: ShieldCheckIcon,
        name: 'Roles',
        key: 'apps.roles',
        href: '/apps/roles'
      },
      {
        icon: ShieldCheckIcon,
        name: 'Permissions',
        key: 'apps.permissions',
        href: '/apps/permissions'
      }
    ]
  },
  {
    title: 'Pages',
    data: [
      {
        icon: UserCogIcon,
        name: 'User Settings - General',
        key: 'pages.user_settings',
        href: '/pages/user-settings?setting=general'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Notifications',
        key: 'pages.user_settings.2',
        href: '/pages/user-settings?setting=notifications'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Workspace',
        key: 'pages.user_settings.3',
        href: '/pages/user-settings?setting=workspace'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Integrations',
        key: 'pages.user_settings.4',
        href: '/pages/user-settings?setting=integrations'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Members',
        key: 'pages.user_settings.5',
        href: '/pages/user-settings?setting=members'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Security',
        key: 'pages.user_settings.6',
        href: '/pages/user-settings?setting=security'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Billing & Usage',
        key: 'pages.user_settings.7',
        href: '/pages/user-settings?setting=billing'
      },
      {
        icon: UserIcon,
        name: 'User Profile',
        key: 'pages.user_profile',
        href: '/pages/user-profile'
      },
      {
        icon: UserIcon,
        name: 'User Profile - Teams',
        key: 'pages.user_profile.2',
        href: '/pages/user-profile?view=teams'
      },
      {
        icon: UserIcon,
        name: 'User Profile - Projects',
        key: 'pages.user_profile.3',
        href: '/pages/user-profile?view=projects'
      },
      {
        icon: UserIcon,
        name: 'User Profile - Connections',
        key: 'pages.user_profile.4',
        href: '/pages/user-profile?view=connections'
      },
      {
        icon: LogInIcon,
        name: 'Login',
        key: 'pages.auth.login_v1',
        href: '/pages/auth/login-v1'
      },
      {
        icon: UserRoundPlusIcon,
        name: 'Register',
        key: 'pages.auth.register_v1',
        href: '/pages/auth/register-v1'
      },
      {
        icon: LockIcon,
        name: 'Forgot Password',
        key: 'pages.auth.forgot_password_v1',
        href: '/pages/auth/forgot-password-v1'
      },
      {
        icon: RepeatIcon,
        name: 'Reset Password',
        key: 'pages.auth.reset_password_v1',
        href: '/pages/auth/reset-password-v1'
      },
      {
        icon: MailCheckIcon,
        name: 'Verify Email',
        key: 'pages.auth.verify_email_v1',
        href: '/pages/auth/verify-email-v1'
      },
      {
        icon: TabletSmartphoneIcon,
        name: 'Two Steps',
        key: 'pages.auth.two_steps_v1',
        href: '/pages/auth/two-steps-v1'
      },
      {
        icon: CircleAlertIcon,
        name: 'Error Page - 404',
        key: 'pages.misc.error_page_404',
        href: '/pages/misc/error-page-404'
      },
      {
        icon: UserXIcon,
        name: 'Not Authorized - 401',
        key: 'pages.misc.unauthorized_access_401',
        href: '/pages/misc/unauthorized-access-401'
      },
      {
        icon: BanIcon,
        name: 'Forbidden Access - 403',
        key: 'pages.misc.forbidden_403',
        href: '/pages/misc/forbidden-403'
      },
      {
        icon: ServerOffIcon,
        name: 'Server Error - 500',
        key: 'pages.misc.server_error_500',
        href: '/pages/misc/server-error-500'
      },
      {
        icon: ConstructionIcon,
        name: 'Under Maintenance Page',
        key: 'pages.misc.maintenance_page',
        href: '/pages/misc/maintenance-page'
      }
    ]
  }
]
