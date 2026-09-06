# Payroll — Phase 01: Frontend Architecture

Discovery report. No production code changed, nothing installed.

---

## Headline: the workspace in §6 already exists

`/payroll/runs/[runId]` is built, at 4,505 lines across 24 components, and it already implements
most of the hypothesis in the brief — header, metric strip, tabs, toolbar, dense table, bulk
actions, exceptions, audit, and a stage bar. Seven payroll routes are live, every mutation goes
through a server action, and permissions are enforced server-side.

So this phase is **not** an architecture proposal for a greenfield screen. It is a delta report:
what exists, where the brief's model and the built model genuinely differ, and the small number
of Studio techniques worth importing. Treating §6 as a build order would mean rewriting a working
workspace to arrive at roughly the same place.

There is one substantive design disagreement (the employee Sheet, §9) and it is called out in E.

---

## A. Existing repository assets

### Routes (all built)

| Route                   | What it is                                                   |
| ----------------------- | ------------------------------------------------------------ |
| `/payroll`              | Overview dashboard                                           |
| `/payroll/runs`         | Run queue — focal run, year to date, all runs                |
| `/payroll/runs/[runId]` | **The operations workspace**                                 |
| `/payroll/payments`     | Funding vs obligation, readiness gates, batches, settlements |
| `/payroll/compliance`   | Statutory filings, inspector, stage rail                     |
| `/payroll/reports`      | Eight reports, CSV + Excel, recent exports                   |
| `/payroll/settings`     | Ten sections, `?section=` in the URL                         |

In flight on this branch (uncommitted): `/payroll/entities/[entityId]`, `src/views/payroll/group/*`,
FX consolidation types, and a lineage Sheet. Five legal entities are seeded across SG / MY / VN.

### The workspace as built

```
PayrollRunWorkspace (client, 811 LOC)
├── CalculationStaleBanner      persistent while PayRun.pendingInputs is set
├── PayrollRunHeader            period, pay group, status, payday countdown, calc #, actions
├── PayrollStageBar             6 stages: inputs → calculate → review → approve → pay → close
├── PayrollMetricRow            6 figures on one baseline, @container, rules not cards
└── Tabs (?view=)
    ├── employees        PayrollTableToolbar · PayrollBulkActions · PayrollRunTable
    │                    → PayrollEmployeeDrilldown replaces the table (?employee=)
    ├── exceptions       ExceptionSummary · ExceptionList → ExceptionInspector (Sheet)
    ├── reconciliation   current vs previous, gross-to-net, by department, largest movers
    └── audit            PayrollAuditTimeline
```

### Directly reusable, no change needed

- **Primitives** — 50 in `src/components/ui`, all Base UI. `table`, `sheet`, `dialog`, `popover`,
  `dropdown-menu`, `command`, `tabs`, `badge`, `timeline`, `scroll-area`, `toggle-group`,
  `skeleton`, `sonner`, `resizable`, `chart`.
- **Table pattern** — TanStack directly per view; there is no `DataTable` wrapper abstraction and
  none should be introduced. Dense `h-11` rows, `h-10` sticky header, right-aligned `tabular-nums`,
  `aria-sort` via `ariaSortFor`, 25/50/100 page sizes, `location` hidden by default.
- **Toolbar pattern** — `FacetFilter` = Popover + Command + count badge on the trigger, plus
  `InputGroup` search and a `DropdownMenuCheckboxItem` column menu. This is already the shadcn
  faceted-filter idiom, built on Base UI.
- **Vocabularies, decided once** in `utils/payroll-metrics.ts` and `utils/payroll-workspace.ts`:
  run status, six stages, exception severity (blocking/error/warning/info) + derived status,
  employee payroll status, payment status. Every label and every token pairing lives in one map.
- **Money** — minor-unit integers, formatted at the edge by `utils/money.ts`. No `Intl` in
  server-rendered code, no clock reads inside components.
- **Data flow** — the server component joins once (`buildRunRows`) and hands finished
  `PayrollRunRow[]` to the client; the workspace is keyed on `calculationVersion` so a
  recalculation remounts rather than merging stale rows.
- **Permissions** — 9 `PayrollPermission` values, `actorFor()` from Access roles, `can()` in the
  interface, enforced again in every action. The UI hiding a control is a courtesy, not the gate.
- **Approval** — `evaluatePayrollApproval` is one policy read by both the dialog and the action.
- **Shell** — sidebar, header, theme, and a global `CommandMenu` that already indexes 6 payroll
  destinations from `src/assets/data/search.ts`.

### Genuine gaps found

1. **No column pinning.** The employee identity column scrolls away horizontally. This is the one
   real §8C miss.
2. **No `error.tsx`** anywhere under `/payroll`, and only one `loading.tsx`
   (`runs/[runId]`). Six routes have no streaming skeleton and none have an error boundary.
3. **No saved views.** Column visibility and filters are session-local; nothing persists.
4. **Two unused dependencies** — `vaul` (0 imports) and `@stepperize/react` (0 imports).
5. **Container queries used once**, in `payroll-metric-row.tsx`. The toolbar and table still key
   off viewport breakpoints, which is wrong when the sidebar can take 260px.
6. **Naming collision risk** — the brief says "Findings", the codebase says "Exceptions",
   consistently, in types, utils, vocabularies and server actions.

---

## B. Studio discoveries

Catalogue actually queried: **101 pages, 824 blocks, 902 components** = 1,827 items, paged in full
through the CLI and searched across every theme in the brief's list.

### Two findings that change the resource hierarchy

**1. The `@ss-pages` tier is empty for this domain.** All 101 pages are marketing: about, blog,
changelog, contact, error, FAQ, feature, integrations, landing, pricing. There is no admin,
dashboard, finance, or workspace page in the tier. `@ss-pages/landing-page-01` also declares
`radix-ui` in its dependencies. For Payroll the page tier is REJECT wholesale — not on quality,
on absence.

**2. The Base UI incompatibility is much narrower than assumed.** Because `components.json` sets
`"style": "base-vega"`, the registry serves `src/registry/base/**`. Every candidate sampled —
6 blocks and 4 components — has **zero `@radix-ui` imports**, and `registryDependencies` such as
`table`, `checkbox`, `select` resolve to the Base UI primitives this repo already has
(`shadcn view checkbox` returns `@base-ui/react/checkbox`).

> This contradicts the standing note in `.claude/commands/{cui,iui,rui}.md` that "Studio blocks are
> shadcn `new-york` on Radix". That was true of the default style; it is not true at `base-vega`.
> Those three files should be corrected — separately from this phase.

The residual incompatibility is **palette colour**, and it is confined to blocks:
`datatable-component-05` uses 18 palette classes (`text-green-600`, `bg-sky-400/10`, …) in
light/dark pairs. This repo has **0 palette classes and 0 hex values** in `src/views` and
`src/app`, verified. Components (`data-table-*`, `stepper-*`) carry none.

So the gate is: `dependencies` contains `radix-ui` → REJECT · block with palette classes → ADAPT
(retokenise) · component with none → may install.

### Ranked

#### ADOPT — one item

| Item                           | Type      | Pattern                                                                                   | Deps                                                                                                     | Where                                             |
| ------------------------------ | --------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `@ss-components/data-table-07` | component | **Column pinning** — `column.getIsPinned()` + computed sticky offsets, synced header/body | `@tanstack/react-table` (installed); reg: button, dropdown-menu, table (all present, Base UI); 0 palette | The employee identity column in `PayrollRunTable` |

Adopt the _technique_ into `payroll-run-table.tsx`, not the file. It is ~40 lines of pin-offset
logic and it closes the one real §8C gap.

#### ADAPT — worth building from, with retokenising

| Item                                   | Pattern                                           | Note                                                                                                    |
| -------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `@ss-components/data-table-02`         | Density selection                                 | Row-height toggle for long sessions. 0 palette. Pairs with §12's 1024px band.                           |
| `@ss-components/data-table-06` / `-09` | Row expansion / sub-rows                          | Inline earnings breakdown without leaving the table. Evaluate against the drilldown — do not ship both. |
| `@ss-blocks/empty-state-08`            | Finance/report empty state with placeholder tiles | 0 palette. Fills the missing empty states on reports and compliance.                                    |

#### REFERENCE — read, do not import

| Item                                        | Why reference only                                                                                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@ss-blocks/statistics-component-12`, `-13` | Financial status tiles and goal-progress metrics. `PayrollMetricRow` is already better for this job: one baseline for cross-reading, container-query columns. 12 palette classes each. |
| `@ss-blocks/datatable-component-05`         | Invoice datatable, filters + bulk + pagination. Structurally equal to the existing toolbar; 18 palette classes. Nothing to gain.                                                       |
| `@ss-blocks/widget-component-28`            | Dotted activity timeline. Repo has a `timeline` primitive and `PayrollAuditTimeline`.                                                                                                  |
| `@ss-components/stepper-01…12`              | §11 explicitly does not want a giant stepper, and `PayrollStageBar` is deliberately not a wizard. Adopting one would install `@stepperize/react`, currently unused.                    |
| `@ss-components/data-table-12`              | Export via papaparse + xlsx — both already installed, and `export-payroll-utils.ts` already does this.                                                                                 |
| `@ss-components/sheet-07`                   | Sheet + table + form. Useful shape reference for the settings sheets only.                                                                                                             |

#### REJECT

- **All 101 `@ss-pages`** — marketing only; `landing-page-01` pulls `radix-ui`.
- **`application-shell-*` (18), `dashboard-shell-*` (9), `dashboard-sidebar-*` (11),
  `dashboard-header-*` (18)** — the app shell is the authority per §1. Replacing it is out of scope.
- **`@ss-themes` / `install-theme`** — `globals.css` is the design system.
- **`hero-section`, `features-section`, `testimonials`, `pricing`, `bento-grid`, `about-us-page`,
  `social-proof`, `cta-section`** — 250+ blocks, all marketing. Not applicable.

---

## C. Proposed Payroll workspace

Corrections to the §6 hypothesis, marked `[+]` new, `[=]` already built, `[~]` changed from brief.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Payroll › Runs › PR-2026-09                          DRAFT   ⟳ Recalculate  ⋯  │ [=]
│ Afenda Pte. Ltd. · Sep 2026 · Monthly · 129 employees · pays in 6 days          │ [~] entity added
├────────────────────────────────────────────────────────────────────────────────┤
│ ⚠ Inputs imported since calculation #4. Recalculate before approving.          │ [=] only when true
├────────────────────────────────────────────────────────────────────────────────┤
│ Inputs ──── Calculate ──●── Review ──── Approve ──── Pay ──── Close             │ [=] not a wizard
├────────────────────────────────────────────────────────────────────────────────┤
│ EMPLOYEES │ GROSS      │ NET        │ EMPLOYER   │ NET VAR   │ OPEN EXCEPTIONS │ [=]
│ 129       │ S$1.42M    │ S$1.11M    │ S$1.63M    │ +S$18.4K  │ 12  →           │
├────────────────────────────────────────────────────────────────────────────────┤
│ Employees   Exceptions   Reconciliation   Audit                                │ [~] 4 not 6
├────────────────────────────────────────────────────────────────────────────────┤
│ ⌕ Search   Department ▾2  Status ▾  Exceptions ▾  │  Density ▾  Columns ▾  ⤓   │ [+] density
├────────────────────────────────────────────────────────────────────────────────┤
│ ☐ │ EMPLOYEE ▸pinned  │ Dept │ Gross │ Net │ Variance │ Status │ Exc │ Payment │ [+] pin
│ ☐ │ ▸ Aisyah Rahman   │ Ops  │ 8,400 │6,712│ +2.1%    │ Review │ ⚠2  │ Ready   │
│   └ expandable: basic · allowances · OT · statutory · employer  (opt-in)       │ [+] adapt
├────────────────────────────────────────────────────────────────────────────────┤
│ Showing 1–25 of 129 · 3 selected          Rows 25 ▾   Page 1 of 6   ‹  ›        │ [=]
└────────────────────────────────────────────────────────────────────────────────┘

Selecting an employee → full-width drilldown replaces the table (?employee=)      [~] not a Sheet
┌────────────────────────────────────────────────────────────────────────────────┐
│ ‹ Back to 129 employees          Aisyah Rahman · 14 of 129        ‹ prev  next ›│
├─────────────────────────────┬──────────────────────────────────────────────────┤
│ Pay — headline net, tiles,  │ Exceptions (2)                                   │
│ PayBreakdown                │ Inputs — PayrollInputs                           │
│ Why it changed — PayVariance│ Source trace — code, rule, calculated at          │
│ Pay history                 │ Activity                                         │
└─────────────────────────────┴──────────────────────────────────────────────────┘
```

### Tabs: 4, not 6

The brief proposes Overview · Employees · Inputs · Findings · Payments · Artifacts.

- **Overview** — rejected. The metric row plus stage bar sit above the tabs and are always
  visible; an Overview tab would restate them one click further away.
- **Inputs** — already a Sheet (`InputReadinessSheet`) plus the import dialog. Inputs are a
  readiness question asked _while_ looking at employees, not a place to sit.
- **Payments** — deliberately a route, not a tab. Payment is cross-run (funding accounts,
  batches, returns) and cannot be scoped to one run without lying about the batch.
- **Artifacts** — `/payroll/reports` owns exports and keeps a recent-exports list. A per-run
  artifact list belongs in the run header's `⋯` menu, not a tab.
- **Findings** → keep the existing **Exceptions**. The domain, types, actions and vocabularies all
  say exception; renaming touches 20+ files for a synonym. One word, chosen once.
- **Reconciliation** and **Audit** are kept; both are load-bearing for auditability (§3).

---

## D. Component architecture

Almost everything exists. `[+]` is the only new code this phase implies.

```
PayrollRunWorkspace                              [=] 811 LOC, orchestration + optimistic state
├── CalculationStaleBanner                       [=]
├── PayrollRunHeader                             [~] add legal entity to the identity line
├── PayrollStageBar                              [=]
├── PayrollMetricRow                             [=]
└── Tabs (?view=)
    ├── employees
    │   ├── PayrollTableToolbar                  [~] + density control
    │   │   ├── search (InputGroup)              [=]
    │   │   ├── FacetFilter ×3 (Popover+Command) [=]
    │   │   ├── ColumnsMenu (DropdownMenu)       [=]
    │   │   └── DensityMenu                      [+] adapt data-table-02
    │   ├── PayrollBulkActions                   [=]
    │   ├── PayrollRunTable                      [~] + column pinning (adopt data-table-07)
    │   │   └── useStickyColumns                 [+] ~40 lines, colocated, not a primitive
    │   └── PayrollEmployeeDrilldown             [=]
    ├── exceptions → ExceptionSummary · ExceptionList · ExceptionInspector (Sheet)   [=]
    ├── reconciliation → PayrollReconciliation   [=]
    └── audit → PayrollAuditTimeline             [=]

Route-level                                      [+]
├── app/(pages)/payroll/error.tsx                one boundary per payroll route
├── app/(pages)/payroll/{runs,payments,compliance,reports}/loading.tsx
└── PayrollEmptyState                            [+] adapt empty-state-08, shared by reports/compliance
```

No new wrapper primitives, no `DataTable` abstraction, no payroll design layer. `useStickyColumns`
stays beside the table rather than in `src/components/ui` — it is one caller's concern.

---

## E. Interaction architecture

### Table → employee: keep the drilldown, do not build the Sheet

§9 asks for a Sheet so table context is retained. The repo **already tried that and replaced it**,
and the reasoning is recorded in `payroll-employee-drilldown.tsx:79-84`: a side panel was capped at
the table's height and gave a payslip a third of the screen, which is not enough to read one.

What replaced it keeps every property §9 actually wants:

- context is not lost — `‹ prev / next ›` walks the table's current filtered, sorted order, and
  **Back** returns to the same filters, sort and page;
- position is stated ("14 of 129") and shareable — `?employee=` is in the URL;
- a payslip gets full width, which is what a gross-to-net breakdown, a variance explanation, a
  source trace and an audit trail need side by side.

Recommendation: **keep the drilldown; do not build `PayrollEmployeeSheet`.** If inline inspection
without leaving the grid is still wanted, the cheaper answer is row expansion
(`data-table-06`/`-09`) for the earnings breakdown only — not a second full inspector. Shipping
both a Sheet and a drilldown would be two answers to one question.

Sheets stay for the things already using them: exception inspector, input readiness, settlement
inspector, filing inspector, report parameters, settings list editing.

### The rest

- **Filters** — Popover + Command multi-select, active count on the trigger; `inSet` for scalar
  columns, `hasOpenException` for severity + a `none` option. Filters are local state; only view
  and employee are in the URL (shareable), which is the right split.
- **Bulk actions** — checkbox column → `PayrollBulkActions` bar; acknowledge warnings is the real
  one. Blocking exceptions are never bulk-clearable, by policy.
- **Exceptions** — severity is a token pair plus a distinct icon, never colour alone; status is
  derived from timestamps by `exceptionStatusOf`, never stored. Count badges in the table cell,
  full words everywhere else. The open count in the metric row is a button into the tab.
- **Approvals** — Dialog, short and consequential, listing every blocking reason from
  `evaluatePayrollApproval`. The same function refuses server-side, so the dialog cannot show a
  gate the server would not enforce.
- **Payments** — released from `/payroll/payments`, not from the run. Batch states are recorded
  events: prepared → released → accepted → processing → settled. "Paid" is a bank confirmation,
  never the payday passing.
- **Optimistic writes** — apply locally, call the action in `useTransition`, adopt the server's
  record on success, restore the snapshot and `toast.error` on refusal.

### Command menu

Six payroll destinations are already indexed. Worth adding run-scoped commands (jump to employee,
switch view) only if a measured need appears — not speculatively.

---

## F. Responsive architecture

Desktop-first, per §12. The important correction: **measure the container, not the viewport.** With
the sidebar expanded, a 1280px screen leaves the workspace ~1000px. `payroll-metric-row.tsx`
already does this (`@container`, `@min-[66rem]:grid-cols-6`); the toolbar and table should follow.

| Width  | Behaviour                                                                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≥1440  | Full workspace. Metric row 6 across. All default columns. Drilldown two columns.                                                                                                            |
| 1280   | Primary target. Metric row 6 across only if the container clears ~1050px, else 3×2. Table scrolls horizontally with the employee column **pinned**.                                         |
| 1024   | Compressed. Metric row 3 across. Toolbar filters collapse behind a single Filters popover. Density defaults to compact. Drilldown single column.                                            |
| <1024  | Progressive reduction. Tabs become a Select. Optional columns drop to identity + net + status + exceptions.                                                                                 |
| mobile | Review and inspection only. Table → stacked summary rows opening the drilldown. Bulk selection, column menu and import are hidden, not shrunk — approving payroll on a phone is not a goal. |

Verification note: Chrome window resizing is ignored in this environment. Probe narrow layouts with
a 390px iframe and check `scrollWidth` against `clientWidth` — the page body must never scroll
sideways; only the table's own `overflow-x` container may.

---

## G. Implementation sequence

Reordered from §15G, because the shell, header, metric strip, toolbar, table and drilldown are
already built. Ordered by risk retired per unit of work.

```
01  Column pinning on the employee identity column        adopt data-table-07     ← the real §8C gap
02  error.tsx per payroll route + missing loading.tsx     6 routes uncovered today
03  PayrollEmptyState                                     adapt empty-state-08
04  Legal entity on the run header identity line          lands the in-flight group work
05  Container queries for toolbar + table                 replaces viewport breakpoints
06  Density control                                       adapt data-table-02
07  Row expansion for earnings — evaluate, then decide    do NOT also build a Sheet
08  Saved views                                           only after 01–06 prove the need
09  Responsive + accessibility QA at 1440/1280/1024/390
10  Correct the Radix claim in cui/iui/rui.md             separate from this phase
```

**Not in the sequence, deliberately:** `PayrollEmployeeSheet` (E), an Overview tab (C), a stepper
(§11 and `PayrollStageBar` already agree), virtualization (H), a `DataTable` abstraction (A).

Steps 01–03 are the ones I would do first regardless of the rest: 02 in particular is a real
robustness hole — a thrown error in any payroll route currently escapes to the root boundary.

---

## H. Dependencies

**Recommendation: no new dependency.**

| Package                                    | Status                   | Verdict                                                                                                                   |
| ------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `@tanstack/react-table` 8.21.3             | installed, used          | Covers pinning, expansion, density, faceting. Nothing to add.                                                             |
| `papaparse` 5.5.4 · `xlsx` 0.18.5          | installed, used          | Export already built in `export-payroll-utils.ts`.                                                                        |
| `motion` 12.40.0                           | installed                | Do not add a second animation library.                                                                                    |
| `vaul` 1.1.2                               | **installed, 0 imports** | Drawer never adopted; `lineage-drawer.tsx` is a Sheet. Candidate for removal.                                             |
| `@stepperize/react` 6.1.0                  | **installed, 0 imports** | Only reachable via a Studio stepper, which §11 rejects. Candidate for removal.                                            |
| `@radix-ui/*`                              | **0 installed**          | Keep it that way.                                                                                                         |
| virtualization (`@tanstack/react-virtual`) | not installed            | **No.** 129 employees across 5 entities; a single-entity run is well under that, and page size is 25/50/100. Unjustified. |

**Studio installations proposed: none.** The single ADOPT (`data-table-07`) is a ~40-line technique
copied into an existing file; installing it would write `src/registry/base/components/...` paths
this repo does not use. Every ADAPT is a pattern to build from, retokenised — Studio blocks carry
12–18 palette classes each and this repo has zero.

---

## Open question for review

**Does the employee Sheet in §9 still stand, given the drilldown that replaced it?** Everything in
G assumes it does not. If you want the Sheet regardless, say so and it goes in at 07 — but then the
drilldown should be removed rather than kept alongside it.
