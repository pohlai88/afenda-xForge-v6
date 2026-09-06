/**
 * The table engine's contract: what a business table *is*, independent of which domain owns it.
 *
 * A domain describes its table once — rows, columns and their meaning, how a row resolves to a
 * business object, what commands it offers — and the engine derives the interaction from that.
 * The engine holds no domain branches; if it ever needs to know a table is payroll's, the
 * abstraction has leaked.
 *
 * The governing rule is that **support is not chrome**. A capability existing in this contract
 * says the engine can do it; whether a control appears is decided three times over — the data must
 * make it meaningful, the user must be permitted it, and the task must call for it. Doctrine
 * `capability_without_chrome` (D07) and `task_adaptation` (D16).
 *
 * Doctrine: `table_engine` (D13) in `.architecture/ux/afenda-ui-ux-doctrine.yaml`.
 */

import type { ReactNode } from 'react'

import type { ObjectCommand, ObjectContext } from '@/types/common/object-context-types'

/**
 * What a column *means*, which is not the same as what it stores.
 *
 * Two money columns and a percentage are all numbers to JavaScript, but only money sums, and
 * summing a percentage produces a figure that is always wrong. The vocabulary is deliberately
 * drawn from columns this repo actually has rather than from a general taxonomy — add a member
 * when a real column needs one, not in advance.
 *
 * - `identity` — the name a person calls the row: a run reference, an employee's name.
 * - `identifier` — a code that identifies but does not describe: employee number.
 * - `status` — a value from a closed lifecycle vocabulary, so it filters as a set, not free text.
 * - `relation` — a pointer to another business object: department, location, legal entity.
 * - `signal` — an ordered business condition: severity, standing, or lifecycle rank. Payroll's
 *   blockers-and-warnings summary and a filing's status order are both this. Its stored value is
 *   a **rank**, not the thing a person names, which is what separates it from `status`.
 *
 *   `signal` MAY be sorted by its rank and filtered by a domain vocabulary. It MUST NOT be summed
 *   or averaged, MUST NOT be faceted (the rank is not the option values), and its rank MUST NOT
 *   be read as a quantity — a row scoring 300 is not three times one scoring 100. Use `status`
 *   when the column stores the state itself and its values are the filter's values; use
 *   `quantity` when the number is a real count someone would total. A column that is merely
 *   interesting is neither.
 */
export type ColumnSemantic =
  | 'identity'
  | 'identifier'
  | 'text'
  | 'money'
  | 'quantity'
  | 'percentage'
  | 'date'
  | 'datetime'
  | 'status'
  | 'relation'
  | 'signal'

/**
 * `set` and `vocabulary` are both multi-select, and the difference between them is the whole
 * reason both exist: a `set` filter's options *are* the column's own values, so faceted counts
 * line up with them, while a `vocabulary` filter's options come from the domain and the column
 * stores something else. Counting a vocabulary against a derived rank would silently produce zero
 * for every option.
 */
export type ColumnFilterKind = 'none' | 'text' | 'numeric' | 'date' | 'set' | 'vocabulary'

/**
 * `aggregate` is only ever `sum`: an average of a column the engine does not understand is a guess.
 * `groupable` marks a column whose values form meaningful buckets — declared now, rendered when a
 * dataset needs it.
 */
export type ColumnCapabilities = {
  sortable: boolean
  filter: ColumnFilterKind
  aggregate: 'none' | 'sum'
  groupable: boolean
  searchable: boolean
}

/**
 * What each meaning permits. A column may narrow this, never widen it: the point is that no
 * surface can offer to total a percentage or free-text-search a status.
 */
export const COLUMN_SEMANTICS: Record<ColumnSemantic, ColumnCapabilities> = {
  identity: { sortable: true, filter: 'text', aggregate: 'none', groupable: false, searchable: true },
  identifier: { sortable: true, filter: 'text', aggregate: 'none', groupable: false, searchable: true },
  text: { sortable: true, filter: 'text', aggregate: 'none', groupable: false, searchable: true },
  money: { sortable: true, filter: 'numeric', aggregate: 'sum', groupable: false, searchable: false },
  quantity: { sortable: true, filter: 'numeric', aggregate: 'sum', groupable: false, searchable: false },
  percentage: { sortable: true, filter: 'numeric', aggregate: 'none', groupable: false, searchable: false },
  date: { sortable: true, filter: 'date', aggregate: 'none', groupable: false, searchable: false },
  datetime: { sortable: true, filter: 'date', aggregate: 'none', groupable: false, searchable: false },
  status: { sortable: true, filter: 'set', aggregate: 'none', groupable: true, searchable: false },
  relation: { sortable: true, filter: 'set', aggregate: 'none', groupable: true, searchable: false },
  signal: { sortable: true, filter: 'vocabulary', aggregate: 'none', groupable: false, searchable: false }
}

/**
 * A column as the domain declares it, alongside its TanStack definition rather than replacing it —
 * the engine adds meaning around TanStack, so nothing already built has to be rewritten to adopt
 * the engine.
 *
 * `capabilities` narrows only; omit it to take the semantic's defaults. `isAnchor` marks the
 * column carrying the row's identity control — its link or name button, and the Shift+F10 target.
 * `label` is what a person calls the column in a filter or column menu.
 */
export type TableColumn = {
  id: string
  label: string
  semantic: ColumnSemantic
  capabilities?: Partial<ColumnCapabilities>
  isAnchor?: boolean
  hideable?: boolean
  pinned?: boolean
}

export const columnCapabilities = (column: TableColumn): ColumnCapabilities => ({
  ...COLUMN_SEMANTICS[column.semantic],
  ...column.capabilities
})

/**
 * Whether a column's own values are also its filter values, which is the precondition for
 * trustworthy facet counts.
 *
 * A `set` filter reads the accessor directly, so TanStack's faceted counts line up with the
 * options. A `signal` column stores a derived rank — payroll's exceptions column is
 * `openBlockers * 100 + openWarnings` — so its `vocabulary` filter cannot be faceted, and counting
 * it would silently show every option as zero rather than error. This is why the engine derives
 * faceting from meaning instead of taking a flag: a hand-set `faceted: true` is a claim about the
 * accessor that nothing checks.
 */
export const isFacetable = (column: TableColumn) => columnCapabilities(column).filter === 'set'

/**
 * Whether a column's values are figures a reader scans down a column edge.
 *
 * Alignment is derived here rather than listed per table, which is what stops two tables
 * right-aligning different things. `signal` is deliberately excluded: it sorts by a number but
 * renders as a set of badges, and a right-aligned header over left-packed badges reads as broken.
 */
export const isNumericSemantic = (semantic: ColumnSemantic | undefined) =>
  semantic === 'money' || semantic === 'quantity' || semantic === 'percentage'

/**
 * Selection exists because there is something to do with a selection.
 *
 * Doctrine `capability_without_chrome`: a checkbox column that leads nowhere is chrome, so the
 * bulk actions are what switch selection on rather than a flag. Actions are resolved per
 * selection, so a domain can withhold one the current rows do not qualify for.
 */
export type TableSelection<TRow> = {
  bulkActions: (rows: TRow[]) => ObjectCommand[]
}

/**
 * A filter the domain declares and the engine operates.
 *
 * The split is the point. The domain owns which dimensions are worth filtering and what their
 * values are called — payroll status, exception severity, department — because those are business
 * vocabulary the engine cannot derive. The engine owns the multi-select control, the active count,
 * reset, the consolidated form for a narrow container, and the filter state itself.
 *
 * Counts are not a property of the filter. They appear when `isFacetable` says the target column's
 * own values are these option values, and are absent otherwise, so no filter can imply a row
 * behind an option that nothing matches.
 */
export type TableFilterOption = {
  value: string
  label: string
}

export type TableFilter = {
  columnId: string
  label: string
  options: TableFilterOption[]
}

/**
 * A summary row under the table, said in columns rather than in markup.
 *
 * The split is the same one the rest of the contract makes. The domain owns whether a total is
 * meaningful at all, what it is, what unit it is in, and what to say when it cannot honestly be
 * produced — a `NoTotal` marker is as valid a `content` as a figure. The engine owns where those
 * values land.
 *
 * A domain names the column each figure belongs under and counts nothing. It must not know that a
 * checkbox column exists, or an overflow column, or that either can disappear: the engine lays the
 * row out over the sequence it actually renders, so adding or removing a structural column can
 * never leave a footer one cell short. A hand-written `colSpan` in a view is exactly the bug this
 * type exists to make unwritable.
 *
 * `label` occupies the columns before the first figure, which is where a row count belongs. A
 * table whose very first column carries a figure therefore has no room for one.
 */
export type TableFooterCell = {
  columnId: string
  content: ReactNode
}

export type TableFooterRow = {
  label?: ReactNode
  cells: TableFooterCell[]
}

/**
 * How much vertical room a row gets.
 *
 * A register an approver scans thirty rows of at a time and a queue of a dozen runs want
 * different densities, and that is a property of the reading task, not of payroll. The engine
 * decides what each one looks like; a domain picks one and never styles rows itself. There is
 * deliberately no density control in the UI — the definition knows the task, the reader does not
 * need to configure it.
 */
export type TableDensity = 'comfortable' | 'compact'

/**
 * What is true, not what is missing: "No runs match" beats "No data". `onClear` is present only
 * when the emptiness is caused by a filter the user can actually clear, so the engine never offers
 * to clear filters that are not the reason.
 */
export type TableEmptyState = {
  message: string
  onClear?: () => void
}

/**
 * How rows arrive. `client` is the default; `manual` hands sorting, filtering and paging to a
 * server; `infinite` and `virtual` are declared seams — the contract admits them so a dataset that
 * needs one does not force a change to the engine's shape, and neither renders anything today.
 */
export type TableDataMode = 'client' | 'manual' | 'infinite' | 'virtual'

/**
 * What an export actually covers.
 *
 * INVARIANT: the engine may only claim completeness it can prove. In `client` mode it holds every
 * row, so a filtered export is genuinely `all`. Under `manual`, `infinite` or `virtual` the client
 * holds a page and the source holds the rest, so the same call is `loaded` — and the domain, which
 * owns the source, decides whether to export what is loaded or go and fetch the remainder.
 *
 * Without this an export silently produces a partial file that looks complete, which is the worst
 * possible failure for a payroll register.
 */
export type TableExportScope = 'all' | 'loaded'

export const exportScopeOf = (mode: TableDataMode | undefined): TableExportScope =>
  mode === undefined || mode === 'client' ? 'all' : 'loaded'

/**
 * Grouping and row expansion, declared and deliberately unrendered.
 *
 * No Afenda dataset needs either yet. They live here so the capability model is complete and the
 * engine has one place to grow into, rather than a domain inventing a parallel expandable table
 * the day a hierarchy appears. `deriveTableCapabilities` reports them as declared; the engine
 * renders nothing until a real dataset arrives.
 */
export type TableGrouping = {
  columnId: string
}

export type TableExpansion<TRow> = {
  getSubRows: (row: TRow) => TRow[] | undefined
}

/**
 * Which capabilities the current user may exercise, **for presentation only**.
 *
 * INVARIANT: this is not an authorization boundary. Hiding a control is not enforcement — anything
 * reachable from the client is reachable without the control, so the domain and the server remain
 * responsible for refusing the operation. A `false` here says "do not offer this", never "this
 * cannot happen". Treating it as a security decision is the mistake this comment exists to prevent.
 *
 * Omitted means permitted: a domain with no permission model should not have to write one.
 * Permissions gate chrome, never truth — a user who may not export still sees every row they are
 * entitled to.
 */
export type TablePermissions = {
  select?: boolean
  export?: boolean
  rowCommands?: boolean
}

/**
 * The named capabilities of a table, in the engine's vocabulary rather than TanStack's.
 */
export type TableCapability =
  | 'sort'
  | 'filter'
  | 'search'
  | 'paginate'
  | 'select'
  | 'bulk'
  | 'rowCommands'
  | 'columnVisibility'
  | 'export'
  | 'aggregate'
  | 'group'
  | 'expand'

/**
 * One table, described once.
 *
 * Rows are passed separately and never live here — this describes the shape of a table, not an
 * instance of its data. `id` is stable across renders and reloads because it scopes state, not
 * just React keys. The object and command resolvers are present when rows are business objects
 * and absent for a table of lines or configuration rows.
 *
 * `task` narrows what the surface offers without changing what the table *can* do: the same
 * definition used for reviewing a run and for glancing at one differs only here.
 */
export type TableDefinition<TRow> = {
  id: string
  getRowId: (row: TRow) => string
  columns: TableColumn[]
  getObject?: (row: TRow) => ObjectContext
  getCommands?: (row: TRow) => ObjectCommand[]
  onOpenProperties?: (row: TRow) => void

  /**
   * The command run when a row is activated — clicked, or Enter on its anchor.
   *
   * Named explicitly because CRUD-SAP answers a different question. A family says *what kind of
   * operation* a command is; activation says *what should happen to this object*. Inferring one
   * from the other made command order load-bearing, so reordering a menu silently changed what a
   * click did, and a second `read` command — View audit trail — was only ever one array position
   * away from becoming the default.
   *
   * A resolver rather than a bare id because rows of the same type can differ: a closed run and an
   * open one may activate differently. Returning `undefined` means this row does not activate, and
   * the engine then renders it without the pointer affordance rather than pretending.
   */
  getDefaultCommandId?: (row: TRow) => string | undefined
  selection?: TableSelection<TRow>
  emptyState: TableEmptyState
  onExport?: (rows: TRow[], scope: TableExportScope) => void
  getRowState?: (row: TRow) => TableRowState

  /**
   * What one of these rows is called, so the engine can say "3 employees selected" and "No
   * employees" rather than "3 selected" and "Nothing to show". Content, in the same class as
   * `emptyState.message` and the table's caption — the engine still owns every mechanic around it.
   */
  noun?: { one: string; many: string }
  filters?: TableFilter[]
  density?: TableDensity

  /**
   * The page sizes this table offers. One entry, or none, means the size is fixed and the engine
   * renders no selector.
   */
  pageSizes?: number[]
  footer?: TableFooterRow
  mode?: TableDataMode
  grouping?: TableGrouping
  expansion?: TableExpansion<TRow>
  permissions?: TablePermissions
  task?: TableCapability[]
}

/**
 * A row's standing, in the domain's terms rather than the engine's.
 *
 * Deliberately not a className hook. A domain says a run is the one still needing work; the engine
 * decides what that looks like, so emphasis means the same thing in every table instead of each
 * one inventing its own highlight.
 */
export type TableRowState = 'default' | 'emphasis'

export type TableCapabilities = Record<TableCapability, boolean>

/**
 * What this table actually offers, after all three gates.
 *
 * A capability survives only if the data makes it meaningful, the user is permitted it, and — when
 * a task is declared — the task asks for it. This is the single place the "support is not chrome"
 * rule is enforced, so no surface can render a control the definition has not earned.
 */
export function deriveTableCapabilities<TRow>(definition: TableDefinition<TRow>): TableCapabilities {
  const columns = definition.columns.map(columnCapabilities)
  const permissions = definition.permissions ?? {}

  const meaningful: TableCapabilities = {
    sort: columns.some(column => column.sortable),

    // Declared, not inferred. Almost every column is filterable in principle, so deriving this
    // from the semantics would say "yes" for every table ever built and mean nothing.
    filter: (definition.filters?.length ?? 0) > 0,
    search: columns.some(column => column.searchable),
    paginate: definition.mode !== 'infinite',
    select: definition.selection !== undefined,
    bulk: definition.selection !== undefined,
    rowCommands: definition.getCommands !== undefined,
    columnVisibility: definition.columns.some(column => column.hideable),
    export: definition.onExport !== undefined,
    aggregate: columns.some(column => column.aggregate !== 'none'),
    group: definition.grouping !== undefined,
    expand: definition.expansion !== undefined
  }

  const permitted: TableCapabilities = {
    ...meaningful,
    select: meaningful.select && permissions.select !== false,
    bulk: meaningful.bulk && permissions.select !== false,
    export: meaningful.export && permissions.export !== false,
    rowCommands: meaningful.rowCommands && permissions.rowCommands !== false
  }

  if (!definition.task) return permitted

  const asked = new Set(definition.task)
  const entries = Object.entries(permitted) as [TableCapability, boolean][]

  return Object.fromEntries(entries.map(([name, on]) => [name, on && asked.has(name)])) as TableCapabilities
}
