import { Card } from '@/components/ui/card'

import ProjectTimelineCard from '@/views/dashboards/charts/chart-project-timeline'
import WeeklyOverviewCard from '@/views/dashboards/charts/chart-weekly-overview'
import ConversionRateCard from '@/views/dashboards/charts/chart-conversion-rate'
import PerformanceCard from '@/views/dashboards/charts/chart-performance'
import UpgradeYourPlanCard from '@/views/dashboards/widgets/widget-upgrade-your-plan'
import UserDatatable, { type Item } from '@/views/datatables/datatable-user'

// Chart data
const conversionRateChartData = [
  { month: 'January', conversion: 240 },
  { month: 'February', conversion: 270 },
  { month: 'March', conversion: 380 },
  { month: 'April', conversion: 230 },
  { month: 'May', conversion: 450 },
  { month: 'June', conversion: 570 },
  { month: 'July', conversion: 310 }
]

// Conversion data
const conversionData = [
  {
    title: 'Impressions',
    stat: '12.2K Visits',
    trend: 'up',
    percentageChange: 20.3
  },
  {
    title: 'Added to cart',
    stat: '32 product in cart',
    trend: 'up',
    percentageChange: 6.3
  },
  {
    title: 'Checkout',
    stat: '15 Product checkout',
    trend: 'down',
    percentageChange: 9.56
  },
  {
    title: 'Purchased',
    stat: '12 orders',
    trend: 'up',
    percentageChange: 2.62
  }
]

// User data for datatable
const userData: Item[] = [
  {
    id: '1',
    avatar: '/images/avatars/avatar-1.webp',
    fallback: 'JA',
    user: 'Jack Alfredo',
    email: 'jack.alfredo@shadcnstudio.com',
    role: 'maintainer',
    plan: 'enterprise',
    billing: 'auto-debit',
    status: 'active'
  },
  {
    id: '2',
    avatar: '/images/avatars/avatar-2.webp',
    fallback: 'SM',
    user: 'Sarah Mitchell',
    email: 'sarah.mitchell@company.com',
    role: 'admin',
    plan: 'enterprise',
    billing: 'auto-debit',
    status: 'active'
  },
  {
    id: '3',
    avatar: '/images/avatars/avatar-3.webp',
    fallback: 'RC',
    user: 'Robert Chen',
    email: 'robert.chen@startup.io',
    role: 'editor',
    plan: 'team',
    billing: 'manual-paypal',
    status: 'pending'
  },
  {
    id: '4',
    avatar: '/images/avatars/avatar-4.webp',
    fallback: 'EW',
    user: 'Emily Wilson',
    email: 'emily.wilson@freelance.com',
    role: 'author',
    plan: 'basic',
    billing: 'manual-cash',
    status: 'inactive'
  },
  {
    id: '5',
    avatar: '/images/avatars/avatar-5.webp',
    fallback: 'DG',
    user: 'David Garcia',
    email: 'david.garcia@agency.net',
    role: 'subscriber',
    plan: 'company',
    billing: 'auto-debit',
    status: 'active'
  },
  {
    id: '6',
    avatar: '/images/avatars/avatar-6.webp',
    fallback: 'LT',
    user: 'Lisa Thompson',
    email: 'lisa.thompson@design.co',
    role: 'editor',
    plan: 'team',
    billing: 'manual-paypal',
    status: 'active'
  },
  {
    id: '7',
    avatar: '/images/avatars/avatar-7.webp',
    fallback: 'MA',
    user: 'Michael Anderson',
    email: 'michael.anderson@tech.com',
    role: 'maintainer',
    plan: 'enterprise',
    billing: 'auto-debit',
    status: 'pending'
  },
  {
    id: '8',
    avatar: '/images/avatars/avatar-8.webp',
    fallback: 'JR',
    user: 'Jessica Rodriguez',
    email: 'jessica.rodriguez@startup.com',
    role: 'author',
    plan: 'basic',
    billing: 'manual-cash',
    status: 'active'
  },
  {
    id: '9',
    avatar: '/images/avatars/avatar-9.webp',
    fallback: 'CB',
    user: 'Christopher Brown',
    email: 'chris.brown@corporate.org',
    role: 'admin',
    plan: 'company',
    billing: 'auto-debit',
    status: 'inactive'
  },
  {
    id: '10',
    avatar: '/images/avatars/avatar-10.webp',
    fallback: 'AD',
    user: 'Amanda Davis',
    email: 'amanda.davis@marketing.io',
    role: 'subscriber',
    plan: 'basic',
    billing: 'manual-paypal',
    status: 'active'
  },
  {
    id: '11',
    avatar: '/images/avatars/avatar-11.webp',
    fallback: 'JJ',
    user: 'James Johnson',
    email: 'james.johnson@development.com',
    role: 'maintainer',
    plan: 'team',
    billing: 'auto-debit',
    status: 'pending'
  },
  {
    id: '12',
    avatar: '/images/avatars/avatar-12.webp',
    fallback: 'MW',
    user: 'Maria Williams',
    email: 'maria.williams@creative.net',
    role: 'editor',
    plan: 'company',
    billing: 'manual-cash',
    status: 'active'
  },
  {
    id: '13',
    avatar: '/images/avatars/avatar-13.webp',
    fallback: 'RT',
    user: 'Ryan Taylor',
    email: 'ryan.taylor@studio.com',
    role: 'author',
    plan: 'enterprise',
    billing: 'auto-debit',
    status: 'inactive'
  },
  {
    id: '14',
    avatar: '/images/avatars/avatar-14.webp',
    fallback: 'NK',
    user: 'Nicole Kim',
    email: 'nicole.kim@digital.agency',
    role: 'subscriber',
    plan: 'team',
    billing: 'manual-paypal',
    status: 'active'
  },
  {
    id: '15',
    avatar: '/images/avatars/avatar-15.webp',
    fallback: 'AL',
    user: 'Andrew Lee',
    email: 'andrew.lee@consulting.biz',
    role: 'admin',
    plan: 'enterprise',
    billing: 'auto-debit',
    status: 'pending'
  },
  {
    id: '16',
    avatar: '/images/avatars/avatar-16.webp',
    fallback: 'SM',
    user: 'Stephanie Martinez',
    email: 'stephanie.martinez@media.com',
    role: 'editor',
    plan: 'basic',
    billing: 'manual-cash',
    status: 'active'
  },
  {
    id: '17',
    avatar: '/images/avatars/avatar-17.webp',
    fallback: 'KW',
    user: 'Kevin White',
    email: 'kevin.white@innovation.co',
    role: 'maintainer',
    plan: 'company',
    billing: 'auto-debit',
    status: 'inactive'
  },
  {
    id: '18',
    avatar: '/images/avatars/avatar-18.webp',
    fallback: 'RH',
    user: 'Rachel Harris',
    email: 'rachel.harris@solutions.org',
    role: 'author',
    plan: 'team',
    billing: 'manual-paypal',
    status: 'active'
  },
  {
    id: '19',
    avatar: '/images/avatars/avatar-19.webp',
    fallback: 'BT',
    user: 'Brian Turner',
    email: 'brian.turner@platform.io',
    role: 'subscriber',
    plan: 'enterprise',
    billing: 'auto-debit',
    status: 'pending'
  },
  {
    id: '20',
    avatar: '/images/avatars/avatar-20.webp',
    fallback: 'CM',
    user: 'Catherine Moore',
    email: 'catherine.moore@ventures.com',
    role: 'admin',
    plan: 'basic',
    billing: 'manual-cash',
    status: 'active'
  },
  {
    id: '21',
    avatar: '/images/avatars/avatar-1.webp',
    fallback: 'TN',
    user: 'Thomas Nelson',
    email: 'thomas.nelson@design.studio',
    role: 'editor',
    plan: 'enterprise',
    billing: 'auto-debit',
    status: 'active'
  },
  {
    id: '22',
    avatar: '/images/avatars/avatar-2.webp',
    fallback: 'SP',
    user: 'Sophie Parker',
    email: 'sophie.parker@freelance.pro',
    role: 'author',
    plan: 'team',
    billing: 'manual-paypal',
    status: 'inactive'
  },
  {
    id: '23',
    avatar: '/images/avatars/avatar-3.webp',
    fallback: 'AR',
    user: 'Alexander Reed',
    email: 'alex.reed@innovation.labs',
    role: 'maintainer',
    plan: 'company',
    billing: 'manual-cash',
    status: 'pending'
  },
  {
    id: '24',
    avatar: '/images/avatars/avatar-4.webp',
    fallback: 'MG',
    user: 'Maya Gonzalez',
    email: 'maya.gonzalez@creative.agency',
    role: 'subscriber',
    plan: 'basic',
    billing: 'auto-debit',
    status: 'active'
  },
  {
    id: '25',
    avatar: '/images/avatars/avatar-5.webp',
    fallback: 'JS',
    user: 'Jordan Smith',
    email: 'jordan.smith@tech.solutions',
    role: 'admin',
    plan: 'enterprise',
    billing: 'manual-paypal',
    status: 'pending'
  }
]

const ProductivityDashboard = () => {
  return (
    <div className='grid grid-cols-6 gap-6'>
      {/* Project Timeline */}
      <ProjectTimelineCard className='col-span-full 2xl:col-span-4' />

      {/* Weekly Overview */}
      <WeeklyOverviewCard className='col-span-full lg:col-span-3 2xl:col-span-2' />

      {/* Conversion Rate */}
      <ConversionRateCard
        title='Conversion rate'
        subTitle='Compared to last month'
        totalConversion={92.8}
        conversionTrend='up'
        percentageChange={6.3}
        conversionData={conversionData}
        chartData={conversionRateChartData}
        className='col-span-full lg:col-span-3 2xl:col-span-2'
      />

      {/* Upgrade your plan */}
      <UpgradeYourPlanCard className='col-span-full lg:col-span-3 2xl:col-span-2' />

      {/* Performance */}
      <PerformanceCard className='col-span-full lg:col-span-3 2xl:col-span-2' />

      {/* User Datatable */}
      <Card className='col-span-full py-0 shadow-none'>
        <UserDatatable data={userData} />
      </Card>
    </div>
  )
}

export default ProductivityDashboard
