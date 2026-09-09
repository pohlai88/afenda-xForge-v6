# Manual interaction acceptance ledger

Gates that the browser automation in this repo **cannot** exercise, and that therefore have never
been observed passing or failing. They are open until a person checks them by hand.

Nothing here is a defect report. Each item has been built, type-checked, linted, shipped in a
production build, and verified as far as construction allows — ARIA, DOM structure, geometry, and
the fact that the same code path was observed working through another route. What is missing is
observation of the interaction itself.

## Why these cannot be automated here

The Chrome automation channel degrades mid-session and does so silently. Two failures recur:

- **Key delivery dies.** `keydown` listeners record nothing for `Shift+F10`, `ArrowDown` or even
  plain `Tab`, while `document.hasFocus()` is `true` and the intended element is focused. Measured
  during Pilot B: zero events for either key, on a correctly focused control.
- **Base UI `DropdownMenu` triggers do not open** from a synthetic pointer event, though `Popover`
  triggers on the same page do. Before recording this, the untouched `apps/users/list` ellipsis —
  code no phase has touched — was tested and failed identically.

The rule this ledger exists to enforce: **construction evidence is never a PASS, and a flaky
harness is never a reason to change working code.** See
`.claude/skills/xforge-design-system/references/debugging.md`.

## Open items

Check each against the object's own identity control — the run reference link, the employee name
button, the filing name button — never against the row, which is deliberately not focusable.

| #   | Surface           | Interaction                     | Expected                                                                                                     |
| --- | ----------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Payroll Run Queue | `Shift+F10` on a run reference  | Menu opens, arrows move through it, Enter runs the command, Escape closes and focus returns to the reference |
| 2   | Payroll Run Queue | `⋮` by pointer and by keyboard  | Same commands as right-click, in the same order, Properties last; Escape restores focus to the button        |
| 3   | Payroll Register  | `Shift+F10` on an employee name | As row 1                                                                                                     |
| 4   | Payroll Register  | `⋮` by pointer and by keyboard  | As row 2                                                                                                     |
| 5   | Filings           | `Shift+F10` on a filing name    | As row 1. Filings renders no `⋮` — `Open filing` is the whole vocabulary, so right-click is the only menu    |
| 6   | Payments          | `Shift+F10` on an employee name | As row 1                                                                                                     |
| 7   | Payments          | `⋮` by pointer and by keyboard  | As row 2, on a payment that has one. A payment with no bank reference has no `⋮` — check right-click there   |
| 10  | Run history       | `⋮` by pointer and by keyboard  | As row 2. The run the page is showing has a `⋮` but no `Open run` — it is already open                       |
| 11  | The five below    | Column visibility by keyboard   | Open, operate, and close. Run queue, Register, Filings, Payments, Run history — the group matrix is closed   |
| 12  | Run queue, Payments | `Shift+F10` → `Ask about this` → Enter | 360 Query opens and the question filter takes focus; arrows move through the questions, Enter runs one, Escape closes and focus returns to the control the menu was summoned from |

Rows 8 and 9 were closed on 2026-09-08 and are recorded below. The numbers are not reused: every
other section of this file cites rows by number, so the sequence keeps its gaps.

### Note on row 12 — where focus can and cannot return

360 Query hands focus back to the control the menu was opened from, resolved to the nearest element
that can actually hold focus. On a run reference link or a `⋮` button that is the control itself,
and closing was observed returning focus to it exactly. Right-clicking a plain table cell — an
employee name that is not a link, a payment amount — has no focusable ancestor at all, so focus
falls to the document. That is the absence of row focus, not a defect in the panel: rows are
deliberately not tabbable, and giving them focus is the One Table Engine's decision to make, not
this feature's.

### Note on row 7 — a row without a trigger

The overflow **column** is decided once for the whole table so paging and filtering cannot move the
table's geometry; the **trigger** is decided per row. On Payments the column is earned by the 163
rows with a bank reference to copy, and the rows that have no reference yet render an empty command
cell rather than a button whose menu would only repeat the click. Right-click still reaches them, so
the manual pass should check one of each.

## Closed 2026-09-07 — keyboard command access verified end to end

Observed with working key delivery on two surfaces: **Run history**
(`/payroll/entities/ent-sg`) and the **Run queue** (`/payroll/runs`), the queue twice.

| Gate                                                  | Run history | Run queue |
| ----------------------------------------------------- | ----------- | --------- |
| `Shift+F10` opens the right menu                      | PASS        | PASS      |
| Focus lands on the first enabled command              | PASS        | PASS      |
| Arrows move through the items                         | PASS        | PASS      |
| Escape closes                                         | PASS        | PASS      |
| Escape returns focus to the exact originating control | PASS        | PASS      |

Right-click is unchanged: opens for the correct object with Properties last, focus stays on the
document, nothing is highlighted, and the keyboard restoration does not run.

The `⋮` **opens by keyboard** — Enter on the focused trigger, `aria-expanded` true — and Escape
returns focus to the trigger, Base UI's own behaviour. Observed, so rows 2, 4, 7 and 10 are now
covered for the keyboard path. Opening it by _synthetic pointer event_ still fails in this harness
and remains the one thing construction evidence alone supports.

### What the fix had to work around, from the installed source

`onOpenChangeComplete(false)` is never emitted for a menu: `MenuPopup` has exactly one call site,
guarded by `if (open)`. The popup also does not unmount on close — it stays in the document with
`data-closed` — so there is no unmount cleanup either. Both were wired up and observed not to fire
before the source was read. The close render is the boundary that exists, and it is what the fix
uses. `finalFocus` is kept as Base UI's first attempt; it is handed to Floating UI's return-focus,
which is conditional on where focus sits at close, which is why it worked only when Escape followed
the open immediately.

## What has been observed

Recorded so the manual pass only has to cover what is genuinely unknown.

- Right-click opens the correct menu with the correct object, on both the Register and the Run
  Queue, and every item resolves against the row's id rather than its label.
- Menu **items** activate correctly when driven directly — the command wiring behind the trigger is
  proven, only the trigger's own open gesture is not.
- The `⋮` button carries `aria-haspopup="menu"`, `aria-expanded`, an `aria-label` naming the object,
  and a 36×36 target, above the 24×24 WCAG 2.2 AA minimum.
- Both surfaces render the same `ObjectCommandItems` over the same descriptors, so parity is
  structural rather than duplicated — there is no second command list that could drift.

## Closed 2026-09-08 — P01 operational sections, focus order

Rows 12, 13 and 14 were all opened and closed on the same day. They were open for a few hours
because the automation degraded during the first visual pass — `javascript_tool` reported zero
cards on a page screenshots showed rendering correctly, and two tabs went blank. Key delivery
recovered later the same session and all three were worked by hand rather than left standing.

| #   | Surface       | Interaction                           | Result                                                                                                                 |
| --- | ------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 12  | Group payroll | Tab through Needs attention           | **PASS** — five items, five stops, in list order, blocker first and warning last; each is the item's one action button |
| 13  | Group payroll | Tab through Next actions and the rail | **PASS** — six action rows and the timeline rows are one stop each, in displayed order, the ring around the whole row  |
| 14  | Group payroll | Column menu on the company matrix     | **PASS** — full open/navigate/toggle/close cycle, detailed below                                                       |

Row 13 was checked in both directions: Tab forward through Next actions, and Shift+Tab backward up
the timeline rail, which steps one row per press. No row produced two stops, so the row-as-control
construction holds — there is no link nested inside the button.

Focus rings were visible in both themes: the Needs attention and Next actions rings in light, the
column-menu trigger ring in dark.

What construction evidence supported before observation: every row is a real `Button` with `render={<Link/>}` and
`nativeButton={false}`, so each is one tab stop with the app's own focus ring rather than a
container `onClick`; and no target is under 24×24, measured at 0 undersized controls across the
four sections.

## Closed 2026-09-08 — row 14, the company matrix column menu

Observed end to end on `/payroll` in dark theme, with working key delivery. Every step watched in
the rendered page; nothing here is inferred from the implementation.

| Gate                                          | Result                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| Columns trigger focused                       | PASS — focus ring visible on the trigger after Escape                           |
| Enter opens the menu from the focused trigger | PASS                                                                            |
| Focus enters the menu                         | PASS — first item highlighted on open                                           |
| ArrowDown navigates                           | PASS — In the total → Employer cost → Change                                    |
| ArrowUp navigates                             | PASS — Change → Employer cost                                                   |
| Enter toggles Employer cost on                | PASS — column appears after Net pay, menu stays open, item shows a check        |
| Footer realigns without structural error      | PASS — net pay and employer cost totals each under their own heading            |
| Enter toggles Employer cost off               | PASS — column disappears, footer returns to the net pay total alone             |
| A second hidden column, by Space              | PASS — Change toggled on and off; it carries no total and the footer added none |
| Escape closes                                 | PASS                                                                            |
| Escape returns focus to the Columns trigger   | PASS — focus ring observed on the trigger                                       |

The menu lists exactly the three hideable columns and none of the seven operational ones, which is
the engine deriving the menu from `hideable` rather than a hand-kept list.

Rows 12 and 13 remain open. Key delivery was working during this pass, so they are worth closing in
the same sitting rather than waiting for another window.

## Closed 2026-09-08 — rows 8 and 9, and what remained of row 11 on P01

Observed on `/payroll` in the dev worktree, light theme, with working key delivery. Every step was
watched in the rendered page. Key delivery was proved before the gates were judged, on the same
control the gates use: `Shift+F10` on the company name recorded two `keydown` events with
`document.hasFocus()` true, so a null result would have meant a defect rather than a dead channel.

### Row 8 — `Shift+F10` on a company name

| Gate                                            | Result                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| Menu opens on the company name                  | PASS — headed `Afenda Pte. Ltd.`, one item, `Open company`       |
| Focus lands on the first enabled command        | PASS — `Open company` focused and highlighted on open            |
| Arrows move through it                          | PASS with a caveat — see below                                   |
| Enter runs the command                          | PASS — navigated to `/payroll/entities/ent-sg?return=%2Fpayroll` |
| Escape closes                                   | PASS — the popup carries `data-closed`                           |
| Escape returns focus to the originating control | PASS — focus back on the `Afenda Pte. Ltd.` link, ring visible   |

The caveat on arrows: the company vocabulary is one command, which is what the row itself predicted
(`Open company` is the whole vocabulary). `ArrowDown` was pressed and focus stayed on that one item
— no wrap error, no escape from the menu — but a one-item menu cannot demonstrate movement between
items. That gate is proved on the surfaces that have more than one command, not here.

### Row 9 — selection by keyboard

Reached the way a person reaches it: `Shift+Tab` from the company name landed on the row checkbox,
labelled `Select Afenda Pte. Ltd.`.

| Gate                              | Result                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Checkbox is reachable by keyboard | PASS — one `Shift+Tab` back from the row's identity control                                                |
| Space toggles it on               | PASS — `aria-checked` true, the row highlights                                                             |
| The engine's bar updates          | PASS — `1 company selected`, `Select all 5 matching these filters`, `Explain selection`, `Clear selection` |
| The truth strip updates           | PASS — `Employer cost S$317,796.17 · Coverage 1 of 1 included · Currency converted to SGD`                 |
| Space toggles it off              | PASS — `aria-checked` false, bar and strip both gone, focus still on the checkbox                          |

### Row 11 — the group matrix half, and a premise the row got wrong

The column menu on the company matrix was closed as row 14 earlier the same day, so what was left of
row 11 on P01 was its Export half. **There is no Export control on P01 to test.** The matrix declares
`task: ['sort', 'select', 'bulk', 'rowCommands', 'columnVisibility']` and no `onExport`, and the
rendered toolbar carries one popup trigger, `Show columns`. The toolbar builds itself from what the
definition asks for — "a table with no hideable columns has no Columns menu and one with no export
has no Export" — so the absence is the engine behaving correctly, not a missing control.

Two corrections to how row 11 was written. It said **all six** tables, but the group matrix's half of
it is now settled, so the row names the five that remain. And it said Export **menus**: export is a
single `Button` that runs on activation, never a menu, so on the surfaces that do have one the gate
is that it is reachable and activates — there is nothing to navigate or close.

## Before a release that claims keyboard accessibility

Work the table above by hand and record the date and result here. Until then, state these gates as
NOT VERIFIED rather than passing.

---

## P02 Entity Payroll Workspace — A16 step 6, 2026-09-10

Recorded against `/payroll/entities/[entityId]` at revision `d15951a` plus the step 6
implementation, served from `C:\JackProjectfenda-xForge-v6-dev` on port 3007. The listening
PID and its parent invocation were both resolved inside that worktree before any reading was
trusted — ports are not identity.

### The four classes of evidence in this entry

They are kept apart on purpose, because the failure this ledger exists to prevent is one class
being read as another.

| Class | Token | What it means |
| ----- | ----- | ------------- |
| Automated measurement | `AUTOMATED_PASS` | A number or a capture taken from the rendered page. Admissible on its own. |
| Construction / source | `CONSTRUCTION_EVIDENCE` | What the code is built to do. **Never a pass.** Recorded only to say what a human should expect to find. |
| Fixture-unavailable | `NOT_RENDER_VERIFIED_FIXTURE_UNAVAILABLE` / `NOT_MANUALLY_VERIFIED_FIXTURE_UNAVAILABLE` | No fixture reaches the branch. Accepted verification debt, not a defect, and not a pass. |
| Awaiting a person | `PENDING_EXTERNAL_HUMAN` | Reachable through current fixtures, requires physical human keyboard observation, not yet done. |

### Automated measurement — admissible

| Gate | Result |
| ---- | ------ |
| Page body never scrolls sideways at 390px | `AUTOMATED_PASS` — `scrollWidth === clientWidth === 371` on `ent-my` |
| Run-history table scrolls inside its own container | `AUTOMATED_PASS` — the table is the only element wider than the viewport (1099px); the document does not scroll |
| Employer-cost hero does not clip at 390px | `AUTOMATED_PASS` — figure right edge 282px against a card edge of 355px |
| Run reference stays on one line at 390px | `AUTOMATED_PASS` — 143px wide, 28px tall, a single line |
| Card sections join the document outline | `AUTOMATED_PASS` — one `h1` plus nine level-2 headings; the page previously rendered one heading for six sections |
| Light and dark both render the full page | `AUTOMATED_PASS` — captured in both, via the shipped header theme toggle |
| No outbound `?return=` on P04 destinations | `AUTOMATED_PASS` — every `/payroll/runs/…` href carries only `view` or `employee` |
| Inbound `?return=` is still honoured | `AUTOMATED_PASS` — back control resolved to `/payroll?period=2026-09`, labelled *Group payroll* |

### Awaiting physical human observation — reachable through current fixtures

Every row below is `PENDING_EXTERNAL_HUMAN`. Nothing here has been attempted by synthetic keyboard
events, and no row may be closed by source inspection, browser automation, accessibility-tree
inference or any other substitute. The `CONSTRUCTION_EVIDENCE` column says only what the code was
built to do, so the person doing the pass knows what they are checking against — it is not a
result.

| Gate | Status | Construction evidence (not a result) |
| ---- | ------ | ------------------------------------ |
| Entity ObjectCommands — pointer opens the menu | `PENDING_EXTERNAL_HUMAN` | `ObjectContextMenu` + `ObjectCommandsButton` on the identity heading |
| Entity ObjectCommands — `Shift+F10` opens the same surface | `PENDING_EXTERNAL_HUMAN` | shared component handles both invocations |
| Menu belongs to the displayed entity | `PENDING_EXTERNAL_HUMAN` | `legalEntityObject(entity)` |
| Commands reachable, movement between them works | `PENDING_EXTERNAL_HUMAN` | four commands built for `ent-sg` |
| Properties is last | `PENDING_EXTERNAL_HUMAN` | shared grammar places it last |
| Enter activates the focused command | `PENDING_EXTERNAL_HUMAN` | — |
| Escape closes; focus returns to the exact invoking control, visibly | `PENDING_EXTERNAL_HUMAN` | — |
| Primary action (one context) — tab position, visible focus, Enter, destination | `PENDING_EXTERNAL_HUMAN` | `Open PR-SG-2026-09` → `/payroll/runs/run-sg-2026-09` |
| Primary action (zero context) — truthful state, no fake disabled control, no stray tab stop | `PENDING_EXTERNAL_HUMAN` | `ent-feed` renders a sentence, not a button |
| Exception items — one principal target each, tab order, Enter, destination | `PENDING_EXTERNAL_HUMAN` | one `Button render={<Link/>}` per item |
| Exception items — no nested duplicate focus targets | `PENDING_EXTERNAL_HUMAN` | — |
| Exception item — right-click exposes the exception object | `PENDING_EXTERNAL_HUMAN` | `payrollExceptionObject` / `payrollExceptionCommands` |
| Department chips — reachable, activation updates `?dept=`, selected state not colour-only | `PENDING_EXTERNAL_HUMAN` | six `<Link>` chips carrying `aria-current` |
| Department chips — clear path reachable, clearing restores unfiltered state | `PENDING_EXTERNAL_HUMAN` | *Clear filter* control |
| Run-history governed table — tab order, sorting, sort state, column menu, Escape, focus restore, selection | `PENDING_EXTERNAL_HUMAN` | governed engine; capabilities this dataset does not enable are to be marked `NOT_APPLICABLE` by the observer, not pre-judged here |
| Run-history — compact horizontal scroll does not trap focus | `PENDING_EXTERNAL_HUMAN` | — |
| Focus ring visible on every control, both themes | `PENDING_EXTERNAL_HUMAN` | — |
| Logical document tab order through the four bands | `PENDING_EXTERNAL_HUMAN` | — |
| No keyboard trap anywhere on the page | `PENDING_EXTERNAL_HUMAN` | — |
| No hidden or removed legacy control remains focusable | `PENDING_EXTERNAL_HUMAN` | — |
| No interactive target smaller than 24x24 | `PENDING_EXTERNAL_HUMAN` | — |

### Fixture-unavailable — accepted verification debt, not defects

| Branch | Render | Keyboard |
| ------ | ------ | -------- |
| More-than-one actionable payroll context chooser | `NOT_RENDER_VERIFIED_FIXTURE_UNAVAILABLE` | `NOT_MANUALLY_VERIFIED_FIXTURE_UNAVAILABLE` |
| Unresolved funding position | `NOT_RENDER_VERIFIED_FIXTURE_UNAVAILABLE` | not applicable — no interactive control |

Every entity has one monthly pay group and at most one non-terminal run, so the chooser never
appears; `PayGroup.entityId` permits more, which is why the branch exists and was not deleted.
Every entity has a default funding account whose currency matches its runs, so the truthful
no-position state never renders — it is the branch that keeps P02-DEF-001A closed for a company
with no compatible account. No fixture was mutated to reach either.

### P02 pre-freeze pass, 2026-09-10 — status of the two unreachable branches, and what is still owed

Correcting the wording of the two entries above to the programme's status tokens, and stating
plainly what this ledger does **not** yet contain.

| Branch                                              | Render status                            | Keyboard status                              |
| --------------------------------------------------- | ---------------------------------------- | -------------------------------------------- |
| More-than-one actionable payroll context chooser    | `NOT_RENDER_VERIFIED_FIXTURE_UNAVAILABLE` | `NOT_MANUALLY_VERIFIED_FIXTURE_UNAVAILABLE` |
| Unresolved funding position                         | `NOT_RENDER_VERIFIED_FIXTURE_UNAVAILABLE` | not applicable — no interactive control      |

Neither is a defect. Both are accepted verification debt: no fixture reaches them, and no fixture
was invented to. Their source and contract evidence stands unchanged.

#### Human keyboard acceptance: `PENDING_EXTERNAL_HUMAN`

The pre-freeze pass requires a person to physically exercise the keyboard gates on the P02 surface.
**That has not happened, and it is an outstanding acceptance dependency rather than a P02 defect.**
No row in the P02 table above has been upgraded, because every form of evidence available without a
person — source inspection, browser automation, synthetic keyboard events, construction evidence,
accessibility-tree inference — is explicitly excluded from closing these rows.

Outstanding, all reachable through current fixtures:

- legal entity object — pointer open, `Shift+F10`, command set, Properties last, movement, Enter,
  Escape, focus return to the exact invoking target, visible focus
- primary next action — tab position, visible focus, activation semantics, direct navigation on the
  one-context branch, and that the zero-context branch renders no fake disabled control
- exception items — one reachable target each, tab order, Enter, destination, no nested focus targets
- department chips — reachable, activation updates `?dept=`, focus stays understandable, the clear
  path is reachable
- run-history governed table — sorting, toolbar, column menu, focus order, horizontal scroll at
  compact width. Capabilities this dataset does not enable are **not** to be exercised for the sake
  of producing evidence
- general — document tab order, no keyboard trap, visible focus, Escape and focus restoration
  wherever an overlay exists

Any reachable keyboard failure found in that pass is a freeze blocker. Until the pass is done and
its outcomes written here, **`FREEZE_STATUS = BLOCKED_BY_HUMAN_ACCEPTANCE`.** If every reachable
check passes the status becomes `ELIGIBLE_FOR_FREEZE`; if any reachable check fails it becomes
`BLOCKED_BY_REACHABLE_DEFECT` and the defect is classified before any code change resumes.

#### One correction made in this pass, affecting a row above

The P02→P04 navigation no longer appends `?return=`. The run workspace never consumed it, so the
parameter was an address that looked like context preservation without being it. The missing
capability is recorded as **P02-GAP-004**. Browser history Back is not an implementation of that
contract and is not claimed as one.

## P02 — automated browser interaction acceptance, 2026-09-10

A governance decision replaced the physical human keyboard gate for P02 V1 with an **automated
browser interaction acceptance** gate. Every `PENDING_EXTERNAL_HUMAN` row in the P02 entry above is
superseded by a row below. Those rows are left in place rather than deleted, so the record still
shows what was owed and how the requirement changed.

**No row here is a `MANUAL_PASS`, and no human keyboard pass has taken place.** The waiver means one
thing only: P02 V1 accepts browser-level interaction verification instead of requiring a person.

### How these rows were produced

Playwright 1.62.1 driving Chromium against the verified worktree runtime — worker PID 29136, parent
21560, `next dev --port 3007` resolving inside `C:\JackProject\afenda-xForge-v6-dev` at `d15951a`.
Playwright is not a dependency of this repo and none was added; it was resolved from an existing
install outside the project tree and driven from the session scratchpad, so `package.json`,
`pnpm-lock.yaml` and `node_modules` are untouched.

Every key goes through the browser's own input pipeline, which is the same path a physical keypress
takes. The proof is at the DOM: `Shift+F10` raises a `contextmenu` event reporting `button:-1,
buttons:0, detail:0` — the keyboard signature `ObjectCommands` documents, and distinct from a
right-click's `button:2`.

Not used, by construction: `element.dispatchEvent`, direct React handler invocation, unit-test
simulation, or setting focus or state to manufacture an expected result. Source was read to build
selectors; no row is asserted from it.

Focus indication is proved by rendered computed style — the focused element's `outline`,
`box-shadow` and `text-decoration` are compared against an unfocused clone measured in place. A
class name in the source proves nothing and closes nothing.

### Result vocabulary

| Token | What it means |
| ----- | ------------- |
| `AUTOMATED_BROWSER_PASS` | Exercised through the real keyboard interaction path against the rendered page, and observed to behave as specified. |
| `AUTOMATED_BROWSER_FAIL` | Same method, observed not to. |
| `NOT_APPLICABLE` | The capability is not enabled for this dataset or not declared by the component. **Never a pass.** |
| `NOT_RENDER_VERIFIED_FIXTURE_UNAVAILABLE` / `NOT_AUTOMATED_KEYBOARD_VERIFIED_FIXTURE_UNAVAILABLE` | No fixture reaches the branch. Accepted verification debt. |

### Results — 46 pass, 3 fail, 4 not applicable

| Gate | Result | Observed |
| ---- | ------ | -------- |
| Entity ObjectCommands — pointer opens the menu | `AUTOMATED_BROWSER_PASS` | control test; opens the same surface as the keyboard route |
| Entity ObjectCommands — `Shift+F10` opens the same surface | `AUTOMATED_BROWSER_PASS` | trigger reached by 37 real Tab presses; exactly one menu opened |
| Menu belongs to the displayed entity | `AUTOMATED_BROWSER_PASS` | `aria-label="Commands for Afenda Pte. Ltd."` |
| Commands reachable, movement between them works | `AUTOMATED_BROWSER_PASS` | keyboard opening lands on the first command; ArrowDown walked all four, ArrowUp reversed |
| Properties is last | `AUTOMATED_BROWSER_PASS` | Open payments, Open compliance, Copy registration number, **Properties** |
| Enter activates the focused command | `AUTOMATED_BROWSER_PASS` | Enter on Properties opened the sheet without navigating |
| Escape closes the menu; focus returns to the exact invoking control, visibly | `AUTOMATED_BROWSER_PASS` | node-identity comparison, not a name match; ring re-rendered |
| **Escape closes the Properties sheet; focus is restored** | **`AUTOMATED_BROWSER_FAIL`** | **sheet closes, focus falls to `<body>` — FAIL-A** |
| Primary action (one context) — tab position, visible focus, Enter, destination | `AUTOMATED_BROWSER_PASS` | 38 Tabs; Enter → `/payroll/runs/run-sg-2026-09` |
| No inert `return=` on the primary destination | `AUTOMATED_BROWSER_PASS` | query string empty |
| Primary action (zero context) — truthful state, no fake disabled control, no stray tab stop | `AUTOMATED_BROWSER_PASS` | `ent-feed`; no focusable descendant, no action-like stop in a 60-stop sweep |
| Exception items — one principal target each, tab order, Enter, destination | `AUTOMATED_BROWSER_PASS` | five items, one target each; Enter → `…?employee=emp-013` |
| Exception items — no nested duplicate focus targets | `AUTOMATED_BROWSER_PASS` | one focusable per `li`, all five |
| Exception item — keyboard exposes the exception object | `AUTOMATED_BROWSER_PASS` | `Commands for No bank account on file · Yuki Tanaka` |
| Department chips — reachable, activation updates `?dept=`, selected state not colour-only | `AUTOMATED_BROWSER_PASS` | 55 Tabs; `?run=…&dept=dept-eng`; `aria-current="true"` |
| Department chips — focus survives the query update | `AUTOMATED_BROWSER_PASS` | focus stayed on the chip, ring still rendered |
| Department chips — clear path reachable, clearing restores unfiltered state | `AUTOMATED_BROWSER_PASS` | `dept` dropped, `run` kept |
| **Clear filter — focus remains valid after clearing** | **`AUTOMATED_BROWSER_FAIL`** | **the control unmounts itself; focus falls to `<body>` — FAIL-B** |
| Run-history — `aria-sort` present | `AUTOMATED_BROWSER_PASS` | all nine data headers |
| Run-history — keyboard sorting | `AUTOMATED_BROWSER_PASS` | Enter on *Sort by Run* moved `aria-sort` none → ascending |
| Run-history — row commands open, Escape, focus restore | `AUTOMATED_BROWSER_PASS` | restored to the exact row trigger |
| Run-history — Calculation Version remains present | `AUTOMATED_BROWSER_PASS` | column present, cells `#9 #3 #3 #3 #3` |
| Run-history — column menu | `NOT_APPLICABLE` | no header-level menu trigger; task list is sort, search, paginate, rowCommands |
| Run-history — selection | `NOT_APPLICABLE` | `select` not declared for this table |
| Run-history — grid arrow-key cell movement | `NOT_APPLICABLE` | static table, not a `role="grid"` widget |
| Run-history — horizontal scroll does not trap focus | `NOT_APPLICABLE` | at 1440px `scrollWidth === clientWidth === 1136`; nothing overflows to trap |
| Focus indication visible on every control, both themes | `AUTOMATED_BROWSER_PASS` | light 59 stops, dark 62 stops, none without a rendered change; theme switched with the shipped header control |
| Logical document tab order through the four bands | `AUTOMATED_BROWSER_PASS` | 59 in-flow stops in `main`, zero backward jumps in document coordinates |
| No keyboard trap anywhere on the page | `AUTOMATED_BROWSER_PASS` | 86 stops, then focus returned to the identical first DOM node |
| No invisible focus stop | `AUTOMATED_BROWSER_PASS` | every application stop has non-zero size |
| Every focus stop has an accessible name | `AUTOMATED_BROWSER_PASS` | including the run-history search field, named from its placeholder |
| No hidden or removed legacy control remains focusable | `AUTOMATED_BROWSER_PASS` | the four unimported components contribute no reachable control |
| No interactive target smaller than 24×24 | `AUTOMATED_BROWSER_PASS` | 22 of 60 below the floor, all inline text under the SC 2.5.8 exception; no non-exempt target undersized |
| **No dead or legacy controls in the traversal** | **`AUTOMATED_BROWSER_FAIL`** | **footer *Support* and *Docs* both `href="#"` — FAIL-C** |

### The three failures

| | FAIL-A | FAIL-B | FAIL-C |
| --- | --- | --- | --- |
| **Surface** | Legal-entity Properties sheet | *Needs attention* → *Clear filter* | Application footer |
| **Expected** | closing returns focus to the opening control | focus stays valid after clearing | no dead control in the traversal |
| **Observed** | focus falls to `<body>` | focus falls to `<body>` | *Support* and *Docs* are inert `href="#"` |
| **Entity / route** | `/payroll/entities/ent-sg` | `…/ent-sg?run=PR-SG-2026-09&dept=dept-eng` | `/payroll/entities/ent-sg`, stops 84–85 |
| **Reproduction** | Tab ×37 → `Shift+F10` → ArrowDown to Properties → Enter → Escape | Tab to *Clear filter* → Enter | Tab to the footer |
| **Focus before** | `BUTTON` *Commands for Afenda Pte. Ltd.*, then `BUTTON` *Close* in the sheet | `A` *Clear filter* | preceding footer stop |
| **Focus after** | `BODY` | `BODY` | the dead anchor itself |
| **Determinism** | 5 of 5 | 4 of 4 | every traversal |
| **Control test** | same on `/payroll/runs`, 3 of 3; same via the Close button | the chip path keeps focus, because the chip survives | present on `/payroll`, `/payroll/runs`, `/dashboard/ecommerce` |
| **Boundary** | `SHARED_PRIMITIVE` | `P02_LOCAL` | `SHARED_PRIMITIVE` |

FAIL-A is `PropertiesSheet` / `sheet.tsx`: focus entry is correct and trapped, only the exit is
unhandled, and the sheet is opened programmatically from a menu item so the primitive has no trigger
to return to. FAIL-B is `entity-attention.tsx`, which renders *Clear filter* only while the filter it
removes is set. FAIL-C is `layout/Footer.tsx`, inherited AdminCN scaffolding present on frozen P01 —
reachable from P02, so recorded, but not a P02 regression.

### Fixture-unavailable — unchanged, still not blocking

| Branch | Render | Keyboard |
| ------ | ------ | -------- |
| More-than-one actionable payroll context chooser | `NOT_RENDER_VERIFIED_FIXTURE_UNAVAILABLE` | `NOT_AUTOMATED_KEYBOARD_VERIFIED_FIXTURE_UNAVAILABLE` |
| Unresolved funding position | `NOT_RENDER_VERIFIED_FIXTURE_UNAVAILABLE` | not applicable — no interactive control |

Confirmed again from the rendered page across all five entities: every one has at most one
non-terminal run, so the chooser never mounts, and every one resolves a funding account, so the
no-position state never renders. `src/fake-db/**` was not modified to reach either.

### Status

```
STEP_6_IMPLEMENTATION          COMPLETE
AUTOMATED_QUALITY_GATES        PASS
RENDER_VALIDATION              PASS_WITH_DECLARED_FIXTURE_GAPS
HUMAN_KEYBOARD_ACCEPTANCE      SUPERSEDED_BY_P02_ACCEPTANCE_POLICY
AUTOMATED_KEYBOARD_ACCEPTANCE  FAIL
FREEZE_STATUS                  BLOCKED_BY_REACHABLE_DEFECT
```

The pass law's tokens — `AUTOMATED_KEYBOARD_ACCEPTANCE = PASS`, `HUMAN_KEYBOARD_ACCEPTANCE =
WAIVED_BY_P02_ACCEPTANCE_POLICY`, `FREEZE_STATUS = ELIGIBLE_FOR_FREEZE` — are conditional on every
reachable gate passing. Three did not, so none of them is written here.

No source file changed during this pass, so build, lint and check-types were not rerun. Under the
failure law, nothing is repaired: the three failures are recorded and P02 stops.

## P02 — post-fix acceptance, 2026-09-10

One P02-local defect was authorised and corrected: **FAIL-B**, the *Clear filter* control in
*Needs attention*. The two inherited failures were classified as non-blocking shared debt and are
recorded in [`.architecture/shared-debt-register.md`](../shared-debt-register.md) as `SD-001` and
`SD-002`, so they stay discoverable after P02 freezes.

Re-verified runtime: worker PID 12432, parent 14408, `next dev --port 3007` resolving inside
`C:\JackProject\afenda-xForge-v6-dev` at `d15951a`. The server was restarted after `pnpm build`
rather than trusted across it, because `next build` writes the same `.next` the dev server reads.

| Gate | Result | Observed |
| ---- | ------ | -------- |
| **Clear filter — focus preserved after clearing** | **`AUTOMATED_BROWSER_PASS` 5/5** | 40 Tabs to *Clear filter*, Enter; `dept` dropped and `run` kept; focus lands on the *Needs attention* heading (`data-slot="card-title"`, `role="heading"`, `aria-level="2"`, `tabIndex -1`), visibly indicated; Clear control gone with no disabled remnant; previously focused node detached. Never `<body>` in any repetition. |
| Primary next action | `AUTOMATED_BROWSER_PASS` | 38 Tabs, Enter → `/payroll/runs/run-sg-2026-09`, no query, no `return=` |
| Zero-action state | `AUTOMATED_BROWSER_PASS` | `ent-feed`, truthful sentence, no focusable descendant |
| Exception items | `AUTOMATED_BROWSER_PASS` | five items, one target each, Enter → `?employee=emp-013` |
| Department filters — select | `AUTOMATED_BROWSER_PASS` | `?dept=dept-eng`, `aria-current="true"`, focus stayed on the chip |
| Run-history integration | `AUTOMATED_BROWSER_PASS` | keyboard sort `none` → `ascending`; Calculation column present |
| Run-history row commands | `AUTOMATED_BROWSER_PASS` | Shift+F10 opens, Escape closes, focus restored to the exact row trigger |
| Full traversal, P02-owned content | `AUTOMATED_BROWSER_PASS` | 57 stops in `main` excluding the shell footer: none without `:focus-visible`, none zero-size, no dead control. The new heading did not become a tab stop. |
| Properties sheet focus restoration | `EXPECTED_SHARED_DEBT_REPRODUCED` | still falls to `<body>` — `SD-001`, not repaired here, **not a pass** |
| Global shell dead anchors | `EXPECTED_SHARED_DEBT_REPRODUCED` | footer *Support* / *Docs* still `href="#"` — `SD-002`, not repaired here, **not a pass** |

Quality gates, rerun because source changed: `pnpm check-types` PASS · `pnpm lint` PASS ·
`pnpm build` PASS (exit 0) · strict design audit PASS, all nine checks at budget.

```
P02_LOCAL_AUTOMATED_KEYBOARD_ACCEPTANCE  PASS
AUTOMATED_KEYBOARD_ACCEPTANCE            PASS_WITH_DECLARED_SHARED_DEBTS
HUMAN_KEYBOARD_ACCEPTANCE                SUPERSEDED_BY_P02_ACCEPTANCE_POLICY
FREEZE_STATUS                            ELIGIBLE_FOR_FREEZE_WITH_SHARED_DEBTS
```

The waiver means P02 V1 accepts browser-level interaction verification instead of a physical human
pass. **It does not mean human testing occurred.** No row in this ledger's P02 entries is a
`MANUAL_PASS`.
