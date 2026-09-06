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
        href: '/'
      },
      {
        icon: TrendingUpIcon,
        name: 'Sales Dashboard',
        href: '/dashboard/sales'
      },
      {
        icon: WalletIcon,
        name: 'Finance Dashboard',
        href: '/dashboard/finance'
      },
      {
        icon: PackageIcon,
        name: 'Orders Dashboard',
        href: '/dashboard/orders'
      },
      {
        icon: CreditCardIcon,
        name: 'Payments Dashboard',
        href: '/dashboard/payments'
      },
      {
        icon: TruckIcon,
        name: 'Logistics Dashboard',
        href: '/dashboard/logistics'
      },
      {
        icon: BanknoteIcon,
        name: 'Payroll Overview',
        href: '/payroll',
        tags: ['payroll', 'salary', 'pay run']
      },
      {
        icon: BanknoteIcon,
        name: 'Payroll Runs',
        href: '/payroll/runs',
        tags: ['payroll', 'pay run', 'register']
      },
      {
        icon: BanknoteIcon,
        name: 'Current Payroll Run',
        href: '/payroll/runs/run-2026-09',
        tags: ['payroll', 'approve', 'exceptions', 'workspace']
      },
      {
        icon: CreditCardIcon,
        name: 'Payroll Payments',
        href: '/payroll/payments',
        tags: ['payroll', 'settlement', 'funding', 'bank', 'returned', 'failed']
      },
      {
        icon: ShieldCheckIcon,
        name: 'Payroll Compliance',
        href: '/payroll/compliance',
        tags: ['payroll', 'compliance', 'cpf', 'iras', 'filing', 'statutory', 'due']
      },
      {
        icon: FileTextIcon,
        name: 'Payroll Reports',
        href: '/payroll/reports',
        tags: ['payroll', 'report', 'register', 'export', 'gross to net', 'bank file']
      },
      {
        icon: UserCogIcon,
        name: 'Payroll Settings',
        href: '/payroll/settings',
        tags: ['payroll', 'pay group', 'schedule', 'statutory', 'cpf', 'banking', 'approvals']
      },
      {
        icon: ShoppingCartIcon,
        name: 'eCommerce Dashboard',
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
        href: '/apps/mail'
      },
      {
        icon: MessageCircleIcon,
        name: 'Chat',
        href: '/apps/chat'
      },
      {
        icon: SquareKanbanIcon,
        name: 'Kanban',
        href: '/apps/kanban'
      },
      {
        icon: CalendarIcon,
        name: 'Calendar',
        href: '/apps/calendar'
      },
      {
        icon: ContactIcon,
        name: 'Contact',
        href: '/apps/contact'
      },
      {
        icon: UsersIcon,
        name: 'User List',
        href: '/apps/users/list'
      },
      {
        icon: UserIcon,
        name: 'User View',
        href: '/apps/users/view/user-001'
      },
      {
        icon: ShieldCheckIcon,
        name: 'Roles',
        href: '/apps/roles'
      },
      {
        icon: ShieldCheckIcon,
        name: 'Permissions',
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
        href: '/pages/user-settings?setting=general'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Notifications',
        href: '/pages/user-settings?setting=notifications'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Workspace',
        href: '/pages/user-settings?setting=workspace'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Integrations',
        href: '/pages/user-settings?setting=integrations'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Members',
        href: '/pages/user-settings?setting=members'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Security',
        href: '/pages/user-settings?setting=security'
      },
      {
        icon: UserCogIcon,
        name: 'User Settings - Billing & Usage',
        href: '/pages/user-settings?setting=billing'
      },
      {
        icon: UserIcon,
        name: 'User Profile',
        href: '/pages/user-profile'
      },
      {
        icon: UserIcon,
        name: 'User Profile - Teams',
        href: '/pages/user-profile?view=teams'
      },
      {
        icon: UserIcon,
        name: 'User Profile - Projects',
        href: '/pages/user-profile?view=projects'
      },
      {
        icon: UserIcon,
        name: 'User Profile - Connections',
        href: '/pages/user-profile?view=connections'
      },
      {
        icon: LogInIcon,
        name: 'Login',
        href: '/pages/auth/login-v1'
      },
      {
        icon: UserRoundPlusIcon,
        name: 'Register',
        href: '/pages/auth/register-v1'
      },
      {
        icon: LockIcon,
        name: 'Forgot Password',
        href: '/pages/auth/forgot-password-v1'
      },
      {
        icon: RepeatIcon,
        name: 'Reset Password',
        href: '/pages/auth/reset-password-v1'
      },
      {
        icon: MailCheckIcon,
        name: 'Verify Email',
        href: '/pages/auth/verify-email-v1'
      },
      {
        icon: TabletSmartphoneIcon,
        name: 'Two Steps',
        href: '/pages/auth/two-steps-v1'
      },
      {
        icon: CircleAlertIcon,
        name: 'Error Page - 404',
        href: '/pages/misc/error-page-404'
      },
      {
        icon: UserXIcon,
        name: 'Not Authorized - 401',
        href: '/pages/misc/unauthorized-access-401'
      },
      {
        icon: BanIcon,
        name: 'Forbidden Access - 403',
        href: '/pages/misc/forbidden-403'
      },
      {
        icon: ServerOffIcon,
        name: 'Server Error - 500',
        href: '/pages/misc/server-error-500'
      },
      {
        icon: ConstructionIcon,
        name: 'Under Maintenance Page',
        href: '/pages/misc/maintenance-page'
      }
    ]
  }
]
