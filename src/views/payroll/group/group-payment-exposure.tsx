// Next Imports
import Link from 'next/link'

// Third-party Imports
import { CheckCircle2Icon, TriangleAlertIcon } from 'lucide-react'

// Type Imports
import type { Money } from '@/types/common/primitive-types'
import type { LegalEntity } from '@/types/hrm/entity-types'
import type { Consolidation } from '@/types/payroll/group-types'

// Component Imports
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'

export type EntityExposure = {
  entity: LegalEntity

  /** Net pay still to leave the account, in the company's own currency. */
  required: Money
  available: Money
  headroom: Money

  /** Whether the run is approved, so the money is actually releasable. */
  releasable: boolean
  accountName?: string
  href: string
}

type Props = {
  consolidation: Consolidation
  exposures: EntityExposure[]
  className?: string
}

/**
 * Whether the group can actually pay.
 *
 * Deliberately not consolidated into one figure. Funding is the one payroll measure that must not
 * be translated: a Singapore account cannot cover a Malaysian shortfall, so a group total of
 * "available" would suggest a cushion that does not exist. Every row stays in its own currency,
 * and the headline counts companies rather than money.
 *
 * The reporting currency at the top of the page answers "what does the group cost". This answers
 * a different question — "can each company pay its own people" — and the two are not the same
 * number in any currency.
 */
const GroupPaymentExposure = ({ consolidation, exposures, className }: Props) => {
  const withoutRun = consolidation.entities.filter(row => !row.run)
  const short = exposures.filter(item => item.headroom.amount < 0)
  const funded = exposures.filter(item => item.headroom.amount >= 0)
  const releasable = exposures.filter(item => item.releasable && item.headroom.amount >= 0)

  const byCurrency = [...new Set(exposures.map(item => item.required.currency))].map(currency => ({
    currency,
    required: {
      amount: exposures
        .filter(item => item.required.currency === currency)
        .reduce((total, item) => total + item.required.amount, 0),
      currency
    } as Money
  }))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Can the group pay?</CardTitle>
        <CardDescription>
          Net pay still to leave each company&apos;s account, in that company&apos;s own currency
        </CardDescription>
        <CardAction className='flex flex-col items-end gap-0.5'>
          <span
            className={cn(
              'flex items-center gap-1.5 text-2xl font-semibold tabular-nums',
              short.length > 0 ? 'text-destructive' : 'text-success'
            )}
          >
            {short.length > 0 ? (
              <TriangleAlertIcon className='size-5' aria-hidden='true' />
            ) : (
              <CheckCircle2Icon className='size-5' aria-hidden='true' />
            )}
            {funded.length} of {exposures.length}
          </span>
          <span className='text-muted-foreground text-xs'>companies funded</span>
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-col gap-4'>
        <p className='text-muted-foreground text-sm'>
          {releasable.length} of {exposures.length} can release today
          {short.length > 0 && (
            <span className='text-destructive'>
              {' · '}
              {short.map(item => item.entity.name).join(', ')} {short.length === 1 ? 'is' : 'are'} short of funds
            </span>
          )}
        </p>

        {/* A company with no calculation has no obligation to fund yet, which is not the same as
            being funded. Counting it in either column would be a claim the domain cannot make. */}
        {withoutRun.length > 0 && (
          <p className='text-warning text-sm'>
            {withoutRun.map(row => row.entity.name).join(', ')} {withoutRun.length === 1 ? 'has' : 'have'} no
            calculation for this period, so {withoutRun.length === 1 ? 'its' : 'their'} funding requirement is not
            yet known. This card covers {exposures.length} of {consolidation.entityCount} companies.
          </p>
        )}

        <div className='overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='h-9 pl-4 text-xs'>Company</TableHead>
                <TableHead className='h-9 text-xs'>Account</TableHead>
                <TableHead className='h-9 text-right text-xs'>Still to pay</TableHead>
                <TableHead className='h-9 text-right text-xs'>Available</TableHead>
                <TableHead className='h-9 pr-4 text-right text-xs'>Headroom</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exposures.map(item => (
                <TableRow key={item.entity.id}>
                  <TableCell className='py-2 pl-4'>
                    <span className='flex flex-col'>
                      <Link
                        href={item.href}
                        className='font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
                      >
                        {item.entity.name}
                      </Link>
                      <span className='text-muted-foreground text-xs'>
                        {item.releasable ? 'Approved' : 'Not yet approved'}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className='text-muted-foreground py-2 text-sm'>
                    {item.accountName ?? 'No account on file'}
                  </TableCell>
                  <TableCell className='py-2 text-right tabular-nums'>{formatMoney(item.required)}</TableCell>
                  <TableCell className='py-2 text-right tabular-nums'>{formatMoney(item.available)}</TableCell>
                  <TableCell
                    className={cn(
                      'py-2 pr-4 text-right font-medium tabular-nums',
                      item.headroom.amount < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  >
                    {formatMoney(item.headroom)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <dl className='flex flex-wrap gap-x-6 gap-y-1 text-sm'>
          <dt className='text-muted-foreground'>Still to pay, by currency</dt>
          {byCurrency.map(entry => (
            <dd key={entry.currency} className='font-medium tabular-nums'>
              {formatMoney(entry.required)}
            </dd>
          ))}
        </dl>

        <p className='text-muted-foreground text-xs'>
          Not converted into {consolidation.reportingCurrency}. A balance in one country cannot cover a shortfall in
          another, so a single group figure would imply a cushion that does not exist.
        </p>
      </CardContent>
    </Card>
  )
}

export default GroupPaymentExposure

