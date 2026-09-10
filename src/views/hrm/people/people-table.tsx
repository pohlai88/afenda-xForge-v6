'use client'

// React Imports
import { useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// Third-party Imports
import { parseAsString, useQueryState } from 'nuqs'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { ArrowRightIcon, DownloadIcon, SearchIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { EmploymentStatus } from '@/types/hrm/employee-types'
import type { PeopleRow } from '@/types/hrm/people-types'
import type { TableColumn, TableDefinition, TableFooterRow } from '@/types/common/table-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import DataTable from '@/components/shared/DataTable'
import PropertiesSheet from '@/components/shared/PropertiesSheet'
import { employeeCommands, employeeObject, employeeProperties } from '@/views/hrm/hrm-objects'

// Util Imports
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/format-datetime'
import { initials } from '@/utils/text'
import { formatMoney } from '@/utils/money'
import {
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_STATUS_STYLES,
  RECORD_COMPLETENESS_LABELS,
  RECORD_COMPLETENESS_STYLES,
  peopleToCsv
} from '@/utils/hrm-people'

const STATUSES: EmploymentStatus[] = ['active', 'onboarding', 'on_leave', 'notice_period', 'terminated']

/**
 * Where a row opens, carrying the list it was opened from.
 *
 * `return` holds the current URL — filters, search and all — so H02's Back restores the list
 * somebody built rather than resetting it. H02 validates the value against `^/hrm` before using
 * it: an unvalidated return parameter is an open redirect, and the entity workspace guards its own
 * the same way.
 */
const hrefFor = (row: PeopleRow, search: string) =>
  `/hrm/people/${row.id}?return=${encodeURIComponent(`/hrm${search}`)}`

/** Says why a total is absent, and says it to a screen reader too. */
const NoTotal = () => (
  <>
    <span aria-hidden='true' className='text-muted-foreground'>
      —
    </span>
    <span className='sr-only'>Not totalled: these people are paid in different currencies</span>
  </>
)

/**
 * Rows are people, so they carry a face. A list of names with no avatar reads as a spreadsheet,
 * and the design system measures exactly this on the dashboards where the rows are people.
 *
 * The employee number sits under the name in muted mono: a person reads first and the identifier
 * second. Reversed, every row looks like a database dump.
 */
const buildColumns = (search: string): ColumnDef<PeopleRow>[] => [
  {
    id: 'name',
    header: 'Employee',
    accessorKey: 'name',
    cell: ({ row }) => (
      <span className='flex items-center gap-2.5'>
        <Avatar className='size-7 shrink-0'>
          {row.original.avatar && <AvatarImage src={row.original.avatar} alt='' />}
          <AvatarFallback className='text-[10px]'>{initials(row.original.name)}</AvatarFallback>
        </Avatar>
        <span className='flex min-w-0 flex-col'>
          <Link
            href={hrefFor(row.original, search)}
            className='truncate font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
          >
            {row.original.name}
          </Link>
          <span className='text-muted-foreground font-mono text-xs'>{row.original.employeeNumber}</span>
        </span>
      </span>
    )
  },
  {
    id: 'entity',
    header: 'Company',
    accessorKey: 'entityName',
    cell: ({ row }) => (
      <span className='flex flex-col'>
        <span className='whitespace-nowrap'>{row.original.entityName}</span>
        <span className='text-muted-foreground text-xs'>{row.original.countryCode}</span>
      </span>
    )
  },
  {
    id: 'department',
    header: 'Department',
    accessorKey: 'departmentName',
    cell: ({ row }) => <span className='whitespace-nowrap'>{row.original.departmentName}</span>
  },
  {
    id: 'position',
    header: 'Position',
    accessorKey: 'positionTitle',
    cell: ({ row }) => <span className='whitespace-nowrap'>{row.original.positionTitle}</span>
  },
  {
    id: 'location',
    header: 'Location',
    accessorKey: 'locationName',
    cell: ({ row }) => <span className='whitespace-nowrap'>{row.original.locationName}</span>
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => (
      <Badge className={cn('whitespace-nowrap', EMPLOYMENT_STATUS_STYLES[row.original.status])}>
        {EMPLOYMENT_STATUS_LABELS[row.original.status]}
      </Badge>
    )
  },
  {
    id: 'completeness',

    // "Record", not "Readiness". The column says what the record holds; it never says whether the
    // person can be paid, which is a run fact this module cannot prove.
    header: 'Record',
    accessorFn: row => row.completenessRank,
    cell: ({ row }) =>
      row.original.completeness === 'complete' ? (
        <span className='text-muted-foreground'>
          —<span className='sr-only'>Complete</span>
        </span>
      ) : (
        <Badge className={cn('whitespace-nowrap', RECORD_COMPLETENESS_STYLES[row.original.completeness])}>
          {RECORD_COMPLETENESS_LABELS[row.original.completeness]}
        </Badge>
      )
  },
  {
    id: 'fte',
    header: 'FTE',
    accessorKey: 'fte',
    cell: ({ row }) => row.original.fte.toFixed(1)
  },
  {
    id: 'compensation',
    header: 'Compensation',

    // Sorts on the raw minor-unit amount and formats only at render. Sorting the formatted string
    // would order 'S$9,120' above 'S$84,300'. Across currencies the order is still arbitrary, which
    // is why the footer refuses a total rather than pretending the column is comparable.
    accessorFn: row => row.compensation.amount,
    cell: ({ row }) => (
      <span className='flex flex-col items-end'>
        <span>{formatMoney(row.original.compensation)}</span>
        <span className='text-muted-foreground text-xs whitespace-nowrap'>{row.original.compensationBasis}</span>
      </span>
    )
  },
  {
    id: 'hireDate',
    header: 'Hired',
    accessorKey: 'hireDate',
    cell: ({ row }) => <span className='whitespace-nowrap'>{formatDate(row.original.hireDate)}</span>
  },
  {
    id: 'open',
    header: () => <span className='sr-only'>Open</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <Button
        variant='ghost'
        size='icon-sm'
        className='text-muted-foreground'
        render={<Link href={hrefFor(row.original, search)} />}
        nativeButton={false}
        aria-label={`Open ${row.original.name}`}
      >
        <ArrowRightIcon />
      </Button>
    )
  }
]

/**
 * What each column means. The engine reads these to decide alignment, sorting, filter kind and
 * whether a column's values can honestly drive a faceted count.
 *
 * `completeness` is a `signal` rather than a `status`, though it renders as a badge: its accessor
 * is a derived rank, so a faceted count against it would report zero for every option. The
 * `vocabulary` filter kind a signal carries is exactly the case for a column whose values are not
 * what the filter offers.
 *
 * `hideable` marks the tail that goes first when width runs out — declared here rather than left
 * to emerge, because at 768px there is no good default.
 */
const PEOPLE_COLUMNS: TableColumn[] = [
  { id: 'name', label: 'Employee', semantic: 'identity', isAnchor: true, pinned: true },
  { id: 'entity', label: 'Company', semantic: 'relation' },
  { id: 'department', label: 'Department', semantic: 'relation' },
  { id: 'position', label: 'Position', semantic: 'text' },
  { id: 'location', label: 'Location', semantic: 'relation', hideable: true },
  { id: 'status', label: 'Status', semantic: 'status' },
  { id: 'completeness', label: 'Record', semantic: 'signal' },
  { id: 'fte', label: 'FTE', semantic: 'quantity' },
  { id: 'compensation', label: 'Compensation', semantic: 'money', hideable: true },
  { id: 'hireDate', label: 'Hired', semantic: 'date', hideable: true },
  { id: 'open', label: 'Open', semantic: 'text', capabilities: { sortable: false, filter: 'none', searchable: false } }
]

type Props = {
  rows: PeopleRow[]
  pageSize?: number
  className?: string
}

/**
 * Every person, with the filters somebody actually reaches for.
 *
 * Status chips carry their counts so a collapsed list still says how many people are behind it,
 * following the run queue. Leavers are in the population but not in the default view: the chips
 * default to everyone, and the count makes it obvious they are included.
 */
const PeopleTable = ({ rows, pageSize = 15, className }: Props) => {
  // The filters live in the URL, not in local state, for two reasons the doctrine names directly.
  // `preserve_context`: opening a person and coming back must not throw away the list somebody
  // built to find them. And `interface_memory`: a filtered view is something a person can send to
  // a colleague, which is also what lets the "others in this department" command work by linking
  // to a URL rather than threading a prop through the page.
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault('all'))
  const [entityFilter, setEntityFilter] = useQueryState('entity', parseAsString.withDefault('all'))
  const [departmentFilter, setDepartmentFilter] = useQueryState('department', parseAsString.withDefault('all'))
  const [locationFilter, setLocationFilter] = useQueryState('location', parseAsString.withDefault('all'))
  const [globalFilter, setGlobalFilter] = useQueryState('q', parseAsString.withDefault(''))
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })
  const [propertiesRow, setPropertiesRow] = useState<PeopleRow | null>(null)

  // One pass, not one filter per status. The chips need every count, so scanning the population
  // five times to produce five numbers is five times the work for the same answer.
  const countsByStatus = useMemo(() => {
    const counts = Object.fromEntries(STATUSES.map(key => [key, 0])) as Record<EmploymentStatus, number>

    for (const row of rows) {
      counts[row.status] += 1
    }

    return counts
  }, [rows])

  // Narrowed against the vocabulary before it filters anything. The value arrives from the URL, so
  // a hand-typed or stale `?status=` can hold any string, and matching rows against it directly
  // empties the table — which the empty state would then report as nobody being on record at all.
  // An unrecognised value means no status filter.
  const activeStatus = STATUSES.find(candidate => candidate === status)

  const data = useMemo(
    () =>
      rows.filter(
        row =>
          (!activeStatus || row.status === activeStatus) &&
          (entityFilter === 'all' || row.entityId === entityFilter) &&
          (departmentFilter === 'all' || row.departmentId === departmentFilter) &&
          (locationFilter === 'all' || row.locationId === locationFilter)
      ),
    [rows, activeStatus, entityFilter, departmentFilter, locationFilter]
  )

  // The filters are in the URL, so the row links can carry the whole query string back.
  const search = useSearchParams().toString()
  const columns = useMemo(() => buildColumns(search ? `?${search}` : ''), [search])

  // Same opt-out the other datatables in this repo carry: useReactTable returns functions the
  // React Compiler cannot memoize, so it declines to compile the component rather than risk
  // stale UI.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    enableSortingRemoval: false,
    globalFilterFn: (row, _columnId, value: string) => {
      const needle = value.trim().toLowerCase()

      if (!needle) return true

      const { name, preferredName, employeeNumber, positionTitle, workEmail } = row.original

      return [name, preferredName ?? '', employeeNumber, positionTitle, workEmail].some(field =>
        field.toLowerCase().includes(needle)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const filteredRows = table.getFilteredRowModel().rows.map(row => row.original)

  const filtered =
    activeStatus !== undefined ||
    entityFilter !== 'all' ||
    departmentFilter !== 'all' ||
    locationFilter !== 'all' ||
    globalFilter.length > 0

  const present = filteredRows.filter(row => row.status !== 'terminated')

  // A total is only meaningful when every row shares a currency. With companies paying in dollars,
  // ringgit and dong in one table, adding the column and stamping the first row's currency on the
  // result produces a figure that looks precise and means nothing.
  const currencies = [...new Set(filteredRows.map(row => row.compensation.currency))]
  const currency = currencies.length === 1 ? currencies[0] : null

  const optionsFor = (key: 'entity' | 'department' | 'location') => {
    const pairs = rows.map(row =>
      key === 'entity'
        ? ([row.entityId, row.entityName] as const)
        : key === 'department'
          ? ([row.departmentId, row.departmentName] as const)
          : ([row.locationId, row.locationName] as const)
    )

    return [...new Map(pairs).entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }

  const entityOptions = optionsFor('entity')
  const departmentOptions = optionsFor('department')
  const locationOptions = optionsFor('location')

  const resetFilters = () => {
    void setStatus('all')
    void setEntityFilter('all')
    void setDepartmentFilter('all')
    void setLocationFilter('all')
    void setGlobalFilter('')
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }

  // Built eagerly for the definition, so it has to hold for 'all' too — which has no status label.
  // Only the last branch may claim the population is empty, and it is reachable only when nothing
  // is filtering. The company, department and location filters also come from the URL and can name
  // something that no longer exists, which empties the table just as effectively as a bad status.
  const emptyMessage = globalFilter
    ? `No one matches “${globalFilter}”.`
    : activeStatus
      ? `Nobody is ${EMPLOYMENT_STATUS_LABELS[activeStatus].toLowerCase()}.`
      : filtered
        ? 'No one matches the current filters.'
        : 'Nobody is on record yet.'

  const totalCompensation = filteredRows.reduce((sum, row) => sum + row.compensation.amount, 0)

  const footer: TableFooterRow = {
    label: (
      <>
        {present.length} {present.length === 1 ? 'person' : 'people'}
        {filteredRows.length !== present.length && (
          <span className='text-muted-foreground ml-2 font-normal'>· {filteredRows.length - present.length} left</span>
        )}
        {!currency && (
          <span className='text-muted-foreground ml-2 font-normal'>
            · {currencies.length} currencies · filter by company to total
          </span>
        )}
      </>
    ),
    cells: [
      { columnId: 'fte', content: (Math.round(present.reduce((sum, row) => sum + row.fte, 0) * 10) / 10).toFixed(1) },
      {
        columnId: 'compensation',
        content: currency ? formatMoney({ amount: totalCompensation, currency }) : <NoTotal />
      }
    ]
  }

  const definition: TableDefinition<PeopleRow> = {
    id: 'hrm-people',
    getRowId: row => row.id,
    columns: PEOPLE_COLUMNS,
    mode: 'client',
    getObject: employeeObject,
    getCommands: row => employeeCommands(row),

    // Named, not inferred: 'open' is the person's activation wherever it sits in the menu.
    getDefaultCommandId: () => 'open',
    onOpenProperties: setPropertiesRow,

    // A record missing payroll-relevant detail is the one worth finding first. The engine decides
    // what emphasis looks like, so it means the same thing in every table.
    getRowState: row => (row.status !== 'terminated' && row.completeness !== 'complete' ? 'emphasis' : 'default'),
    emptyState: {
      message: emptyMessage,
      onClear: filtered ? resetFilters : undefined
    },
    footer: filteredRows.length > 1 ? footer : undefined
  }

  const handleExport = () => {
    const csv = peopleToCsv(filteredRows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = 'people.csv'
    anchor.click()
    URL.revokeObjectURL(url)

    toast.success('Export created', {
      description: `${filteredRows.length} ${filteredRows.length === 1 ? 'person' : 'people'} · people.csv`
    })
  }

  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className='py-6'>
        <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
          Everyone
        </CardTitle>
        <CardDescription>
          {filteredRows.length} of {rows.length} people
        </CardDescription>
        <CardAction className='w-full sm:w-64'>
          <Label htmlFor='people-search' className='sr-only'>
            Search people
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon className='size-4' />
            </InputGroupAddon>
            <InputGroupInput
              id='people-search'
              value={globalFilter}
              onChange={event => {
                void setGlobalFilter(event.target.value)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
              placeholder='Search name, number, position'
            />
          </InputGroup>
        </CardAction>
      </CardHeader>

      <div className='flex flex-wrap items-center gap-2 border-y px-6 py-3'>
        <ToggleGroup
          variant='outline'
          size='sm'
          spacing={0}
          value={[activeStatus ?? 'all']}
          onValueChange={value => {
            // Single-select: pressing the active chip again would empty the group, which means
            // "show everything" here rather than "show nothing".
            void setStatus(value[0] ?? 'all')
            setPagination(p => ({ ...p, pageIndex: 0 }))
          }}
          aria-label='Filter people by employment status'
        >
          <ToggleGroupItem value='all'>
            All
            <span className='text-muted-foreground tabular-nums'>{rows.length}</span>
          </ToggleGroupItem>
          {STATUSES.map(
            key =>
              countsByStatus[key] > 0 && (
                <ToggleGroupItem key={key} value={key}>
                  {EMPLOYMENT_STATUS_LABELS[key]}
                  <span className='text-muted-foreground tabular-nums'>{countsByStatus[key]}</span>
                </ToggleGroupItem>
              )
          )}
        </ToggleGroup>

        {entityOptions.length > 1 && (
          <Select
            value={entityFilter}
            onValueChange={value => {
              if (!value) return
              void setEntityFilter(value)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            items={[
              { value: 'all', label: 'All companies' },
              ...entityOptions.map(([id, name]) => ({ value: id, label: name }))
            ]}
          >
            <SelectTrigger size='sm' className='w-48' aria-label='Filter people by company'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All companies</SelectItem>
              {entityOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {departmentOptions.length > 1 && (
          <Select
            value={departmentFilter}
            onValueChange={value => {
              if (!value) return
              void setDepartmentFilter(value)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            items={[
              { value: 'all', label: 'All departments' },
              ...departmentOptions.map(([id, name]) => ({ value: id, label: name }))
            ]}
          >
            <SelectTrigger size='sm' className='w-48' aria-label='Filter people by department'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All departments</SelectItem>
              {departmentOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {locationOptions.length > 1 && (
          <Select
            value={locationFilter}
            onValueChange={value => {
              if (!value) return
              void setLocationFilter(value)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            items={[
              { value: 'all', label: 'All locations' },
              ...locationOptions.map(([id, name]) => ({ value: id, label: name }))
            ]}
          >
            <SelectTrigger size='sm' className='w-48 max-lg:hidden' aria-label='Filter people by location'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All locations</SelectItem>
              {locationOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filtered && (
          <Button variant='ghost' size='sm' onClick={resetFilters}>
            Reset
            <XIcon />
          </Button>
        )}

        <Button variant='outline' size='sm' className='ml-auto' onClick={handleExport}>
          <DownloadIcon />
          <span className='max-md:hidden'>Export people</span>
        </Button>
      </div>

      <CardContent className='px-0 pb-0'>
        <DataTable definition={definition} table={table} caption='Everyone employed across the group' />

        <PropertiesSheet
          object={propertiesRow ? employeeObject(propertiesRow) : null}
          typeLabel='Employee'
          sections={propertiesRow ? employeeProperties(propertiesRow) : []}
          open={propertiesRow !== null}
          onOpenChange={open => {
            if (!open) setPropertiesRow(null)
          }}
        />
      </CardContent>
    </Card>
  )
}

export default PeopleTable
