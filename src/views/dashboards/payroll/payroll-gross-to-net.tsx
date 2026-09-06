'use client'

// Third-party Imports
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'

// Type Imports
import type { BridgeStep } from '@/utils/payroll-metrics'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { formatMajorUnits } from '@/utils/money'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const chartConfig = {
  value: { label: 'Amount' }
} satisfies ChartConfig

type Props = {
  steps: BridgeStep[]
  currencySymbol: string
  className?: string
}

/**
 * Gross-to-net as a waterfall.
 *
 * Recharts has no waterfall chart, so each column is two stacked bars: a transparent `offset`
 * that lifts the visible bar to where the running total sits, and the visible `value` on top.
 * The terminal columns (gross, net) sit on the floor with a zero offset; the deductions float
 * between them, which is what makes the drop legible.
 */
const PayrollGrossToNet = ({ steps, currencySymbol, className }: Props) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Gross to net</CardTitle>
        <CardDescription>Where this run&apos;s pay goes</CardDescription>
      </CardHeader>
      <CardContent>
        {/* No accessibilityLayer here, unlike the trend chart. This waterfall is two stacked
            bars per column and the lower one is a transparent spacer, so point-by-point
            navigation would announce the spacer as data. The chart stays hidden and the
            sr-only summary below is the accessible version. */}
        <p className='sr-only'>
          How gross pay reduces to net for this run.{' '}
          {steps.map(step => `${step.label}: ${formatMajorUnits(step.value, currencySymbol)}.`).join(' ')}
        </p>
        <ChartContainer config={chartConfig} className='max-h-85 min-h-60 w-full' aria-hidden='true'>
          <BarChart data={steps} margin={{ top: 20, right: 8, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray='4' stroke='var(--border)' />
            <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={10} />
            {/* width='auto' sizes to the widest tick: a negative left margin used to clip the
                currency symbol off the widest labels, turning "S$340K" into "$340K". */}
            <YAxis
              width='auto'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={value => `${currencySymbol}${Math.round(Number(value) / 1000)}K`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel={false}
                  formatter={value => `${currencySymbol}${Number(value).toLocaleString('en-US')}`}
                />
              }
            />
            {/* The lift. Stacked underneath and painted transparent so only its height counts. */}
            <Bar dataKey='offset' stackId='bridge' fill='transparent' isAnimationActive={false} />
            <Bar dataKey='value' stackId='bridge' radius={[4, 4, 0, 0]}>
              {steps.map(step => (
                <Cell key={step.label} fill={step.kind === 'total' ? 'var(--chart-2)' : 'var(--chart-5)'} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default PayrollGrossToNet
