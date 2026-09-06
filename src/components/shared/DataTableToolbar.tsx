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
import type { TableCapabilities, TableColumn, TableDefinition, TableFilter } from '@/types/common/table-types'

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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { cn } from '@/lib/utils'
import { exportScopeOf, isFacetable } from '@/types/common/table-types'

/**
 * How much room the filter row needs before it can show one trigger per filter.
 *
 * Scaled by how many filters there are, because that is what actually decides whether they fit,
 * and expressed as literal container-query classes so Tailwind can see them. Below the threshold
 * every filter collapses into one popover — the semantics are identical either way, which is what
 * `layout_grammar` requires of a responsive change.
 *
 * These are container queries, not viewport ones: a table inside a workspace panel with the
 * sidebar open has far less room than the window suggests.
 */
const INLINE_AT: Record<number, string> = {
  1: 'hidden @2xl:contents',
  2: 'hidden @3xl:contents',
  3: 'hidden @4xl:contents',
  4: 'hidden @5xl:contents',
  5: 'hidden @6xl:contents'
}

const COLLAPSED_AT: Record<number, string> = {
  1: 'contents @2xl:hidden',
  2: 'contents @3xl:hidden',
  3: 'contents @4xl:hidden',
  4: 'contents @5xl:hidden',
  5: 'contents @6xl:hidden'
}

type ResolvedOption = {
  value: string
  label: string
  count: number | null
}

/**
 * The options worth offering, and how many rows are behind each.
 *
 * Counts appear only where the column's own values *are* the option values — `isFacetable`. A
 * `signal` column stores a derived rank, so counting a severity vocabulary against it would report
 * zero for everything; those filters show their full vocabulary and no counts instead.
 *
 * Where counts do exist, an option nothing matches is absent rather than dimmed: offering it would
 * assert a row sitting behind the filter, which doctrine `domain_truth` forbids.
 */
const resolveOptions = <TRow,>(
  column: Column<TRow, unknown> | undefined,
  filter: TableFilter,
  declared: TableColumn | undefined
): ResolvedOption[] => {
  if (!column) return []

  if (!declared || !isFacetable(declared)) {
    return filter.options.map(option => ({ ...option, count: null }))
  }

  const counts = column.getFacetedUniqueValues()

  return filter.options
    .map(option => ({ ...option, count: counts.get(option.value) ?? 0 }))
    .filter(option => (option.count ?? 0) > 0)
}

const toggleValue = <TRow,>(column: Column<TRow, unknown>, selected: Set<string>, value: string) => {
  const next = new Set(selected)

  if (next.has(value)) next.delete(value)
  else next.add(value)

  column.setFilterValue(next.size === 0 ? undefined : [...next])
}

const selectedValues = <TRow,>(column: Column<TRow, unknown> | undefined) =>
  new Set((column?.getFilterValue() as string[] | undefined) ?? [])

const OptionRow = ({ option, active }: { option: ResolvedOption; active: boolean }) => (
  <>
    <span
      aria-hidden='true'
      className={cn(
        'border-input flex size-4 items-center justify-center rounded-[4px] border',
        active && 'bg-primary border-primary text-primary-foreground'
      )}
    >
      {active ? <CheckIcon className='size-3' /> : null}
    </span>
    <span className='flex-1'>{option.label}</span>
    {option.count === null ? null : <span className='text-muted-foreground text-xs tabular-nums'>{option.count}</span>}
  </>
)

const ActiveCount = ({ count }: { count: number }) =>
  count > 0 ? (
    <>
      <Separator orientation='vertical' className='mx-0.5 h-4!' />
      <Badge variant='secondary' className='h-auto rounded-sm px-1 py-0 text-[11px] tabular-nums'>
        {count}
      </Badge>
    </>
  ) : null

type FacetProps<TRow> = {
  column: Column<TRow, unknown> | undefined
  filter: TableFilter
  options: ResolvedOption[]
}

/** One filter, as its own trigger, for a container with room to show them side by side. */
const Facet = <TRow,>({ column, filter, options }: FacetProps<TRow>) => {
  if (!column || options.length === 0) return null

  const selected = selectedValues(column)

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant='outline' size='sm' className={cn(selected.size > 0 && 'border-primary/40')} />}
      >
        <ListFilterIcon />
        {filter.label}
        <ActiveCount count={selected.size} />
        <ChevronDownIcon className='opacity-60' />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-56 p-0'>
        <Command>
          <CommandInput placeholder={`Filter ${filter.label.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>No options match.</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => toggleValue(column, selected, option.value)}
                >
                  <OptionRow option={option} active={selected.has(option.value)} />
                </CommandItem>
              ))}
            </CommandGroup>
            {selected.size > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => column.setFilterValue(undefined)} className='justify-center text-center'>
                    Clear
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type ResolvedFilter<TRow> = {
  filter: TableFilter
  column: Column<TRow, unknown> | undefined
  options: ResolvedOption[]
}

/**
 * Every filter in one popover, for a container too narrow to hold a row of triggers.
 *
 * One Command over grouped sections rather than nested popovers: it collapses to a single control,
 * and typing searches every dimension at once, which a row of separate triggers cannot do.
 */
const AllFilters = <TRow,>({ filters }: { filters: ResolvedFilter<TRow>[] }) => {
  const active = filters.reduce((total, entry) => total + selectedValues(entry.column).size, 0)

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' size='sm' className={cn(active > 0 && 'border-primary/40')} />}>
        <ListFilterIcon />
        Filters
        <ActiveCount count={active} />
        <ChevronDownIcon className='opacity-60' />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-64 p-0'>
        <Command>
          <CommandInput placeholder='Filter' />
          <CommandList className='max-h-80'>
            <CommandEmpty>No options match.</CommandEmpty>
            {filters.map(({ filter, column, options }) => {
              if (!column || options.length === 0) return null

              const selected = selectedValues(column)

              return (
                <CommandGroup key={filter.columnId} heading={filter.label}>
                  {options.map(option => (
                    <CommandItem
                      key={option.value}
                      value={`${filter.label} ${option.label}`}
                      onSelect={() => toggleValue(column, selected, option.value)}
                    >
                      <OptionRow option={option} active={selected.has(option.value)} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type Props<TRow> = {
  definition: TableDefinition<TRow>
  table: TanstackTable<TRow>
  capabilities: TableCapabilities
  search?: string
  onSearchChange?: (value: string) => void
}

/**
 * The controls a table has earned, and nothing else.
 *
 * Every control here is behind a capability that survived all three gates, so a table with no
 * hideable columns has no Columns menu and one with no export has no Export — rather than a row of
 * disabled buttons explaining what this table cannot do. A table that has earned none of them
 * renders no toolbar at all.
 *
 * The division of labour is the whole point: the domain declares which business dimensions are
 * worth filtering and what their values are called, and every mechanic around that — the
 * multi-select, the counts, the active tally, reset, the responsive collapse — is the engine's.
 */
const DataTableToolbar = <TRow,>({ definition, table, capabilities, search, onSearchChange }: Props<TRow>) => {
  const declared = new Map(definition.columns.map(column => [column.id, column]))

  const filters: ResolvedFilter<TRow>[] = capabilities.filter
    ? (definition.filters ?? []).map(filter => {
        const column = table.getColumn(filter.columnId)

        return { filter, column, options: resolveOptions(column, filter, declared.get(filter.columnId)) }
      })
    : []

  const present = filters.filter(entry => entry.column && entry.options.length > 0)
  const searchable = capabilities.search && onSearchChange !== undefined
  const searchText = search ?? ''
  const filtered = table.getState().columnFilters.length > 0 || searchText.length > 0
  const hideable = definition.columns.filter(column => column.hideable)

  const controls = searchable || present.length > 0 || capabilities.columnVisibility || capabilities.export || filtered

  if (!controls) return null

  const inlineAt = INLINE_AT[present.length] ?? 'hidden'
  const collapsedAt = COLLAPSED_AT[present.length] ?? 'contents'

  const resetFilters = () => {
    table.resetColumnFilters()
    onSearchChange?.('')
  }

  const exportRows = () =>
    definition.onExport?.(
      table.getFilteredRowModel().rows.map(row => row.original),
      exportScopeOf(definition.mode)
    )

  return (
    <div className='flex flex-wrap items-center gap-2 border-b px-4 py-2'>
      {searchable ? (
        <div className='w-full @2xl:w-60'>
          <Label htmlFor={`${definition.id}-search`} className='sr-only'>
            Search
          </Label>
          <InputGroup className='h-8'>
            <InputGroupAddon>
              <SearchIcon className='size-4' />
            </InputGroupAddon>
            <InputGroupInput
              id={`${definition.id}-search`}
              value={searchText}
              onChange={event => onSearchChange?.(event.target.value)}
              placeholder='Search'
            />
          </InputGroup>
        </div>
      ) : null}

      {present.length > 0 ? (
        <>
          <div className={collapsedAt}>
            <AllFilters filters={present} />
          </div>
          <div className={inlineAt}>
            {present.map(entry => (
              <Facet key={entry.filter.columnId} column={entry.column} filter={entry.filter} options={entry.options} />
            ))}
          </div>
        </>
      ) : null}

      {filtered ? (
        <Button variant='ghost' size='sm' onClick={resetFilters}>
          Reset
          <XIcon />
        </Button>
      ) : null}

      <div className='ms-auto flex items-center gap-2'>
        {capabilities.columnVisibility ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='outline' size='sm' aria-label='Show columns' />}>
              <Settings2Icon />
              <span className='hidden @5xl:inline'>Columns</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-44'>
              {hideable.map(column => {
                const tableColumn = table.getColumn(column.id)

                if (!tableColumn) return null

                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={tableColumn.getIsVisible()}
                    onCheckedChange={value => tableColumn.toggleVisibility(!!value)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {capabilities.export ? (
          <Button variant='outline' size='sm' onClick={exportRows} aria-label='Export'>
            <DownloadIcon />
            <span className='hidden @5xl:inline'>Export</span>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default DataTableToolbar
