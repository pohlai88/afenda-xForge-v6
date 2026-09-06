// Third-party Imports
import type { Column } from '@tanstack/react-table'

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
