'use client'

// Third-party Imports
import { Bar, BarChart, Cell, XAxis } from 'recharts'

// Type Imports
import type { BridgeStep } from '@/utils/payroll-metrics'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
        <ChartContainer config={chartConfig} className='h-72 w-full'>
          <BarChart data={steps} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
            <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={10} />
            <ChartTooltip
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
