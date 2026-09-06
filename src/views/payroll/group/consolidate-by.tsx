'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// Type Imports
import type { CurrencyCode } from '@/types/common/primitive-types'
import type { Consolidation, DimensionBreakdown, DimensionRow } from '@/types/payroll/group-types'

// Component Imports
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import GroupCoverage from './group-coverage'
import LineageDrawer from './lineage-drawer'

// Util Imports
import { CONSOLIDATION_DIMENSIONS } from '@/types/payroll/group-types'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'
import { DIMENSION_LABELS } from '@/utils/payroll-group'
import { groupHref, type GroupQuery } from './group-query'

type Props = {
  consolidation: Consolidation
  breakdown: DimensionBreakdown
  query: GroupQuery
  defaults: { period: string; currency: CurrencyCode; basis: never | GroupQuery['basis'] }
  className?: string
}

/**
 * The same total, cut a different way.
 *
 * Every row opens the same lineage drawer the headline does. That consistency is the point: a
 * reader learns one explanation interaction and it works on the group figure, on a company, on a
 * selection, on a movement, and later on a cell in a report.
 *
 * Table first, chart second. On a payroll surface the exact figure is the thing being checked;
 * the bar is there to rank, not to be read off.
 */
const ConsolidateBy = ({ consolidation, breakdown, query, defaults, className }: Props) => {
  const [openRow, setOpenRow] = useState<DimensionRow | null>(null)

  const reporting = consolidation.reportingCurrency
  const largest = Math.max(...breakdown.rows.map(row => row.cost.amount), 1)

  // Only the entity dimension maps a row back to companies the drawer can explain. The others
  // aggregate across them, and pretending otherwise would show a bridge for a slice that has no
  // single set of source calculations.
  const entityIdsFor = (row: DimensionRow) => (breakdown.dimension === 'entity' ? [row.key] : undefined)

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>
            Employer cost by {DIMENSION_LABELS[breakdown.dimension].toLowerCase()}
          </CardTitle>
          <CardDescription>
            In {reporting} · {consolidation.coverage.entities.included} of {consolidation.entityCount} companies
            included
          </CardDescription>
          <CardAction className='text-muted-foreground text-sm'>
            {breakdown.rows.length} {breakdown.rows.length === 1 ? 'row' : 'rows'}
          </CardAction>
        </CardHeader>

        <CardContent className='flex flex-col gap-4'>
          <nav aria-label='Consolidate by' className='flex flex-wrap gap-2'>
            {CONSOLIDATION_DIMENSIONS.map(dimension => {
              const active = dimension === breakdown.dimension

              return (
                <Link
                  key={dimension}
                  href={groupHref(query, defaults, { by: dimension })}
                  scroll={false}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    buttonVariants({ variant: active ? 'secondary' : 'outline', size: 'sm' }),
                    'rounded-full'
                  )}
                >
                  {DIMENSION_LABELS[dimension]}
                </Link>
              )
            })}
          </nav>

          {breakdown.rows.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No {DIMENSION_LABELS[breakdown.dimension].toLowerCase()} breakdown is available for the companies included
              this period.
            </p>
          ) : (
            <div className='overflow-x-auto rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='h-9 pl-4 text-xs'>{DIMENSION_LABELS[breakdown.dimension]}</TableHead>
                    <TableHead className='h-9 text-right text-xs'>Companies</TableHead>
                    <TableHead className='h-9 text-right text-xs'>Employees</TableHead>
                    <TableHead className='h-9 text-right text-xs'>Employer cost</TableHead>
                    <TableHead className='h-9 pr-4 text-xs'>Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.rows.map(row => (
                    <TableRow
                      key={row.key}
                      className='hover:bg-muted/50 cursor-pointer'
                      onClick={() => setOpenRow(row)}
                    >
                      <TableCell className='py-2 pl-4'>
                        <Button
                          variant='link'
                          onClick={event => {
                            event.stopPropagation()
                            setOpenRow(row)
                          }}
                          aria-label={`Explain ${row.label}`}
                          className='h-auto p-0 font-medium'
                        >
                          {row.label}
                        </Button>
                        {row.code && row.code !== row.label && (
                          <span className='text-muted-foreground ml-2 font-mono text-xs'>{row.code}</span>
                        )}
                      </TableCell>
                      <TableCell className='py-2 text-right tabular-nums'>{row.entities}</TableCell>
                      <TableCell className='py-2 text-right tabular-nums'>{row.employees}</TableCell>
                      <TableCell className='py-2 text-right font-medium tabular-nums'>
                        {formatMoney(row.cost)}
                      </TableCell>
                      <TableCell className='py-2 pr-4'>
                        <span className='flex items-center gap-2'>
                          <span className='bg-muted relative h-2 w-24 shrink-0 overflow-hidden rounded-full'>
                            <span
                              className='bg-chart-1 absolute inset-y-0 left-0 rounded-full'
                              style={{ width: `${Math.max((row.cost.amount / largest) * 100, 2)}%` }}
                              aria-hidden='true'
                            />
                          </span>
                          <span className='text-muted-foreground w-12 text-right text-xs tabular-nums'>
                            {row.share.toFixed(1)}%
                          </span>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className='pl-4 font-medium'>Total</TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {consolidation.coverage.entities.included}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>{consolidation.headcount.unique}</TableCell>
                    <TableCell className='text-right font-semibold tabular-nums'>
                      {formatMoney(breakdown.total)}
                    </TableCell>
                    <TableCell className='text-muted-foreground pr-4 text-xs'>100%</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}

          {!consolidation.coverage.complete && <GroupCoverage coverage={consolidation.coverage} subject='breakdown' />}
        </CardContent>
      </Card>

      <LineageDrawer
        consolidation={consolidation}
        open={Boolean(openRow)}
        onOpenChange={value => !value && setOpenRow(null)}
        entityIds={openRow ? entityIdsFor(openRow) : undefined}
        title={openRow ? `${openRow.label} · ${DIMENSION_LABELS[breakdown.dimension].toLowerCase()}` : undefined}
      />
    </>
  )
}

export default ConsolidateBy
