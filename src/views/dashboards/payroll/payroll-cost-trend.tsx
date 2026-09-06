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
        {/* The chart is a set of unlabelled paths to a screen reader, so it is hidden from the
            accessibility tree and the same figures are stated in text beside it. */}
        <p className='sr-only'>
          Employer cost and headcount over the last {points.length} pay runs.{' '}
          {points
            .map(
              point =>
                `Run ${point.reference}: ${formatMajorUnits(point.cost, currencySymbol)} across ${point.employees} employees.`
            )
            .join(' ')}
        </p>
        <ChartContainer config={chartConfig} className='h-72 w-full' aria-hidden='true'>
          <ComposedChart data={points} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis dataKey='reference' tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis yAxisId='cost' hide />
            <YAxis yAxisId='employees' orientation='right' hide />
            <ChartTooltip
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
