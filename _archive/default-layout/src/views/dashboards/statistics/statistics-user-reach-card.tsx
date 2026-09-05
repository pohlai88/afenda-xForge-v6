'use client'

// Third-party Imports
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'

// User reach chart data
const userReachChartData = [{ visitors: 500, fill: 'var(--color-visitors)' }]

const userReachChartConfig = {
  visitors: {
    label: 'Visitors',
    color: 'var(--chart-5)'
  }
} satisfies ChartConfig

const StatisticsCardData = {
  title: 'User reach',
  description: 'Last week',
  children: (
    <>
      <ChartContainer config={userReachChartConfig} className='h-21 w-full'>
        <RadialBarChart data={userReachChartData} startAngle={90} endAngle={250} innerRadius={43} outerRadius={32}>
          <PolarGrid
            gridType='circle'
            radialLines={false}
            stroke='none'
            className='first:fill-primary/10 last:fill-card'
            polarRadius={[42, 32]}
          />
          <RadialBar dataKey='visitors' />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                  return (
                    <text x={viewBox.cx} y={20} textAnchor='middle' dominantBaseline='middle'>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) - 8}
                        className='fill-foreground text-base font-semibold'
                      >
                        {userReachChartData[0].visitors.toLocaleString()}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 15} className='fill-muted-foreground text-xs'>
                        Visitors
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
    </>
  ),
  value: '32K',
  changePercentage: '+12%'
}

const StatisticsUserReachCard = ({ className }: { className?: string }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>{StatisticsCardData.title}</CardTitle>
        <CardDescription className='text-muted-foreground text-base'>{StatisticsCardData.description}</CardDescription>
      </CardHeader>
      <CardContent>{StatisticsCardData.children}</CardContent>

      <CardContent className='flex items-center justify-between'>
        <span className='text-xl font-semibold'>{StatisticsCardData.value}</span>
        <span className='text-primary text-base'>{StatisticsCardData.changePercentage}</span>
      </CardContent>
    </Card>
  )
}

export default StatisticsUserReachCard
