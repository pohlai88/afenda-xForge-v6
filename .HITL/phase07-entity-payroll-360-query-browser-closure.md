# Phase 07 — browser closure

```
branch:               payroll/phase07-entity-360-query
base:                 93769ea   docs(payroll): what phase 06 looks like when you actually open it
contract:             beb5561   docs(payroll): define phase 07 entity payroll 360 query
implementation:       7223d7e   feat(payroll): a company can be asked about the things it is connected to
tested at:            7223d7e
date:                 2026-09-10
session:              https://claude.ai/code/session_01VWrxxBPGviuNo5o4PhUg9Y
```

Fourteen probes, all PASS, no corrections required. Every verdict below is a reading taken from the
rendered product; where something rests on the source instead it is labelled as construction
evidence and is not counted as a PASS.

## What was tested against

A dev server started from **this** working tree on **:3012**, its working directory confirmed as
`C:\JackProject\afenda-xForge-v6` before the first probe. The unrelated server on `:3007` — a
different checkout, recorded in the Phase 06 closure — was neither used nor touched.

```
/payroll/entities/ent-sg      Afenda Pte. Ltd.              a company with a current run
/payroll/entities/ent-feed    Afenda Feed Vietnam Co. Ltd.  awaiting data, no run for the open period
/payroll/runs/run-sg-2026-09  PR-SG-2026-09                 control surface, not under test
```

## Viewports

```
1280 x 773   the real Chrome viewport
1440 x 760   same-origin iframe
1024 x 760   same-origin iframe
 390 x 760   same-origin iframe
```

Chrome window resize is ignored in this environment, so the three named widths were probed with a
same-origin iframe at the target width and measured from inside the iframe's own document. One
caveat on that technique is recorded under *Automation limitations*.

## Probes

| # | Probe | Verdict |
| --- | --- | --- |
| 1 | Provider registration, no page-local special case | **PASS** |
| 2 | Context menu gains Ask about this | **PASS** |
| 3 | Shift+F10 keyboard parity | **PASS** |
| 4 | Query opens in context | **PASS** |
| 5 | Correct object identity, `ent-sg` and `ent-feed` | **PASS** |
| 6 | Normal entity answers from provable data | **PASS** |
| 7 | Awaiting-data entity | **PASS** |
| 8 | No current-period run | **PASS** |
| 9 | Unsupported intent omitted | **PASS** |
| 10 | 1440 | **PASS** |
| 11 | 1024 | **PASS** |
| 12 | 390 | **PASS** |
| 13 | Close and focus restoration | **PASS** |
| 14 | Existing providers unaffected | **PASS** |

### 1 — Provider registration · PASS

The browser-observed half: the command **Ask about this** now renders on the `entity_payroll`
object, and still renders on `payroll_run` and in the same position, produced by the same
`ObjectCommandItems` for all three. Nothing about the entity page renders it specially — the
capability arrived through the registry and the menu learned nothing new.

Construction evidence, stated as such and not counted as the PASS: `git diff 93769ea..HEAD` touches
neither `ObjectCommands.tsx`, `QueryPanel.tsx`, `query-store.ts`, `query-types.ts`,
`find-object-adapter.ts`, the entity page, nor `entity-identity.tsx`. The whole diff is three source
files — the server actions, the provider, and one registration line.

### 2 — Context menu · PASS

Right-clicking the header on `/payroll/entities/ent-sg`:

```
Afenda Pte. Ltd. | Open PR-SG-2026-09 | Copy registration number | Ask about this | Add to favourites | Properties
```

Ask about this sits between the domain's commands and favourites; **Properties is last**; **no Audit
command has appeared**. On `/payroll/entities/ent-feed` the same, with the run command naming that
company's own latest run:

```
Afenda Feed Vietnam Co. Ltd. | Open PR-FEED-2026-08 | Copy registration number | Ask about this | Add to favourites | Properties
```

### 3 — Shift+F10 · PASS

Focus placed on the header's `Group payroll` back link, `shift+F10` delivered by the harness. The
menu opened with the identical six entries including Ask about this, and focus moved into the popup
(`document.activeElement` became `Open PR-SG-2026-09`). Arrowing to Ask about this and pressing
Enter opened the panel on the company. Keyboard parity is observed, not inferred from the pointer
path.

### 4 — Query opens in context · PASS

Invoking the command opened the shell's query panel over the workspace. `location.pathname` stayed
`/payroll/entities/ent-sg`, the breadcrumb still read `Home / Payroll / Entities / Afenda Pte. Ltd.`,
and the workspace stayed visible and interactive beside the panel. No route was created and none was
navigated to; only the address's `?ask=` parameter changed, which is the existing panel's own
behaviour.

### 5 — Object identity · PASS

The panel title is the company, on both entities:

```
ent-sg     Ask about Afenda Pte. Ltd.
ent-feed   Ask about Afenda Feed Vietnam Co. Ltd.
```

Never a route id, never the run, never a surrogate. The run workspace's own panel still titles itself
`Ask about PR-SG-2026-09`, so the two objects are not being confused for one another.

### 6 — Normal entity · PASS

`ent-sg` publishes both questions, and no mode switch renders — correct, because the provider
declares one mode and the panel only draws the switch above one.

**Which pay runs has this company calculated?**

```
PR-SG-2026-09   September 2026 · Pending approval
PR-SG-2026-08   August 2026 · Closed
PR-SG-2026-07   July 2026 · Closed
PR-SG-2026-06   June 2026 · Closed
PR-SG-2026-05   May 2026 · Closed
PR-SG-2026-04   April 2026 · Closed
```

Six, newest first, matching `Runs on record: 6` in the Phase 06 Properties panel.

**Who is affected by open exceptions on the latest run?**

```
Yuki Tanaka     EMP-013 · 2 open · worst: Blocker
Farah Aziz      EMP-017 · 2 open · worst: Error
Ben Carter      EMP-037 · 1 open · worst: Warning
Bram de Vries   EMP-018 · 1 open · worst: Warning
Grace Chen      EMP-009 · 1 open · worst: Warning
Ines Cardoso    EMP-019 · 1 open · worst: Warning
Julian Reyes    EMP-016 · 1 open · worst: Warning
Kwame Mensah    EMP-012 · 1 open · worst: Warning
```

Blockers first, then by name. Every row is a record, rendered as a `FindResult`; nothing is
summarised, scored or concluded.

### 7 — Awaiting-data entity · PASS

`ent-feed`. The panel opens, and its one question answers:

```
PR-FEED-2026-08   August 2026 · Closed
PR-FEED-2026-07   July 2026 · Closed
PR-FEED-2026-06   June 2026 · Closed
PR-FEED-2026-05   May 2026 · Closed
PR-FEED-2026-04   April 2026 · Closed
```

**No September run is fabricated** — the list ends at August, exactly as the workspace banner and
Properties say. Nothing in the panel claims the company is in the group total for the open period,
and no question is offered that would have to answer that.

### 8 — No current-period run · PASS

The same company, and the point of the probe: `entity_payroll` identity and queryability do not
depend on a run existing for the open period. The object is published, the command appears, the
panel opens on the company, and the run history answers.

### 9 — Unsupported intent omitted · PASS

`ent-feed` renders **one** question. `Who is affected by open exceptions on the latest run?` is
**absent** — not greyed, not disabled, not present with an empty result — because that company's
latest run is closed with nothing outstanding. Directly observed as the difference between the two
entities' panels, from the same provider.

### 10 — 1440 · PASS

```
innerWidth        1440
scrollWidth       1425   clientWidth 1425   scrollsSideways false
breadcrumb        Home / Payroll / Entities / Afenda Pte. Ltd.   x=280 w=1121
h1                Afenda Pte. Ltd.
panel             position fixed, right 0px, width 448px, both questions rendered
```

### 11 — 1024 · PASS

```
innerWidth        1024
scrollWidth       1009   clientWidth 1009   scrollsSideways false
breadcrumb        Home / Payroll / Entities / Afenda Pte. Ltd.   x=24 w=961
panel             position fixed, right 0px, width 448px, both questions rendered
```

### 12 — 390 · PASS

```
innerWidth        390
scrollWidth       375    clientWidth 375    scrollsSideways false
breadcrumb        Home / Payroll / Entities / Afenda Pte. Ltd.   x=16 w=343 — full trail
panel             position fixed, right 0px, width 374.67px — the full compact width
```

Compact presentation, same semantics: both questions render, and running one returned the six runs
newest-first with the page still not scrolling sideways. The panel takes the whole width at this
size rather than shrinking its content, which is the existing `w-full sm:max-w-md` behaviour and not
a payroll-specific rule.

### 13 — Close and focus restoration · PASS

Opened from a right-click on the `Group payroll` back link — a focusable control, which is what the
return-focus contract is written for — then Escape:

```
panel      closed
focus      A "Group payroll"
```

Focus returned to the exact control the panel was summoned from.

### 14 — Existing providers unaffected · PASS

`/payroll/runs/run-sg-2026-09`, untouched by this phase. Its menu still carries Copy reference, View
audit trail, Ask about this, Add to favourites and Properties; its panel still titles itself
`Ask about PR-SG-2026-09`, still renders the **Search / Audit** switch, and its search question
answers with the same eight people and the same sublabels as the entity question returns for the
same run — which is the extraction of `peopleWithOpenExceptions` proving it changed nothing.

## Observation, recorded and not fixed

**Invoking Ask about this from the keyboard leaves focus on the closed menu item rather than moving
it into the panel.** Observed on the entity workspace: after Enter on the menu item, the panel is
open and not inert, while `document.activeElement` is the `role=menuitem` div inside the popup that
now carries `data-closed`.

It is not Phase 07's. The identical sequence on the **pre-existing** `payroll_run` provider, on the
run workspace this phase did not touch, strands focus in exactly the same place:

```
entity workspace   panelOpen true, focus = menuitem "Ask about this" in a [data-closed] menu
run workspace      panelOpen true, focus = menuitem "Ask about this" in a [data-closed] menu
```

The pointer path is unaffected — the panel takes initial focus into its filter input, and Escape
returns focus correctly, which is probe 13. This belongs to the shared panel and menu layer, whose
files this phase is forbidden to touch and did not. Recorded here so it is not rediscovered as new.

The `/payroll` narrow-width card clipping recorded in the Phase 06 closure was not revisited and is
still out of scope.

## Automation limitations encountered

- **A backgrounded tab does not hydrate.** Unchanged from Phase 06: take a screenshot to activate the
  tab, then read the DOM. Every reading here was taken after activation, with `bodyLen` in the
  4.4k–5.3k range as evidence the page was real.
- **An iframe's entry transition does not run.** A panel opened inside the probe iframe keeps
  `data-starting-style` and `opacity: 0` indefinitely, so its `getBoundingClientRect()` reports the
  starting offset — at 1440 that read `right: 1465` against a 1440 viewport, which is the 40px
  `translate-x-[2.5rem]` starting transform and not an overflow. The settled layout was therefore
  read from computed style (`position: fixed`, `right: 0px`, `width`), which the stalled transition
  does not affect, and the document's own `scrollWidth` confirmed no page-level overflow at every
  width.
- **Pointer coordinates inside an iframe are unreliable.** A right-click scrolled the iframe's
  document by ~2400px between calls, and a follow-up click at previously measured coordinates landed
  on the wrong menu item — visible as a "Registration number copied" toast. At the three named widths
  the menu was opened by a **trusted** right-click at coordinates measured in the adjacent call, and
  Ask about this was then activated by `element.click()` on the rendered menu item, which is an
  ordinary React handler. The layout being measured is unaffected by which of the two opened it; the
  trusted-invocation probes (2, 3, 4, 13) were all run at the real 1280 viewport.
- **`repeat` on a key press under-delivers.** `ArrowDown` with `repeat: 2` moved the highlight once.
  Verify the focused item between presses rather than counting.
- The JS tool still refuses any result containing query-string-shaped data; return attribute names
  and geometry, never raw HTML or hrefs.

None of these blocked a probe. Every probe was executed.

## Browser-observed vs construction evidence

**Browser-observed**, and the only basis for any PASS above: the menu contents and ordering on both
entities and on the run; the trusted `shift+F10` and the focus landing inside the popup; the panel
opening without navigation; the panel titles; every question label, its presence or absence per
entity, and every answer row; focus returning to the back link on Escape; and all geometry at 1440,
1024 and 390.

**Construction evidence**, used only to locate the seam and to size the change, never converted into
a verdict: `queryProviderFor` being the single lookup; `ObjectCommands.tsx:124` computing `askable`
from it; and the diff showing that file, `QueryPanel`, the query store and types, the Find adapter,
the entity page and `entity-identity.tsx` all untouched.

## Freeze

Phase 07 may freeze. The contract is written, the provider is implemented entirely through the
existing architecture, domain truth is preserved — exclusion stated where provable, inclusion never
claimed, no run invented, no answer generated — `check-types`, `lint` and `build` are green and the
design audit is at budget on all nine checks. All fourteen probes are PASS, no correction was needed,
and the one focus observation is reproduced identically on a surface this phase did not touch.
