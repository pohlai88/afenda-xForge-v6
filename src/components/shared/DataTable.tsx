'use client'

// React Imports
import * as React from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import type { Table as TanstackTable } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from 'lucide-react'

// Type Imports
import type { TableDefinition } from '@/types/common/table-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ObjectCommandsButton, ObjectContextMenu } from '@/components/shared/ObjectCommands'
import DataTableToolbar from '@/components/shared/DataTableToolbar'

// Util Imports
import { cn } from '@/lib/utils'
import { deriveTableCapabilities, isNumericSemantic } from '@/types/common/table-types'
import { ariaSortFor } from '@/utils/table-utils'

/**
 * The widths of the columns the engine renders itself.
 *
 * They are constants here and nowhere else. A domain that pins its identity column must not have
 * to know that a checkbox sits to the left of it, or how wide that checkbox is — which is exactly
 * what a hand-written sticky offset in a view would encode.
 */
const SELECT_COLUMN_WIDTH = 40
const COMMANDS_COLUMN_WIDTH = 48

type Props<TRow> = {
  definition: TableDefinition<TRow>

  /**
   * The TanStack instance, owned by the caller.
   *
   * The engine does not create it, because who owns sorting, filters and pagination is a caller
   * decision — the run workspace keeps them in URL state, a settings list keeps them local — and
   * an engine that owned them would force every table into the same answer. This is also what lets
   * `manual` server-driven operation work without a data-fetching layer in here.
   */
  table: TanstackTable<TRow>

  /**
   * False when this table is mounted but not the surface the user is on.
   *
   * A workspace can keep an inactive tab's table mounted. Such a table must not participate in
   * keyboard navigation, focus, selection targeting or context-menu targeting — its rows are real
   * DOM the user cannot see, and letting them answer a right-click or a command means acting on a
   * row nobody is looking at. The engine never guesses this from viewport or visibility; the
   * workspace that owns the tabs says so.
   */
  active?: boolean

  /** Rows are being fetched. Skeletons hold the table's height so the page does not jump. */
  loading?: boolean

  /** The table's accessible name, rendered as a caption for screen readers. */
  caption: string

  /**
   * Search text and its setter, when this surface offers search.
   *
   * State rather than a predicate: what a search *means* — which fields of the identity a person
   * expects to match — is the domain's, and it expresses that through the TanStack instance it
   * already owns. The engine owns the control, its placement and when it is offered at all.
   */
  search?: string
  onSearchChange?: (value: string) => void
  className?: string
}

/**
 * Afenda's one business-table interaction engine.
 *
 * Domains describe a table through `TableDefinition` and supply rows; everything about how a table
 * behaves lives here. There are no domain branches in this file, and there must never be: a new
 * domain table should need a definition, not an edit to the engine.
 *
 * Every control is behind a capability that has already survived the semantic, permission and task
 * gates in `deriveTableCapabilities`. Support is not chrome — the engine can select, export and
 * command, and renders none of it for a table that has not earned it.
 *
 * Grouping and row expansion are declared in the contract and deliberately render nothing: no
 * Afenda dataset needs them, and the seam exists so the first one that does extends this file
 * rather than inventing a second table.
 */
const DataTable = <TRow,>({
  definition,
  table,
  active = true,
  loading = false,
  caption,
  search,
  onSearchChange,
  className
}: Props<TRow>) => {
  const router = useRouter()
  const capabilities = deriveTableCapabilities(definition)
  const rows = table.getRowModel().rows
  const leafColumns = table.getVisibleLeafColumns()

  // Only an active table offers commands. Inactive rows still render, so a hidden tab keeps its
  // scroll position and layout, but they are inert.
  const interactive = active && capabilities.rowCommands && definition.getObject && definition.getCommands

  /*
   * Whether the overflow column is worth a column of the table's width.
   *
   * A menu whose only item is the command a click already runs offers nothing: the row activates,
   * the identity control activates, and the menu repeats them. That is chrome under
   * `capability_without_chrome`, so a table whose whole command vocabulary is its own activation
   * renders no overflow column at all. Right-click still works — it costs no space, and everything
   * in it remains reachable without a pointer through the row's identity control.
   *
   * Asked of every row rather than the page, so the column cannot appear and disappear as someone
   * pages or filters. `some` stops at the first row that earns it, which is every table that has a
   * real menu.
   */
  const offersMenu =
    capabilities.rowCommands &&
    (definition.onOpenProperties !== undefined ||
      table
        .getCoreRowModel()
        .rows.some(row =>
          definition.getCommands!(row.original).some(
            command => command.id !== definition.getDefaultCommandId?.(row.original)
          )
        ))

  const columnCount = leafColumns.length + (capabilities.select ? 1 : 0) + (offersMenu ? 1 : 0)

  // Alignment is read from meaning, not from a per-table list of column ids. Money, counts and
  // percentages are the figures a reader scans down, so the engine right-aligns them everywhere
  // rather than each table remembering which of its own columns are numeric.
  const declared = new Map(definition.columns.map(column => [column.id, column]))
  const isNumeric = (columnId: string) => isNumericSemantic(declared.get(columnId)?.semantic)

  /*
   * Pinning, measured across the sequence the engine actually renders.
   *
   * `getStart('left')` cannot be used: it sums the declared widths of the *TanStack* columns before
   * this one, and the checkbox and command columns are the engine's own markup rather than columns
   * in that model, so every offset would be short by their width. Walking the rendered sequence
   * here is what lets a domain say `pinned: true` on its identity column and know nothing else —
   * no widths, no neighbours, no sticky CSS.
   *
   * Only a leading run of pinned columns is meaningful, which is what left pinning means, so the
   * walk stops at the first column that does not ask for it.
   */
  const leftOffset = new Map<string, number>()
  let runningOffset = capabilities.select ? SELECT_COLUMN_WIDTH : 0

  for (const column of leafColumns) {
    if (!declared.get(column.id)?.pinned) break

    leftOffset.set(column.id, runningOffset)
    runningOffset += column.getSize()
  }

  const pinning = leftOffset.size > 0
  const lastPinnedId = [...leftOffset.keys()].at(-1)

  const pinnedStyle = (columnId: string): React.CSSProperties | undefined => {
    const left = leftOffset.get(columnId)

    if (left === undefined) return undefined

    // A pinned column only lands where the offsets say it does if it also renders at the width
    // those offsets were summed from, hence the triple rather than a width hint.
    const width = table.getColumn(columnId)?.getSize()

    return { left, width, minWidth: width, maxWidth: width }
  }

  /*
   * `bg-inherit` takes the row's own background, so a pinned cell keeps the hover, selected and
   * emphasis tints instead of punching an untinted hole in the row. Those tints are translucent,
   * which would let the scrolling columns show through, so an opaque card layer sits behind them.
   * The seam border marks where the frozen block ends, on the last pinned column only.
   */
  const pinnedClass = (columnId: string, header = false) =>
    leftOffset.has(columnId) &&
    cn(
      'sticky bg-inherit before:bg-card before:absolute before:inset-0 before:-z-10',
      header ? 'z-30' : 'z-10',
      columnId === lastPinnedId && 'after:border-border after:absolute after:inset-y-0 after:-right-px after:border-r'
    )

  // Density is a property of the reading task, decided once here so "compact" means the same
  // thing in every table rather than each one picking its own row height.
  const compact = definition.density === 'compact'
  const headCellClass = compact ? 'text-muted-foreground h-10 text-xs first:pl-4 last:pr-4' : 'first:pl-6 last:pr-6'
  const bodyCellClass = compact ? 'py-1.5 first:pl-4 last:pr-4' : 'first:pl-6 last:pr-6'

  // Pagination presentation is the engine's; the page state, page size and row count remain the
  // caller's, which is what lets a server-paged table report a total it alone knows.
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()
  const filteredRows = table.getFilteredRowModel().rows
  const rowCount = filteredRows.length
  const pageSizes = definition.pageSizes ?? []
  const resizable = pageSizes.length > 1
  const paginated = capabilities.paginate && (pageCount > 1 || resizable)
  const firstOnPage = pageIndex * pageSize + 1
  const lastOnPage = Math.min((pageIndex + 1) * pageSize, rowCount)

  const noun = definition.noun
  const nounFor = (count: number) => (noun ? (count === 1 ? noun.one : noun.many) : null)
  const countLabel = (count: number) => [count, nounFor(count)].filter(Boolean).join(' ')

  const selectedRows = capabilities.bulk ? table.getSelectedRowModel().rows.map(row => row.original) : []
  const bulkActions = selectedRows.length > 0 ? (definition.selection?.bulkActions(selectedRows) ?? []) : []

  // The header checkbox selects a page, which silently means "the 25 I could see" on a filtered
  // table with more matches behind it. Saying so, and offering the rest, is a mechanic every
  // paginated selectable table needs — not something each domain should remember to build.
  const selectAllFiltered = () => table.setRowSelection(Object.fromEntries(filteredRows.map(row => [row.id, true])))

  // The command a row activates with, named by the domain rather than inferred from command order.
  const activationFor = (row: TRow) => {
    const id = definition.getDefaultCommandId?.(row)

    if (!id) return undefined

    return definition.getCommands?.(row).find(command => command.id === id)
  }

  // Mouse convenience only: the activation command is also in the menu and on the row's own
  // anchor, so nothing here is the sole route to it. Clicks landing on a control inside the row
  // belong to that control, or the commands menu would open and the row would navigate out from
  // under it.
  //
  // The menu roles matter as much as the controls. A dropdown's content is portalled out of the
  // row in the DOM but still bubbles to it through the React tree, so choosing Properties from the
  // ellipsis menu reached this handler and activated the row underneath — the exact collision the
  // guard exists to stop. A click that started inside a popup surface is that surface's business.
  const handleRowClick = (row: TRow) => (event: React.MouseEvent<HTMLTableRowElement>) => {
    const target = event.target as HTMLElement

    if (target.closest('button, a, [role=checkbox], input, [role=menu], [role=menuitem], [role=dialog]')) return

    const command = activationFor(row)

    if (!command) return

    if (command.href) router.push(command.href)
    else command.onSelect?.()
  }

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-col', className)}>
      <DataTableToolbar
        definition={definition}
        table={table}
        capabilities={capabilities}
        search={search}
        onSearchChange={onSearchChange}
      />

      {bulkActions.length > 0 ? (
        <div
          role='region'
          aria-live='polite'
          className='bg-muted/40 flex flex-wrap items-center gap-2 border-b px-4 py-2 text-sm'
        >
          <span className='font-medium tabular-nums'>
            {selectedRows.length === rowCount
              ? `All ${countLabel(selectedRows.length)} selected`
              : `${countLabel(selectedRows.length)} selected`}
          </span>
          {selectedRows.length < rowCount ? (
            <Button variant='link' size='sm' className='h-auto p-0' onClick={selectAllFiltered}>
              Select all {rowCount} matching these filters
            </Button>
          ) : null}
          <Separator orientation='vertical' className='h-4!' />
          {bulkActions.map(action => (
            <Button
              key={action.id}
              variant={action.destructive ? 'destructive' : 'outline'}
              size='sm'
              onClick={action.onSelect}
            >
              {action.icon ? <action.icon /> : null}
              {action.label}
            </Button>
          ))}
          <Button variant='ghost' size='sm' className='ms-auto' onClick={() => table.resetRowSelection()}>
            Clear selection
          </Button>
        </div>
      ) : null}

      {/*
        The engine owns horizontal overflow. A dense table scrolls inside this box against whatever
        width its container gives it, so the page itself never gains a horizontal scrollbar and the
        pinned block stays put against this scrollport rather than the viewport.
      */}
      <div className='min-h-0 min-w-0 flex-1 overflow-auto'>
        <Table aria-busy={loading || undefined}>
          <caption className='sr-only'>{caption}</caption>
          <TableHeader className='bg-card sticky top-0 z-20'>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className={cn(pinning && 'bg-card', compact && 'h-10')}>
                {capabilities.select ? (
                  <TableHead
                    style={pinning ? { left: 0, width: SELECT_COLUMN_WIDTH, minWidth: SELECT_COLUMN_WIDTH } : undefined}
                    className={cn(
                      'w-10',
                      pinning && 'before:bg-card sticky z-30 bg-inherit before:absolute before:inset-0 before:-z-10'
                    )}
                  >
                    <Checkbox
                      checked={table.getIsAllPageRowsSelected()}
                      indeterminate={table.getIsSomePageRowsSelected()}
                      onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
                      aria-label='Select all rows on this page'
                    />
                  </TableHead>
                ) : null}
                {headerGroup.headers.map(header => {
                  const numeric = isNumeric(header.column.id)
                  const sorted = header.column.getIsSorted()
                  const label = declared.get(header.column.id)?.label ?? header.column.id

                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={ariaSortFor(header.column)}
                      style={pinnedStyle(header.column.id)}
                      className={cn(headCellClass, numeric && 'text-right', pinnedClass(header.column.id, true))}
                    >
                      {header.isPlaceholder ? null : capabilities.sort && header.column.getCanSort() ? (
                        <span
                          role='button'
                          tabIndex={0}
                          aria-label={`Sort by ${label}`}
                          className={cn('flex cursor-pointer items-center gap-1 select-none', numeric && 'justify-end')}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              header.column.getToggleSortingHandler()?.(event)
                            }
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ChevronUpIcon className='size-4 shrink-0 opacity-60' aria-hidden='true' />
                          ) : null}
                          {sorted === 'desc' ? (
                            <ChevronDownIcon className='size-4 shrink-0 opacity-60' aria-hidden='true' />
                          ) : null}
                        </span>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
                {offersMenu ? (
                  <TableHead style={{ width: COMMANDS_COLUMN_WIDTH }}>
                    <span className='sr-only'>Commands</span>
                  </TableHead>
                ) : null}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array.from({ length: columnCount }).map((__, cell) => (
                    <TableCell key={`skeleton-${index}-${cell}`} className={bodyCellClass}>
                      <Skeleton className='h-4 w-full' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className='h-32 text-center'>
                  <div className='text-muted-foreground flex flex-col items-center gap-2 text-sm'>
                    <span>{definition.emptyState.message}</span>
                    {definition.emptyState.onClear ? (
                      <Button variant='link' size='sm' onClick={definition.emptyState.onClear}>
                        Clear filters
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => {
                const emphasis = definition.getRowState?.(row.original) === 'emphasis'
                const activates = activationFor(row.original) !== undefined

                const cells = (
                  <>
                    {capabilities.select ? (
                      <TableCell
                        style={
                          pinning ? { left: 0, width: SELECT_COLUMN_WIDTH, minWidth: SELECT_COLUMN_WIDTH } : undefined
                        }
                        className={cn(
                          'w-10',
                          compact && 'py-1.5',
                          pinning && 'before:bg-card sticky z-10 bg-inherit before:absolute before:inset-0 before:-z-10'
                        )}
                      >
                        <Checkbox
                          checked={row.getIsSelected()}
                          onCheckedChange={value => row.toggleSelected(!!value)}
                          aria-label={`Select ${definition.getObject?.(row.original).label ?? 'row'}`}
                        />
                      </TableCell>
                    ) : null}
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        style={pinnedStyle(cell.column.id)}
                        className={cn(bodyCellClass, pinnedClass(cell.column.id))}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                    {offersMenu ? (
                      <TableCell className={cn(bodyCellClass, 'w-12')}>
                        {interactive ? (
                          <ObjectCommandsButton
                            object={definition.getObject!(row.original)}
                            commands={definition.getCommands!(row.original)}
                            onOpenProperties={
                              definition.onOpenProperties ? () => definition.onOpenProperties!(row.original) : undefined
                            }
                          />
                        ) : null}
                      </TableCell>
                    ) : null}
                  </>
                )

                const rowClass = cn(pinning && 'bg-card', compact && 'h-11')

                if (!interactive) {
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() || emphasis ? 'selected' : undefined}
                      className={rowClass}
                    >
                      {cells}
                    </TableRow>
                  )
                }

                return (
                  <ObjectContextMenu
                    key={row.id}
                    object={definition.getObject!(row.original)}
                    commands={definition.getCommands!(row.original)}
                    onOpenProperties={
                      definition.onOpenProperties ? () => definition.onOpenProperties!(row.original) : undefined
                    }
                    render={
                      <TableRow
                        data-state={row.getIsSelected() || emphasis ? 'selected' : undefined}
                        className={cn(rowClass, 'hover:bg-muted/50', activates && 'cursor-pointer')}
                        onClick={activates ? handleRowClick(row.original) : undefined}
                      />
                    }
                  >
                    {cells}
                  </ObjectContextMenu>
                )
              })
            )}
          </TableBody>

          {definition.footer}
        </Table>
      </div>

      {paginated ? (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 border-t',
            compact ? 'px-4 py-2' : 'px-6 py-4'
          )}
        >
          <span
            className={cn('text-muted-foreground tabular-nums', compact ? 'text-xs' : 'text-sm')}
            aria-live='polite'
          >
            {rowCount === 0 ? `No ${noun?.many ?? 'rows'}` : `Showing ${firstOnPage}–${lastOnPage} of ${rowCount}`}
            {capabilities.select && selectedRows.length > 0 ? ` · ${selectedRows.length} selected` : null}
          </span>
          <div className='flex items-center gap-3'>
            {resizable ? (
              <div className='hidden items-center gap-2 @xl:flex'>
                <span className='text-muted-foreground text-xs'>Rows</span>
                <Select value={String(pageSize)} onValueChange={value => value && table.setPageSize(Number(value))}>
                  <SelectTrigger size='sm' className='w-16' aria-label='Rows per page'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizes.map(size => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <span className={cn('text-muted-foreground tabular-nums', compact ? 'text-xs' : 'text-sm')}>
              Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
            </span>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size={compact ? 'icon-sm' : 'icon'}
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label='Previous page'
              >
                <ChevronLeftIcon className='size-4' />
              </Button>
              <Button
                variant='outline'
                size={compact ? 'icon-sm' : 'icon'}
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label='Next page'
              >
                <ChevronRightIcon className='size-4' />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default DataTable
