import {
  DollarSignIcon,
  MailIcon,
  TicketCheckIcon,
  ShoppingCartIcon,
  BookMarkedIcon,
  MailOpenIcon,
  MousePointerClickIcon,
  BellRingIcon,
  TriangleAlertIcon,
  CircleOffIcon
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import MonthlyCampaignCard from '@/views/dashboards/widgets/widget-monthly-campaign'
import StatisticsCard, { type StatisticsCardProps } from '@/views/dashboards/statistics/statistics-card-03'
import StatisticsCardWithSvg from '@/views/dashboards/statistics/statistics-card-04'
import TotalEarningCard from '@/views/dashboards/charts/chart-total-earning'
import TotalIncomeCard from '@/views/dashboards/charts/chart-total-income'
import ForBusinessSharkCard from '@/views/dashboards/widgets/widget-for-business-shark'
import VehiclesConditionCard from '@/views/dashboards/widgets/widget-vehicles-condition'
import UserDatatable, { type Item } from '@/views/datatables/datatable-user'

import CustomersCardSvg from '@/assets/svg/customers-card-svg'

// Statistics card data
const StatisticsCardData: StatisticsCardProps[] = [
  {
    icon: <TicketCheckIcon />,
    title: 'Total Sales',
    value: '$13.4k',
    trend: 'up',
    changePercentage: '+38%',
    badgeContent: 'Last 6 months',
    iconClassName: 'bg-chart-1/10 text-chart-1'
  },
  {
    icon: <ShoppingCartIcon />,
    title: 'Total Orders',
    value: '155K',
    trend: 'up',
    changePercentage: '+22%',
    badgeContent: 'Last 4 months',
    iconClassName: 'bg-chart-2/10 text-chart-2'
  },
  {
    icon: <DollarSignIcon />,
    title: 'Total Profit',
    value: '$89.34k',
    trend: 'down',
    changePercentage: '-16%',
    badgeContent: 'Last One year',
    iconClassName: 'bg-chart-3/10 text-chart-3'
  },
  {
    icon: <BookMarkedIcon />,
    title: 'Bookmarks',
    value: '$1,200',
    trend: 'up',
    changePercentage: '+38%',
    badgeContent: 'Last 6 months',
    iconClassName: 'bg-chart-4/10 text-chart-4'
  }
]

// Campaigns data
const campaignData = [
  {
    icon: <MailIcon />,
    title: 'Emails',
    value: '14,250',
    percentage: '0.3%',
    avatarClassName: 'bg-chart-1/10 text-chart-1'
  },
  {
    icon: <MailOpenIcon />,
    title: 'Opened',
    value: '4,523',
    percentage: '3.1%',
    avatarClassName: 'bg-chart-2/10 text-chart-2'
  },
  {
    icon: <MousePointerClickIcon />,
    title: 'Clicked',
    value: '1,250',
    percentage: '1.3%',
    avatarClassName: 'bg-chart-4/10 text-chart-4'
  },
  {
    icon: <BellRingIcon />,
    title: 'Subscribed',
    value: '750',
    percentage: '9.8%',
    avatarClassName: 'bg-chart-3/10 text-chart-3'
  },
  {
    icon: <TriangleAlertIcon />,
    title: 'Errors',
    value: '20',
    percentage: '1.5%',
    avatarClassName: 'bg-chart-5/10 text-chart-5'
  },
  {
    icon: <CircleOffIcon />,
    title: 'Unsubscribed',
    value: '86',
    percentage: '0.6%'
  }
]

// Vehicle condition data
const vehicleConditionData = [
  {
    condition: 'Excellent',
    details: '12% increase',
    progressValue: 55,
    changePercentage: '+25%',
    progressClassName: 'stroke-chart-1'
  },
  {
    condition: 'Good',
    details: '24 vehicles',
    progressValue: 20,
    changePercentage: '+30%',
    progressClassName: 'stroke-chart-2'
  },
  {
    condition: 'Average',
    details: '182 Tasks',
    progressValue: 12,
    changePercentage: '-15%',
    progressClassName: 'stroke-chart-3'
  },
  {
    condition: 'Bad',
    details: '9 vehicles',
    progressValue: 7,
    changePercentage: '+35%',
    progressClassName: 'stroke-chart-4'
  },
  {
    condition: 'Not Working',
    details: '3 vehicles',
    progressValue: 4,
    changePercentage: '-2%',
    progressClassName: 'stroke-chart-5'
  },
  {
    condition: 'Scraped',
    details: '2 vehicles',
    progressValue: 2,
    changePercentage: '+1%'
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

const CampaignDashboard = () => {
  return (
    <div className='grid grid-cols-2 gap-6 xl:grid-cols-3'>
      <div className='col-span-2 grid grid-cols-2 gap-6 xl:grid-cols-4'>
        {StatisticsCardData.map((card, index) => (
          <StatisticsCard
            key={index}
            icon={card.icon}
            title={card.title}
            value={card.value}
            trend={card.trend}
            changePercentage={card.changePercentage}
            badgeContent={card.badgeContent}
            iconClassName={card.iconClassName}
          />
        ))}
      </div>

      <StatisticsCardWithSvg
        title='Customers'
        badgeContent='Daily customers'
        value='42.4k'
        changePercentage={9.2}
        svg={<CustomersCardSvg />}
        className='max-xl:col-span-full'
      />

      <TotalIncomeCard className='col-span-2' />

      <MonthlyCampaignCard
        title='Monthly campaign state'
        subTitle='7.58k Social Visitors'
        campaignData={campaignData}
        className='justify-between max-sm:col-span-full md:max-lg:col-span-full'
      />

      <TotalEarningCard className='justify-between *:data-[slot=card-content]:space-y-6 max-sm:col-span-full md:max-lg:col-span-full' />

      <ForBusinessSharkCard className='max-sm:col-span-full md:max-lg:col-span-full' />

      <VehiclesConditionCard
        title='Vehicles Condition'
        vehicleConditionData={vehicleConditionData}
        className='justify-between gap-6 max-sm:col-span-full md:max-lg:col-span-full'
      />

      <Card className='col-span-full py-0'>
        <UserDatatable data={userData} />
      </Card>
    </div>
  )
}

export default CampaignDashboard
