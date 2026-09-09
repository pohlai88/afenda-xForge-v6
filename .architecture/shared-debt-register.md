# Shared and global defect register

Defects that are **reachable from a product surface but not owned by it**: they live in a shared
primitive or in the global application shell, they reproduce outside the surface that found them,
and the surface neither introduced nor worsened them.

This register exists so those defects survive the freeze of the page that discovered them. A page
contract freezes a page. It does not certify that every inherited primitive beneath it is
defect-free, and a debt recorded only inside a frozen page's release narrative stops being
discoverable the moment that page is closed.

## Acceptance ownership law

A reachable failure **blocks** a page freeze when the page owns it, the page introduced or
regressed it, or the page can only function by relying on the broken behaviour.

A failure may be carried here as **non-blocking shared debt** only when all five are proven:

1. reproduced outside the discovering page;
2. owned by a shared primitive or the global shell;
3. existed independently of the discovering page;
4. the discovering page did not introduce or worsen it;
5. recording it does not label the behaviour a pass.

Nothing in this register is a `PASS`. Every entry is `OPEN_SHARED_DEBT` until its owning programme
repairs it.

---

## SD-001 — Properties sheet does not restore focus when it closes

|                    |                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| **Status**         | `OPEN_SHARED_DEBT` — fix authored on an unmerged branch, see *Fix in flight*                     |
| **Owner boundary** | `SHARED_PRIMITIVE` — `src/components/shared/PropertiesSheet.tsx`, `src/components/ui/sheet.tsx` |
| **Discovered by**  | P02 Entity Payroll Workspace, automated browser keyboard acceptance, 2026-09-10                 |
| **Affects**        | every consumer of `PropertiesSheet`                                                             |

**Expected.** Closing the Properties sheet returns focus to the control it was opened from — the
`ObjectCommands` trigger, or the row command trigger in a governed table.

**Observed.** Focus falls to `<body>`. A keyboard reader who opens Properties and closes it is
returned to the start of the document, losing their position in the task.

**Reproduction.** On `/payroll/entities/ent-sg`: Tab to _Commands for Afenda Pte. Ltd._ (37 presses
from load), `Shift+F10`, ArrowDown to _Properties_, `Enter`, then `Escape`.
Focus before: `BUTTON` _Commands for Afenda Pte. Ltd._, then `BUTTON` _Close_ inside the sheet.
Focus after: `BODY`. Deterministic, 5 of 5 repetitions.

**Control-route reproduction.** `/payroll/runs` (P04 run queue), same shared component, 3 of 3.
Also reproduces when the sheet is closed by its own _Close_ button rather than by `Escape`, so it is
not specific to the `Escape` path.

**Diagnosis.** Focus _entry_ is correct — it lands on _Close_ and is trapped inside the dialog.
Only the exit is unhandled. `SheetContent` passes no `finalFocus`, and the sheet is opened
programmatically from a menu item rather than from a `Sheet` trigger, so the primitive has no
recorded trigger to return focus to.

**Why P02 did not fix it.** P02 does not own the primitive, did not introduce the behaviour, and
does not depend on it to function — the surrounding menu interaction restores focus correctly on its
own. Repairing it inside P02 would mean either editing a shared primitive from a page pass or
forking it behind a P02-only workaround. Both were explicitly rejected: the fix belongs once, in the
primitive, for every consumer.

**Repair note for the owning programme.** The fix is at the primitive, not at the call sites: give
the sheet a way to record and restore the element it was summoned from, the way
`ObjectContextMenu` already does with `finalFocus` and the way `QueryPanel` does with its
`returnFocus` ref. Doing it per consumer would put the same logic in four places and leave the fifth
without it.

### Fix in flight — authored outside the frozen line, 2026-09-10

`e682393` *"fix(ux): Properties takes the focus it opens with"* on
`payroll/phase10-properties-focus` rewrites `PropertiesSheet.tsx` from 89 lines to 216 and makes
entry and restoration one lifecycle: focus is captured into a `restoreTo` ref at the instant it is
taken, a callback ref covers the first open, and an effect covers reopens and every close. It
carries a 289-line browser closure record, `.HITL/phase10-properties-sheet-focus-browser-closure.md`
(`79a6771`) — 22 probes, all PASS, at 1440, 1024 and 390, measured with capturing
`focusin`/`focusout` against `document.activeElement`.

**This does not close SD-001 yet**, and the entry stays `OPEN_SHARED_DEBT`. Verified against this
line of code: `e682393` is NOT an ancestor of `main` or `dev`. `PropertiesSheet.tsx` at `5f1370b` is
still the 89-line version with zero occurrences of `restoreTo` or `takeFocus`, so the defect is live
in the frozen line exactly as recorded. A debt cannot be closed in a tree against a commit that tree
does not contain — the same rule the acceptance policy applies to everything else here.

**Closes when** `payroll/phase12-command-palette-focus` (which contains `e682393`) merges to `main`,
and the reproduction above is re-run against the merged tree and fails to reproduce. Then, and only
then, this entry closes citing `e682393`.

### Correction to the diagnosis above, from the author of the fix

The original repair note suggested giving the sheet a way to record and restore its summoning
element. That is what `e682393` does, so the direction was right. But one implication needs
correcting, because it would mislead the next reader:

**Declaring `finalFocus` on the sheet would not have fixed this.** Base UI restores focus on
*unmount*, and this popup does not unmount — it stays in the document carrying `data-closed`. So a
declared `finalFocus` has no moment to run. Corroborated independently in this tree, in code that
predates the fix: `ObjectCommands.tsx:309` already records *"the popup does not unmount on close — it
stays in the document carrying `data-closed` — so there is no unmount to hook either"*, and
`QueryPanel.tsx:244` keeps its own `finalFocus` while noting it *"is Base UI's to run"* and adding an
explicit restoration beside it rather than relying on it. Three surfaces have now reached the same
conclusion separately.

The absence of `finalFocus` on `SheetContent` was reported accurately — it is genuinely not there at
`5f1370b` — but it was the wrong thing to point at. Restoration had to become an explicit effect
keyed on `open`. That is the durable lesson, and it is why this correction is recorded rather than
quietly edited away.

---

## SD-002 — Dead anchors in the global shell footer

|                    |                                                                                 |
| ------------------ | ------------------------------------------------------------------------------- |
| **Status**         | `OPEN_SHARED_DEBT`                                                              |
| **Owner boundary** | `GLOBAL_SHELL / SHARED_PRIMITIVE` — `src/components/layout/Footer.tsx`          |
| **Discovered by**  | P02 Entity Payroll Workspace, automated browser keyboard acceptance, 2026-09-10 |
| **Affects**        | every route in the application                                                  |

**Expected.** No dead control participates in keyboard traversal. A control that takes a tab stop
does something when it is activated.

**Observed.** The footer renders _Support_ and _Docs_ as anchors with `href="#"`. Both take a tab
stop and neither does anything. They are stops 84 and 85 of 85 in the P02 traversal.

**Reproduction.** On `/payroll/entities/ent-sg`, Tab from page start through to the footer.
Focus before: the preceding footer stop. Focus after: the dead anchor itself — focus behaviour is
correct, the control is inert. Every traversal.

**Control-route reproduction.** Present on `/payroll` (P01, `FROZEN_V1`), `/payroll/runs` and
`/dashboard/ecommerce`.

**Why P02 did not fix it.** Inherited AdminCN template scaffolding, declared at
`Footer.tsx:9` onwards. It is app-wide, it predates P02, and it is already present on a page that
froze with it. P02 neither introduced nor worsened it, and changing the global shell during a page
pass is out of boundary.

**Repair note for the owning programme.** Either give the two links real destinations or remove
them. A dead control is worse than an absent one: it spends a tab stop and a reader's attention to
deliver nothing.

---

## Cross-references

- P02 contract: `.architecture/payroll/P02-entity-payroll-workspace.yaml`, sections
  `automated_keyboard_acceptance` and `p02_local_defect_pass`.
- Evidence tables: `.architecture/ux/manual-acceptance-ledger.md`, the P02 automated browser
  acceptance entries.

Both entries are carried through the P02 freeze as declared shared debt. Neither is a P02 defect and
neither blocks P02 V1.
