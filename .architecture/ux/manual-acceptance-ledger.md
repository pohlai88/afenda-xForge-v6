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

| #   | Surface           | Interaction                        | Expected                                                                                                     |
| --- | ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Payroll Run Queue | `Shift+F10` on a run reference     | Menu opens, arrows move through it, Enter runs the command, Escape closes and focus returns to the reference |
| 2   | Payroll Run Queue | `⋮` by pointer and by keyboard     | Same commands as right-click, in the same order, Properties last; Escape restores focus to the button        |
| 3   | Payroll Register  | `Shift+F10` on an employee name    | As row 1                                                                                                     |
| 4   | Payroll Register  | `⋮` by pointer and by keyboard     | As row 2                                                                                                     |
| 5   | Filings           | `Shift+F10` on a filing name       | As row 1. Filings renders no `⋮` — `Open filing` is the whole vocabulary, so right-click is the only menu    |
| 6   | Payments          | `Shift+F10` on an employee name    | As row 1                                                                                                     |
| 7   | Payments          | `⋮` by pointer and by keyboard     | As row 2, on a payment that has one. A payment with no bank reference has no `⋮` — check right-click there   |
| 8   | Group payroll     | `Shift+F10` on a company name      | As row 1. No `⋮` — `Open company` is the whole vocabulary, so right-click is the only menu                   |
| 9   | Group payroll     | Selection by keyboard              | Space toggles a checkbox, the engine's bar and the truth strip below the table both update                   |
| 10  | Run history       | `⋮` by pointer and by keyboard     | As row 2. The run the page is showing has a `⋮` but no `Open run` — it is already open                        |
| 11  | All six           | Column visibility and Export menus | Open, operate, and close by keyboard                                                                         |

### Note on row 7 — a row without a trigger

The overflow **column** is decided once for the whole table so paging and filtering cannot move the
table's geometry; the **trigger** is decided per row. On Payments the column is earned by the 163
rows with a bank reference to copy, and the rows that have no reference yet render an empty command
cell rather than a button whose menu would only repeat the click. Right-click still reaches them, so
the manual pass should check one of each.

## Closed 2026-09-07 — keyboard command access verified end to end

Observed with working key delivery on two surfaces: **Run history**
(`/payroll/entities/ent-sg`) and the **Run queue** (`/payroll/runs`), the queue twice.

| Gate | Run history | Run queue |
| --- | --- | --- |
| `Shift+F10` opens the right menu | PASS | PASS |
| Focus lands on the first enabled command | PASS | PASS |
| Arrows move through the items | PASS | PASS |
| Escape closes | PASS | PASS |
| Escape returns focus to the exact originating control | PASS | PASS |

Right-click is unchanged: opens for the correct object with Properties last, focus stays on the
document, nothing is highlighted, and the keyboard restoration does not run.

The `⋮` **opens by keyboard** — Enter on the focused trigger, `aria-expanded` true — and Escape
returns focus to the trigger, Base UI's own behaviour. Observed, so rows 2, 4, 7 and 10 are now
covered for the keyboard path. Opening it by *synthetic pointer event* still fails in this harness
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

## Before a release that claims keyboard accessibility

Work the table above by hand and record the date and result here. Until then, state these gates as
NOT VERIFIED rather than passing.
