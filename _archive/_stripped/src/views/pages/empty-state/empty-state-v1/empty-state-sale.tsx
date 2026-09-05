'use client'

// Third-party Imports
import { EllipsisVerticalIcon } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

// Component Imports
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

const salesLeadsData = [
  { month: 'January', success: 0, fail: 0 },
  { month: 'February', success: 0, fail: 0 },
  { month: 'March', success: 0, fail: 0 },
  { month: 'April', success: 0, fail: 0 },
  { month: 'May', success: 0, fail: 0 },
  { month: 'June', success: 0, fail: 0 },
  { month: 'July', success: 0, fail: 0 },
  { month: 'August', success: 0, fail: 0 },
  { month: 'September', success: 0, fail: 0 },
  { month: 'October', success: 0, fail: 0 },
  { month: 'November', success: 0, fail: 0 },
  { month: 'December', success: 0, fail: 0 }
]

const salesLeadsConfig = {
  success: {
    label: 'Success',
    color: 'var(--chart-2)'
  },
  fail: {
    label: 'Fail',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig

const EmptyStateSale = ({ className }: { className?: string }) => {
  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader className='flex justify-between border-b'>
        <div className='flex flex-col gap-1'>
          <span className='text-lg font-medium'>Sales Lead</span>
          <span className='text-muted-foreground text-sm'>Sales leads performance chart</span>
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
      <CardContent className='flex flex-col gap-4'>
        <div className='grid gap-6 sm:grid-cols-3'>
          <div className='flex items-center gap-2'>
            <span className='bg-chart-2 h-14 w-1 rounded-sm' />
            <div className='flex flex-col'>
              <span className='text-xl font-medium'>--</span>
              <span className='text-muted-foreground text-sm'>Successful Sales</span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <span className='bg-chart-1 h-14 w-1 rounded-sm' />
            <div className='flex flex-col'>
              <span className='text-xl font-medium'>--</span>
              <span className='text-muted-foreground text-sm'>Failed Sales</span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <span className='bg-chart-3 h-14 w-1 rounded-sm' />
            <div className='flex flex-col'>
              <span className='text-xl font-medium'>--</span>
              <span className='text-muted-foreground text-sm'>Total</span>
            </div>
          </div>
        </div>
        <ChartContainer config={salesLeadsConfig} className='aspect-auto h-81.25 w-full min-w-60'>
          <AreaChart
            margin={{
              left: 15,
              right: 15,
              top: 20,
              bottom: 5
            }}
            data={salesLeadsData}
            className='stroke-2'
          >
            <defs>
              <linearGradient id='fillSuccess' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-success)' stopOpacity={0.8} />
                <stop offset='95%' stopColor='var(--color-success)' stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id='fillFail' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-fail)' stopOpacity={0.8} />
                <stop offset='95%' stopColor='var(--color-fail)' stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='5 4' vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              minTickGap={20}
              tickFormatter={value => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className='w-45'
                  labelFormatter={label => label}
                  formatter={(value, name, item, index) => {
                    // Only render once for the first item
                    if (index !== 0) return null

                    return (
                      <>
                        {/* Success */}
                        <div className='flex w-full items-center gap-2'>
                          <div
                            className='h-2.5 w-2.5 shrink-0 rounded-xs'
                            style={{ backgroundColor: 'var(--color-success)' }}
                          />
                          <span className='flex-1'>{salesLeadsConfig.success.label}</span>
                          <span className='text-foreground font-mono font-medium tabular-nums'>
                            {item.payload.success}
                          </span>
                        </div>
                        {/* Fail */}
                        <div className='flex w-full items-center gap-2'>
                          <div
                            className='h-2.5 w-2.5 shrink-0 rounded-xs'
                            style={{ backgroundColor: 'var(--color-fail)' }}
                          />
                          <span className='flex-1'>{salesLeadsConfig.fail.label}</span>
                          <span className='text-foreground font-mono font-medium tabular-nums'>
                            {item.payload.fail}
                          </span>
                        </div>
                        {/* Total */}
                        <div className='text-foreground mt-1.5 flex w-full items-center border-t pt-1.5 text-xs font-medium'>
                          <span className='flex-1'>Total</span>
                          <span className='text-foreground font-mono font-medium tabular-nums'>
                            {item.payload.success + item.payload.fail}
                          </span>
                        </div>
                      </>
                    )
                  }}
                />
              }
            />
            <Area dataKey='fail' type='bump' fill='url(#fillFail)' stroke='var(--color-fail)' stackId='a' />
            <Area dataKey='success' type='bump' fill='url(#fillSuccess)' stroke='var(--color-success)' stackId='a' />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default EmptyStateSale
