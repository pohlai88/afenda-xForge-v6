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

Rows 8 and 9 were closed on 2026-09-08 and are recorded below. The numbers are not reused: every
other section of this file cites rows by number, so the sequence keeps its gaps.

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
