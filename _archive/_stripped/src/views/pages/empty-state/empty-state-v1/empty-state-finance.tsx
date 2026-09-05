'use client'

// Third-party Imports
import { CreditCardIcon, DollarSignIcon, EllipsisVerticalIcon, WalletIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

// Component Imports
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Util Imports
import { cn } from '@/lib/utils'

const listItems = ['Share', 'Update', 'Refresh']

const financeChartData = [
  { month: 'January', profit: 0, income: 0, expense: 0 },
  { month: 'February', profit: 0, income: 0, expense: 0 },
  { month: 'March', profit: 0, income: 0, expense: 0 },
  { month: 'April', profit: 0, income: 0, expense: 0 },
  { month: 'May', profit: 0, income: 0, expense: 0 },
  { month: 'June', profit: 0, income: 0, expense: 0 },
  { month: 'July', profit: 0, income: 0, expense: 0 }
]

const financeChartConfig = {
  profit: {
    label: 'Profit',
    color: 'var(--chart-2)'
  },
  income: {
    label: 'Income',
    color: 'var(--chart-1)'
  },
  expense: {
    label: 'Expense',
    color: 'var(--chart-4)'
  }
} satisfies ChartConfig

const ReportData = [
  {
    icons: <DollarSignIcon className='size-4.5' />,
    title: 'Total Profit',
    amount: '$0',
    iconClassName: 'bg-chart-2/10 text-chart-2'
  },
  {
    icons: <WalletIcon className='size-4.5' />,
    title: 'Total Income',
    amount: '$0',
    iconClassName: 'bg-chart-1/10 text-chart-1'
  },
  {
    icons: <CreditCardIcon className='size-4.5' />,
    title: 'Total Expense',
    amount: '$0',
    iconClassName: 'bg-chart-4/10 text-chart-4'
  }
]

const EmptyStateFinance = ({ className }: { className?: string }) => {
  return (
    <Card className={cn('grid grid-cols-1 gap-x-2 gap-y-4 lg:grid-cols-5', className)}>
      <div className='flex flex-col gap-10 max-lg:border-b max-lg:pb-6 lg:col-span-3 lg:border-r lg:pr-2'>
        <CardHeader className='flex justify-between'>
          <div className='flex flex-col gap-1'>
            <span className='text-lg font-medium'>Finance</span>
            <span className='text-muted-foreground text-sm'>Yearly report overview</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant='ghost' size='icon' className='text-muted-foreground size-6 rounded-full' />}
            >
              <EllipsisVerticalIcon />
              <span className='sr-only'>Menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuGroup>
                {listItems.map((item, index) => (
                  <DropdownMenuItem key={index}>{item}</DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className='flex-1'>
          <ChartContainer config={financeChartConfig} className='h-full min-h-65 w-full'>
            <BarChart accessibilityLayer data={financeChartData} barSize={12} margin={{ left: -30, bottom: -5 }}>
              <CartesianGrid vertical={false} strokeDasharray='4' stroke='var(--border)' />
              <XAxis
                dataKey='month'
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={value => value.slice(0, 3)}
              />
              <YAxis
                domain={[0, 50]}
                ticks={[0, 10, 20, 30, 40, 50]}
                tickFormatter={value => value}
                tickLine={false}
                tickMargin={8}
                axisLine={false}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey='profit' stackId='a' fill='var(--color-profit)' />
              <Bar dataKey='income' stackId='a' fill='var(--color-income)' />
              <Bar dataKey='expense' stackId='a' fill='var(--color-expense)' />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </div>
      <div className='flex flex-col gap-10 lg:col-span-2'>
        <CardHeader className='flex justify-between'>
          <div className='flex flex-col gap-1'>
            <span className='text-lg font-medium'>Report</span>
            <span className='text-muted-foreground text-sm'>Monthly Avg. $0k</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant='ghost' size='icon' className='text-muted-foreground size-6 rounded-full' />}
            >
              <EllipsisVerticalIcon />
              <span className='sr-only'>Menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuGroup>
                {listItems.map((item, index) => (
                  <DropdownMenuItem key={index}>{item}</DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className='flex flex-1 flex-col justify-between gap-6'>
          {ReportData.map((report, index) => (
            <div key={index} className='flex items-center gap-3'>
              <Avatar className='size-9 rounded-sm after:border-none'>
                <AvatarFallback
                  className={cn(
                    'bg-primary/10 text-primary shrink-0 rounded-sm [&>svg]:size-4.5',
                    report.iconClassName
                  )}
                >
                  {report.icons}
                </AvatarFallback>
              </Avatar>
              <div className='flex flex-col'>
                <span>{report.title}</span>
                <span className='text-muted-foreground text-sm'>{report.amount}</span>
              </div>
            </div>
          ))}

          <Button className='w-full sm:max-lg:max-w-70'>View Report</Button>
        </CardContent>
      </div>
    </Card>
  )
}

export default EmptyStateFinance
