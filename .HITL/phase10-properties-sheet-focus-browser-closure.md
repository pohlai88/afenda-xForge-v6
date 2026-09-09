# Phase 10 — browser closure

```
branch:               payroll/phase10-properties-focus
base:                 ead5011   docs(ux): close phase 09 browser acceptance
contract:             0c14351   docs(ux): define phase 10 properties focus lifecycle
implementation:       e682393   fix(ux): Properties takes the focus it opens with
baseline measured at: ead5011
verified at:          e682393
date:                 2026-09-10
session:              https://claude.ai/code/session_01VWrxxBPGviuNo5o4PhUg9Y
```

Twenty-two probes, all PASS, no correction commit. Focus was measured with capturing
`focusin`/`focusout` listeners and `document.activeElement`; open state was read from `data-open` /
`data-closed`, never from counting `[role=dialog]`.

## What was tested against

A dev server started from **this** working tree on **:3015**, working directory confirmed as
`C:\JackProject\afenda-xForge-v6` before the first probe. The unrelated `:3007` server was neither
used nor touched.

```
/payroll/entities/ent-sg      entity_payroll   Afenda Pte. Ltd.
/payroll/entities/ent-feed    entity_payroll   Afenda Feed Vietnam Co. Ltd., awaiting data
/payroll/runs/run-sg-2026-09  payroll_run      PR-SG-2026-09
/payroll/runs                 no published object
command palette               a shipped Base UI modal, used as a control
```

## Viewports

```
1568 x 704 / 1568 x 773   the real Chrome viewport
1440 x 560                 same-origin iframe
1024 x 560                 same-origin iframe
 390 x 560                 same-origin iframe — compact **browser** layout, see probe 22
```

## P1 — Baseline, and a correction to the brief

Measured at `ead5011`, before any edit:

| Route | Which open | Active element after open | Focus events |
| --- | --- | --- | --- |
| `entity_payroll`, Alt+Enter | first after load | `A role=button` "Group payroll" — outside | none |
| `entity_payroll`, Alt+Enter | second | same — outside | none |
| `entity_payroll`, right-click → Properties | first after load | `DIV role=menuitem` — outside | none |
| `payroll_run`, Alt+Enter | first after load | `A role=button` "All runs" — outside | none |

**The Phase 10 brief frames this as a first-open defect. It was not.** Focus never entered the sheet,
on any open, by any route. Phase 09's closure recorded one first open landing on the Close button;
that reading was taken immediately after an HMR update rather than a cold load and did not reproduce.
**Phase 09's commits are not amended** — this record supersedes that one observation.

The consequence, measured: with the modal sheet open, `Tab` moved focus to a control **behind** it.

Structure while open: popup `tabIndex -1`; tabbables inside are the scroll viewport
(`DIV[tabindex=0]`) and `BUTTON` "Close". The sheet element is **absent** from the document before
the first open.

**Verdict: PASS as a reproduction.**

## What the fix had to be, from measurement rather than assumption

Two attempts, each measured, each wrong in the opposite direction:

```
initialFocus={popup} alone      first open  focus enters the sheet
                                second open focus stays outside — no mount to hook
effect on `open` alone          first open  focus stays outside — the element is not yet reachable
                                second open focus enters the sheet
```

So the entry law is both: a **callback ref** for the moment the node attaches, and an **effect on
`open`** for the opens where nothing attaches. `initialFocus` stays because it aims Base UI at the
same element instead of at its default, which is the Close button — and one of the three routes is
`Alt+Enter`, so a reader still holding Enter would dismiss the inspector they had just opened.

Restoration then had to become explicit for the same structural reason: `finalFocus` is declared and
cannot run, because Base UI restores on unmount and this popup does not unmount. Phase 09 measured
restoration working only because focus had never left the page.

## Probes

| # | Probe | Verdict |
| --- | --- | --- |
| 1 | Baseline first-open failure | **PASS** (defect demonstrated) |
| 2 | `entity_payroll`, fresh load, Alt+Enter | **PASS** |
| 3 | Second open | **PASS** |
| 4 | `payroll_run`, fresh load, Alt+Enter | **PASS** |
| 5 | Right-click → Properties, fresh load | **PASS** |
| 6 | Shift+F10 → Properties, fresh load | **PASS** |
| 7 | Immediate keyboard operation | **PASS** |
| 8 | Tab | **PASS** |
| 9 | Shift+Tab | **PASS** |
| 10 | Escape | **PASS** |
| 11 | Restoration, Alt+Enter | **PASS** |
| 12 | Restoration, pointer | **PASS** |
| 13 | Invocation parity | **PASS** |
| 14 | `ent-sg` identity unaffected | **PASS** |
| 15 | `ent-feed` truth unaffected | **PASS** |
| 16 | Run identity unaffected | **PASS** |
| 17 | QueryPanel regression | **PASS** |
| 18 | No-capability object | **PASS** |
| 19 | First open across in-app navigation | **PASS** |
| 20 | 1440 | **PASS** |
| 21 | 1024 | **PASS** |
| 22 | 390 compact browser layout | **PASS** |

### 2, 3 — first and second open · PASS

Fresh load, focus on the back link, `Alt+Enter`:

```
in  A | role=button | OUTSIDE            the back link, focused before the keypress
in  DIV | role=dialog | sheet-content | IN-SHEET
```

Escape, then `Alt+Enter` again: `DIV | role=dialog | sheet-content | IN-SHEET`. **No warm-up open.**

### 4 — `payroll_run` · PASS

Fresh load, `Alt+Enter`: focus in the sheet, and the sheet is the run's —
`Pay run | PR-SG-2026-09 | Properties — …`.

### 5 — Right-click · PASS

Fresh load, right-click the header → **Properties**:

```
in  DIV | role=menuitem | OUTSIDE
in  DIV | role=dialog | sheet-content | IN-SHEET
```

### 6 — Shift+F10 · PASS

The whole keyboard trail on the run workspace, recorded:

```
in  A | role=button | OUTSIDE            "All runs"
in  DIV | role=menuitem | OUTSIDE        menu opens
in  A | role=menuitem | OUTSIDE          arrowing
in  DIV | role=menuitem | OUTSIDE
in  DIV | role=menuitem | OUTSIDE
in  DIV | role=menuitem | OUTSIDE        Properties
in  DIV | role=dialog | sheet-content | IN-SHEET
```

### 7 — Immediate keyboard · PASS

With focus in the sheet and nothing clicked, the next keypress operated **inside** Properties:
Escape closed it. Before the fix the same keypress would have gone to the page behind.

### 8, 9 — Tab and Shift+Tab · PASS, with an observation

Traversal inside the sheet, in order:

```
Tab        popup → scroll viewport → Close → SPAN[data-base-ui-focus-guard, aria-hidden=true]
Shift+Tab  popup → SPAN[data-base-ui-focus-guard]
```

The order inside the sheet is correct and the boundary in both directions is **Base UI's own focus
guard**, which is the primitive's trap machinery and not page content.

**Observed and not fixed:** tabbing *past* that guard reached a sidebar link behind the modal. The
control test decides ownership — with the **command palette** open, a shipped Base UI modal dialog
this phase never touches, focus was already on a sidebar link behind it and `Tab` moved between
links behind it, identically. It is the shared primitive's, not Phase 10's, and §15 of this phase
forbids writing a second focus trap beside the one Base UI owns. Recorded as the next unresolved
capability.

### 10 — Escape · PASS

```
sheet   present true, data-open false, data-closed true
```

Judged on real open state. A closed popup keeps its role and its height through the exit transition,
which is how Phase 09 nearly reported a defect that was not there.

### 11, 12 — Restoration · PASS

```
Alt+Enter summon → Escape → A "Group payroll"          the control the shortcut was pressed from
pointer summon   → Escape → DIV role=menuitem          the menu item that opened it
```

Neither goes to `document.body`, the page root, or an arbitrary first control. The pointer result
matches what Phase 09 measured, so restoration is not regressed.

### 13 — Invocation parity · PASS

All three routes end at `DIV | role=dialog | sheet-content | IN-SHEET`. The summoning mechanism
differs; the opened lifecycle does not.

### 14, 15, 16 — Domain truth unaffected · PASS

```
ent-sg     Company payroll | Afenda Pte. Ltd. | … | Id | ent-sg
ent-feed   … Displayed run PR-FEED-2026-08 | Period August 2026 | Runs on record 5 |
           State Awaiting data | Group total Not included — no calculation for this period
run        Pay run | PR-SG-2026-09 | Identity | Reference PR-SG-2026-09 …
```

No September run invented for `ent-feed`, no group inclusion claimed, and the run's inspector still
inspects the run rather than an employee.

### 17 — QueryPanel · PASS

`Shift+F10` → **Ask about this** still opens the panel and Phase 08's handoff still lands focus in
`INPUT | role=combobox | command-input`.

### 18 — No-capability object · PASS

`/payroll/runs` publishes no object. `Alt+Enter` there:

```
sheet elements in the document   0
path                             unchanged
active                           BODY
```

### 19 — First open across in-app navigation · PASS

Reached without a reload — sidebar **Group** → `/payroll` → the **Afenda Feed Vietnam Co. Ltd.** row,
both by focusing the link and pressing Enter. The sheet was absent from the document again on
arrival (the previous workspace unmounted it), so this is a genuine first open, and `Alt+Enter`
landed on `DIV | role=dialog | sheet-content | IN-SHEET`.

### 20, 21, 22 — Widths

Measured inside each iframe after a trusted click into the frame and the back link focused:

```
1440   scrollWidth 1425   scrollsSideways false   sheet open, width 384px   focus in sheet
1024   scrollWidth 1009   scrollsSideways false   sheet open, width 384px   focus in sheet
 390   scrollWidth  375   scrollsSideways false   sheet open, width 281px   focus in sheet
```

**Probe 22 is compact browser layout**, not a phone: a desktop keyboard sent `Alt+Enter` into a
390px-wide frame. It proves the layout does not regress and that Properties stays usable and
correctly sized; the pointer route is what serves an actual phone.

## Automation limitations encountered

- **A closed popup keeps `role="dialog"` and its height** through the exit transition. Read
  `data-open` / `data-closed` instead — the rule this phase's contract wrote down in advance because
  Phase 09 nearly lost a probe to it.
- **Pointer clicks stopped landing** partway through the session — three consecutive clicks on links
  and a menu item did nothing, and one screenshot timed out with the renderer unresponsive. In-app
  navigation was completed by focusing links and pressing Enter instead, which is a fair
  substitution: it is the same client-side navigation.
- **A right-click before hydration opens nothing.** Two of the pointer probes needed a second attempt
  after the page had hydrated.
- **`repeat` on a key press under-delivers**, unchanged from Phases 07–09: verify the focused item
  between arrow presses rather than counting them.
- A backgrounded tab still does not hydrate; screenshot to activate, then read the DOM.

## Browser-observed vs construction evidence

**Browser-observed**, and the only basis for any PASS above: every `focusin` trail and every
`document.activeElement`; `data-open`/`data-closed` on the popup; the sheet contents for all three
objects; the tab order and the identity of the boundary element; the query panel's focus; the
absence of any sheet element on a page without a published object; and the geometry at three widths.

**Construction evidence**, used only to place the change and never converted into a verdict: that the
runtime diff is one file, `src/components/shared/PropertiesSheet.tsx`, and that `src/views`,
`src/app`, `src/lib`, `src/components/ui` and `src/components/layout` are untouched — so no Payroll
domain file, no store, no shortcut and no shared primitive was edited.

**Not claimed:** why Base UI's initial focus does not run for a triggerless controlled dialog. It was
not proven, in this phase or in Phase 08, and the contract deliberately refuses to guess.

## Freeze

Phase 10 may freeze. The defect was reproduced before any edit and the brief's framing corrected from
measurement, the contract was committed first, the entry law lives in `PropertiesSheet` alone, first
and subsequent opens behave identically, all three routes converge, the trap's interior order holds
in both directions, Escape closes on real open state, restoration works on both summon paths and is
not regressed from Phase 09, the Phase 08 query probe passes, domain truth is unchanged,
`check-types`, `lint` and `build` are green and the design audit is at budget on all nine checks. No
correction commit was needed and no unrelated defect was fixed.

**Next unresolved capability:** focus escapes a modal Base UI dialog past its own focus guard —
reproduced identically on the command palette, so it belongs to the shared primitive rather than to
Properties, and the answer is not a second hand-written trap.
