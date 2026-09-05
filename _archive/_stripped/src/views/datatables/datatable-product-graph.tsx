'use client'

import { useId, useMemo, useState } from 'react'

import Papa from 'papaparse'
import * as XLSX from 'xlsx'

import type { Column, ColumnDef, ColumnFiltersState, PaginationState, RowData } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getPaginationRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import { Line, LineChart } from 'recharts'

import {
  ArrowUpIcon,
  ArrowDownIcon,
  Trash2Icon,
  EyeIcon,
  UploadIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  EllipsisVerticalIcon
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { usePagination } from '@/hooks/use-pagination'

import { cn } from '@/lib/utils'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'range' | 'select'
  }
}

export type Item = {
  id: string
  productImage: string
  product: string
  brand: string
  graphData: { month: string; sales: number }[]
  price: number
  orders: number
  orderTrend: 'up' | 'down'
  sales: number
}

const salesChartConfig = {
  sales: {
    label: 'Sales'
  }
} satisfies ChartConfig

const columns: ColumnDef<Item>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={value => table.toggleAllRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    size: 50
  },
  {
    header: 'Product',
    accessorKey: 'product',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <div className='bg-primary/5 flex size-10 items-center justify-center rounded-sm'>
          <img src={row.original.productImage} alt={row.getValue('product')} className='w-7.5' />
        </div>
        <div className='flex flex-col'>
          <span className='font-medium'>{row.getValue('product')}</span>
          <span className='text-muted-foreground'>{row.original.brand}</span>
        </div>
      </div>
    ),
    size: 360
  },

  {
    header: 'Graph',
    accessorKey: 'graphData',
    cell: ({ row }) => (
      <>
        <ChartContainer config={salesChartConfig} className='h-6 w-full'>
          <LineChart
            accessibilityLayer
            data={row.original.graphData}
            margin={{
              top: 4,
              left: 6,
              right: 6
            }}
          >
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Line dataKey='sales' type='monotone' dot={false} stroke='var(--primary)' strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      </>
    ),
    size: 200
  },
  {
    header: 'Price',
    accessorKey: 'price',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('price'))

      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)

      return <span>{formatted.slice(0, -3)}</span>
    },
    size: 100
  },
  {
    header: 'Orders',
    accessorKey: 'orders',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        {row.original.orderTrend === 'up' ? <ArrowUpIcon className='size-4' /> : <ArrowDownIcon className='size-4' />}
        <span>{row.getValue('orders')}</span>
      </div>
    ),
    size: 100
  },
  {
    header: 'Sales',
    accessorKey: 'sales',
    cell: ({ row }) => (
      <Badge className='bg-primary/10 text-primary h-auto rounded-sm px-1.5'>
        {row.original.sales > 0 ? `+${row.original.sales}` : row.original.sales}%
      </Badge>
    ),
    size: 100
  },
  {
    id: 'actions',
    header: () => <div className='text-center'>Actions</div>,
    cell: () => (
      <div className='flex items-center justify-center gap-1'>
        <Tooltip>
          <TooltipTrigger render={<Button variant='ghost' size='icon' aria-label='Delete item' />}>
            <Trash2Icon className='size-4.5' />
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant='ghost' size='icon' aria-label='View item' />}>
            <EyeIcon className='size-4.5' />
          </TooltipTrigger>
          <TooltipContent>
            <p>View</p>
          </TooltipContent>
        </Tooltip>
        <RowActions />
      </div>
    ),
    enableHiding: false
  }
]

const ProductDatatable = ({ data }: { data: Item[] }) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const pageSize = 5

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      pagination
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination
  })

  const exportToCSV = () => {
    const selectedRows = table.getSelectedRowModel().rows

    const dataToExport =
      selectedRows.length > 0
        ? selectedRows.map(row => row.original)
        : table.getFilteredRowModel().rows.map(row => row.original)

    const csv = Papa.unparse(dataToExport, {
      header: true
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `payments-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToExcel = () => {
    const selectedRows = table.getSelectedRowModel().rows

    const dataToExport =
      selectedRows.length > 0
        ? selectedRows.map(row => row.original)
        : table.getFilteredRowModel().rows.map(row => row.original)

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments')

    const cols = [{ wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }]

    worksheet['!cols'] = cols

    XLSX.writeFile(workbook, `payments-export-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToJSON = () => {
    const selectedRows = table.getSelectedRowModel().rows

    const dataToExport =
      selectedRows.length > 0
        ? selectedRows.map(row => row.original)
        : table.getFilteredRowModel().rows.map(row => row.original)

    const json = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `payments-export-${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2
  })

  return (
    <div className='w-full'>
      <div className='border-b'>
        <div className='flex gap-4 p-6 max-sm:flex-col sm:items-center sm:justify-between'>
          <Filter column={table.getColumn('product')!} />
          <div className='flex items-center gap-4 max-sm:gap-2 sm:flex-wrap sm:justify-between'>
            <div className='flex items-center gap-2'>
              <Label htmlFor='#rowSelect' className='sr-only'>
                Show
              </Label>
              <Select
                items={[5, 10, 25, 50].map(s => ({
                  label: String(s),
                  value: String(s)
                }))}
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value: string | null) => {
                  if (value) table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger id='rowSelect' className='w-fit whitespace-nowrap'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[5, 10, 25, 50].map(pageSize => (
                      <SelectItem key={pageSize} value={pageSize.toString()}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button className='bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40' />
                }
              >
                <UploadIcon />
                Export
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-auto'>
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileTextIcon className='mr-2 size-4' />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel}>
                  <FileSpreadsheetIcon className='mr-2 size-4' />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportToJSON}>
                  <FileTextIcon className='mr-2 size-4' />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button>
              <PlusIcon />
              Add Product
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className='h-14 border-t'>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className='text-muted-foreground first:pl-4 last:px-4 nth-of-type-[3]:*:justify-center'
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() &&
                              'flex h-full cursor-pointer items-center justify-between gap-2 select-none'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={e => {
                            if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault()
                              header.column.getToggleSortingHandler()?.(e)
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ChevronUpIcon className='shrink-0 opacity-60' size={16} aria-hidden='true' />,
                            desc: <ChevronDownIcon className='shrink-0 opacity-60' size={16} aria-hidden='true' />
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className='h-14 first:w-12.5 first:pl-4 last:w-29 last:px-4'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between gap-3 px-6 py-4 max-sm:flex-col'>
        <p className='text-muted-foreground text-sm whitespace-nowrap' aria-live='polite'>
          Showing{' '}
          <span>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              Math.max(
                table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                  table.getState().pagination.pageSize,
                0
              ),
              table.getRowCount()
            )}
          </span>{' '}
          of <span>{table.getRowCount().toString()} entries</span>
        </p>

        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  className='disabled:pointer-events-none disabled:opacity-50'
                  variant='ghost'
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label='Go to previous page'
                >
                  <ChevronLeftIcon aria-hidden='true' />
                  Previous
                </Button>
              </PaginationItem>

              {showLeftEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {pages.map(page => {
                const isActive = page === table.getState().pagination.pageIndex + 1

                return (
                  <PaginationItem key={page}>
                    <Button
                      size='icon'
                      className={`${!isActive && 'bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40'}`}
                      onClick={() => table.setPageIndex(page - 1)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                )
              })}

              {showRightEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <Button
                  className='disabled:pointer-events-none disabled:opacity-50'
                  variant='ghost'
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label='Go to next page'
                >
                  Next
                  <ChevronRightIcon aria-hidden='true' />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}

export default ProductDatatable

function Filter({ column }: { column: Column<any, unknown> }) {
  const id = useId()
  const columnFilterValue = column.getFilterValue()
  const { filterVariant } = column.columnDef.meta ?? {}

  const columnHeader = typeof column.columnDef.header === 'string' ? column.columnDef.header : ''

  const facetedUniqueValues = column.getFacetedUniqueValues()

  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === 'range') return []

    const values = Array.from(facetedUniqueValues.keys())

    const flattenedValues = values.reduce((acc: string[], curr) => {
      if (Array.isArray(curr)) {
        return [...acc, ...curr]
      }

      return [...acc, curr]
    }, [])

    return Array.from(new Set(flattenedValues)).sort()
  }, [facetedUniqueValues, filterVariant])

  if (filterVariant === 'select') {
    return (
      <div className='w-full max-w-2xs'>
        <Label htmlFor={`${id}-select`} className='sr-only'>
          {columnHeader}
        </Label>
        <Select
          items={[
            { label: 'All', value: 'all' },
            ...sortedUniqueValues.map(value => ({
              label: String(value),
              value: String(value)
            }))
          ]}
          value={columnFilterValue?.toString()}
          onValueChange={(value: string | null) => {
            column.setFilterValue(value === 'all' || value === null ? undefined : value)
          }}
        >
          <SelectTrigger id={`${id}-select`} className='w-full capitalize'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value='all'>All</SelectItem>
              {sortedUniqueValues.map(value => (
                <SelectItem key={String(value)} value={String(value)} className='capitalize'>
                  {String(value)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className='w-full max-w-2xs'>
      <Label htmlFor={`${id}-input`} className='sr-only'>
        {columnHeader}
      </Label>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          id={`${id}-input`}
          value={(columnFilterValue ?? '') as string}
          onChange={e => column.setFilterValue(e.target.value)}
          placeholder={`Search ${columnHeader.toLowerCase()}`}
          type='text'
        />
      </InputGroup>
    </div>
  )
}

function RowActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size='icon' variant='ghost' aria-label='Edit item' />}>
        <EllipsisVerticalIcon className='size-4.5' aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Duplicate</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
