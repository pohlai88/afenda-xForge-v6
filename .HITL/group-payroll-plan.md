# Group Payroll: a consolidation surface with coverage

**Two documents, deliberately separate.** `.HITL/GROUP-PAYROLL-UX.md` is the UX acceptance
specification: screens, hierarchy, states, interaction, lineage, coverage, wording, visual and
accessibility rules, and the checks that decide when the surface is done. It contains no types, no
file paths and no algorithms. This file is the engineering plan. Where they disagree about what the
user sees, the UX document wins. Splitting them stops the drift that comes from one file trying to
be both.

## Context

`.HITL/afenda-payrol-pholosophy.txt` revises the earlier review. It says frontend and domain maturity
are coupled in payroll: a screen forces the decisions a backend abstraction hides. Its central
example is exactly this surface:

> 10 companies · 6 countries · 4 currencies · September 2026 payroll — what is the group employer cost?

Drawing that screen forces period alignment, currency translation, reporting currency, FX basis,
coverage, and the difference between operational payroll cost and the financial charge. The
document names five flagship surfaces; the user chose **Group Payroll** first.

What the document requires of it (the acceptance test for this plan):

- **Not "company selector + local pack".** A consolidation surface: group, reporting currency,
  period, FX basis in the header; group employer cost and group net pay as the two dominant
  figures with vs-previous deltas; headcount and entity readiness beside them; an entity table
  (entity, country, employees, cost, state); "consolidate by" dimensions.
- **Every measure aggregates its own way.** Gross/net/cost sum after FX normalisation; headcount is
  unique; rates never sum; readiness is derived. This lives once, in a semantic layer, not in each
  screen.
- **No consolidated number without coverage.** "9 / 10 entities included · Vietnam Feed pending ·
  current group total is incomplete". The missing entity is part of the number's meaning.
- **Every number explains itself.** Click the group cost: local cost + FX movement = reporting
  total, FX basis, coverage, source calculations.
- **Operational vs financial consolidation are distinct** (legal employer vs cost allocation).
  This plan builds the operational view and names the financial view as the seam, not a screen.

Standing rules from the module: never display a state the domain cannot prove; semantic tokens
only; Base UI primitives; server components unless state is needed; money as minor-unit integers
formatted at the edge; clock read once in the page; vocabularies decided once and imported.

## Decisions taken with the user

- **Currencies: SGD, MYR, VND.** `VND` is new to `CurrencyCode` and has no minor units.
- **Route: `/payroll` becomes Group Payroll.** The current single-entity overview moves to
  `/payroll/entities/[entityId]`; entity rows drill into it.
- Five legal entities in three countries: `ent-sg` Afenda Pte. Ltd. (home, SGD), `ent-my` Afenda
  Malaysia Sdn. Bhd. (MYR), `ent-mfg` Afenda Manufacturing Sdn. Bhd. (MYR), `ent-vn` Afenda
  Vietnam Co. Ltd. (VND), `ent-feed` Afenda Feed Vietnam (VND).
- September 2026 states so the surface has something to prove: MY approved (ready), VN in review,
  Feed **awaiting data** (no calculation), and both SG and MFG **blocked** — SG because its
  existing `exc-001` is still open, and a run that cannot advance is blocked whatever has been
  signed. Coverage 4 / 5, total incomplete. April to August closed for every entity.
- FX: rates per period per basis (pay-date spot, period end, period average) into the reporting
  currency, plus a group budget rate per currency. Explain = local at budget rate + FX movement
  = reporting total.
- Statutory stays simplified per country (profiles in the seed) and filings stay Singapore-only.
  The Statutory Pack Center is the next surface and owns versioning.

## What exists today (exploration, verified)

- No entity, group, tenant or FX concept anywhere. `PayGroup.entity` is a free-text name; the
  settings "Legal entity" section is a singular `PayrollGeneralSettings`. One dormant MYR pay
  group with zero employees.
- Country lives on `WorkLocation.country` (plain string); employees link by `locationId` only.
- `src/utils/money.ts` is the single formatter, deliberately without `Intl`. `formatMoney` reads
  the currency off the `Money` value, so it needs a digits map, not a signature change.
- The currency list is duplicated seven times (three Zod enums in `actions.ts`, three settings
  views, one import dialog).
- Silent single-currency sums: `queueSummary`, `complianceSummary`, `fundingSummary`,
  `run_summary` report, `percentageOf`.
- Reusable aggregation: `costByDepartment` (id, name, employees, cost, share),
  `countExceptions`, `changeVsPrevious`, `grossToNetBridge`, `paymentReadiness`'s
  `ReadinessCheck` shape, `InputFeedStatus`.
- UI precedents: runs page shell and 6-col grid, `run-queue-focus` dominant figure,
  `payroll-kpi-strip` sparkline, `run-queue-year` n-of-m + Progress, `run-queue-table` for the
  table, `payroll-by-department` link chips, `exception-inspector` sheet and
  `payroll-source-trace` table for the explain surface, `report-sheet` Select `items` gotcha.

## Interaction decisions from the user (apply here, carry into later surfaces)

- **TanStack Table everywhere** a table sorts, filters or selects. Entity table and consolidate-by
  table follow `run-queue-table.tsx`.
- **Bottom drawer for numbers and selections; right sheet for one record.** "Explain this number"
  and the selection summary open a `Sheet` with `side='bottom'` (wide, tabular lineage). Single
  records (exception, settlement, form) keep the right-hand sheet. Write this rule into the module
  README.
- **Multi-selection with a floating selection bar.** Checkbox column, select-all-matching-filter
  (as the run workspace bulk bar), a bar at the bottom: "3 entities selected · employer cost in
  SGD at pay-date spot · coverage 3 / 3", opening the same lineage drawer for the selection.
  Mixed-currency selections convert at the page basis and say so; a selection with an entity
  lacking a calculation is marked incomplete beside the figure.
- **Faceted filters** (Popover + Command, as `payroll-table-toolbar.tsx`) for country, currency,
  state and entity; shareable ones live in the URL.
- **Report Studio (later surface, decided now):** the printed-copy builder is an Excel-like grid
  canvas at page proportions, but with *bound cells* referencing the semantic layer (measure ×
  dimension × period × currency), arithmetic only over bound cells, manual numbers visibly
  marked, page-aware (breaks, repeat headers, header/footer with issuer, period, reporting
  currency, FX basis, prepared date), the eight reports as saved templates. Analyze mode stays a
  pivot table on TanStack. No spreadsheet dependency unless a named pain demands it. "Explain
  this cell" reuses the bottom drawer and lineage layout built here.

## How to use the shadcn-studio MCP without burning tokens

Two passes in this project have ended the same way: enormous block payloads, a subagent to contain
them, and a catalogue that mostly loses to what this repo already has. The waste is the method, not
the tool. Four rules, to be written into the `iui` and `cui` skill files:

1. **Cache the catalogue once.** A single `get-blocks-metadata` call, saved to a local index file.
   Afterwards the index is grepped locally and the call is never repeated.
2. **Keep a repo precedent index beside it** — one line per solved pattern (dense table, ranked bar
   list, diverging bars on a zero baseline, sheet inspector, source-trace table, sparkline card,
   stage rail, faceted toolbar). This is consulted first, always.
3. **Gate the MCP behind a miss.** Fetch a block only when a pattern has no precedent here. If there
   is a precedent, the precedent is the answer and no MCP call happens.
4. **Log every verdict** (block, pattern, adopted or rejected, why). A rejected block is never
   fetched again.

Applying the gate to this surface: the control matrix is the run queue table; variance concentration
is already solved twice, by the department ranked bars and the overtime diverging bars with a zero
baseline; the lineage panel is the exception inspector plus the source-trace table. Only the
bottom-sheet direction and the three-truth hero are genuinely absent here.

**Verdict from the one mining pass that did run**, recorded so it is never repeated:

| Pattern | Verdict | Take |
| --- | --- | --- |
| Control matrix | Loses | Only the idea of telling status dimensions apart by kind of mark rather than four badges, and showing a badge only when the state is exceptional. The catalogue has no bulk-action bar, no missing-value convention and no tabular figures. |
| Three-truth hero | Matches | A completeness bar with two labelled feet, and the delta as an inline chip beside the figure. "X of Y", the caveat line and the segmented bar do not exist there and are ours. |
| Variance concentration | **Beats** | A ranked row whose tinted fill sits behind the text, sized against the largest contributor rather than the total, with a minimum width so a tiny row stays visible, and a row that becomes a button only when it can actually drill. Dependency-free; port the mechanic, not the styling. |
| Bottom lineage drawer | Loses on the shell, **beats on the arithmetic** | No bottom sheet exists in the catalogue at all. But the bridge structure is worth copying exactly: its own bordered well, muted labels with plain-weight figures, a real separator element as the rule, and the whole total row promoted with the label pushed left. |

Rejected across all of it: Radix component internals, palette colours, CDN imagery, chart and export
dependencies, and loose row heights unsuited to a consolidation matrix.

## What Retool teaches (researched, applies to Report Studio later)

Retool's builder is worth copying; its printed output is the thing to avoid.

- **Take:** a snapping grid canvas whose frame grows by rows; a right-hand inspector with fixed
  Content / Interaction / Appearance sections; named bindings with a state panel showing what each
  resolves to; named reusable transformers; and above all the table's **group-rows-by-column plus
  a summary row** (sum, average, min, max, count-distinct, chosen per column). Group-by plus
  summary *is* a payroll register with subtotals.
- **Reject:** Retool's PDF story. Its exporter takes Markdown only, and `utils.downloadPage()`
  screenshots the canvas and cannot split pages, so long reports become one giant page. Printed
  copy is the whole point of our builder, so the grid is page-aware from the start: real page
  breaks, repeating headers, currency-derived number formats, and a header/footer carrying issuer,
  period, reporting currency, FX basis and prepared date. The eight existing reports become saved
  templates.

This does not change the work below. It is recorded so the next surface does not re-argue it.

---

# The build

Three commits. A is the domain and the seed with every existing page still green. B is the group
surface. C is ripple and docs.

## Commit A — domain, money, seed, settings

### A1. Types

- `src/types/common/primitive-types.ts`: add `'VND'` to `CurrencyCode`; export a single
  `CURRENCY_CODES` tuple and derive `CurrencyCode` from it. Collapse the seven duplicate lists onto
  it: three `z.enum` in `src/app/server/actions.ts`, `CURRENCIES` in settings `general.tsx`,
  `pay-groups.tsx`, `banking.tsx`, and the inline union in `payroll-import.tsx`.
- New `src/types/payroll/group-types.ts`: `CountryCode`, `LegalEntity { id, name, registrationNumber,
  countryCode, countryName, currency, timezone }`, `PayrollGroup { id, name, homeEntityId, entityIds,
  reportingCurrency, fxBasis, budgetRates }`, `FxBasis`, `FxRate`, `StatutoryProfile`,
  `EntityPayrollState` (`awaiting_data | in_progress | blocked | review | ready | paid | closed`)
  plus `ENTITY_STATE_TIER` mapping each to `incomplete | attention | proceed | complete`,
  `ConsolidatedMoney { total, atBudget, fxMovement, byCurrency[] }`, `Consolidation`, `EntityRow`,
  `MovementLine`, `ComparisonBasis`, and a `MEASURES` vocabulary `{ key, label, aggregate:
  'sum'|'unique'|'derived'|'none', fx: boolean, note }` — the one place recording that headcount is
  unique and rates are never summed.

  `Coverage` carries **three** measures, not one: `entities { included, total, missing[] }`,
  `employees { counted, expected, percent }` and `expectedCost { covered, expected, percent }`,
  where expectation comes from the previous period since that is the only figure the domain can
  prove. Plus `byState` and `complete`.

  **Finality is a fourth axis**, not a footnote on coverage. `Finality = 'final' | 'provisional'` is
  derived from run status (approved, paid, closed are final; calculated and pending approval are
  provisional) and appears on `EntityRow`. `ConsolidatedMoney` gains `provisional: { amount: Money;
  count: number; share: number }`, because what a finance lead needs is not "2 provisional" but how
  much of the total can still move.

  **Freshness** is `{ newestCalculationAt: IsoDateTime | undefined; ratesAsOf: IsoDate }`, computed
  from the **included** runs' `lastCalculatedAt` and the FX rows in use. It is never the render
  clock: that would report when the page was opened, claim freshness the domain cannot prove, and
  reintroduce the hydration bug this codebase already forbids.
- `entityId` lands on `PayRun`, `PayGroup` (replacing free-text `entity`), `FundingAccount`,
  `StatutoryFiling`, `Employee`; `WorkLocation` gains `countryCode`.

Find the breakage with `grep -rn "\.entity\b" src`, `grep -rn "run-2026-\|PR-2026-\|slip-run-" src`.

### A2. money.ts

Per-currency minor-digit map (VND = 0), `'₫'` symbol, and a `B` tier in the compact formatter
because a Vietnamese group cost runs to billions. `formatMoney` keeps its signature and reads digits
from the map.

**Rates are exact fractions, never decimals.** An `FxQuote` is a numerator and a denominator, so one
Singapore dollar at 19,012 dong is `{19012, 1}` and the inverse is the same two integers swapped.
`convertMoney` then stays in integer arithmetic with half-up rounding and the round trip is
symmetric. `convertAllocated(parts, quote)` converts a set of buckets and puts the rounding residual
on the largest one, so a dimension table always reconciles to the headline figure to the cent.
`assertSameCurrency`, `addMoney` and `subtractMoney` replace the four private sum helpers, so no sum
can cross currencies silently.

Charts currently take a bare `currencySymbol` string and format ticks as thousands, which would
render a Vietnamese axis as `₫1,250,000K`. They take a `CurrencyCode` instead and derive symbol and
digits internally.

### A3. Seed

- `src/fake-db/payroll/entities.ts`: the five entities and the group.
- `src/fake-db/payroll/fx-rates.ts`: 2026 rates per period for three bases, plus budget rates.
  Period-average must differ from spot so FX movement is non-zero and the explain drawer has
  something to show.
- `src/fake-db/hrm/employees.ts`: `entityId: 'ent-sg'` on all 37 existing; roughly 90 new employees
  across the four new entities with local-currency salaries (VND in the hundreds of millions), new
  locations `loc-jb`, `loc-hcm`, `loc-hanoi` with `countryCode`.
- `src/fake-db/payroll/pay-runs.ts`: run ids become `run-{entity}-{yyyy-mm}`. `calculatePayslip`
  takes a per-country `StatutoryProfile` (SG CPF as today; MY EPF/SOCSO/EIS; VN SI/HI/UI/PIT), all
  marked simplified and illustrative. `totalsFor` sums by `PayComponent.kind` and takes the currency
  from the slips instead of hardcoding codes and SGD.
- **"Awaiting data" must be honest:** `ent-feed` has no September run at all rather than a run with
  zero totals. A zero total is a claim; absence is the truth.
- Settlements, batches and funding accounts gain `entityId`; filings stay `ent-sg` only.

### A4. Settings

`PayrollGeneralSettings` becomes group-level (`groupName`, `homeEntityId`, `reportingCurrency`,
`fxBasis`, `payslipSender`, `rounding`). A new `entities` section lists legal entities with Sheet
editing, following `pay-groups.tsx`. `PayGroup.entityId` becomes a `Select`. Update `SECTIONS` in
`payroll-settings-tabs.tsx` and the matching Zod schemas.

### A5. Semantic layer — `src/utils/payroll-group.ts`

`previousRunOf` (the four-site fix above), `entityStateOf(run | undefined)`, `consolidate(...)`,
`consolidateBy(dimension, ...)` in the shape of `costByDepartment`, `consolidateHistory(...)` for the
trend, `groupMovement(current, previous)` returning ranked `MovementLine[]` for the variance block,
and `explainMeasure(...)` returning the drawer's four layers so the hero, a matrix row, a selection,
a movement row and a dimension subtotal all render the same structure from one function.

Vocabularies live here too: `ENTITY_STATE_LABELS/STYLES/TIER/ORDER`, `FX_BASIS_LABELS`,
`COMPARISON_BASIS_LABELS`, `COUNTRY_LABELS`, `GROUP_DIMENSIONS`. Coverage in its three measures,
unique headcount, and constant-currency versus FX effect are computed here and nowhere else.

`entityStateOf` precedence, decided once: no run or draft or calculating or cancelled →
awaiting data; closed → closed; paid → paid; approved → ready; failed or any open blocking exception
→ blocked; pending approval → review; calculated → in progress. Blocked outranks review because the
approval policy refuses over an open blocker regardless of who has signed.

## Commit B — the Group Payroll Control surface

Internally the surface is **Group Payroll Control**, because it answers operational questions and
not only "what is the total". The nav still reads "Group".

`src/app/(pages)/payroll/page.tsx` is a server page reading
`?period=&currency=&basis=&by=&compare=`, each falling back to a default rather than 404ing.

| Block | Span | Type |
| --- | --- | --- |
| `group-header.tsx` + `group-selectors.tsx` | header | server + client |
| `group-hero.tsx` | `lg:col-span-4` | client |
| `group-readiness.tsx` | `lg:col-span-2` | server |
| **`entity-control-matrix.tsx`** | full | client |
| `group-movement.tsx` | full | client |
| `consolidate-by.tsx` + chart | full | server + client |
| `group-trend.tsx` | full, under a Trends divider | client |
| `lineage-drawer.tsx` | bottom sheet | client |

### The matrix is the centre, not the dashboard

The entity table is the working surface, so it gets the weight: filters, checkbox selection, a
floating selection bar, and both status dimensions in the row. Everything above it exists to frame
it, and everything below it explains it. Columns: entity, country, currency, employees, employer
cost, delta, state, coverage.

### Three orthogonal dimensions, never collapsed

This becomes a written doctrine because it recurs everywhere:

| Question | Values |
| --- | --- |
| Has a calculation? | included / missing |
| Can it advance? | blocked / review / ready |
| Has it finished? | paid / closed |

Singapore in September is included, blocked, and not ready, all three at once. One badge cannot say
that, so the matrix carries state and coverage as separate columns.

The seven states are rendered in four visual tiers rather than seven equal badges: incomplete
(awaiting data, in progress) muted; attention (blocked, review) destructive and warning; proceed
(ready) success; complete (paid, closed) muted. That gives hierarchy instead of a status rainbow.

### The hero states three truths

Value, completeness, readiness, in that order and in one block: the dominant figure, the delta
against the comparison basis, then "4 of 5 entities included" with the missing entity named, then
"1 of 5 ready to pay". The qualifiers are set as siblings of the number, not as a footnote below the
card. Net pay stays secondary and is reachable through the drawer's measure toggle.

### Coverage is three measures, not one

Missing a dormant company is not missing the largest business unit, so coverage reports entity
coverage (4 of 5), employee coverage (a percentage of expected headcount) and expected-cost coverage
(a percentage of the prior period's cost, the only defensible expectation the seed can prove). The
last two answer the real question: is this total materially complete?

### Group movement — variance concentration

A new block answering "where did the increase come from". The total movement against the comparison
basis, decomposed into ranked contributors by entity, each row opening the lineage drawer for that
contribution. Positive and negative are distinguished by sign, direction icon and bar direction, not
by colour alone. This is the block a group finance lead actually reads.

### One lineage interaction, everywhere

The bottom drawer (`Sheet side='bottom'`) is opened by the hero figure, any matrix row, any
selection, any movement row, and any dimension subtotal. It always has the same four layers:

1. **Identity.** Measure, period, reporting currency, FX basis.
2. **Bridge.** Local payroll at budget rates, plus FX movement, rule line, reporting total.
3. **Composition.** Per-entity local, rate, converted, included.
4. **Evidence.** Source calculations with reference, calculation number and state; the entity with
   no calculation listed as such, claiming nothing.

Because dimension subtotals use the same drawer, this interaction is the direct precursor to Report
Studio's "explain this cell".

### Analytical context survives the drill

The group view is fully described by its URL, so every drill target carries one `return` parameter
holding that URL, and the back link restores it. Absent or invalid, the back link falls back to a
plain `/payroll`.

**`return` is untrusted input.** It is accepted only after validating that it is a same-origin path
beginning with `/payroll`; anything else is discarded. A navigation target taken raw from a query
parameter is an open redirect, and this is the only place in the change where that could appear.

### Comparison is a control, not a fixed previous period

`compare=previous_period` today, with `same_month_last_year`, `budget` and `custom` as later values
of the same control. The delta, the movement block and the trend all read it.

### The operational / financial seam is visible

A view selector showing "Operational payroll" as the only enabled option, with "Financial
allocation" present and disabled. It costs nothing now and prevents the conceptual confusion later,
when legal employer and cost allocation diverge.

### Reconciliation is visible, never buried

The invariant the page must hold: headline equals the sum of entity converted amounts equals the sum
of any dimension breakdown. `convertAllocated` makes that exact. If a residual ever survives, it is
shown as its own line, "FX rounding adjustment", not absorbed silently.

### The moved entity overview

`src/app/(pages)/payroll/entities/[entityId]/page.tsx` is today's overview body plus a back link, the
entity name in the h1, `notFound()` for an unknown id, `generateMetadata`, and entity-scoped runs.
`?run=` and `?dept=` keep working. Three client components (`payroll-run-history.tsx`,
`payroll-by-department.tsx`, `payroll-exception-queue.tsx`) gain a `basePath` prop, defaulting to
`/payroll`, because they build hrefs internally. Old `/payroll?run=…` links redirect to the owning
entity.

## Commit C — ripple and docs

- **Runs queue:** an Entity column and an entity facet. Period folds into the Run cell as a subline
  to stay inside the ten-column budget the file already documents. The footer will not sum mixed
  currencies.
- **Payments** scopes to `?entity=`, defaulting to the home entity, with funding accounts filtered.
  **Compliance** states that filings are Singapore-only. **Reports** shows currency per row in the
  run summary.
- `revalidateRun` and `revalidateBatch` add `/payroll/entities/${entityId}`.
- Nav leaf becomes "Group"; search gains one entry per entity.
- `src/views/payroll/README.md`: the route table, the right-sheet versus bottom-drawer rule, and the
  Retool section above.
- One global fix: `scroll-padding-top` on `html` in `globals.css`, so a keyboard-focused control is
  never hidden under the sticky header.

## Risks

- **"Previous run" is `runs[index - 1]` in four places** (the workspace page, the queue builder, the
  reports builder, the overview). Once five entities interleave in one array, each compares a
  Singapore run with a Malaysian one. One helper, `previousRunOf(runs, run)`, matching entity and
  the latest earlier period, fixes all four. This is the largest breakage in the change and belongs
  in commit A before anything else touches runs.
- **The approval threshold has no currency check.** `evaluatePayrollApproval` compares a run's net
  pay against the second-approver amount regardless of currency, so a Malaysian run would be judged
  against a Singapore threshold. Apply it only on a currency match and show a note saying it was not
  applied, rather than silently skipping it.
- `periodForRun` matches on id only while `getPayRun` accepts id or reference. Renaming run ids
  touches both; grep before and after.
- `getCurrentPayRun` becomes ambiguous across entities. It stays home-entity-scoped and is renamed
  to say so.
- `CURRENT_USER_ID` stays global: the actor has no entity scoping yet. Recorded as a known gap, not
  fixed here, because entity-level permissions belong with a real session.
- Roughly 127 employees across five entities will slow the seed's per-period recomputation. If build
  time moves, memoise per entity.

## Verification

Gates: `pnpm check-types && pnpm lint && pnpm build`, plus the design skill's audit greps (palette
colours, hex, faked card titles, raw elements) staying at zero.

Browser, at 1280 wide, baseline screenshots of two peer dashboards first:

1. Change FX basis. The dominant figure and the FX movement tile change; the budget-rate tile does
   not.
2. Change reporting currency to MYR. Every figure re-denominates and the rate column inverts.
3. Open the explain drawer from the number. Assert the three bridge amounts add up to the cent, that
   the per-entity converted column sums to the same total, and that the source list length equals
   coverage. Escape returns focus to the figure.
4. The coverage line names Afenda Feed Vietnam and links to its entity page.
5. Select three entities. The bar states the subset total and its coverage, and mixed currencies are
   declared.
6. Dimension chips round-trip through the URL without scrolling the page.
7. Reload every URL. Unknown parameters fall back silently; an unknown entity id 404s.
8. Keyboard: every control shows a focus ring and none hides under the header.

Then the semantic assertions, which are browser tests that prove payroll meaning:

9. Every consolidated amount equals its entity composition exactly.
10. An excluded entity contributes nothing to cost, headcount or any denominator.
11. A blocked entity can be included but is never counted as ready.
12. An awaiting-data entity never renders a zero amount in any currency.
13. Changing reporting currency changes denomination only, never a local source value.
14. Changing FX basis changes the reporting total and FX movement, never local payroll.
15. Explaining a dimension subtotal reconciles exactly to the same measure in the headline.
16. A mixed-currency table footer never shows a raw sum.
17. Coverage is readable at 1280 wide without hovering anything.
18. Closing the drawer by keyboard returns focus to the exact figure that opened it.
19. Freshness names the newest included calculation and does not move on reload alone.
20. Provisional is stated in money, and an included-but-unapproved entity never reads as final.
21. Group to entity and back restores period, currency, basis, dimension and comparison exactly.
22. A `return` path pointing outside the payroll routes is discarded for the fallback.

Measure what a screenshot cannot: the largest font size on the page (one element at 60px) and the
count of tinted elements (roughly eight to fifteen).
