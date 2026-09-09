# Phase 06 — browser closure

```
branch:               payroll/phase06
contract:             fb4de00   docs(payroll): define phase 06 entity workspace object identity
implementation:       805bac2   feat(payroll): implement phase 06 entity workspace object identity
tested at:            805bac2 for probes 1, 3-10; the correction commit for probes 2 and 3
date:                 2026-09-10
session:              https://claude.ai/code/session_01VWrxxBPGviuNo5o4PhUg9Y
```

This record exists because `805bac2` shipped with four of its own acceptance probes marked
**NOT browser-verified**, on the honest ground that the automation had failed mid-session. This is
the pass that ran them. Every verdict below is separated into what was **observed in the rendered
product** and what is only **construction evidence**; the second kind is never a PASS.

## What was tested against

The dev server that was already running on `:3007` was serving
`C:\JackProject\afenda-xForge-v6-dev` at commit `d15951a` — **a different checkout of a different
branch**, not this working tree. Its DOM did not match either the Phase 06 or the pre-Phase-06
markup, and its breadcrumb read `Ent Sg` on both the entity workspace and the run workspace. Nothing
observed against `:3007` is evidence about this branch and none of it is recorded below.

A dev server was started for this tree on `:3011` and every reading in this record was taken from it.

## Routes

```
/payroll/entities/ent-sg      Afenda Pte. Ltd.              primary
/payroll/entities/ent-feed    Afenda Feed Vietnam Co. Ltd.  awaiting_data, no run for the open period
/payroll/runs/run-sg-2026-09  PR-SG-2026-09                 control surface, not under test
/payroll                      group payroll                 control surface, not under test
```

Entity ids are the seed's own. `ent-feed` is the only company whose open period (`2026-09`) has no
run — `SKIPPED` in `pay-runs.ts` — so it is the only `awaiting_data` company and the only company
with no current run. **No company in the seed has zero runs at all**, so the `runs.length === 0`
branch was not exercised; inventing a fixture to reach it was out of scope.

## Viewports

```
1280 x 704   the real Chrome viewport (window is 1920 physical at dpr 1.5)
1440 x 900   same-origin iframe
1024 x 900   same-origin iframe
 390 x 900   same-origin iframe
```

Chrome window resize is ignored in this environment — `resize_window` to 1440x900 returned success
and `window.innerWidth` stayed at 1280. Narrow widths were therefore probed with a same-origin
iframe at the target width, reading `documentElement.scrollWidth` against the iframe's own
`innerWidth`. The iframe gets a real viewport of the stated width; the measurements are the inner
document's.

## Probes

| # | Probe | Verdict |
| --- | --- | --- |
| 1 | Breadcrumb leaf is domain identity | **PASS** |
| 2 | Recents records and shows the `entity_payroll` object | **FAIL at `805bac2`, PASS after correction** |
| 3 | Right-click contextual menu | **FAIL at `805bac2` (missing favourite), PASS after correction** |
| 4 | Shift+F10 opens the same surface | **PASS** |
| 5 | Properties from current domain data | **PASS** |
| 6 | `awaiting_data` company | **PASS** |
| 7 | Company with no current run | **PASS** |
| 7b | Company with **no runs at all** | **NOT VERIFIED** — no such company exists in the seed |
| 8 | 1440 | **PASS** |
| 9 | 1024 | **PASS** |
| 10 | 390 | **PASS** |

### 1 — Object identity / breadcrumb · PASS

Observed on `/payroll/entities/ent-sg`, read from the visible tree after hydration and stable across
three reads over 7s:

```
Home / Payroll / Entities / Afenda Pte. Ltd.
```

`<h1>` reads `Afenda Pte. Ltd.`; `document.title` reads `Afenda Pte. Ltd. · Payroll`. The leaf is
domain identity, not route identity.

**Timing note, not a defect.** The breadcrumb renders `Ent Sg` from the streamed server HTML and
becomes the company name when `PublishObjectContext`'s effect runs. Any screenshot taken before
hydration shows `Ent Sg`, and several in this session did. The published value is the one that
stands.

### 2 — Recents · FAIL at `805bac2`, PASS after correction

Observed at `805bac2`: visiting the workspace wrote the first-class object to session storage —

```
afenda.find.recent = [{"kind":"object","type":"entity_payroll","id":"ent-sg"}]
```

— so the recorded item is the object, not a route or a URL. But opening the command palette
rendered **`Recent → PR-SG-2026-09` only**, and the stored entry was **deleted**: session storage
went from two entries to one, keeping only `payroll_run`. The company was unreachable in Recents and
could not become reachable, because each visit re-recorded an entry the next palette open discarded.

This contradicts the committed contract in `fb4de00`: objective 1 "page enters Recents" and
acceptance probe 2 "Navigating away and back shows the company in Recents".

Observed after the correction, on `/payroll/runs/run-sg-2026-09` having visited the company first:

```
Recent
  PR-SG-2026-09      September 2026 · Pending approval
  Afenda Pte. Ltd.   Singapore · pays in SGD
```

The recent item carries the company's name and a company icon, and the stored target survives the
resolution pass.

### 3 — Right-click contextual menu · FAIL at `805bac2`, PASS after correction

Observed at `805bac2`, right-clicking the header on `/payroll/entities/ent-sg`:

```
Afenda Pte. Ltd. | Open PR-SG-2026-09 | Copy registration number | Properties
```

The two required absences hold, and held at every reading in this session:

- **`Ask about this` does not appear.** There is no `entity_payroll` query provider, and the
  registry's rule is that an absent type is absent everywhere — not disabled, not an empty panel.
- **No entity-level Audit is invented.** The domain has no entity-level audit trail and the menu
  offers no command that would open nothing.

`Properties` is last. But **`Add to favourites` was missing**, against `fb4de00` objective 4
("inherits favouriting … from the shared command layer") and acceptance probe 3, which names
favourite between Copy registration number and Properties.

Observed after the correction:

```
Afenda Pte. Ltd. | Open PR-SG-2026-09 | Copy registration number | Add to favourites | Properties
```

and on `ent-feed`:

```
Afenda Feed Vietnam Co. Ltd. | Open PR-FEED-2026-08 | Copy registration number | Add to favourites | Properties
```

The run command names the run the page is showing rather than saying "current", which is what the
company awaiting data proves: it displays August and the menu says `Open PR-FEED-2026-08`.

**On the harness.** The first right-click of the session opened nothing, which matches this repo's
recorded automation failure. It was not the automation. The same gesture on the shipped run
workspace opened its menu immediately, which is the control this repo's debugging note requires
before calling a control broken; a second attempt on the entity header, landing on the subtitle
line, opened the menu and every subsequent attempt did too. The first click missed the trigger.

### 4 — Shift+F10 · PASS

Focus was placed on the header's existing focusable control — the `Group payroll` back link — and a
real `shift+F10` was delivered by the harness. Instrumented listeners recorded both events as
trusted:

```
F10|shift=true|trusted=true
CONTEXTMENU|trusted=true|target=A
```

The menu opened with the identical command set, and focus moved into the popup —
`document.activeElement` became `Open PR-SG-2026-09`, so the menu is driveable from the keyboard and
not merely visible. Re-run after the correction with the same result. This is keyboard parity
observed in the product, not inferred from the pointer path.

### 5 — Properties · PASS

Opened through the menu's own `Properties` item on `/payroll/entities/ent-sg`. Rendered:

```
Company payroll — Afenda Pte. Ltd.
Properties — what this object is, not what to do with it.

Identity        Name             Afenda Pte. Ltd.
                Code             SG
                Country          Singapore
                Currency         SGD
                Registration no. 201912345K
                Timezone         Asia/Singapore
Payroll         Displayed run    PR-SG-2026-09
                Period           September 2026
                Employees        31
                Runs on record   6
Group standing  Open period      September 2026
                State            Blocked
System          Statutory profile SG-2026
                Id               ent-sg
```

The displayed run matches the run the page is showing. **No group-consolidation truth is
overstated**: the `Group total` row is absent entirely for a company that is not `awaiting_data`, so
inclusion is never claimed. That asymmetry is the point of the probe and it holds in the rendered
product.

### 6 — Awaiting-data company · PASS

`/payroll/entities/ent-feed`, whose open period `2026-09` has no run.

```
breadcrumb   Home / Payroll / Entities / Afenda Feed Vietnam Co. Ltd.
h1           Afenda Feed Vietnam Co. Ltd.
banner       No run has been created for this period
             The figures below are PR-FEED-2026-08, the most recent calculation.
             This company is not included in the group total for the open period.
```

Properties:

```
Payroll         Displayed run    PR-FEED-2026-08
                Period           August 2026
                Employees        20
                Runs on record   5
Group standing  Open period      September 2026
                State            Awaiting data
                Group total      Not included — no calculation for this period
```

Identity intact, breadcrumb human-readable, no crash, no sideways scroll. Exclusion is **stated**,
because consolidation excludes `awaiting_data` unconditionally and the page can prove it. Inclusion
is **not invented** anywhere on the surface.

### 7 — Company with no current run · PASS

Same company. `entity_payroll` identity does not depend on a run existing for the open period: the
breadcrumb, the heading, the menu and Properties all resolve from the company, and the only thing
the missing run changes is which run is named. No September run state is fabricated — the page names
August and says so twice, in the banner and in Properties.

### 7b — Company with no runs at all · NOT VERIFIED

The `runs.length === 0` branch — "No payroll yet", and a command list that omits Open — is not
reachable from the seed. `buildPeriods` skips only `ent-feed` for `2026-09`; every company has runs.
Reaching this branch needs a fixture that does not exist, so it is recorded unverified rather than
tested against invented data.

### 8 — 1440 · PASS

```
innerWidth        1440
scrollWidth       1425      scrollsSideways false
breadcrumb        Home / Payroll / Entities / Afenda Pte. Ltd.   x=280 w=1121
header            x=280 w=1121 h=84, computed display flex, flex-direction row
elements past the viewport edge:  0
```

### 9 — 1024 · PASS

```
innerWidth        1024
scrollWidth       1009      scrollsSideways false
breadcrumb        Home / Payroll / Entities / Afenda Pte. Ltd.   x=24 w=961
header            x=24 w=961 h=84, flex / row — same composition as 1440
```

25 elements extend past 1024, all of them the employee table and its rows, inside their own
horizontally scrolling container. The page itself does not scroll sideways. Responsive compression
only: nothing semantic disappears and nothing is replaced by a different control.

### 10 — 390 · PASS

```
innerWidth        390
scrollWidth       375   clientWidth 375   scrollsSideways false
breadcrumb        Home / Payroll / Entities / Afenda Pte. Ltd.   x=16 w=343 — full trail, not truncated
header            x=16 w=343 h=84, flex / row
context menu      opens, x=128 w=200 right=328 — inside the viewport
```

The menu opens at 390 and fits, so the object is operable and not merely rendered. The breadcrumb
keeps all four crumbs; orientation semantics are identical to 1440.

**Out-of-scope observation, recorded and not fixed.** At 390 the run-status card's total
(`S$317,796.17`) is laid out to `right=387` inside a container ending at `359`, under an ancestor
with `overflow-x: hidden` — so roughly 28px of the figure is clipped with no way to scroll to it.
This is **not** a Phase 06 defect: the same shape occurs on `/payroll`, which Phase 06 did not
touch, where the group hero figure runs to `right=351` inside a `335`-wide container with the same
hidden overflow. It belongs to the card layer at narrow widths and is left for whoever owns that.

## Defect found, and the correction

One root cause produced both failures, and it was one line's worth of registration missing rather
than anything wrong in the Phase 06 files.

```
probe             2 (Recents), and the missing favourite in 3
owning layer      src/lib/find/find-object-adapter.ts — FIND_OBJECT_TYPES has no entity_payroll
```

`findObjectType('entity_payroll')` returned `undefined`, and two shared surfaces read it:

- `ObjectCommands.tsx:104` offers the favourite command only for types Find can address, so the
  item was withheld.
- `find-sources.ts:30` drops a hit whose type is unknown, so `resolveTargets` reported the stored
  recent as unresolved and `forgetUnresolvedRecent` deleted it.

The brief's own premise — that the workspace "inherits favouriting … from the shared command layer"
— was the mistake. The shared layer inherits nothing for a type it has never been told about, and an
object that publishes itself must be addressable in the adapter or it never reaches the surfaces
that promise it.

**Correction, smallest that closes both:**

```
src/lib/find/find-object-adapter.ts   register entity_payroll — heading, icon, href.
                                      No commands, for the same reason as employee: the entity
                                      commands close over the legal entity and the displayed run,
                                      neither of which the adapter holds.
src/app/server/find-actions.ts        resolve an entity_payroll target back to its company, minted
                                      by entityPayrollObject so the recent entry and the breadcrumb
                                      that recorded it cannot disagree about the label.
```

No new store, route, primitive or chrome; no query provider; no change to the three files `805bac2`
touched. Committed separately as a Phase 06 correction — `805bac2` is not amended.

**Gates after the correction:**

```
pnpm check-types      PASS
pnpm lint             PASS
pnpm build            PASS
design-system audit   PASS — 9 / 9, all checks at budget
```

## Automation limitations encountered

Recorded so the next session does not spend the same time on them.

- **The already-running dev server was the wrong repository.** `:3007` served a sibling checkout at
  an unrelated commit. Confirm the server's working directory before trusting a single reading.
- **A backgrounded tab does not hydrate.** `document.hidden` stays `true` and `document.body.innerText`
  sits at 146 characters — the app shell only — indefinitely, while the page content waits in Next's
  streamed `<div hidden>`. Taking a screenshot activates the tab and hydration then completes. Every
  measurement in this record was taken after a screenshot, with `bodyLen` in the 4.4k–4.8k range as
  the evidence that the page was real.
- **A screenshot can be a stale frame.** More than once the screenshot showed pre-hydration content
  while the DOM read immediately afterwards showed the hydrated page. Where the two disagree the DOM
  read is the later state.
- **Chrome window resize is ignored.** `resize_window` reports success and changes nothing. Use an
  iframe at the target width.
- **The JS tool refuses any result containing query-string-shaped data.** Two probes returned
  `[BLOCKED: Cookie/query string data]` because an element's `outerHTML` or `className` happened to
  contain one. Return attribute names and geometry, never raw HTML or hrefs.
- **`computer` timed out twice** — once on a screenshot, once with the extension reporting the page
  as possibly unresponsive. Both recovered on the next call.
- **Synthetic events do not drive Base UI.** A dispatched `KeyboardEvent('Escape')` left the menu
  open; the harness's own key press closed it. Clicking a menu **item** through `element.click()`
  does work, because that is an ordinary React handler — that is how Properties was opened on
  `ent-feed`.

None of these blocked a probe in the end. Every probe this harness could execute was executed.

## Browser-observed vs construction evidence

**Browser-observed** — read from the rendered product on `:3011`, and the only thing any PASS above
rests on: the breadcrumb text; the recent entries and the palette's Recent list; the context menu's
items and its two absences; the trusted `F10|shift=true` and `contextmenu` events with focus landing
inside the popup; every Properties field and value; the awaiting-data banner; and all geometry at
1440, 1024 and 390.

**Construction evidence** — read from source, used only to locate the defect's owner and to size the
correction, and never converted into a verdict: `FIND_OBJECT_TYPES` lacking `entity_payroll`; the
gate at `ObjectCommands.tsx:104`; the drop at `find-sources.ts:30`; `buildPeriods` skipping only
`ent-feed`, which is why 7b is NOT VERIFIED rather than PASS.

One console error was observed on the entity workspace — *"Can't perform a React state update on a
component that hasn't mounted yet"*, reported by the React DevTools hook. It is not Phase 06's: the
identical message appeared on the unrelated `:3007` checkout at commit `d15951a`, which does not
contain any Phase 06 code.

## Freeze

Phase 06 may freeze. Every probe the harness could execute is PASS. The one NOT VERIFIED result
(7b) is caused by the absence of a company with no runs in the seed, not by an observed product
contradiction, and reaching it would have required inventing data. The two probes that failed at
`805bac2` failed against the committed contract, were diagnosed to a single shared-layer omission,
were corrected in a separate commit, and were re-observed as PASS in the browser.

The next unresolved capability is the `entity_payroll` 360 Query provider, which stays deliberately
absent: `Ask about this` is correctly missing from the menu until it exists.
