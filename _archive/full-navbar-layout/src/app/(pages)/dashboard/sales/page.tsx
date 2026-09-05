import { CircleDollarSignIcon, CreditCardIcon, ChartPieIcon, DollarSignIcon, WalletIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'

import StatisticsOrderCard from '@/views/dashboards/statistics/statistics-order-card'
import StatisticsProfitCard from '@/views/dashboards/statistics/statistics-profit-card'
import StatisticsUserReachCard from '@/views/dashboards/statistics/statistics-user-reach-card'
import StatisticsTotalProfitCard from '@/views/dashboards/statistics/statistics-total-profit-card'
import StatisticsCard from '@/views/dashboards/statistics/statistics-card-05'
import TotalTransactionCard from '@/views/dashboards/charts/chart-total-transaction'
import TotalSalesCard from '@/views/dashboards/charts/chart-total-sales'
import UpgradeYourPlanCard from '@/views/dashboards/widgets/widget-upgrade-your-plan'
import AdvertisementCard from '@/views/dashboards/widgets/widget-advertisement'
import EarningReportCard from '@/views/dashboards/charts/chart-earning-report'
import InvoiceDatatable, { type Item } from '@/views/datatables/datatable-invoice'

// Statistics card data
const StatisticsCardData = [
  {
    icon: <CircleDollarSignIcon />,
    title: 'Total Income',
    badgeContent: 'Last week',
    value: '$4,673',
    changePercentage: 25.2,
    iconClassName: 'bg-chart-2/10 text-chart-2'
  },
  {
    icon: <CreditCardIcon />,
    title: 'Total Expense',
    badgeContent: 'Last month',
    value: '$1.28K',
    changePercentage: -12.2,
    iconClassName: 'bg-chart-1/10 text-chart-1'
  }
]

// Statistical data
const statData = [
  {
    icon: <ChartPieIcon />,
    title: 'Net profit',
    department: 'Sales',
    value: '$1,623',
    trend: 'up',
    percentage: 20.3,
    iconClassName: 'bg-chart-1/10 text-chart-1'
  },
  {
    icon: <DollarSignIcon />,
    title: 'Total income',
    department: 'Sales, Affiliation',
    value: '$5,600',
    trend: 'up',
    percentage: 16.2,
    iconClassName: 'bg-chart-2/10 text-chart-2'
  },
  {
    icon: <WalletIcon />,
    title: 'Total expense',
    department: 'ADVT, Marketing',
    value: '$3,200',
    trend: 'up',
    percentage: 10.5,
    iconClassName: 'bg-chart-5/10 text-chart-5'
  }
]

// Chart data
const earningReportChartData = [
  { day: 'Monday', earning: 48, fill: 'color-mix(in oklab, var(--chart-2) 20%, transparent)' },
  { day: 'Tuesday', earning: 147, fill: 'color-mix(in oklab, var(--chart-2) 20%, transparent)' },
  { day: 'Wednesday', earning: 106, fill: 'color-mix(in oklab, var(--chart-2) 20%, transparent)' },
  { day: 'Thursday', earning: 180, fill: 'var(--chart-2)' },
  { day: 'Friday', earning: 75, fill: 'color-mix(in oklab, var(--chart-2) 20%, transparent)' },
  { day: 'Saturday', earning: 60, fill: 'color-mix(in oklab, var(--chart-2) 20%, transparent)' },
  { day: 'Sunday', earning: 128, fill: 'color-mix(in oklab, var(--chart-2) 20%, transparent)' }
]

// Invoice data
const invoiceData: Item[] = [
  {
    id: '5099',
    status: 'draft',
    avatar: '/images/avatars/avatar-1.webp',
    fallback: 'JA',
    client: 'Jack Alfredo',
    field: 'UI/UX designer',
    total: 3120,
    issuedDate: new Date('2025-04-03'),
    balance: 0
  },
  {
    id: '5008',
    status: 'paid',
    avatar: '/images/avatars/avatar-2.webp',
    fallback: 'MG',
    client: 'Maria Gonzalez',
    field: 'Frontend developer',
    total: 1450,
    issuedDate: new Date('2025-05-12'),
    balance: 0
  },
  {
    id: '5101',
    status: 'paid',
    avatar: '/images/avatars/avatar-3.webp',
    fallback: 'JD',
    client: 'John Doe',
    field: 'Graphic designer',
    total: 1200,
    issuedDate: new Date('2025-06-26'),
    balance: 0
  },
  {
    id: '4586',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-4.webp',
    fallback: 'EC',
    client: 'Emily Carter',
    field: 'UI/UX designer',
    total: 2680,
    issuedDate: new Date('2025-07-05'),
    balance: -78
  },
  {
    id: '4360',
    status: 'draft',
    avatar: '/images/avatars/avatar-5.webp',
    fallback: 'DL',
    client: 'David Lee',
    field: 'Backend developer',
    total: 3120,
    issuedDate: new Date('2025-08-07'),
    balance: 0
  },
  {
    id: '5104',
    status: 'past due',
    avatar: '/images/avatars/avatar-6.webp',
    fallback: 'SP',
    client: 'Sophia Patel',
    field: 'Product manager',
    total: 1600,
    issuedDate: new Date('2025-08-26'),
    balance: 86
  },
  {
    id: '5201',
    status: 'paid',
    avatar: '/images/avatars/avatar-7.webp',
    fallback: 'MW',
    client: 'Michael Williams',
    field: 'Full Stack Developer',
    total: 2850,
    issuedDate: new Date('2025-01-15'),
    balance: 0
  },
  {
    id: '4987',
    status: 'draft',
    avatar: '/images/avatars/avatar-8.webp',
    fallback: 'AB',
    client: 'Amanda Brown',
    field: 'Marketing Specialist',
    total: 1750,
    issuedDate: new Date('2025-02-20'),
    balance: 0
  },
  {
    id: '5342',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-9.webp',
    fallback: 'RJ',
    client: 'Robert Johnson',
    field: 'DevOps Engineer',
    total: 3500,
    issuedDate: new Date('2025-03-10'),
    balance: -120
  },
  {
    id: '4723',
    status: 'past due',
    avatar: '/images/avatars/avatar-10.webp',
    fallback: 'LM',
    client: 'Lisa Miller',
    field: 'Data Analyst',
    total: 2200,
    issuedDate: new Date('2025-04-18'),
    balance: 250
  },
  {
    id: '5445',
    status: 'paid',
    avatar: '/images/avatars/avatar-11.webp',
    fallback: 'TD',
    client: 'Thomas Davis',
    field: 'Mobile Developer',
    total: 4200,
    issuedDate: new Date('2025-05-22'),
    balance: 0
  },
  {
    id: '4892',
    status: 'draft',
    avatar: '/images/avatars/avatar-12.webp',
    fallback: 'JW',
    client: 'Jennifer Wilson',
    field: 'UX Researcher',
    total: 1950,
    issuedDate: new Date('2025-06-14'),
    balance: 0
  },
  {
    id: '5667',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-13.webp',
    fallback: 'CM',
    client: 'Christopher Moore',
    field: 'System Administrator',
    total: 2750,
    issuedDate: new Date('2025-07-08'),
    balance: -95
  },
  {
    id: '4534',
    status: 'past due',
    avatar: '/images/avatars/avatar-14.webp',
    fallback: 'ST',
    client: 'Sarah Taylor',
    field: 'Content Writer',
    total: 1380,
    issuedDate: new Date('2025-01-28'),
    balance: 180
  },
  {
    id: '5789',
    status: 'paid',
    avatar: '/images/avatars/avatar-15.webp',
    fallback: 'MA',
    client: 'Matthew Anderson',
    field: 'Cloud Architect',
    total: 5600,
    issuedDate: new Date('2025-02-12'),
    balance: 0
  },
  {
    id: '4398',
    status: 'draft',
    avatar: '/images/avatars/avatar-16.webp',
    fallback: 'KT',
    client: 'Karen Thompson',
    field: 'Business Analyst',
    total: 2100,
    issuedDate: new Date('2025-03-25'),
    balance: 0
  },
  {
    id: '5923',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-17.webp',
    fallback: 'JG',
    client: 'James Garcia',
    field: 'Security Engineer',
    total: 3800,
    issuedDate: new Date('2025-04-30'),
    balance: -200
  },
  {
    id: '4672',
    status: 'past due',
    avatar: '/images/avatars/avatar-18.webp',
    fallback: 'NH',
    client: 'Nancy Harris',
    field: 'QA Engineer',
    total: 1850,
    issuedDate: new Date('2025-05-16'),
    balance: 320
  },
  {
    id: '5234',
    status: 'paid',
    avatar: '/images/avatars/avatar-19.webp',
    fallback: 'DM',
    client: 'Daniel Martinez',
    field: 'Software Architect',
    total: 4800,
    issuedDate: new Date('2025-06-09'),
    balance: 0
  },
  {
    id: '4756',
    status: 'draft',
    avatar: '/images/avatars/avatar-20.webp',
    fallback: 'ER',
    client: 'Elizabeth Rodriguez',
    field: 'Product Designer',
    total: 2650,
    issuedDate: new Date('2025-07-21'),
    balance: 0
  },
  {
    id: '5456',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-1.webp',
    fallback: 'AL',
    client: 'Andrew Lopez',
    field: 'Technical Lead',
    total: 5200,
    issuedDate: new Date('2025-08-03'),
    balance: -150
  },
  {
    id: '4823',
    status: 'past due',
    avatar: '/images/avatars/avatar-2.webp',
    fallback: 'MH',
    client: 'Michelle Hill',
    field: 'Scrum Master',
    total: 2400,
    issuedDate: new Date('2025-01-11'),
    balance: 400
  },
  {
    id: '5678',
    status: 'paid',
    avatar: '/images/avatars/avatar-3.webp',
    fallback: 'KS',
    client: 'Kevin Scott',
    field: 'Database Administrator',
    total: 3200,
    issuedDate: new Date('2025-02-07'),
    balance: 0
  },
  {
    id: '4945',
    status: 'draft',
    avatar: '/images/avatars/avatar-4.webp',
    fallback: 'RG',
    client: 'Rachel Green',
    field: 'Digital Marketing Manager',
    total: 1820,
    issuedDate: new Date('2025-03-19'),
    balance: 0
  },
  {
    id: '5812',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-5.webp',
    fallback: 'BW',
    client: 'Brian White',
    field: 'AI/ML Engineer',
    total: 6200,
    issuedDate: new Date('2025-04-26'),
    balance: -300
  }
]

const SalesDashboard = () => {
  return (
    <div className='grid grid-cols-6 gap-6'>
      <StatisticsTotalProfitCard className='max-xl:col-span-2 max-md:col-span-3' />
      <StatisticsOrderCard className='max-xl:col-span-2 max-md:col-span-3' />
      <StatisticsProfitCard className='max-xl:col-span-2 max-md:col-span-3' />
      <StatisticsUserReachCard className='max-xl:col-span-2 max-md:col-span-3' />

      {StatisticsCardData.map((card, index) => (
        <StatisticsCard
          key={index}
          icon={card.icon}
          title={card.title}
          time={card.badgeContent}
          value={card.value}
          changePercentage={card.changePercentage}
          className='max-xl:col-span-2 max-md:col-span-3'
          iconClassName={card.iconClassName}
        />
      ))}

      <TotalTransactionCard className='col-span-full lg:col-span-4' />

      <TotalSalesCard className='col-span-full sm:col-span-3 lg:col-span-2' />

      <UpgradeYourPlanCard className='col-span-full sm:col-span-3 lg:col-span-2' />

      <EarningReportCard
        title='Earning Report'
        subTitle='Weekly Earning overview'
        statData={statData}
        chartData={earningReportChartData}
        className='col-span-full sm:col-span-3 lg:col-span-2'
      />

      <AdvertisementCard className='col-span-full sm:col-span-3 lg:col-span-2' />

      <Card className='col-span-full py-0'>
        <InvoiceDatatable data={invoiceData} />
      </Card>
    </div>
  )
}

export default SalesDashboard
