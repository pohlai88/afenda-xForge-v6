'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Type Imports
import type { CurrencyCode } from '@/types/common/primitive-types'
import type { FxBasis, GroupPeriodOption } from '@/types/payroll/group-types'

// Component Imports
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Util Imports
import { FX_BASES } from '@/types/payroll/group-types'
import { FX_BASIS_LABELS } from '@/utils/payroll-group'
import { COMPARISON_BASES, COMPARISON_BASIS_LABELS, groupHref, type GroupQuery } from './group-query'

type Props = {
  query: GroupQuery
  defaults: { period: string; currency: CurrencyCode; basis: FxBasis }
  periods: GroupPeriodOption[]
  currencies: CurrencyCode[]
}

/**
 * Period, reporting currency, exchange rate basis, view and comparison.
 *
 * These push the URL rather than holding state, which keeps the page a server component and
 * makes every view someone builds shareable. The view selector shows "Financial allocation"
 * disabled on purpose: legal employer and cost allocation diverge, and making the seam visible
 * now costs nothing and prevents the assumption that this view covers both.
 */
const GroupSelectors = ({ query, defaults, periods, currencies }: Props) => {
  const router = useRouter()

  const go = (overrides: Partial<GroupQuery>) => router.push(groupHref(query, defaults, overrides), { scroll: false })

  return (
    <div className='flex flex-wrap items-end gap-3'>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='group-period' className='text-muted-foreground text-xs'>
          Period
        </Label>
        <Select
          value={query.period}
          onValueChange={value => value && go({ period: value })}
          items={periods.map(option => ({ value: option.value, label: option.label }))}
        >
          <SelectTrigger id='group-period' className='w-full sm:w-44'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='group-currency' className='text-muted-foreground text-xs'>
          Reporting currency
        </Label>
        <Select
          value={query.currency}
          onValueChange={value => value && go({ currency: value as CurrencyCode })}
          items={currencies.map(code => ({ value: code, label: code }))}
        >
          <SelectTrigger id='group-currency' className='w-full sm:w-28'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map(code => (
              <SelectItem key={code} value={code}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='group-basis' className='text-muted-foreground text-xs'>
          Exchange rate basis
        </Label>
        <Select
          value={query.basis}
          onValueChange={value => value && go({ basis: value as FxBasis })}
          items={FX_BASES.map(basis => ({ value: basis, label: FX_BASIS_LABELS[basis] }))}
        >
          <SelectTrigger id='group-basis' className='w-full sm:w-44'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FX_BASES.map(basis => (
              <SelectItem key={basis} value={basis}>
                {FX_BASIS_LABELS[basis]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='group-compare' className='text-muted-foreground text-xs'>
          Compare to
        </Label>
        <Select
          value={query.compare}
          onValueChange={value => value && go({ compare: value as GroupQuery['compare'] })}
          items={COMPARISON_BASES.map(basis => ({ value: basis, label: COMPARISON_BASIS_LABELS[basis] }))}
        >
          <SelectTrigger id='group-compare' className='w-full sm:w-44'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPARISON_BASES.map(basis => (
              <SelectItem key={basis} value={basis}>
                {COMPARISON_BASIS_LABELS[basis]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='group-view' className='text-muted-foreground text-xs'>
          View
        </Label>
        <Select value='operational' items={[{ value: 'operational', label: 'Operational payroll' }]}>
          <SelectTrigger id='group-view' className='w-full sm:w-52'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='operational'>Operational payroll</SelectItem>
            <SelectItem value='financial' disabled>
              Financial allocation — later
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default GroupSelectors
