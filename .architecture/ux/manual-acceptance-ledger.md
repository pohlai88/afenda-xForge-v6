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
| 7   | Payments          | `⋮` by pointer and by keyboard     | As row 2. On a payment with no bank reference the menu holds `Open payment` alone — see the note below       |
| 8   | All four          | Column visibility and Export menus | Open, operate, and close by keyboard                                                                         |

### Note on row 7 — a menu that can hold one item

The overflow column is decided once for the whole table, deliberately, so it cannot appear and
disappear as someone pages or filters. On Payments the column is earned by the 163 released and
paid rows that have a bank reference to copy; the 33 rows that do not yet have one still show a `⋮`
whose menu holds only `Open payment`. That is the cost of a column that stays put, and it is the
first table where a row's menu can be degenerate — worth a person's judgement rather than a silent
assumption that it is fine.

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
