'use client'

// Third-party Imports
import { Area, AreaChart } from 'recharts'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

// Income chart data
const incomeChartData = [
  { date: '2024-06-24', income: 190 },
  { date: '2024-06-25', income: 285 },
  { date: '2024-06-26', income: 420 },
  { date: '2024-06-27', income: 280 },
  { date: '2024-06-28', income: 250 },
  { date: '2024-06-29', income: 500 },
  { date: '2024-06-30', income: 550 },
  { date: '2024-06-31', income: 300 }
]

const incomeChartConfig = {
  income: {
    label: 'Income'
  }
} satisfies ChartConfig

const StatisticsCardData = {
  title: 'Income this month',
  amount: '$5,280',
  changePercentage: '+12.2%',
  children: (
    <ChartContainer config={incomeChartConfig} className='max-h-26.5 w-full max-w-70 flex-1 max-sm:max-w-35'>
      <AreaChart
        data={incomeChartData}
        margin={{
          left: 4,
          right: 0
        }}
      >
        <defs>
          <linearGradient id='fillIncome' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='10%' stopColor='var(--primary)' stopOpacity={1} />
            <stop offset='90%' stopColor='var(--primary)' stopOpacity={0} />
          </linearGradient>
        </defs>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Area
          dataKey='income'
          type='natural'
          fill='url(#fillIncome)'
          stroke='var(--primary)'
          strokeWidth={2}
          stackId='a'
        />
      </AreaChart>
    </ChartContainer>
  )
}

const StatisticsIncomeCard = ({ className }: { className?: string }) => {
  return (
    <Card className={className}>
      <CardContent className='flex flex-1 items-center justify-between gap-4 pr-0'>
        <div className='flex shrink-0 flex-col justify-between gap-6'>
          <div className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-sm'>{StatisticsCardData.title}</span>
            <span className='text-3xl font-semibold'>{StatisticsCardData.amount}</span>
          </div>
          <div className='flex gap-3'>
            <Badge className='bg-primary/10 text-primary h-6 rounded-sm px-3 py-1'>
              {StatisticsCardData.changePercentage}
            </Badge>
            <span className='text-muted-foreground'>vs Last month</span>
          </div>
        </div>
        {StatisticsCardData.children}
      </CardContent>
    </Card>
  )
}

export default StatisticsIncomeCard
