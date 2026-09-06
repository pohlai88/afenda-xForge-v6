// Third-party Imports
import type { Column, FilterFn } from '@tanstack/react-table'

/**
 * Multi-select on a scalar column: keep the row when its value is one of the chosen ones.
 *
 * The mechanic behind every `set` filter, shared rather than redefined per table — the engine
 * renders the multi-select, and this is the predicate that pairs with it. A column whose stored
 * value is not what the options say needs its own predicate instead; that is a domain fact, and a
 * `signal` column is the case it exists for.
 */
export const inSet =
  <TRow>(): FilterFn<TRow> =>
  (row, columnId, filterValue: string[]) =>
    !filterValue || filterValue.length === 0 || filterValue.includes(String(row.getValue(columnId)))

/**
 * The `aria-sort` value for a table header cell.
 *
 * Screen readers announce sort state from this attribute — the chevron the sighted user reads is
 * invisible to them. WCAG expects the currently sorted column to report its direction and the
 * other sortable columns to report `none`; a column that cannot be sorted reports nothing at all,
 * because `aria-sort="none"` on every static header is noise rather than information.
 *
 * Shared rather than inlined per table: the six sortable tables in this app would otherwise each
 * carry their own copy of the same ternary, and copies drift.
 */
export const ariaSortFor = <TData, TValue>(
  column: Column<TData, TValue>
): 'ascending' | 'descending' | 'none' | undefined => {
  if (!column.getCanSort()) return undefined

  const sorted = column.getIsSorted()

  if (sorted === 'asc') return 'ascending'
  if (sorted === 'desc') return 'descending'

  return 'none'
}
