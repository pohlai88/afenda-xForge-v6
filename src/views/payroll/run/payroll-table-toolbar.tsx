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

  return (
    <div className='flex flex-wrap items-center gap-2 border-b px-4 py-2'>
      <div className='w-full sm:w-60'>
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

      <FacetFilter
        column={table.getColumn('payrollStatus')}
        title='Status'
        options={Object.entries(EMPLOYEE_PAYROLL_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
      />
      <FacetFilter
        column={table.getColumn('exceptions')}
        title='Exceptions'
        options={[
          ...Object.entries(EXCEPTION_SEVERITY_LABELS).map(([value, label]) => ({ value, label })),
          { value: EXCEPTION_FILTER_NONE, label: 'No open exceptions' }
        ]}
      />
      <FacetFilter column={table.getColumn('department')} title='Department' options={departments} />
      <FacetFilter column={table.getColumn('location')} title='Location' options={locations} />
      <FacetFilter
        column={table.getColumn('paymentStatus')}
        title='Payment'
        options={Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
      />

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
          <DropdownMenuTrigger render={<Button variant='outline' size='sm' />}>
            <Settings2Icon />
            <span className='max-md:hidden'>Columns</span>
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

        <Button variant='outline' size='sm' onClick={onExport}>
          <DownloadIcon />
          <span className='max-md:hidden'>Export register</span>
        </Button>
      </div>
    </div>
  )
}

export default PayrollTableToolbar
