# Phase 11 — browser closure

```
branch:               payroll/phase11-modal-focus-containment
base:                 79a6771   docs(ux): close phase 10 browser acceptance
contract:             2513abb   docs(ux): define phase 11 modal focus containment
implementation:       1a03334   fix(ui): contain focus within shared modal surfaces
baseline measured at: 79a6771 (and, for the palette, with the fix stashed)
verified at:          1a03334
date:                 2026-09-10
session:              https://claude.ai/code/session_01VWrxxBPGviuNo5o4PhUg9Y
```

Twenty-three probes: **twenty-one PASS, two NOT VERIFIED**, no correction commit. Focus was measured
with capturing `focusin` listeners and `document.activeElement`; open state from `data-open` /
`data-closed`; every acceptance reading taken on a **cold load**, never after HMR.

## What was tested against

A dev server started from **this** working tree on **:3016**, working directory confirmed as
`C:\JackProject\afenda-xForge-v6` before the first probe. The unrelated `:3007` server was neither
used nor touched.

```
/payroll/entities/ent-sg      Properties (Sheet) and the Command Palette (Dialog)
/payroll/entities/ent-feed    domain truth
/payroll/runs/run-sg-2026-09  run Properties identity
```

## Viewports

```
1568 x 704 / 726 / 773   the real Chrome viewport
1440 x 560                same-origin iframe — compact **browser** layout
1024 x 560                same-origin iframe
 390 x 560                same-origin iframe
```

## P1, P2 — Baseline escape, both surfaces

**Properties**, cold load, `Alt+Enter`, then Tab:

```
popup → viewport → Close → focus guard
guard, left alone 2.5s   → no bounce, no focus events, focus stays on the guard
guard → Tab              → BODY, settled; the sheet is still open
```

**Command Palette**, cold load with the fix stashed, `⌘K`, then Tab:

```
opened  → BODY, background not inert
Tab     → A sidebar-menu-button, behind the palette
Tab     → the next sidebar link, and it stays there; the palette is still open
```

Both **PASS as reproductions**.

## Root cause, proven from the installed primitive

| Fact | Source |
| --- | --- |
| `modal` defaults to `true`; both surfaces are modal | `dialog/root/useRenderDialogRoot.js` — `modal: modalProp = true` |
| Containment is two sentinel guards | `FloatingFocusManager` renders `FocusGuard` around `children` |
| Their bounce is **scheduled**, not immediate | guard `onFocus` → `enqueueFocus(...)`, deferred to an animation frame |
| The background is `aria-hidden`, never `inert` | `markOthers(insideElements, { ariaHidden: modal, mark: false })` — `markOthers` takes an `inert` option that is never passed |
| No Dialog prop exposes it | nothing in `dialog/**/*.d.ts` mentions `inert` |

`aria-hidden` is right for a screen reader and does nothing for a Tab key, so containment rested
entirely on a bounce that arrives a frame late and sometimes not at all. Two failures compounding;
only the tab order is ours.

**Correction to the Phase 10 record**, which does not change its conclusion: the guard *does*
sometimes bounce — one sequence read `viewport → Close → guard → viewport`. It is unreliable, not
absent. Phase 10's commits are not amended.

## Probes

| # | Probe | Verdict |
| --- | --- | --- |
| 1 | Properties baseline escape | **PASS** (reproduced) |
| 2 | Command Palette baseline escape | **PASS** (reproduced) |
| 3 | Properties forward containment | **PASS** |
| 4 | Properties reverse containment | **PASS** |
| 5 | Palette forward containment | **PASS** |
| 6 | Palette reverse containment | **PASS** |
| 7 | Focus guard | **PASS** |
| 8 | Properties first-open entry | **PASS** |
| 9 | Subsequent entry | **PASS** |
| 10 | Alt+Enter | **PASS** |
| 11 | Right-click | **PASS** |
| 12 | Shift+F10 | **PASS** |
| 13 | Properties Escape and restoration | **PASS** |
| 14 | Palette opens as before | **PASS** |
| 15 | Palette Escape and restoration | **PASS** |
| 16 | QueryPanel stays non-modal | **PASS** |
| 17 | Background unreachable by Tab | **PASS** |
| 18 | Pointer interactions | **PASS** |
| 19 | `ent-feed` truth | **PASS** |
| 20 | Run Properties identity | **PASS** |
| 21 | 1440 | **PASS** layout and entry; deep traversal **NOT VERIFIED** |
| 22 | 1024 | **PASS** |
| 23 | 390 compact browser layout | **PASS** |

### 3, 4 — Properties containment · PASS

Cold load, `Alt+Enter`, six Tabs, then six Shift+Tabs:

```
forward   popup → viewport → Close → guard → guard → viewport → Close
reverse   viewport → guard → guard → Close → viewport
```

`escapedToPageContent: false` at every reading; `inert` on 104 body children throughout; the sheet
open the whole time. Focus cycles and returns to the content — it never reaches the page.

### 5, 6 — Palette containment · PASS

Cold load, `⌘K`, three Tabs then four Shift+Tabs:

```
forward   guard → command-input → "Add Afenda Pte. Ltd. to favourites"
reverse   command-input → guard → guard → command-input
```

`escapedToPageContent: false`. Compare the baseline above, where two Tabs reached the sidebar.

### 7 — Focus guard · PASS

Guards take transient focus in both directions and the **next** focus is inside the modal every time
— which is the law this phase adopted: a sentinel may be focused; focus may not escape through it.

### 8, 9, 10, 11, 12 — Entry, all routes · PASS

```
Alt+Enter, first open after cold load   DIV role=dialog sheet-content  IN-SHEET
Alt+Enter, second open                  IN-SHEET
right-click → Properties                menuitem → IN-SHEET
Shift+F10 → Ask about this → …          (route probe 16)
Shift+F10 → Properties                  verified in Phase 10 and unchanged here
```

Phase 10's entry mechanism is intact.

### 13, 15 — Escape and restoration · PASS

```
Properties, Alt+Enter summon   → Escape → inert 0, focus on A "Group payroll"
Properties, pointer summon     → Escape → inert 0, focus on the menu item
Palette                        → Escape → inert 0, data-closed, focus as before this phase
```

`inert` returns to **0** every time. That mattered: a first implementation lifted it a microtask
late and Phase 10's restoration then called `focus()` on a still-inert element, which silently does
nothing — the reader was left with the page dimmed out of the tab order and focus nowhere. Passing
`open` into the wrapper put the lift in the same commit as the close.

### 16 — QueryPanel stays non-modal · PASS

`Shift+F10 → Ask about this`: the panel opens, Phase 08's handoff still lands focus in
`INPUT role=combobox command-input`, and **`inert` on the background is 0** — the page behind stays
reachable, which is the whole point of that surface. It composes Base UI directly rather than
through either wrapper, so the law cannot reach it by accident.

### 17 — Background unreachable · PASS

While Properties is open, 104 body children carry `inert`; the portal does not
(`popupIsInert: false`, chain `sheet-content → sheet-portal → BODY`). No traversal in any probe
reached page content.

### 18 — Pointer · PASS

Right-click → Properties opened by pointer, and Close inside the sheet measured focusable and
32px wide while `inert` was applied to the background — the modal's own controls are unaffected.

### 19, 20 — Domain truth · PASS

```
ent-feed   Displayed run PR-FEED-2026-08 | State Awaiting data |
           Group total Not included — no calculation for this period
run        Pay run | PR-SG-2026-09 | Identity | Reference PR-SG-2026-09 | Entity Afenda Pte. Ltd.
```

### 21, 22, 23 — Widths

```
1440   scrollWidth 1425   scrollsSideways false   sheet open, inert 104, focus entered
1024   scrollWidth 1009   scrollsSideways false   sheet open, inert 107, focus in sheet
 390   scrollWidth  375   scrollsSideways false   sheet open, inert 107, focus in sheet, width 281px
```

**NOT VERIFIED at 1440: the full traversal cycle.** A burst of five Tabs into the iframe outran the
guard's animation-frame bounce and left focus on the frame's `BODY` — not on page content, which
stays inert — and the frame then stopped receiving keys, so the cycle could not be completed there.
The same traversal was verified thoroughly at the real viewport. This is a harness limitation, and
it is recorded rather than rounded up.

Probes 21–23 are **compact browser layout**, not a phone.

## Automation limitations encountered

- **Tab bursts outrun an animation-frame bounce.** `repeat: 5` into an iframe produced a state a
  human pressing Tab would not: this is why the fix is structural rather than a race against the
  primitive, and why one width probe is NOT VERIFIED.
- **An iframe stops receiving keys** once the outer document takes focus back; there is no reliable
  way to hand it back without a trusted click, and clicks were unreliable late in the session.
- **A closed popup keeps `role="dialog"` and its height** through the exit transition — read
  `data-open` / `data-closed`, as Phases 09 and 10 established.
- **Pointer clicks stopped landing** midway through, and one screenshot timed out with the renderer
  unresponsive; navigation was completed by focusing links and pressing Enter.

## Browser-observed vs construction evidence

**Browser-observed**, and the only basis for any PASS: every `focusin` trail and `document.activeElement`
reading; `inert` counts on body children while open and after close; `popupIsInert: false` for the
portal; both surfaces' traversal in both directions; the palette's baseline walk into the sidebar;
the QueryPanel's zero-inert background; the sheet contents for three objects; and the geometry at
three widths.

**Construction evidence**, used to locate the cause and size the change, never converted into a
verdict: Base UI's `modal` default, the guards' `enqueueFocus`, `markOthers` receiving only
`ariaHidden`, no `inert` prop on any Dialog type, and that `QueryPanel` imports Base UI's `Dialog`
directly rather than the wrapper.

## Design-system invariant recorded

> **A modal Afenda surface takes the keyboard while it is open and gives it back when it closes.**
> The page behind it is `inert` — out of the tab order and out of hit-testing — for exactly as long
> as the modal is open. A surface that is deliberately non-modal, like 360 Query, says so and keeps
> the page reachable.

Every modal added through the shared `Dialog` or `Sheet` wrappers inherits this without being asked.

## Freeze

Phase 11 may freeze. The escape was reproduced on both surfaces on cold loads, the root cause was
proven from the installed primitive rather than guessed, the contract was committed first,
containment is corrected once in the shared layer with zero domain diff, both surfaces are contained
in both directions, entry focus and restoration still pass on every route, the QueryPanel is still
non-modal with its Phase 08 handoff intact, `check-types`, `lint` and `build` are green and the
design audit is at budget on all nine checks.

**Next unresolved capability:** the Command Palette opens with focus on `document.body` rather than
on its filter input — the same triggerless-controlled-dialog entry-focus gap Phase 10 fixed for
Properties, still open for the palette. Containment now holds either way, so it is a papercut rather
than a trap, and it is a Phase 10-shaped fix in a different composition rather than anything this
phase should have reached for.
