'use client'

// Third-party Imports
import type { Column, Table as TanstackTable } from '@tanstack/react-table'
import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  ListFilterIcon,
  SearchIcon,
  Settings2Icon,
  XIcon
} from 'lucide-react'

// Type Imports
import type { PayrollRunRow } from '@/types/payroll/run-workspace-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { EXCEPTION_FILTER_NONE } from './payroll-run-table'

// Util Imports
import { cn } from '@/lib/utils'
import { EXCEPTION_SEVERITY_LABELS } from '@/utils/payroll-metrics'
import { EMPLOYEE_PAYROLL_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/utils/payroll-workspace'

export type FilterOption = { value: string; label: string }

type FacetFilterProps = {
  column: Column<PayrollRunRow, unknown> | undefined
  title: string
  options: FilterOption[]
}

/**
 * Multi-select filter: a Popover holding a Command list, the way the rest of shadcn does it.
 * The active count sits on the trigger so a collapsed toolbar still says what is filtered.
 */
const FacetFilter = ({ column, title, options }: FacetFilterProps) => {
  if (!column) return null

  const selected = new Set((column.getFilterValue() as string[] | undefined) ?? [])

  const toggle = (value: string) => {
    const next = new Set(selected)

    if (next.has(value)) next.delete(value)
    else next.add(value)

    column.setFilterValue(next.size === 0 ? undefined : [...next])
  }

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant='outline' size='sm' className={cn(selected.size > 0 && 'border-primary/40')} />}
      >
        <ListFilterIcon />
        {title}
        {selected.size > 0 && (
          <>
            <Separator orientation='vertical' className='mx-0.5 h-4!' />
            <Badge variant='secondary' className='h-auto rounded-sm px-1 py-0 text-[11px] tabular-nums'>
              {selected.size}
            </Badge>
          </>
        )}
        <ChevronDownIcon className='opacity-60' />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-56 p-0'>
        <Command>
          <CommandInput placeholder={`Filter ${title.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>No options match.</CommandEmpty>
            <CommandGroup>
              {options.map(option => {
                const active = selected.has(option.value)

                return (
                  <CommandItem key={option.value} value={option.label} onSelect={() => toggle(option.value)}>
                    <span
                      className={cn(
                        'border-input flex size-4 items-center justify-center rounded-[4px] border',
                        active && 'bg-primary border-primary text-primary-foreground'
                      )}
                      aria-hidden='true'
                    >
                      {active && <CheckIcon className='size-3' />}
                    </span>
                    <span className='flex-1'>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => column.setFilterValue(undefined)} className='justify-center text-center'>
                    Clear
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * The same facets in one Popover, for a container too narrow to hold five triggers. One Command
 * over grouped sections rather than five nested popovers: it collapses to a single control, and
 * typing searches every facet at once, which the row of triggers cannot do.
 */
const AllFilters = ({ facets }: { facets: Facet[] }) => {
  const active = facets.reduce(
    (total, facet) => total + ((facet.column?.getFilterValue() as string[] | undefined)?.length ?? 0),
    0
  )

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' size='sm' className={cn(active > 0 && 'border-primary/40')} />}>
        <ListFilterIcon />
        Filters
        {active > 0 && (
          <>
            <Separator orientation='vertical' className='mx-0.5 h-4!' />
            <Badge variant='secondary' className='h-auto rounded-sm px-1 py-0 text-[11px] tabular-nums'>
              {active}
            </Badge>
          </>
        )}
        <ChevronDownIcon className='opacity-60' />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-64 p-0'>
        <Command>
          <CommandInput placeholder='Filter employees' />
          <CommandList className='max-h-80'>
            <CommandEmpty>No options match.</CommandEmpty>
            {facets.map(({ column, title, options }) => {
              if (!column) return null

              const selected = new Set((column.getFilterValue() as string[] | undefined) ?? [])

              return (
                <CommandGroup key={title} heading={title}>
                  {options.map(option => {
                    const isActive = selected.has(option.value)

                    return (
                      <CommandItem
                        key={option.value}
                        value={`${title} ${option.label}`}
                        onSelect={() => {
                          const next = new Set(selected)

                          if (next.has(option.value)) next.delete(option.value)
                          else next.add(option.value)

                          column.setFilterValue(next.size === 0 ? undefined : [...next])
                        }}
                      >
                        <span
                          className={cn(
                            'border-input flex size-4 items-center justify-center rounded-[4px] border',
                            isActive && 'bg-primary border-primary text-primary-foreground'
                          )}
                          aria-hidden='true'
                        >
                          {isActive && <CheckIcon className='size-3' />}
                        </span>
                        <span className='flex-1'>{option.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type Facet = {
  column: Column<PayrollRunRow, unknown> | undefined
  title: string
  options: FilterOption[]
}

type Props = {
  table: TanstackTable<PayrollRunRow>
  search: string
  onSearchChange: (value: string) => void
  departments: FilterOption[]
  locations: FilterOption[]
  onExport: () => void
}

const COLUMN_LABELS: Record<string, string> = {
  department: 'Department',
  location: 'Location',
  gross: 'Gross',
  net: 'Net',
  variance: 'Variance',
  payrollStatus: 'Payroll status',
  exceptions: 'Exceptions',
  paymentStatus: 'Payment'
}

const PayrollTableToolbar = ({ table, search, onSearchChange, departments, locations, onExport }: Props) => {
  const filtered = table.getState().columnFilters.length > 0 || search.length > 0

  // One definition, rendered as five triggers when the container can hold them and as a single
  // Popover when it cannot. Both paths read and write the same column filter state.
  const facets: Facet[] = [
    {
      column: table.getColumn('payrollStatus'),
      title: 'Status',
      options: Object.entries(EMPLOYEE_PAYROLL_STATUS_LABELS).map(([value, label]) => ({ value, label }))
    },
    {
      column: table.getColumn('exceptions'),
      title: 'Exceptions',
      options: [
        ...Object.entries(EXCEPTION_SEVERITY_LABELS).map(([value, label]) => ({ value, label })),
        { value: EXCEPTION_FILTER_NONE, label: 'No open exceptions' }
      ]
    },
    { column: table.getColumn('department'), title: 'Department', options: departments },
    { column: table.getColumn('location'), title: 'Location', options: locations },
    {
      column: table.getColumn('paymentStatus'),
      title: 'Payment',
      options: Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
    }
  ]

  return (
    <div className='flex flex-wrap items-center gap-2 border-b px-4 py-2'>
      <div className='w-full @2xl:w-60'>
        <Label htmlFor='payroll-search' className='sr-only'>
          Search employees
        </Label>
        <InputGroup className='h-8'>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            id='payroll-search'
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder='Search name, number, role'
          />
        </InputGroup>
      </div>

      {/*
        Five triggers once the row can actually hold them, one consolidated Popover below that.
        Measured, not guessed: the five come to 615px, search 240, the two actions 238 with labels
        and ~80 without, plus gaps. At 68rem the icon-only form fits on one line; the labels come
        back at 76rem. Thresholds any lower and widening the container — collapsing the sidebar —
        made the toolbar wrap to two rows, so more room bought less.
      */}
      <div className='contents @min-[68rem]:hidden'>
        <AllFilters facets={facets} />
      </div>
      <div className='hidden @min-[68rem]:contents'>
        {facets.map(facet => (
          <FacetFilter key={facet.title} column={facet.column} title={facet.title} options={facet.options} />
        ))}
      </div>

      {filtered && (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => {
            table.resetColumnFilters()
            onSearchChange('')
          }}
        >
          Reset
          <XIcon />
        </Button>
      )}

      <div className='ml-auto flex items-center gap-2'>
        <DropdownMenu>
          {/* The label is hidden in a narrow container, so the name has to come from aria-label. */}
          <DropdownMenuTrigger render={<Button variant='outline' size='sm' aria-label='Show columns' />}>
            <Settings2Icon />
            <span className='hidden @min-[76rem]:inline'>Columns</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-44'>
            <DropdownMenuLabel>Show columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllLeafColumns()
              .filter(column => column.getCanHide())
              .map(column => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={value => column.toggleVisibility(!!value)}
                >
                  {COLUMN_LABELS[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant='outline' size='sm' onClick={onExport} aria-label='Export register'>
          <DownloadIcon />
          <span className='hidden @min-[76rem]:inline'>Export register</span>
        </Button>
      </div>
    </div>
  )
}

export default PayrollTableToolbar
