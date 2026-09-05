// React Imports
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

// Third-party Imports
import {
  BadgeCheckIcon,
  BanIcon,
  BarChart3Icon,
  BriefcaseIcon,
  CalendarIcon,
  ChartNoAxesColumnIncreasingIcon,
  CircleAlertIcon,
  CircleQuestionMarkIcon,
  Columns2Icon,
  ConstructionIcon,
  ContactIcon,
  CreditCardIcon,
  DollarSignIcon,
  FileIcon,
  FootprintsIcon,
  HouseIcon,
  LayoutGridIcon,
  LineChartIcon,
  ListOrderedIcon,
  LockIcon,
  LogInIcon,
  MailCheckIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  PackageIcon,
  PanelTopIcon,
  PinIcon,
  PuzzleIcon,
  RepeatIcon,
  RocketIcon,
  Rows3Icon,
  ServerOffIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SquareKanbanIcon,
  TableIcon,
  TabletSmartphoneIcon,
  TrendingUpIcon,
  TruckIcon,
  UserIcon,
  UsersIcon,
  UserRoundPlusIcon,
  UserXIcon,
  WalletIcon,
  WandSparklesIcon,
  UserCogIcon,
  MailIcon,
  InfoIcon,
  BookOpenTextIcon,
  LayoutTemplateIcon,
  SquareSplitHorizontalIcon,
  PanelLeftDashedIcon,
  PanelsTopLeftIcon,
  LayoutPanelLeftIcon,
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
        icon: TruckIcon,
        name: 'Logistics Dashboard',
        href: '/dashboard/logistics'
      },
      {
        icon: BriefcaseIcon,
        name: 'Productivity Dashboard',
        href: '/dashboard/productivity'
      },
      {
        icon: MegaphoneIcon,
        name: 'Campaign Dashboard',
        href: '/dashboard/campaign'
      },
      {
        icon: BarChart3Icon,
        name: 'Analytics Dashboard',
        href: '/dashboard/analytics'
      },
      {
        icon: CreditCardIcon,
        name: 'Payments Dashboard',
        href: '/dashboard/payments'
      },
      {
        icon: ShoppingCartIcon,
        name: 'eCommerce Dashboard',
        href: '/dashboard/ecommerce'
      },
      {
        icon: PackageIcon,
        name: 'Orders Dashboard',
        href: '/dashboard/orders'
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
    title: 'Layouts',
    data: [
      {
        icon: PanelsTopLeftIcon,
        name: 'Full Navbar Layout',
        href: 'https://shadcn-nextjs-admincn-full-navbar-layout-admin-template.vercel.app/',
        openInNewTab: true
      },
      {
        icon: LayoutTemplateIcon,
        name: 'Horizontal Layout',
        href: 'https://shadcn-nextjs-admincn-horizontal-layout-admin-template.vercel.app/',
        openInNewTab: true
      },
      {
        icon: SquareSplitHorizontalIcon,
        name: 'Split Layout',
        href: 'https://shadcn-nextjs-admincn-split-layout-admin-template.vercel.app/',
        openInNewTab: true
      },
      {
        icon: LayoutPanelLeftIcon,
        name: 'Icon Menu Layout',
        href: 'https://shadcn-nextjs-admincn-icon-menu-layout-admin-template.vercel.app/',
        openInNewTab: true
      },
      {
        icon: PanelLeftDashedIcon,
        name: 'Paper Layout',
        href: 'https://shadcn-nextjs-admincn-paper-layout-admin-template.vercel.app/',
        openInNewTab: true
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
        icon: RocketIcon,
        name: 'Landing Page',
        href: 'https://shadcn-nextjs-flow-landing-page.vercel.app/',
        openInNewTab: true
      },
      {
        icon: CircleQuestionMarkIcon,
        name: 'FAQ',
        href: '/pages/faq'
      },
      {
        icon: DollarSignIcon,
        name: 'Pricing',
        href: '/pages/pricing'
      },
      {
        icon: FootprintsIcon,
        name: 'Onboarding v1',
        href: '/pages/onboarding-v1'
      },
      {
        icon: FootprintsIcon,
        name: 'Onboarding v2',
        href: '/pages/onboarding-v2'
      },
      {
        icon: FileIcon,
        name: 'Empty State v1',
        href: '/pages/empty-state-v1'
      },
      {
        icon: FileIcon,
        name: 'Empty State v2',
        href: '/pages/empty-state-v2'
      },
      {
        icon: LogInIcon,
        name: 'Login v1',
        href: '/pages/auth/login-v1'
      },
      {
        icon: LogInIcon,
        name: 'Login v2',
        href: '/pages/auth/login-v2'
      },
      {
        icon: LogInIcon,
        name: 'Login v3',
        href: '/pages/auth/login-v3'
      },
      {
        icon: UserRoundPlusIcon,
        name: 'Register v1',
        href: '/pages/auth/register-v1'
      },
      {
        icon: UserRoundPlusIcon,
        name: 'Register v2',
        href: '/pages/auth/register-v2'
      },
      {
        icon: UserRoundPlusIcon,
        name: 'Register v3',
        href: '/pages/auth/register-v3'
      },
      {
        icon: LockIcon,
        name: 'Forgot Password v1',
        href: '/pages/auth/forgot-password-v1'
      },
      {
        icon: LockIcon,
        name: 'Forgot Password v2',
        href: '/pages/auth/forgot-password-v2'
      },
      {
        icon: LockIcon,
        name: 'Forgot Password v3',
        href: '/pages/auth/forgot-password-v3'
      },
      {
        icon: MailCheckIcon,
        name: 'Verify Email v1',
        href: '/pages/auth/verify-email-v1'
      },
      {
        icon: MailCheckIcon,
        name: 'Verify Email v2',
        href: '/pages/auth/verify-email-v2'
      },
      {
        icon: MailCheckIcon,
        name: 'Verify Email v3',
        href: '/pages/auth/verify-email-v3'
      },
      {
        icon: RepeatIcon,
        name: 'Reset Password v1',
        href: '/pages/auth/reset-password-v1'
      },
      {
        icon: RepeatIcon,
        name: 'Reset Password v2',
        href: '/pages/auth/reset-password-v2'
      },
      {
        icon: RepeatIcon,
        name: 'Reset Password v3',
        href: '/pages/auth/reset-password-v3'
      },
      {
        icon: TabletSmartphoneIcon,
        name: 'Two Steps v1',
        href: '/pages/auth/two-steps-v1'
      },
      {
        icon: TabletSmartphoneIcon,
        name: 'Two Steps v2',
        href: '/pages/auth/two-steps-v2'
      },
      {
        icon: TabletSmartphoneIcon,
        name: 'Two Steps v3',
        href: '/pages/auth/two-steps-v3'
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
  },
  {
    title: 'Forms & Tables',
    data: [
      {
        icon: Columns2Icon,
        name: 'Vertical Form Layout',
        href: '/forms/form-layouts/vertical'
      },
      {
        icon: Rows3Icon,
        name: 'Horizontal Form Layout',
        href: '/forms/form-layouts/horizontal'
      },
      {
        icon: PinIcon,
        name: 'Sticky Actions Form',
        href: '/forms/form-layouts/sticky-actions'
      },
      {
        icon: BadgeCheckIcon,
        name: 'Form Validation',
        href: '/forms/form-validation'
      },
      {
        icon: WandSparklesIcon,
        name: 'Form Wizard - Icons',
        href: '/forms/form-wizard/icons'
      },
      {
        icon: ListOrderedIcon,
        name: 'Form Wizard - Numbered',
        href: '/forms/form-wizard/numbered'
      },
      {
        icon: TableIcon,
        name: 'Data Table',
        href: '/datatable'
      }
    ]
  },
  {
    title: 'Components & Charts',
    data: [
      {
        icon: LayoutGridIcon,
        name: 'Components',
        href: 'https://shadcnstudio.com/components',
        openInNewTab: true
      },
      {
        icon: LineChartIcon,
        name: 'Charts',
        href: 'https://shadcnstudio.com/blocks/dashboard-and-application/charts-component',
        openInNewTab: true
      },
      {
        icon: ChartNoAxesColumnIncreasingIcon,
        name: 'Statistics',
        href: 'https://shadcnstudio.com/blocks/dashboard-and-application/statistics-component',
        openInNewTab: true
      },
      {
        icon: PanelTopIcon,
        name: 'Card Nav',
        href: 'https://shadcnstudio.com/blocks/dashboard-and-application/card-nav',
        openInNewTab: true
      },
      {
        icon: PuzzleIcon,
        name: 'Widgets',
        href: 'https://shadcnstudio.com/blocks/dashboard-and-application/widgets-component',
        openInNewTab: true
      }
    ]
  },
  {
    title: 'Miscellaneous',
    data: [
      {
        icon: InfoIcon,
        name: 'Support',
        href: 'https://shadcnstudio.com/support',
        openInNewTab: true
      },
      {
        icon: BookOpenTextIcon,
        name: 'Documentation',
        href: 'https://shadcnstudio.com/docs/documentation-admin/getting-started',
        openInNewTab: true
      }
    ]
  }
]
