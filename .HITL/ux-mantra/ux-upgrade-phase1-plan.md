# Afenda Progressive UX Upgrade — Phase 01

## Context

`.architecture/ux/afenda-ui-ux-doctrine.yaml` was installed this session as the only
normative UX authority. `.HITL/ux-mantra/ux-upgrade-phase1.txt` is the phase brief acting
on it.

Phase 01 establishes **orientation + business-object context + a contextual command
foundation**, and proves the grammar on two objects. It is not a redesign, not a domain
migration, not workspace splitting (§12 defer list stands).

It matters because everything later in the doctrine — one table engine, floating query,
workspace groups, favourites — assumes a stable answer to *what object is the user acting
on?* The app has no answer today. The contract is four fields; getting it wrong is what's
expensive, because it propagates into every surface that adopts it.

## Established facts (verified, not assumed)

- **`@base-ui/react@1.6.0` ships `context-menu`** (Root + Trigger, reusing the Menu parts).
  Right-click is buildable on the existing primitive system. No new dependency.
- **`@shadcn/context-menu` and `@shadcn/breadcrumb` both resolve to `registry/base-vega/`** —
  Base UI + semantic tokens only, zero palette classes. Both **ADOPT-eligible**; each needs
  one fixup (they import `IconPlaceholder` from `@/app/(create)/components/icon-placeholder`,
  which does not exist here → replace with `lucide-react`, as `dropdown-menu.tsx` already does).
- **No breadcrumb primitive, and zero files reference one.** §11's "use the existing
  primitive/pattern" has no referent in this repo.
- **No `onContextMenu` handler anywhere in `src/**`.** Right-click is entirely new.
- **No generic object abstraction.** No `EntityType`, no `getEntityHref`, no registry.
- **Payroll tables have no row action menus at all** (the inline-`DropdownMenu` ellipsis
  convention lives only in `src/views/apps/*` and `src/views/datatables/*`). So contextual
  commands are additive in payroll — but there is also no existing non-pointer path, which
  §15 requires.
- **Properties presentation convention exists, unnamed**: `Card` > `CardContent` with a local
  `detailRows` array as `flex justify-between` label/value rows
  (`src/views/apps/users/view/user-view-left-panel.tsx`). Reimplemented per view.
- **Right-side inspectors are an established payroll pattern**, all on `Sheet`:
  `exception-inspector.tsx`, `filing-inspector.tsx`, `settlement-inspector.tsx`,
  `report-sheet.tsx`. `exception-inspector.tsx` is the closest model for Properties.
- **`grossToNetBridge(run)`** (`src/utils/payroll-metrics.ts:48`) already builds
  Gross → Tax → Deductions → Net purely from `run.totals`. Used on the entity dashboard,
  **not** wired to the run-workspace metric row. §9 is satisfiable with zero new fetching.
- **`countExceptions()`** already returns `{blocking,error,warning,…}` and the exceptions
  tile **already renders it as text** and already drills to the Exceptions tab.
- **`src/assets/data/search.ts`** is a static route index (title/href/icon) already powering
  the ⌘K `CommandMenu` — reusable as the breadcrumb's route-label source.
- `src/types/common/` exists. No shared `PageHeader` component exists.

## Decisions

**Pilot pair — PayRun + Employee-on-a-run** (§8's recommendation, confirmed against code).
They differ exactly where it matters: `PayRun` has a stable id, a human label (`reference`)
and a canonical route; `PayrollRunRow` has a stable `employeeId` and label (`name`) but **no
route** — it is reached via `?employee=` on the parent workspace. That asymmetry is precisely
why the contract's `href` is optional, so the pair proves the contract rather than flattering it.
Both live on `/payroll/runs/[runId]`, so one workspace exercises the whole grammar.

**Object contract — four fields, `src/types/common/object-context.ts`:**

```ts
export type ObjectContext = {
  type: string   // doctrine vocabulary: 'payroll_run', 'employee'
  id: string     // stable identity; commands resolve against this
  label: string  // human-readable; menu header, a11y name, copy target
  href?: string  // optional — an employee-on-a-run has no canonical route
}
```

No `reference`, no status, no permissions, no metadata bag. "Copy reference" differs per type
(`PayRun.reference` vs `employeeNumber`), so **commands are supplied by the domain** closing
over its own row — which keeps business data out of the contract, per §4's MUST NOT.

**Breadcrumb lives in the app shell** (your call), so it applies repo-wide rather than
per-page. Built via **`/iui`** — browse Studio for breadcrumb/page-header patterns as source
material, then build from this repo's primitives and tokens.

**The shell breadcrumb consumes `ObjectContext` as its leaf.** This is the one seam §12
permits. Static segments resolve through `src/assets/data/search.ts`; the dynamic leaf
(`PR-SG-2026-09`, not a raw id) is published by the page. §4 and §11 are served by one contract.

**Properties = Sheet, identity facts only.** Reading your answer: the doctrine now supersedes
the README's earlier rejection of a side panel, so the README changes rather than acting as a
veto — and the drilldown stays. Properties carries employee number, department, location,
position, payroll/payment status, payslip id, calculation version. It **never** shows the
payslip, and **Open (the drilldown) remains the default action**. The two answer different
questions: "what exactly is this?" vs "do the work". _If you meant instead that Properties
should simply open the drilldown, say so — it's a small change to step 6._

**§9 is narrower than the brief assumes.** The exceptions tile already shows its breakdown as
text and already drills through, so adding a popover there would be chrome the doctrine
doesn't want. The genuinely missing case is **Gross and Net**, where `grossToNetBridge` is
already computed and unused on this surface.

## Work

**0. Housekeeping (§0)** — delete `.HITL/ux-mantra/ux-doctrine.txt`. Do **not** add `.HITL/`
to `.gitignore`; do not touch other HITL material.

**1. Primitives** — add `src/components/ui/breadcrumb.tsx` and
`src/components/ui/context-menu.tsx` from the base-vega registry. Swap `IconPlaceholder` for
`lucide-react` icons and match local house style (single quotes, `@/lib/utils`), so
`context-menu.tsx` is visually identical to `dropdown-menu.tsx` — both wrap Base UI Menu parts.

**2. Object contract** — `src/types/common/object-context.ts` (type above) plus a small client
provider so a server page can publish its subject. Payroll pages are server components, so each
publishes via a thin client child.

**3. Shell breadcrumb (§11)** — via `/iui`. A breadcrumb row in `src/app/(pages)/layout.tsx`
between `<Header />` and `<main>`, so every route gets it without per-page wiring. Ancestor
labels from `src/assets/data/search.ts`; leaf from the published `ObjectContext`. Semantics stay
constant across breakpoints — compress visually (`BreadcrumbEllipsis`), never degrade into
tabs/select/pagination (doctrine `layout_grammar` MUST_NOT).

**4. Command composition (§5, §6)** — one command list per object type, rendered through **two
triggers**: `ContextMenu.Trigger` (right-click, Shift+F10) and an ellipsis `DropdownMenu`
matching the app's existing convention. This is what satisfies §15's "right-click MUST NOT be
the only way". Grammar order: Open → object actions → Copy reference → Audit → Properties,
Properties last. **Omit** any group with no real command — no disabled placeholders.

**5. Properties (§7)** — a shared `PropertiesSheet` on `Sheet`, modelled on
`exception-inspector.tsx`. Shared shell owns header, object identity, section layout, close,
focus. Domains supply sections. Reuses the `detailRows` label/value convention already in the
codebase, factored just far enough to serve both pilot types — not a new design layer.

**6. Pilot wiring (§8)** — `PayRun` on both `run-queue-table.tsx` rows and as the workspace
subject in `payroll-run-workspace.tsx` (doctrine `identity_rule`: same object, same commands,
both places). `Employee` on `payroll-run-table.tsx` rows. Audit command reuses the existing
`auditEvents()` output; Open reuses existing `hrefFor` / `?employee=` behaviour.

**7. Gross-to-net popover (§9)** — wire the existing `grossToNetBridge(run)` into a `Popover`
on the Gross and Net tiles in `payroll-metric-row.tsx`. No new fetching, no new analytics layer.
Leave the exceptions tile alone.

**8. Orientation audit (§10)** and README update — reconcile `src/views/payroll/README.md`
with the doctrine (the side-panel rationale, and the stale line describing `/payroll` as the
old single-entity dashboard).

## Out of scope

Everything in §12. Also: no migration of the 47 existing `DropdownMenu` call sites, no
context menus outside the two pilot types, no touching `src/views/{apps,datatables,pages}`
(AdminCN template surfaces, not product).

## Verification

- `pnpm check-types`, `pnpm build`, `pnpm lint` (`pnpm lint:fix` first — new imports).
- Run the app; on `/payroll/runs/[runId]`: right-click a run row and an employee row, confirm
  only genuine commands appear, Properties is last, Open is default.
- **Keyboard**: Shift+F10 opens the menu, arrows move, Escape closes, focus returns to the
  trigger. Confirm every command is reachable without a pointer via the ellipsis trigger.
- **Breadcrumb**: confirm `Payroll → Runs → PR-SG-2026-09` renders the *reference*, not a raw
  id, and that ancestors navigate.
- **Widths 1440 / 1280 / 1024 / 390.** Chrome resize is ignored in this environment — probe 390
  with a 390px iframe and check `scrollWidth`.
- Expect **no new dependency**. If one appears, stop and justify it.

## Report (§16)

Doctrine IDs covered: D17 orientation, D09 business_objects, D03 context_menu, D04 properties,
D05 preserve_context, D06 command_grammar, D07 capability_without_chrome, D20 layout_grammar,
D14 domain_truth. Close with a single recommendation: **ONE TABLE ENGINE** or **FIX PHASE 01
FIRST**. Do not start Phase 02.

---

# Phase 01 — completion report (§16)

## Amendments applied

1. **Publisher/subscriber external store, not a context provider.** `src/lib/object-context-store.ts`
   is a one-slot store read through `useSyncExternalStore`. React context flows downward and the
   breadcrumb renders above `<main>`, so a provider could not have worked. `clearObjectContext`
   checks ownership before clearing, because a route transition can mount the next page before the
   previous one's cleanup runs.
2. **CRUD-SAP on the command descriptor.** `ObjectCommand.family` is one of
   `create|read|update|delete|search|audit|predict`. `groupCommands()` derives the §6 render order
   from it; empty groups collapse. Properties is not a family — the command surface owns it and
   pins it last, so a domain cannot move it.
3. **Gross-to-net exposed from Net only.** The bridge answers "how did gross become net?", which is
   Net's question. Gross is where the bridge starts and decomposes into nothing, so putting it there
   would assert a relationship the domain cannot prove.
4. **No row focus.** Rows carry no `tabindex` (verified in the DOM). The context-menu trigger is the
   `<tr>` itself; keyboard users get the identical command list from the ellipsis button. Global
   table keyboard behaviour is left to the One Table Engine.

## Doctrine covered

D17 orientation · D09 business_objects · D03 context_menu · D04 properties · D05 preserve_context
· D06 command_grammar · D07 capability_without_chrome · D20 layout_grammar · D14 domain_truth

## Object contract

`{ type, id, label, href? }` — `src/types/common/object-context-types.ts`. Four fields, no business
data. `href` is optional because an employee-on-a-run has no route. "Copy reference" differs per
type (`reference` vs `employeeNumber`), so commands are domain-supplied and close over their own
row, keeping business data out of the contract.

## Verified in the running app

- Breadcrumb renders on every route; leaf shows `PR-VN-2026-09`, not the id. Segment labels come
  from the URL — the ⌘K search index would have said "Payroll Runs" where the hierarchy wants "Runs".
- Pay-run context menu: `Open run · Copy reference · View audit trail · Properties`, Properties last,
  `role=menu`, `aria-label="Commands for PR-VN-2026-09"`.
- Employee context menu: `Open payslip · Copy employee number · Properties`. "View exceptions" is
  omitted even for employees who have them, because the exceptions tab is not filtered per person.
- Properties sheets open for both types and show the row actually clicked (proved against two
  distinct employees both named "Anh Ngo" — commands resolve on `id`, not `label`).
- Net popover: 1,213,825,774 − 108,637,410 − 127,451,710 = 977,736,654, matching the Net tile.
- Escape closes menu and sheet. Ellipsis button is 36×36 (> 24×24 WCAG 2.2 AA),
  `aria-haspopup=menu`, `aria-expanded`, focusable.
- 390px: no horizontal overflow; breadcrumb stays a `<nav>` with the same links — semantics
  unchanged at narrow width, per `layout_grammar`.

## Defects found and fixed during validation

- **Menu crash.** `MenuGroupLabel` requires a `Menu.Group` ancestor; the object name was rendered as
  a bare label and every menu open hit the error boundary. types/lint/build all passed on it. The
  name is not a group label — it now renders as a presentational `<div>` with the popup carrying
  `aria-label`.
- **Run-queue row navigated out from under the menu.** That row's click handler had no guard, which
  was harmless while every control in it went to the same place. Added the guard the employee table
  already had.
- **Metric tiles off baseline.** Button-variant tiles sat 6px below static ones (`gap-2` on top of
  the `dd`'s `mt-1`). Pre-existing on the exceptions tile; my Net tile would have doubled it.
  `gap-0` puts all six on 329.
- **Raw enum in Properties.** Frequency rendered `monthly`. A `FREQUENCY_LABELS` map already existed,
  trapped in `pay-groups.tsx`; lifted to `PAY_FREQUENCY_LABELS` in `payroll-workspace.ts` and used by
  all three call sites rather than copied.

## Not verified

The ellipsis command button could not be opened through browser automation. The app's **existing**
users-table ellipsis fails identically in the same harness, so this is a limitation of the tooling,
not evidence about the code — but it means the overflow path has been verified by construction and
ARIA only, not by observation. **Check it by hand before trusting §15.**

## Dependencies

None added. `shadcn add` pulled an npm package literally named `cn` (the registry's dependency
token, not this repo's `@/lib/utils`); it was removed and both primitives repointed.

## Next phase

**FIX PHASE 01 FIRST** — confirm the ellipsis menu opens by hand on both tables. If it does,
ONE TABLE ENGINE is the right next phase, and it should also take over row focus so Shift+F10 has a
real target.

---

# Phase 01 acceptance closure — result

**Verdict: FIX PHASE 01 FIRST** (not all gates passed).

## One code change

`ObjectContextMenu` now moves focus into the popup **when the menu was opened from the
keyboard**. Shift+F10 already opened the menu — Chrome dispatches a trusted `contextmenu` at the
focused control, and Base UI's `onContextMenu` is a React prop on the trigger, so it bubbles from
the object's own link/name button. But Base UI builds this menu for pointer invocation and leaves
focus on the trigger, so the menu appeared while arrow keys still went to the row behind it.

The bridge is scoped to keyboard invocation (`Shift+F10` / `ContextMenu` key set a ref that
`onOpenChange` consumes) precisely so the pointer path — which was observed working — is untouched.
No second command implementation: both surfaces still render `ObjectCommandItems` over the same
domain descriptors.

Rows are still not focusable. `<tr>` carries no `tabindex`.

## Observed during this pass

- Shift+F10 on the employee name button produced a **trusted** `contextmenu` at the control's
  coordinates and opened the menu with the correct object and items.
- Focus stayed on the trigger; two ArrowDown presses never entered the menu. This is the defect
  the bridge fixes.
- Focusing the popup by hand then pressing ArrowDown highlighted `Open payslip`
  (`role=menuitem`, `data-highlighted`) — the exact mechanism the bridge automates.

## Could not be driven by the harness

Browser key delivery stopped mid-session: `keydown` listeners recorded nothing for Shift+F10,
ArrowDown or even Tab, with `document.hasFocus() === true`, across a fresh tab and a fresh tab
group. Dropdown triggers never opened by click either — including the app's **pre-existing**
`apps/users/list` ellipsis, which fails identically. Both are tooling limits, not findings about
this code, and both leave real gates unverified.

## Incidental finding (not a defect)

The run workspace has two employee tables in the DOM — one visible, one in a hidden kept-mounted
tab panel (Base UI `Tabs`). Pre-existing. It matters only because DOM queries must filter to the
visible table, which is what made several probes look flaky.

---

# Carried into Phase 02 — ONE TABLE ENGINE

## Invariant: mounted is not interactive

> **A table instance may remain mounted while not interactive. Hidden or inactive table instances
> MUST NOT participate in keyboard navigation, selection focus, context-menu targeting, or
> shortcut resolution.**

Not hypothetical. The run workspace already holds two employee tables in the DOM — Base UI `Tabs`
keeps inactive panels mounted — and during Phase 01 validation several probes silently addressed
the invisible copy: focusing a row there and pressing Shift+F10 did nothing, because the control
was real, connected, and off-screen.

The failure mode this prevents is a page-global row registry:

```
document.querySelectorAll('[data-row]')   ← wrong
```

Rows the user cannot see would enter roving focus, selection and command targeting. The engine
needs a scope, not a registry:

```
table instance
  + active/visible surface
  + local focus scope
```

Solved once in the engine, or rediscovered by every domain in turn.

## Ownership boundary (do not blur it)

```
ContextMenu.Trigger   pointer contextmenu; browser Shift+F10 opening semantics
Afenda bridge         keyboard-origin detection; initial popup focus; focus restoration
ObjectCommand         commands; CRUD-SAP family; availability
Table engine (next)   which object is focused; row/cell navigation; active table scope
```

The context-menu infrastructure must not start owning table focus to get a phase over the line.
Phase 01's bridge is deliberately confined to keyboard-origin detection and popup focus, and knows
nothing about rows — which is why the table engine can take focus over later without unpicking it.

## Phase 01 exit condition

Frozen pending four manual checks (Shift+F10 + focus lifecycle on both pilot objects, and ⋮ parity
on both). No further Phase 01 code changes. If they pass: **ONE TABLE ENGINE**.

---

# Closure attempt 2 — diagnosis of the focus bridge

Key delivery worked briefly, then died again. What it bought before failing:

## Newly observed

- **Shift+F10 on a PayRun passes the "opens" half.** Focusing the run reference link
  (`PR-FEED-2026-08`) and pressing Shift+F10 produced a **trusted** `contextmenu` on the `<a>`,
  and the menu opened with `aria-label="Commands for PR-FEED-2026-08"` and
  `Open run · Copy reference · View audit trail · Properties`. Both pilot objects have now been
  seen opening from the keyboard.
- **The first focus bridge did not work**, and the reason is now known rather than guessed:
  - Base UI is *not* stealing focus back. Focusing the popup by hand took effect immediately and
    still held 400ms later (`role="menu"`).
  - The trigger *does* receive caller props: `ContextMenuTrigger` merges `elementProps` after its
    own handlers, so `onKeyDown` reaches the row.
  - The bridge code *was* loaded in the browser (found `keyboardInvoked` in a served chunk).
  - What remains is timing: the popup mounts into a portal *after* `onOpenChange` runs, so a
    single `requestAnimationFrame` found `popupRef.current === null` and focused nothing.

## Fix applied (unverified)

`onOpenChange` now retries the focus across up to 10 animation frames and gives up quietly,
instead of a single frame. Still keyboard-origin only; still no row focus; still one command model.

## Still unverified

Every focus-lifecycle gate. The harness lost key delivery again — `keydown` listeners recorded
nothing for Shift+F10 while `document.hasFocus()` was `true` and the correct element was focused —
so the retry fix has never been exercised. Treat the bridge as *diagnosed and plausibly fixed*,
not as working.

`check-types`, `lint`, `build` pass. Dependencies unchanged.

---

# Bridge assessment against the keep-or-rewrite criteria

Kept, not reverted. Reverting would knowingly restore a defect for a tidier history.

| Criterion | Holds? |
| --- | --- |
| Tiny | Yes — ~15 lines inside one `onOpenChange` |
| Isolated to keyboard invocation | Yes — guarded by `keyboardInvoked.current`, set only by `Shift+F10` / `ContextMenu` key |
| Doesn't affect pointer opening | Yes — the pointer path runs no new code |
| Cancels on close | **Effectively, not literally** |

The loop does not re-check `open`. It expires after ten frames, and `popupRef.current` is `null`
once the popup unmounts, so it cannot focus a closed menu. The only reachable gap is a keyboard
open, close, and *pointer* re-open inside ~160ms, where a stale frame could focus a
mouse-opened popup — which is what most platform context menus do anyway. Not fixed, because the
one-line guard is as untestable right now as the thing it guards, and the instruction was not to
rewrite untested.

## Preferred design once it can be tested (Phase 02 refinement)

Mount state should drive focus, not elapsed frames:

```
keyboard invocation detected → flag
        ↓
menu content actually mounts
        ↓
content mount effect sees the flag → focus first item → clear flag
```

The trigger should not be guessing when the portal exists. Base UI's `Menu.Popup` exposes
`finalFocus` (close-time) but no `initialFocus`, so this needs the effect to live in the content,
which is a change to `ObjectCommands` shape rather than a tweak — the right size of change for a
phase that can verify it, and the wrong size for a closure pass that cannot.

# Phase 02 brief received

`.HITL/ux-mantra/one-table-engine.txt` already carries the active-scope invariant, at §9:

> A mounted but inactive table MUST NOT participate in keyboard navigation, focus, selection
> targeting, context-menu targeting, shortcut resolution, or active-object publication.

with §23 requiring an explicit test that the hidden kept-mounted Employee table stays out. The
finding propagated. **Not started** — Phase 01 gates remain open.
