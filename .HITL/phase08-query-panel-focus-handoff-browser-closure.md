# Phase 08 — browser closure

```
branch:               payroll/phase08-query-focus
base:                 8995222   docs(payroll): close phase 07 browser acceptance
contract:             aeeedbd   docs(ux): define phase 08 query focus handoff
implementation:       8711e06   fix(query): hand focus to the 360 query panel it just opened
baseline measured at: 8995222
fix verified at:      8711e06
date:                 2026-09-10
session:              https://claude.ai/code/session_01VWrxxBPGviuNo5o4PhUg9Y
```

Fifteen probes, all PASS, no correction required. The defect was reproduced with a capturing
`focusin`/`focusout` listener before a line was edited, on both Payroll providers and on both
invocation paths, and every verdict below is a reading taken from the rendered product.

## What was tested against

A dev server started from **this** working tree on **:3013**, its working directory confirmed as
`C:\JackProject\afenda-xForge-v6` before the first probe. The unrelated server on `:3007` was
neither used nor touched.

```
/payroll/entities/ent-sg      entity_payroll   Afenda Pte. Ltd.
/payroll/runs/run-sg-2026-09  payroll_run      PR-SG-2026-09, and its employee rows (no provider)
```

Both themes were exercised incidentally — the app was in light mode for the baseline and dark mode
for most of the verification, and the focus behaviour is identical in both.

## Viewports

```
1280 x 773 and 1280 x 575   the real Chrome viewport (the window was resized by the environment mid-session)
1440 x 560                   same-origin iframe
1024 x 560                   same-origin iframe
 390 x 560                   same-origin iframe
```

## P1 — Baseline, measured before any edit

`entity_payroll`, `Shift+F10` on `/payroll/entities/ent-sg`:

```
focused before invocation    A | role=button              the "Group payroll" back link
focused after menu opens     A | role=menuitem            IN-OPEN-MENU
focused after panel opens    DIV | role=menuitem          IN-CLOSED-MENU
focus events in between      none
```

`payroll_run`, `Shift+F10` on `/payroll/runs/run-sg-2026-09`: identical — panel open,
`document.activeElement` still the menu item, now in a popup carrying `data-closed`, and the last
recorded focus event is the arrow navigation that happened before the command was activated.

**Pointer invocation fails the same way.** Right-click → click **Ask about this** leaves focus on
the closed menu item with the panel open. The Phase 07 closure recorded the pointer path as
unaffected, from a caret visible in a screenshot; the DOM measurement contradicts it and this record
supersedes that one observation. Phase 07 is not amended.

Two facts decided the fix and both were measured, not assumed:

- **The popup is absent from the document while closed** — `querySelector('[data-slot=query-panel]')`
  returns `null` between invocations. Mounting is therefore a real lifecycle signal.
- **Nothing steals focus; nothing ever sets it** — the capturing listener recorded **zero**
  `focusin` after the command was activated. Not a race between two owners.

**Verdict: PASS as a reproduction.** The defect exists, on both providers and both modalities.

## Probes after the fix

| # | Probe | Verdict |
| --- | --- | --- |
| 1 | Baseline reproduction | **PASS** (defect demonstrated) |
| 2 | `entity_payroll`, keyboard | **PASS** |
| 3 | `payroll_run`, keyboard | **PASS** |
| 4 | Right-click invocation | **PASS** |
| 5 | Typing immediately | **PASS** |
| 6 | Tab order | **PASS** |
| 7 | Escape | **PASS** |
| 8 | Focus restoration | **PASS** |
| 9 | Provider independence | **PASS** |
| 10 | Object with no provider | **PASS** |
| 11 | 1440 | **PASS** |
| 12 | 1024 | **PASS** |
| 13 | 390 | **PASS** |
| 14 | No query regression | **PASS** |
| 15 | Properties unaffected | **PASS** |

### 2 — `entity_payroll`, keyboard · PASS

`Shift+F10` from the back link, arrow to **Ask about this**, Enter. The full focus trail, recorded:

```
focusin A | role=button | button                          the back link
focusin A | role=menuitem | IN-OPEN-MENU                  menu opens, first item takes focus
focusin DIV | role=menuitem | IN-OPEN-MENU                arrowing
focusin DIV | role=menuitem | IN-OPEN-MENU                arrowing
focusin INPUT | role=combobox | command-input | IN-PANEL  the panel's filter
```

`document.activeElement` after the panel opens is `INPUT | combobox | command-input | IN-PANEL`.

### 3 — `payroll_run`, keyboard · PASS

The same sequence on the run workspace, which this phase did not touch beyond the shared panel:
panel titled `Ask about PR-SG-2026-09`, focus on `INPUT | combobox | command-input | IN-PANEL`.
**This is what proves the fix is shared** — one file changed, two providers corrected.

### 4 — Right-click invocation · PASS

Right-click the entity header, click **Ask about this**: panel open, focus on
`INPUT | combobox | command-input | IN-PANEL`. Keyboard and pointer now behave identically, which
they did not before — and did not in either direction, since the pointer path was broken too.

### 5 — Typing immediately · PASS

With the panel just opened and nothing clicked, typing `exception` went to the filter:

```
input value          "exception"
questions rendered   Who is affected by open exceptions on the latest run?
questions hidden     Which pay runs has this company calculated?
```

Two questions narrowed to one by keyboard alone.

### 6 — Tab order · PASS

The panel's tabbable controls, in document order:

```
BUTTON  aria-label="Close"
INPUT   data-slot="command-input"
```

`Shift+Tab` from the filter lands on **Close**. `Tab` forward from the filter leaves the panel — the
panel is non-modal by design and is meant to be worked beside, so the tab ring is not closed and the
contract says so. The question list is driven by arrow keys through the command primitive's
`aria-activedescendant`, not by Tab, which is the primitive's own model and was not changed.

### 7 — Escape · PASS

Escape closes through the existing behaviour: `querySelector('[data-slot=query-panel]')` returns
`null` afterwards, so the popup unmounts rather than lingering.

### 8 — Focus restoration · PASS

After Escape from a panel opened by `Shift+F10` on the back link:

```
focused   A | role=button   "Group payroll"
```

Focus returned to the exact control the panel was summoned from. Not `document.body`, not the page
root, not an arbitrary first control. The existing restoration was not replaced.

### 9 — Provider independence · PASS

Two providers, one fix, and the diff since `8995222` over `src/views`, `src/app` and `src/lib` is
**empty** — no provider, no server action, no Payroll page, no registry. The only changed source
file is `src/components/shared/QueryPanel.tsx`.

### 10 — Object with no provider · PASS

An employee row on the run workspace. `employee` is registered with Find and has **no** query
provider, and its menu still offers no query entrance:

```
run header    PR-SG-2026-09 | Copy reference | View audit trail | Ask about this | Add to favourites | Properties
employee row  Yuki Tanaka   | Open payslip   | Copy employee number | Add to favourites | Properties
```

Capability detection is untouched: the command appears exactly where a provider exists and nowhere
else.

### 11, 12, 13 — 1440, 1024, 390 · PASS

Measured inside the iframe's own document after opening the panel:

```
1440    scrollWidth 1425   scrollsSideways false   panel open   focus INPUT command-input IN-PANEL
1024    scrollWidth 1009   scrollsSideways false   panel open   focus INPUT command-input IN-PANEL
 390    scrollWidth  375   scrollsSideways false   panel open   focus INPUT command-input IN-PANEL
```

At 390 the panel also rendered both questions, so it is usable and not merely focused.

### 14 — No query regression · PASS

Both providers still answer. `entity_payroll` returned its six runs newest-first
(`PR-SG-2026-09 · September 2026 · Pending approval`, then August back to April), and `payroll_run`
returned its eight outstanding people worst-first (`Yuki Tanaka · EMP-013 · 2 open · worst: Blocker`,
`Farah Aziz · EMP-017 · 2 open · worst: Error`, …) with its **Search / Audit** switch still drawn.

### 15 — Properties unaffected · PASS

Properties opened from the employee row menu and rendered its fields
(`Employee | Yuki Tanaka | Identity | Name | Employee no. | EMP-013 …`). Nothing in this phase
touches `PropertiesSheet` or the command grammar around it.

## The focus lifecycle, as it now behaves

```
invoke Ask about this          pointer or keyboard, any provider
        ↓
openQuery(object, returnFocus) the store records the summoning control
        ↓
the popup mounts               absent from the document until this moment
        ↓
FocusHandoff mounts inside it and focuses the filter input
        ↓
the reader types, filters, arrows and selects without touching the pointer
        ↓
Escape or Close
        ↓
the popup unmounts and focus returns to the summoning control
```

## Automation limitations encountered

- **A stale `.next` cache made every route 404.** The previous phase's dev server was force-killed,
  and the next `pnpm dev` served 404 for `/`, `/payroll`, `/payroll/runs` and every entity route.
  `rm -rf .next` and a restart fixed it. Worth knowing before diagnosing a routing bug that is not
  one.
- **Pointer coordinates drift between calls.** A menu measured in one call and clicked in the next
  landed on the wrong item more than once, because Floating UI settles the popup's position after
  mount. The reliable sequence is right-click → screenshot → click the coordinate seen in the
  screenshot. At the three iframe widths the menu was opened by a **trusted** right-click and the
  command activated with `element.click()` on the rendered menu item, which is an ordinary React
  handler; the focus behaviour being measured is the same either way, and every trusted-invocation
  probe (2, 3, 4, 5, 7, 8) ran at the real viewport.
- **`repeat` on a key press under-delivers**, unchanged from Phase 07: verify the focused item
  between arrow presses rather than counting them.
- A backgrounded tab still does not hydrate; screenshot to activate, then read the DOM.

## Browser-observed vs construction evidence

**Browser-observed**, and the only basis for any PASS above: every focus trail and every
`document.activeElement` reading; the typed filter value and the question it narrowed to; the
panel's tabbable list and where `Shift+Tab` landed; the popup's absence after Escape; both menus'
contents on the run workspace; both providers' answers; the Properties sheet; and the three widths.

**Construction evidence**, used only to place the fix and never converted into a verdict: that
`git diff 8995222..HEAD` over `src/views`, `src/app` and `src/lib` is empty, so no provider or
domain file participates in the fix.

**Not claimed:** why the primitive's `initialFocus` does not move focus. It was not proven, and the
contract deliberately refuses to guess. What is proven is that it does not, and that the panel now
guarantees the handoff itself.

## Freeze

Phase 08 may freeze. The defect was reproduced and recorded before any edit, the contract was
committed first, the fix lives in one shared file, both providers and both invocation paths are
observed to pass, focus restoration still passes, the three widths pass, `check-types`, `lint` and
`build` are green and the design audit is at budget on all nine checks. No correction commit was
needed and no unrelated defect was fixed.
