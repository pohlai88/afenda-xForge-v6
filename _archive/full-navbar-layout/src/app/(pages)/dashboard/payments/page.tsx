import { WalletIcon, CreditCardIcon, LandmarkIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'

import StatisticsIncomeCard from '@/views/dashboards/statistics/statistics-income-card'
import StatisticsExpenseCard from '@/views/dashboards/statistics/statistics-expense-card'
import StatisticsCardWithSvg from '@/views/dashboards/statistics/statistics-card-04'
import PaymentHistoryCard from '@/views/dashboards/widgets/widget-payment-history'
import TotalRevenueCard from '@/views/dashboards/charts/chart-total-revenue'
import SalesByCountryCard from '@/views/dashboards/widgets/widget-sales-by-countries'
import TransactionsCard from '@/views/dashboards/widgets/widget-transactions'
import TotalEarningCard from '@/views/dashboards/widgets/widget-total-earning'
import InvoiceDatatable, { type Item } from '@/views/datatables/datatable-invoice'

import TotalOrdersCardSvg from '@/assets/svg/total-orders-card-svg'

// Payment gateways data
const paymentData = [
  {
    img: '/images/widgets/master-card.webp',
    imgWidth: 'w-8',
    cardNumber: '5688',
    cardType: 'Credit Card',
    date: '05/Jan',
    spend: '2,820',
    remaining: '10,020'
  },
  {
    img: '/images/widgets/visa.webp',
    imgWidth: 'w-8',
    cardNumber: '8562',
    cardType: 'Debit Card',
    date: '15/Feb',
    spend: '1,450',
    remaining: '8,570'
  },
  {
    img: '/images/widgets/american-express.webp',
    imgWidth: 'w-8',
    cardNumber: '5238',
    cardType: 'ATM card',
    date: '20/Mar',
    spend: '500',
    remaining: '7,070'
  },
  {
    img: '/images/widgets/visa.webp',
    imgWidth: 'w-8',
    cardNumber: '8562',
    cardType: 'Debit card',
    date: '10/Mar',
    spend: '750',
    remaining: '5,120'
  },
  {
    img: '/images/widgets/master-card.webp',
    imgWidth: 'w-8',
    cardNumber: '*5688',
    cardType: 'Credit Card',
    date: '25/May',
    spend: '1,200',
    remaining: '5,870'
  }
]

// Sales data
const Sales = [
  {
    img: '/images/flags/austria.webp',
    sales: '$867k',
    country: 'Austria',
    changePercentage: '20.3%',
    trend: 'up'
  },
  {
    img: '/images/flags/china.webp',
    sales: '$1.2M',
    country: 'China',
    changePercentage: '15.7%',
    trend: 'up'
  },
  {
    img: '/images/flags/switzerland.webp',
    sales: '$750k',
    country: 'Switzerland',
    changePercentage: '18.2%',
    trend: 'down'
  },
  {
    img: '/images/flags/india.webp',
    sales: '$1.5M',
    country: 'India',
    changePercentage: '22.1%',
    trend: 'up'
  },
  {
    img: '/images/flags/brazil.webp',
    sales: '$980k',
    country: 'Brazil',
    changePercentage: '19.6%',
    trend: 'down'
  }
]

// Transactions data
const transactions = [
  {
    icon: <CreditCardIcon />,
    paymentMethod: 'Credit Card',
    platform: 'Digital Ocean',
    amount: '$2820',
    paymentType: 'debit'
  },
  {
    icon: <LandmarkIcon />,
    paymentMethod: 'Bank account',
    platform: 'Received money',
    amount: '$1,260',
    paymentType: 'credit'
  },
  {
    icon: <CreditCardIcon />,
    paymentMethod: 'Credit Card',
    platform: 'Netflix',
    amount: '$149',
    paymentType: 'debit'
  },
  {
    icon: <WalletIcon />,
    paymentMethod: 'Wallet',
    platform: 'Starbucks',
    amount: '$49',
    paymentType: 'debit'
  },
  {
    icon: <LandmarkIcon />,
    paymentMethod: 'Bank account',
    platform: 'Received money',
    amount: '$268',
    paymentType: 'credit'
  }
]

// Earning data
const earningData = [
  {
    img: '/images/widgets/zipcar.webp',
    platform: 'Zipcar',
    technologies: 'Vuejs & HTML',
    earnings: '-$23,569.26',
    progressPercentage: 75
  },
  {
    img: '/images/widgets/bitbank.webp',
    platform: 'Bitbank',
    technologies: 'Figma & React',
    earnings: '-$12,650.31',
    progressPercentage: 25
  },
  {
    img: '/images/widgets/aviato.webp',
    platform: 'Aviato',
    technologies: 'HTML & Angular',
    earnings: '-$55,699.50',
    progressPercentage: 50
  }
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

const PaymentsDashboard = () => {
  return (
    <div className='grid grid-cols-6 gap-6'>
      {/* Income Statistics */}
      <StatisticsIncomeCard className='col-span-2 max-lg:col-span-full *:data-[slot=card-content]:lg:max-xl:flex-col *:data-[slot=card-content]:lg:max-xl:pr-6' />

      {/* Expense Statistics */}
      <StatisticsExpenseCard className='col-span-2 max-lg:col-span-full *:data-[slot=card-content]:lg:max-xl:flex-col *:data-[slot=card-content]:lg:max-xl:pr-6' />

      {/* Total Orders */}
      <StatisticsCardWithSvg
        title='Total orders'
        badgeContent='Last Week'
        value='42.4k'
        changePercentage={10.8}
        svg={<TotalOrdersCardSvg />}
        className='col-span-2 max-lg:col-span-full'
      />

      {/* Payment History */}
      <PaymentHistoryCard
        title='Payment History'
        paymentData={paymentData}
        className='col-span-full lg:col-span-3 lg:max-2xl:order-1 2xl:col-span-2'
      />

      {/* Total Revenue */}
      <TotalRevenueCard className='col-span-full 2xl:col-span-4' />

      {/* Sales by Country */}
      <SalesByCountryCard
        title='Sales by countries'
        subTitle='Monthly sales overview'
        salesData={Sales}
        className='col-span-full lg:col-span-3 lg:max-2xl:order-1 2xl:col-span-2'
      />

      {/* Transactions */}
      <TransactionsCard
        title='Transactions'
        transactions={transactions}
        className='col-span-full lg:col-span-3 lg:max-2xl:order-1 2xl:col-span-2'
      />

      {/* Total Earning */}
      <TotalEarningCard
        title='Total Earning'
        earning={24650}
        trend='up'
        percentage={10}
        comparisonText='Compare to last year ($84,325)'
        earningData={earningData}
        className='col-span-full lg:col-span-3 lg:max-2xl:order-1 2xl:col-span-2'
      />

      {/* Invoice Table */}
      <Card className='col-span-full py-0 lg:max-2xl:order-2'>
        <InvoiceDatatable data={invoiceData} />
      </Card>
    </div>
  )
}

export default PaymentsDashboard
