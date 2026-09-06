'use client'

// Third-party Imports
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { formatMajorUnits } from '@/utils/money'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'

export type CostTrendPoint = {
  reference: string

  /** Employer cost in major units. */
  cost: number
  employees: number
}

const chartConfig = {
  cost: { label: 'Employer cost', color: 'var(--chart-2)' },
  employees: { label: 'Employees', color: 'var(--chart-1)' }
} satisfies ChartConfig

type Props = {
  points: CostTrendPoint[]
  currencySymbol: string
  className?: string
}

/**
 * Cost and headcount on one chart, deliberately.
 *
 * Payroll cost rising on its own is ambiguous — it could be hiring or it could be overtime and
 * raises. Overlaying headcount answers which, and the gap between the two lines is the part
 * worth asking about.
 */
const PayrollCostTrend = ({ points, currencySymbol, className }: Props) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Cost and headcount</CardTitle>
        <CardDescription>Last six runs</CardDescription>
      </CardHeader>
      <CardContent>
        {/* The summary states the whole series at once; accessibilityLayer below then lets a
            keyboard user walk the points individually. Summary for the gist, layer for the detail. */}
        <p className='sr-only'>
          Employer cost and headcount over the last {points.length} pay runs.{' '}
          {points
            .map(
              point =>
                `Run ${point.reference}: ${formatMajorUnits(point.cost, currencySymbol)} across ${point.employees} employees.`
            )
            .join(' ')}
        </p>
        <ChartContainer config={chartConfig} className='max-h-85 min-h-60 w-full'>
          <ComposedChart accessibilityLayer data={points} margin={{ top: 20, right: 8, left: -8 }}>
            <CartesianGrid vertical={false} strokeDasharray='4' stroke='var(--border)' />
            <XAxis dataKey='reference' tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              yAxisId='cost'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={value => `${currencySymbol}${Math.round(Number(value) / 1000)}K`}
            />
            <YAxis yAxisId='employees' orientation='right' hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) =>
                    name === 'cost'
                      ? `${currencySymbol}${Number(value).toLocaleString('en-US')}`
                      : `${value} employees`
                  }
                />
              }
            />
            <Bar yAxisId='cost' dataKey='cost' fill='var(--color-cost)' radius={[4, 4, 0, 0]} maxBarSize={44} />
            <Line
              yAxisId='employees'
              dataKey='employees'
              type='monotone'
              stroke='var(--color-employees)'
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default PayrollCostTrend
