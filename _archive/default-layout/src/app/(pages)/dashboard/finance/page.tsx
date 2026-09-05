import {
  ShoppingCartIcon,
  DollarSignIcon,
  SmartphoneIcon,
  LaptopIcon,
  HeadphonesIcon,
  LaptopMinimalIcon,
  WatchIcon,
  TabletIcon,
  Gamepad2Icon,
  MonitorIcon
} from 'lucide-react'

import { Card } from '@/components/ui/card'

import FinanceCard from '@/views/dashboards/charts/chart-finance'
import StatisticsCard, { type StatisticsCardProps } from '@/views/dashboards/statistics/statistics-card-03'
import StatisticsImpressionCard from '@/views/dashboards/statistics/statistics-impression-card'
import StatisticsTotalRevenueCard from '@/views/dashboards/statistics/statistics-total-revenue-card'
import TotalVisitorsCard from '@/views/dashboards/charts/chart-total-visitors'
import TopProductsCard from '@/views/dashboards/widgets/widget-top-products'
import UserDatatable, { type Item } from '@/views/datatables/datatable-user'

// Statistics card data
const StatisticsCardData: StatisticsCardProps[] = [
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
  }
]

// Visitor data
const visitorData = [
  {
    product: 'Desktop',
    percentage: 17,
    amount: 23.8,
    trend: 'up',
    heightClass: 'h-[17%]',
    color: 'bg-chart-1'
  },
  {
    product: 'Tablet',
    percentage: 65,
    amount: 13.604,
    trend: 'down',
    heightClass: 'h-[65%]',
    color: 'bg-chart-1/20'
  },
  {
    product: 'Mobile',
    percentage: 18,
    amount: 47.146,
    trend: 'up',
    heightClass: 'h-[18%]',
    color: 'bg-chart-1/50'
  }
]

// Product by sales data
const productsBySalesData = [
  {
    icon: <SmartphoneIcon />,
    productName: 'Samsung galaxy S25',
    productBrand: 'Samsung',
    sales: '$32,203',
    iconClassName: 'bg-chart-1/10 text-chart-1'
  },
  {
    icon: <LaptopIcon />,
    productName: 'Apple MacBook Pro',
    productBrand: 'Apple',
    sales: '$1,299',
    iconClassName: 'bg-chart-2/10 text-chart-2'
  },
  {
    icon: <HeadphonesIcon />,
    productName: 'Sony WH-1000XM4',
    productBrand: 'Sony',
    sales: '$348',
    iconClassName: 'bg-chart-5/10 text-chart-5'
  },
  {
    icon: <LaptopMinimalIcon />,
    productName: 'Dell XPS 13',
    productBrand: 'Dell',
    sales: '$999'
  },
  {
    icon: <WatchIcon />,
    productName: 'Smart band 4',
    productBrand: 'Xiaomi',
    sales: '$749',
    iconClassName: 'bg-chart-3/10 text-chart-3'
  }
]

// Products by volume data
const productsByVolumeData = [
  {
    icon: <LaptopIcon />,
    productName: 'Dell XPS 13',
    productBrand: 'Dell',
    volume: '200k',
    changePercentage: 5,
    iconClassName: 'bg-chart-1/10 text-chart-1'
  },
  {
    icon: <TabletIcon />,
    productName: 'Apple iPad',
    productBrand: 'Apple',
    volume: '80K',
    changePercentage: 10,
    iconClassName: 'bg-chart-2/10 text-chart-2'
  },
  {
    icon: <Gamepad2Icon />,
    productName: 'Sony PlayStation 5',
    productBrand: 'Sony',
    volume: '30k',
    changePercentage: -20,
    iconClassName: 'bg-chart-5/10 text-chart-5'
  },
  {
    icon: <MonitorIcon />,
    productName: 'IMac pro',
    productBrand: 'Apple',
    volume: '15k',
    changePercentage: 12
  },
  {
    icon: <SmartphoneIcon />,
    productName: 'Samsung galaxy S25',
    productBrand: 'Samsung',
    volume: '12.4k',
    changePercentage: -15,
    iconClassName: 'bg-chart-3/10 text-chart-3'
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

const FinanceDashboard = () => {
  return (
    <div className='grid grid-cols-6 gap-6'>
      <FinanceCard className='col-span-full xl:col-span-4' />

      <div className='col-span-full grid grid-cols-2 gap-6 lg:col-span-3 xl:col-span-2'>
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

        <StatisticsTotalRevenueCard />

        <StatisticsImpressionCard />
      </div>

      <TotalVisitorsCard
        title='Total visitors'
        totalVisitors='23.02K'
        percentage={-6}
        visitorData={visitorData}
        className='col-span-full lg:col-span-3 xl:col-span-2'
      />

      <TopProductsCard
        salesTitle='Top Products by Sales'
        volumeTitle='Top Products by Volume'
        productsBySalesData={productsBySalesData}
        productsByVolumeData={productsByVolumeData}
        className='col-span-full xl:col-span-4'
      />

      <Card className='col-span-full py-0 shadow-none'>
        <UserDatatable data={userData} />
      </Card>
    </div>
  )
}

export default FinanceDashboard
