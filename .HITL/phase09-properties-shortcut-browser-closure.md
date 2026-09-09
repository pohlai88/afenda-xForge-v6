# Phase 09 — browser closure

```
branch:               payroll/phase09-properties-shortcut
base:                 62cdfe9   docs(ux): close phase 08 browser acceptance
contract:             1e4b23a   docs(ux): define phase 09 properties shortcut
implementation:       f3b8364   feat(ux): Alt+Enter opens Properties for the object the page is about
baseline measured at: 62cdfe9
verified at:          f3b8364
date:                 2026-09-10
session:              https://claude.ai/code/session_01VWrxxBPGviuNo5o4PhUg9Y
```

Seventeen probes: **sixteen PASS, one NOT VERIFIED**, no correction required. The gap was
reproduced with a capturing `keydown` listener before a line was edited, on both first-class objects.

## What was tested against

A dev server started from **this** working tree on **:3014**, its working directory confirmed as
`C:\JackProject\afenda-xForge-v6` before the first probe. The unrelated `:3007` server was neither
used nor touched.

```
/payroll/entities/ent-sg      entity_payroll   Afenda Pte. Ltd.
/payroll/entities/ent-feed    entity_payroll   Afenda Feed Vietnam Co. Ltd., awaiting data
/payroll/runs/run-sg-2026-09  payroll_run      PR-SG-2026-09, and an employee row
/payroll/runs                 no published object
```

## Viewports

```
1568 x 773 and 1280 x 575   the real Chrome viewport (the window was resized by the environment mid-session)
1440 x 560                   same-origin iframe
1024 x 560                   same-origin iframe
 390 x 560                   same-origin iframe — compact layout, see probe 17
```

## P1 — Baseline, measured before any edit

`entity_payroll` on `/payroll/entities/ent-sg`, focus on the header's back link:

```
focused before      A | role=button      "Group payroll"
event               Enter alt=true shift=false ctrl=false meta=false
isTrusted           true
defaultPrevented    false
event target        the same anchor
Properties state    unchanged — zero dialogs in the document
```

`payroll_run` on `/payroll/runs/run-sg-2026-09`, focus on "All runs": identical.

The two readings that mattered: the key **reached application code**, so nothing in the browser or
OS was swallowing it, and `defaultPrevented` was **false**, so nothing in the app was competing for
it. A genuine absence rather than a broken handler.

The pointer route worked and was the behaviour to match — right-click → **Properties** opened
`Pay run | PR-SG-2026-09 | …`.

**Verdict: PASS as a reproduction.**

## Probes after the implementation

| # | Probe | Verdict |
| --- | --- | --- |
| 1 | Baseline reproduction | **PASS** (gap demonstrated) |
| 2 | `entity_payroll`, Alt+Enter | **PASS** |
| 3 | `payroll_run`, Alt+Enter | **PASS** |
| 4 | Object identity matches the pointer route | **PASS** |
| 5 | Shift+F10 → Properties unaffected | **PASS** |
| 6 | right-click → Properties unaffected | **PASS** |
| 7 | Surface with no Properties capability | **PASS** |
| 8 | Editable target | **PASS** |
| 9 | Exact modifier | **PASS**, with `Meta+Enter` **NOT VERIFIED** |
| 10 | Focus entry | **PASS** (parity), inconsistency recorded |
| 11 | Escape | **PASS** |
| 12 | Focus restoration | **PASS** |
| 13 | QueryPanel and Phase 08 handoff | **PASS** |
| 14 | `ent-feed`, awaiting data | **PASS** |
| 15 | 1440 | **PASS** |
| 16 | 1024 | **PASS** |
| 17 | 390 compact layout | **PASS** |

### 2 — `entity_payroll` · PASS

Focus on the back link, `Alt+Enter`. The sheet opened with the full Phase 06 field set:

```
Company payroll | Afenda Pte. Ltd. | Properties — what this object is, not what to do with it.
Identity        Name Afenda Pte. Ltd. | Code SG | Country Singapore | Currency SGD |
                Registration no. 201912345K | Timezone Asia/Singapore
Payroll         Displayed run PR-SG-2026-09 | Period September 2026 | Employees 31 | Runs on record 6
Group standing  Open period September 2026 | State Blocked
System          Statutory profile SG-2026 | Id ent-sg
```

### 3 — `payroll_run` · PASS

The same gesture on the run workspace opened **the run's** Properties, not the employee's:

```
Pay run | PR-SG-2026-09 | Properties — … | Identity | Reference PR-SG-2026-09 |
Entity Afenda Pte. Ltd. | Pay group SG Monthly | Frequency Monthly | Currency SGD | Lif…
```

Two object types, one mechanism, no branch on either. That page mounts two inspectors — the run's
and an employee's — and the shortcut reached the one the page is about, which is the eligibility law
working rather than being asserted.

### 4 — Object identity · PASS

Opened the same object both ways in the same page load. The sheet text from right-click →
**Properties** is character-for-character the sheet text from `Alt+Enter`, down to
`Displayed run PR-SG-2026-09` and `Id ent-sg`. They are the same component instance, so they could
not have differed.

### 5 — Shift+F10 · PASS

`Shift+F10` from the back link opened the menu, arrow keys reached **Properties → Alt+Enter**, Enter
opened the sheet. The menu order is unchanged and Properties is still last.

### 6 — Right-click · PASS

Right-click the header → **Properties** → the sheet opened, unchanged.

### 7 — No Properties capability · PASS

`/payroll/runs` publishes no object context. `Alt+Enter` there:

```
open sheets            0
sheet elements in DOM  0     — nothing was even mounted, let alone opened
focused                unchanged
path                   unchanged
```

No fake inspector, and nothing consumed the key.

### 8 — Editable target · PASS

With the 360 Query panel open and focus in its filter — an `input` with `role=combobox`, which is
exactly what the guard is written for:

```
Alt+Enter    open sheets 0      no Properties opened
             panel still open   focus still on the filter
```

The panel's own list did select its highlighted question, which is **cmdk's** Enter handling and not
this phase's doing: a plain `Enter` in the same filter does the identical thing, measured
immediately afterwards. That is the guard behaving exactly as written — the event was left as it
arrived rather than prevented, and the editable control kept it.

### 9 — Exact modifier · PASS, with one NOT VERIFIED

With focus on `document.body` on a Properties-capable page:

```
Enter                open sheets 0
Shift+Enter          open sheets 0
Ctrl+Enter           open sheets 0
Ctrl+Shift+Enter     open sheets 0
Alt+Shift+Enter      open sheets 0
Alt+Enter            Properties opened
```

The last line matters as much as the first five: it proves the negatives were the modifier law and
not "nothing works from the body".

**`Meta+Enter` — NOT VERIFIED.** On Windows the Meta key is the Windows key and the OS takes it
before the page; the harness cannot deliver the combination. The guard rejects `metaKey` in the same
expression that rejects `ctrlKey`, which was proven, but that is construction evidence and is not
counted as a browser PASS.

### 10 — Focus entry · PASS (parity), with an inconsistency recorded

Measured on both routes:

```
pointer route, baseline     focus stays on the context-menu item, outside the sheet
Alt+Enter, first open       focus enters the sheet — BUTTON aria-label="Close"
Alt+Enter, later opens      focus stays on the invoking control, outside the sheet
```

So `PropertiesSheet` takes entry focus on a page's first open and not on subsequent ones — the same
shape Phase 08 found in `QueryPanel`, in the primitive rather than in either caller, and present on
the pointer route before this phase existed. Phase 09's law was parity with the pointer route, and
`Alt+Enter` is never worse than it: at worst focus stays on a live, focusable control the reader was
already on, where the pointer route strands it on a menu item that then unmounts.

Nothing is trapped, which is what would have made this a blocker — see probe 11. Recorded as the
next unresolved capability rather than fixed here, because §14 of this phase forbids a second focus
solution in a primitive that owns its own lifecycle.

### 11 — Escape · PASS

Escape closed the sheet in **both** focus states — with focus inside it, and with focus still on the
page. Measured twice, each time reading past the exit transition: an element carrying `data-closed`
is still in the document and still has height, and counting it as open is how this record almost
reported a defect that was not there.

### 12 — Focus restoration · PASS

After Escape from an `Alt+Enter` open:

```
open sheets   0
focused       A "Group payroll"   — the control the shortcut was pressed from
```

Not `document.body`, not the page root, not an arbitrary first control.

### 13 — QueryPanel and Phase 08 · PASS

`Ask about this` still opens the panel and Phase 08's handoff still lands focus in the filter
(`INPUT | combobox | command-input`). Phase 09 touches nothing in the query layer.

### 14 — `ent-feed`, awaiting data · PASS

`Alt+Enter` on the company with no calculation for the open period:

```
Payroll         Displayed run PR-FEED-2026-08 | Period August 2026 | Employees 20 | Runs on record 5
Group standing  Open period September 2026 | State Awaiting data
                Group total  Not included — no calculation for this period
```

No September run invented, no group inclusion claimed. The keyboard route tells the same truth the
pointer route does, because it is the same sheet.

### 15, 16, 17 — 1440, 1024, 390

Measured inside each iframe's own document, with a trusted click into the frame and the back link
focused before the keypress:

```
1440   scrollWidth 1425   scrollsSideways false   Alt+Enter → Properties open
1024   scrollWidth 1009   scrollsSideways false   Alt+Enter → Properties open
 390   scrollWidth  375   scrollsSideways false   Alt+Enter → Properties open
                                                  sheet: position fixed, right 0, width 281px
```

**Probe 17 is compact-layout verification, not a mobile-keyboard claim.** A desktop keyboard sent
`Alt+Enter` into a 390px-wide frame. What it proves is that the layout does not regress and that
Properties remains reachable and correctly sized at that width; it proves nothing about a physical
phone, which has no such binding, and the pointer route is what serves that device.

## Discoverability, verified

The menu shows the binding only where it applies:

```
entity workspace header   Open PR-SG-2026-09 | Copy registration number | Ask about this |
                          Add to favourites | Properties → Alt+Enter
employee row in a run     Open payslip | Copy employee number | Add to favourites | Properties
```

The employee row has an inspector of its own that the keyboard does not reach, so it carries no
hint. One string, one definition, rendered through the `Shortcut` slot both menu families already
had.

## The eligibility law, as it now behaves

```
Alt+Enter
  ↓ not Enter alone, not Shift/Ctrl/Meta+Enter          → ignored, event untouched
  ↓ target is input/textarea/select/contenteditable/
    role=textbox/role=combobox                          → ignored, event untouched
  ↓ the page's published ObjectContext                  → none? ignored, event untouched
  ↓ a PropertiesSheet registered for that object        → none? ignored, event untouched
  ↓
preventDefault, and open that sheet
```

## Automation limitations encountered

- **A closing sheet is still in the DOM and still has height.** Counting `[role=dialog]` reported the
  sheet as open for over a second after Escape, and this record nearly gained a defect that did not
  exist. The reliable test is `[data-slot=sheet-content]` without `data-closed`.
- **`KeyboardFocusHandoff` only fires on a fresh mount.** After several opens in one page load,
  `Shift+F10` opened the menu without moving focus into it; a page reload restored it. This is the
  same kept-mounted-popup behaviour Phase 08 documented, and it affected the probe, not the product.
- **Menu positions settle after mount**, so a coordinate measured in one call and clicked in the next
  can land on the wrong item — screenshot between the two.
- **Sending keys into an iframe needs a trusted click into the frame first**, then the target focused
  from script; the keypress then reaches the frame's own document.
- A backgrounded tab still does not hydrate; screenshot to activate, then read the DOM.

## Browser-observed vs construction evidence

**Browser-observed**, and the only basis for any PASS above: every keydown reading with its modifier
flags and `defaultPrevented`; every sheet's text; every `document.activeElement`; the two menus'
contents and the presence or absence of the hint; the query panel's survival and its focus; and the
geometry at three widths.

**Construction evidence**, used only to place the change and never converted into a verdict: that
the diff touches five shared files and no page, view, provider or server action; and that the
modifier guard rejects `metaKey`, which the harness could not deliver.

## Freeze

Phase 09 may freeze. The gap was reproduced before any edit, the contract was committed first, one
shared implementation exists with no object-type branching and no domain file touched, both
first-class objects pass, the pointer and `Shift+F10` routes are unchanged, a page with no object
stays silent, the modifier and editable-target laws are proven, focus entry and restoration are
measured on both routes, the Phase 08 regression probe passes, `check-types`, `lint` and `build` are
green and the design audit is at budget on all nine checks.

The single NOT VERIFIED is an OS-level key the harness cannot send, not an observed contradiction.

**Next unresolved capability:** `PropertiesSheet` takes entry focus only on its first open within a
page load. It is in the shared primitive, it predates this phase, it affects the pointer route
identically, and Escape still closes from either state — so nothing is trapped and nothing here
required it to be fixed.
