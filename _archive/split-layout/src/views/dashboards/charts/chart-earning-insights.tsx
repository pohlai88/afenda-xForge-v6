'use client'

// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { Bar, BarChart, XAxis } from 'recharts'
import { EllipsisVerticalIcon } from 'lucide-react'

// Component Imports
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { Progress } from '@/components/ui/progress'

// Util Imports
import { cn } from '@/lib/utils'

const listItems = ['Share', 'Update', 'Refresh']

type Props = {
  title: string
  subTitle: string
  totalEarning: string
  trend: 'up' | 'down'
  changePercentage: number
  description: string
  chartData: {
    day: string
    earning: number
    fill: string
  }[]
  statData: {
    icon: ReactNode
    title: string
    amount: string
    progress: number
  }[]
  className?: string
}

const earningReportChartConfig = {
  earning: {
    label: 'Earning'
  }
} satisfies ChartConfig

const EarningInsightsCard = ({
  title,
  subTitle,
  totalEarning,
  trend,
  changePercentage,
  description,
  chartData,
  statData,
  className
}: Props) => {
  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader className='flex justify-between'>
        <div className='flex flex-col gap-1'>
          <span className='text-lg font-semibold'>{title}</span>
          <span className='text-muted-foreground text-sm'>{subTitle}</span>
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
      <CardContent className='flex flex-col gap-4 text-base'>
        <div className='grid gap-10 md:grid-cols-5'>
          <div className='flex flex-col justify-center gap-3 md:col-span-2'>
            <div className='flex items-center gap-4'>
              <span className='text-6xl font-medium'>{totalEarning}</span>
              <Badge className='bg-primary/10 [a&]:hover:bg-primary/5 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40 text-primary h-6 rounded-sm px-3 py-1 focus-visible:outline-none'>
                {trend === 'up' ? '+' : '-'}
                {changePercentage}%
              </Badge>
            </div>
            <p className='text-muted-foreground text-xs'>{description}</p>
          </div>
          <ChartContainer config={earningReportChartConfig} className='w-full text-sm sm:h-37.5 md:col-span-3 md:pl-6'>
            <BarChart
              accessibilityLayer
              data={chartData}
              barSize={24}
              margin={{
                left: -5,
                right: -5
              }}
            >
              <XAxis
                dataKey='day'
                tickLine={false}
                tickMargin={5.5}
                axisLine={false}
                tickFormatter={value => value.slice(0, 2)}
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey='earning' radius={8} />
            </BarChart>
          </ChartContainer>
        </div>

        <Card className='ring-foreground/10 shadow-none'>
          <CardContent className='flex flex-wrap justify-between gap-6 text-base max-md:gap-5'>
            {statData.map((data, index) => (
              <div key={index} className='flex flex-col gap-3'>
                <div className='flex items-center gap-2'>
                  <Avatar className='rounded-sm after:border-0'>
                    <AvatarFallback className='bg-primary/10 text-primary shrink-0 rounded-sm *:size-4'>
                      {data.icon}
                    </AvatarFallback>
                  </Avatar>
                  <span>{data.title}</span>
                </div>
                <span className='text-2xl font-medium'>{data.amount}</span>
                <Progress value={data.progress} className='w-37.5 *:data-[slot=progress-track]:h-1.5' />
              </div>
            ))}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

export default EarningInsightsCard
