'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// Type Imports
import type { Money } from '@/types/common/primitive-types'
import type { ConsolidatedMoney, Consolidation, MeasureKey } from '@/types/payroll/group-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import GroupCoverage from './group-coverage'

// Util Imports
import { formatMoney } from '@/utils/money'
import { ENTITY_STATE_LABELS, ENTITY_STATE_STYLES, FX_BASIS_LABELS, MEASURES, periodLabel } from '@/utils/payroll-group'
import { cn } from '@/lib/utils'

export type LineageMeasure = Extract<MeasureKey, 'employer_cost' | 'net_pay' | 'gross_pay'>

const MEASURE_ORDER: LineageMeasure[] = ['employer_cost', 'net_pay', 'gross_pay']

type Props = {
  consolidation: Consolidation
  open: boolean
  onOpenChange: (open: boolean) => void

  /** Which measure to open on. The toggle can change it without closing. */
  measure?: LineageMeasure

  /** Restricts the panel to a subset, for a selection or a single entity. */
  entityIds?: string[]

  /** Overrides the title when the panel explains something other than the headline. */
  title?: string
}

const moneyOf = (consolidation: Consolidation, measure: LineageMeasure): ConsolidatedMoney =>
  measure === 'net_pay'
    ? consolidation.netPay
    : measure === 'gross_pay'
      ? consolidation.grossPay
      : consolidation.employerCost

/**
 * A rate quoted in whichever direction reads as a number.
 *
 * "1 VND = 0.0001 SGD" is arithmetically true and tells the reader nothing; "1 SGD = 19,012 VND"
 * is the same fact in a form someone can check against what they know.
 */
const rateLabel = (from: string, to: string, quote?: { numerator: number; denominator: number }) => {
  if (from === to || !quote) return '—'

  const value = quote.numerator / quote.denominator
  const [near, far, magnitude] = value >= 1 ? [from, to, value] : [to, from, quote.denominator / quote.numerator]

  // Hand-rolled rather than toLocaleString. A client component still server-renders once, and
  // Intl is the one thing this codebase keeps out of render for exactly that reason.
  const whole = Math.floor(magnitude)
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const fraction = magnitude >= 100 ? '' : String(Math.round((magnitude - whole) * 10_000)).padStart(4, '0')

  return `1 ${near} = ${grouped}${fraction ? `.${fraction}` : ''} ${far}`
}

/**
 * How a number was built, in four layers: identity, bridge, composition, evidence.
 *
 * A bottom sheet rather than a right-hand one. A financial bridge and a per-entity table are wide
 * and tabular, and a 28rem column turns both into a scroll. The house rule this sets: a bottom
 * drawer explains a number or a selection, a right sheet works on a single record.
 */
const LineageDrawer = ({ consolidation, open, onOpenChange, measure = 'employer_cost', entityIds, title }: Props) => {
  const [active, setActive] = useState<LineageMeasure>(measure)
  const [openedWith, setOpenedWith] = useState(measure)

  // Reopening from a different figure should show that figure, not whatever was last toggled.
  // Adjusted during render rather than in an effect: an effect would render the stale measure
  // first and then correct it, which is both a wasted pass and a visible flicker.
  if (measure !== openedWith) {
    setOpenedWith(measure)
    setActive(measure)
  }

  const scoped = entityIds
    ? consolidation.entities.filter(row => entityIds.includes(row.entity.id))
    : consolidation.entities

  const included = scoped.filter(row => row.included && row.reporting)
  const total = moneyOf(consolidation, active)
  const reporting = consolidation.reportingCurrency

  // For a subset the headline figures are re-summed from the rows, because the consolidation's
  // own totals describe the whole group and would overstate a selection.
  const subsetTotal: Money | null = entityIds
    ? {
        amount: included.reduce((sum, row) => {
          const value =
            active === 'net_pay'
              ? row.reporting!.netPay.amount
              : active === 'gross_pay'
                ? row.reporting!.grossPay.amount
                : row.reporting!.employerCost.amount

          return sum + value
        }, 0),
        currency: reporting
      }
    : null

  const headline = subsetTotal ?? total.total

  const localOf = (row: (typeof included)[number]) =>
    active === 'net_pay' ? row.local!.netPay : active === 'gross_pay' ? row.local!.grossPay : row.local!.employerCost

  const reportingOf = (row: (typeof included)[number]) =>
    active === 'net_pay'
      ? row.reporting!.netPay
      : active === 'gross_pay'
        ? row.reporting!.grossPay
        : row.reporting!.employerCost

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='bottom' className='flex max-h-[85dvh] flex-col gap-0'>
        <SheetHeader className='gap-3 pr-12'>
          <div className='flex flex-col gap-1'>
            <SheetTitle>{title ?? 'How this number was consolidated'}</SheetTitle>
            <SheetDescription>
              {MEASURES[active].label} · {periodLabel(consolidation.period)} · reported in {reporting} ·{' '}
              {FX_BASIS_LABELS[consolidation.fxBasis]}
            </SheetDescription>
          </div>

          <ToggleGroup
            variant='outline'
            size='sm'
            spacing={0}
            value={[active]}
            onValueChange={value => setActive((value[0] as LineageMeasure) ?? active)}
            aria-label='Measure'
            className='w-fit'
          >
            {MEASURE_ORDER.map(key => (
              <ToggleGroupItem key={key} value={key}>
                {MEASURES[key].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </SheetHeader>

        <ScrollArea className='min-h-0 flex-1'>
          <div className='grid gap-8 px-4 py-6 lg:grid-cols-2'>
            {/* Bridge — its own bordered well, so three lines read as arithmetic. */}
            <section className='flex flex-col gap-3'>
              <h3 className='text-sm font-semibold'>How the total was reached</h3>
              <div className='space-y-3 rounded-md border p-5'>
                <div className='flex items-center justify-between gap-3 text-sm'>
                  <p className='text-muted-foreground'>
                    Local payroll at {consolidation.group.budgetYear} budget rates
                  </p>
                  <p className='tabular-nums'>{formatMoney(total.atBudget)}</p>
                </div>
                <div className='flex items-center justify-between gap-3 text-sm'>
                  <p className='text-muted-foreground'>
                    Exchange rate movement
                    <span className='block text-xs'>
                      {FX_BASIS_LABELS[consolidation.fxBasis].toLowerCase()} against budget
                    </span>
                  </p>
                  <p className='tabular-nums'>
                    {total.fxMovement.amount > 0 ? '+' : ''}
                    {formatMoney(total.fxMovement)}
                  </p>
                </div>
                <Separator />
                <div className='flex items-center justify-between gap-3 text-lg font-semibold'>
                  <h4 className='grow'>Reporting-currency total</h4>
                  <span className='tabular-nums'>{formatMoney(total.total)}</span>
                </div>
              </div>
              <p className='sr-only'>
                {formatMoney(total.atBudget)} plus {formatMoney(total.fxMovement)} equals {formatMoney(total.total)}.
              </p>

              <div className='pt-2'>
                <GroupCoverage coverage={consolidation.coverage} variant='block' />
              </div>
            </section>

            {/* Composition and evidence */}
            <section className='flex flex-col gap-6'>
              <div className='flex flex-col gap-3'>
                <h3 className='text-sm font-semibold'>What each company contributed</h3>
                <div className='overflow-x-auto rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='h-9 pl-4 text-xs'>Company</TableHead>
                        <TableHead className='h-9 text-right text-xs'>Local</TableHead>
                        <TableHead className='h-9 text-right text-xs'>Rate</TableHead>
                        <TableHead className='h-9 pr-4 text-right text-xs'>In {reporting}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scoped.map(row => (
                        <TableRow key={row.entity.id}>
                          <TableCell className='py-2 pl-4'>
                            <span className='flex flex-col'>
                              <span className='font-medium'>{row.entity.name}</span>
                              <span className='text-muted-foreground text-xs'>
                                {row.entity.countryCode} · {row.entity.currency}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className='py-2 text-right tabular-nums'>
                            {row.included && row.local ? formatMoney(localOf(row)) : '—'}
                          </TableCell>
                          <TableCell className='text-muted-foreground py-2 text-right text-xs tabular-nums'>
                            {row.included ? rateLabel(row.entity.currency, reporting, row.quote) : '—'}
                          </TableCell>
                          <TableCell className='py-2 pr-4 text-right tabular-nums'>
                            {row.included && row.reporting ? (
                              formatMoney(reportingOf(row))
                            ) : (
                              <span className='text-warning-strong text-xs'>Not included</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className='py-2 pl-4 font-medium'>
                          {included.length} of {scoped.length} included
                        </TableCell>
                        <TableCell className='text-muted-foreground py-2 text-right'>—</TableCell>
                        <TableCell className='text-muted-foreground py-2 text-right'>—</TableCell>
                        <TableCell className='py-2 pr-4 text-right font-semibold tabular-nums'>
                          {formatMoney(headline)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              <div className='flex flex-col gap-3'>
                <h3 className='text-sm font-semibold'>Source calculations</h3>
                <ul className='divide-y text-sm'>
                  {scoped.map(row => {
                    const source = consolidation.sourceCalculations.find(item => item.entityId === row.entity.id)

                    return (
                      <li key={row.entity.id} className='flex items-center justify-between gap-3 py-2'>
                        {source ? (
                          <>
                            <span className='flex min-w-0 flex-col'>
                              <Link
                                href={source.href}
                                className='font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
                              >
                                {source.reference}
                              </Link>
                              <span className='text-muted-foreground text-xs'>
                                Calculation #{source.calculationVersion} · {row.entity.name}
                              </span>
                            </span>
                            <Badge className={cn('shrink-0 whitespace-nowrap', ENTITY_STATE_STYLES[row.state])}>
                              {ENTITY_STATE_LABELS[row.state]}
                            </Badge>
                          </>
                        ) : (
                          <span className='text-muted-foreground'>
                            {row.entity.name} — no calculation for {periodLabel(consolidation.period)}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
                <p className='text-muted-foreground text-xs'>
                  Figures are exact minor units, converted per company and then summed. Nothing here is rounded for
                  display.
                </p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default LineageDrawer
