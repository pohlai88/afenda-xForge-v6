# Phase 12 — browser closure

```
branch:               payroll/phase12-command-palette-focus
base:                 e909b3b   docs(ux): close phase 11 browser acceptance
contract:             bf28819   docs(ux): define phase 12 command palette focus lifecycle
implementation:       e396912   fix(ui): focus command palette input on open
baseline measured at: e909b3b, and again with the fix stashed
verified at:          e396912
date:                 2026-09-10
session:              https://claude.ai/code/session_01VWrxxBPGviuNo5o4PhUg9Y
```

Twenty-one probes: **twenty-one PASS**, no NOT VERIFIED, no correction commit. Focus was measured
with capturing `focusin` listeners and `document.activeElement`; open state from `data-open` /
`data-closed`; containment from `inert` on `document.body` children; every acceptance reading taken
on a **cold load**, never after HMR. Trusted keys were sent one at a time.

## What was tested against

A dev server started from **this** working tree on **:3017**, the process command line confirmed as
`C:\JackProject\afenda-xForge-v6` before the first probe. The unrelated `:3007` server was neither
used nor touched. The server was stopped immediately after the last probe.

```
/payroll/entities/ent-sg        palette entry, restoration, the BODY-summon edge
/payroll/entities/ent-feed      domain truth, and the three widths
/payroll/runs/run-sg-2026-08    Properties and QueryPanel regressions, command execution
/payroll/runs/run-sg-2026-09    reached by executing a command from the palette
```

Real viewport 1568 x 704 for the probes above; the three width probes ran in same-origin iframes.

## Baseline — PASS as a reproduction

Cold load, `Ctrl+K`, at `e909b3b` and again at the tip with the fix stashed, because a baseline
measured after the change is not a baseline:

```
palette                data-open true
command-input          present, tabIndex 0
document.activeElement BODY
focus events           none since the open
type "run"             inputValue ""        ← the decisive probe
background inert       104                  ← Phase 11 containment already correct
```

## Mechanism trial — measured before anything was kept

| Attempt | First open | Later opens |
| --- | --- | --- |
| `initialFocus={popup}` | **no effect** | **no effect** |
| `open` effect alone | **fails** | passes |
| callback ref alone | passes | **fails** on a reopen inside the exit transition |
| callback ref + `open` effect | passes | passes |

`initialFocus` is Base UI's own API and the thing Phase 10 leaned on for Properties. Here it did
nothing on any open — the primitive resolves it before this wrapper's ref exists — so it is left
undeclared rather than kept as decoration. The two mechanisms that do work are inverses of each
other, which is the entire reason both are present:

```
Dialog.Portal mounts the popup a commit after `open` turns true   → the effect is too early
a closed popup lingers with `data-closed` until its exit ends     → the ref does not fire again
```

Both facts were measured in the browser, not read out of the source.

## Probes

| # | Probe | Verdict |
| --- | --- | --- |
| 1 | Baseline, cold, including the typing probe | **PASS** (reproduced) |
| 2 | First open after a cold load | **PASS** |
| 3 | Second open | **PASS** |
| 4 | Each candidate mechanism measured alone | **PASS** |
| 5 | Type immediately after opening | **PASS** |
| 6 | The shortcut is unchanged | **PASS** |
| 7 | Forward containment | **PASS** |
| 8 | Reverse containment | **PASS** |
| 9 | Reverse containment, second pass | **PASS** |
| 10 | Escape closes | **PASS** |
| 11 | Restoration to the summoning control | **PASS** |
| 12 | Command execution navigates | **PASS** |
| 13 | Reopen after execution | **PASS** |
| 14 | Properties regression — entry, containment, restoration | **PASS** |
| 15 | QueryPanel regression — focused, still non-modal | **PASS** |
| 16 | Background `inert` while the palette is open | **PASS** |
| 17 | `inert` back to zero on close | **PASS** |
| 18 | Domain regression, entity with no run for the period | **PASS** |
| 19 | 1440 | **PASS** |
| 20 | 1024 | **PASS** |
| 21 | 390 compact browser layout | **PASS** |

### 2, 3, 5 — Entry and the decisive probe · PASS

```
first open    INPUT | combobox | command-input | IN-DIALOG
type          "september"  → inputValue "september", palette showed "Nothing matches."
second open   IN-DIALOG
```

Compare the baseline, where the same keystrokes left the value empty.

Typing was re-read **scoped to `[data-slot=dialog-content]`** after an unscoped read returned `""`:
the closed QueryPanel is still in the document and carries a `command-input` of its own, so an
unscoped `querySelector` finds the wrong one. Scoped, `"reports"` read back as `"reports"`.

### 7, 8, 9 — Containment · PASS

```
forward   command-input → "Add … to favourites" → guard → BODY → guard
reverse   command-input → guard → guard → command-input
escapedToPage: false
```

The guard sequence is Phase 11's law, unchanged and not re-implemented here.

### 10, 11, 17 — Close, restore, lift · PASS

```
Escape            data-open false, data-closed true
inert             0
focus returns to  the header search BUTTON (pointer summon)
                  A "Group payroll"          (keyboard summon on /payroll/entities/ent-feed)
                  A "All runs"               (keyboard summon on the run page)
```

### 12, 13 — Execution · PASS

Typed `PR-SG-2026-08`, pressed Enter: navigated to `/payroll/runs/run-sg-2026-08`, the palette
unmounted, `inert` returned to 0, and focus was **not** dragged back to the control that had summoned
it — which is the deliberate limit in the restoration law rather than an omission. Reopening on the
new page put the caret back in the filter.

### 14 — Properties regression · PASS

`/payroll/runs/run-sg-2026-08`, focus on "All runs", `Alt+Enter`:

```
entry        DIV | dialog | sheet-content | IN-SHEET      inert 68
Tab, Tab     scroll-area-viewport → sheet-close, both IN-SHEET
Escape       data-closed, inert 0, focus back on A "All runs"
```

**A first reading of this probe reported `OUTSIDE` and was wrong about nothing but the label.** The
classifier in the page had been redefined earlier in the session to answer a question about the
palette, so it tested `closest('[data-slot=dialog-content]')` and called the Properties sheet
outside. Re-measured with a sheet-aware predicate, the same DOM reads `IN-SHEET`. Recorded because
the artefact is in the instrument, and a verdict taken from it would have been a false failure.

### 15 — QueryPanel regression · PASS

`Shift+F10 → Ask about this` on the run page:

```
query-panel        data-open true
focus              INPUT | combobox | command-input, inside [data-slot=query-panel]
background inert   0
panel              "Ask about PR-SG-2026-08 | Search | Audit | Who is affected by open exceptions?"
Escape             data-closed, inert 0, focus back on A "All runs"
```

Phase 08's handoff is intact and the surface is still deliberately non-modal.

### 16 — Containment while open · PASS

```
/payroll/runs/run-sg-2026-08     inert 71
/payroll/entities/ent-feed       inert 98
/payroll/entities/ent-sg         inert 104 (baseline) — unchanged by this phase
```

### 18 — Domain truth · PASS

```
ent-feed   "No run has been created for this period"
           "The figures below are PR-FEED-2026-08, the most recent calculation.
            This company is not included in the group total for the open period."
```

Expected domain diff was zero and the diff is zero: one file changed in the whole phase.

### 19, 20, 21 — Widths

```
1440   scrollWidth 1425   scrollsSideways false   caret in filter, typed "aug", inert 100
1024   scrollWidth 1009   scrollsSideways false   caret in filter, typed "pay", inert  98, palette 426px
 390   scrollWidth  375   scrollsSideways false   caret in filter, typed "sg",  inert  98, palette 326px
```

Probes 19–21 are **compact browser layout**, not a phone.

## One edge measured and deliberately left alone

Summoning the palette while focus is on the document — no control focused, as after a fresh load —
means the remembered origin is `document.body`, and `body.focus()` is a no-op. Measured consequence:

```
Ctrl+K from BODY → Escape → focus sits on the closing filter for the exit transition
                          → the popup unmounts → document.activeElement is BODY again
                          → Tab during that window resumes in page content, not in the popup
```

The end state is the state the reader started in, so nothing is stranded and no restoration is
missing. A branch for it would be code with no observable effect, which is the opposite of what this
phase set out to do. Recorded rather than fixed, and recorded rather than left unsaid.

## Automation limitations encountered

- **A classifier written for one surface mislabels another.** The Properties probe's first reading
  said `OUTSIDE` because the helper was palette-scoped. Re-measured with the right predicate; see 14.
- **An unscoped `[data-slot=command-input]` finds the closed QueryPanel's input**, because a
  dismissed popup stays in the document. Every value read is scoped to its own popup.
- **A Base UI dropdown trigger did not open under a synthetic click** — the known limitation for this
  app. The context menu was opened with `Shift+F10` instead, which is the keyboard route the phase
  cares about anyway.
- **One `Down` in an open menu was absorbed** while the menu was still animating in; sent again.
- **One screenshot timed out** with the renderer unresponsive, and the window reported a different
  `innerWidth` afterwards. Every measurement quoted above was taken before or independently of that,
  and the width probes ran inside iframes at explicit CSS pixel widths.

## Browser-observed vs construction evidence

**Browser-observed**, and the only basis for any PASS: every `focusin` trail and `activeElement`
reading; the input's value after typing, scoped to its own popup; `inert` counts while open and after
close on three routes; the mechanism trial's four outcomes; both containment directions; the
navigation after executing a command; the Properties and QueryPanel regressions; `ent-feed`'s domain
text; and the geometry at three widths.

**Construction evidence**, used to explain the cause and never converted into a verdict: that
`Dialog.Portal` mounts a commit late, that a dismissed popup lingers until its exit transition ends,
and that `CommandInput` is rendered by the caller rather than by the wrapper.

## Design-system invariant recorded

> **A surface that exists to be typed into takes the caret when it opens, and hands the reader's
> place back when it closes.** Where the primitive cannot say what the origin was — a controlled
> dialog with no trigger — the surface remembers it itself, and lets go of anyone who has since
> chosen to be somewhere else.

## Freeze

Phase 12 may freeze. The baseline was reproduced cold and with the fix stashed, the mechanism was
chosen by measuring each candidate alone rather than by copying the phase before it, the contract was
committed first, entry and restoration are corrected once in `CommandDialog` with a one-file diff and
zero domain diff, Properties and the non-modal QueryPanel are both unchanged, Phase 11's containment
holds while open and lifts to zero on close, `check-types`, `lint` and `build` are green and the
design audit is at budget on all nine checks.

**Next unresolved capability:** what the palette matches. Measured while probing focus, not while
looking for this: `PR-SG-2026-08` finds its run, while `september`, `august`, `aug`, `sg`, `reports`
and `compliance` all return "Nothing matches." on pages where those runs, entities and routes plainly
exist. A reader who now has the caret in the filter — which is this phase's whole contribution — will
type a word rather than a reference. That is a search-matching question, in the Find adapter and its
server actions rather than in any focus mechanism, and it is deliberately not touched here.
