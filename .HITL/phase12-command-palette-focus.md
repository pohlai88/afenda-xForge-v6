# Phase 12 — the palette takes the caret, and gives the place back

```
branch base:          e909b3b   docs(ux): close phase 11 browser acceptance
branch:               payroll/phase12-command-palette-focus
status:               contract — implementation follows in a second commit
```

**Phase 12 repairs the Command Palette's focus entry and restoration.** It is not a search feature,
not a command-grammar feature and not a Payroll feature. `⌘K` / `Ctrl+K`, the command set, the
filtering and the results are all frozen; only where the caret is when the palette opens, and where
it goes when the palette closes, are in scope.

Phase 11's closure named this as the next unresolved capability, and named it accurately: containment
now holds either way, so this is a papercut rather than a trap.

## Problem

The palette opens and the caret is not in it. A reader presses `⌘K`, types, and nothing happens —
the keystrokes go to the document. The palette exists to be typed into, so this is the whole
interaction failing quietly rather than a rough edge on it.

## Measured baseline

At `e909b3b`, cold load, `/payroll/entities/ent-sg`, capturing `focusin` listener, open state read
from `data-open` / `data-closed`:

```
Ctrl+K                    palette data-open true, command-input present, tabIndex 0
document.activeElement    BODY
focus events since open   none
type "run"                inputValue ""      ← the decisive probe
background inert          104                ← Phase 11 containment already correct
```

The palette is open, contained, and deaf.

## Mechanism, determined by measurement rather than by precedent

Phase 10 fixed the same class of defect for Properties with a callback ref **and** an `open` effect.
That is not a licence to paste the pair here — the two surfaces have different lifecycles, and the
brief for this phase says so explicitly. Both halves were therefore measured on their own, at this
composition, before either was kept:

| Attempt | First open | Later opens |
| --- | --- | --- |
| `initialFocus={popup}` — the primitive's own API | **no effect** | **no effect** |
| `open` effect alone | **fails** | passes |
| callback ref alone | passes | **fails** on a reopen inside the exit transition |
| callback ref + `open` effect | passes | passes |

`initialFocus` was tried first and measured doing nothing at all: Base UI resolves it before this
wrapper's ref exists, and a triggerless controlled dialog gives it nothing else to aim at. It is
therefore **not declared** — a prop that provably never fires is decoration, not configuration.

The two mechanisms are the exact inverse of each other, which is why both are present:

```
Dialog.Portal mounts the popup a commit after `open` becomes true
        → an effect keyed on `open` finds the ref still empty the first time

a closed popup lingers with `data-closed` until its exit transition ends
        → a reopen inside that window is a state change, not a mount,
          so the callback ref does not fire
```

Two moments, both real, neither sufficient alone. No timer is involved: mount and `open` are the
moments the lifecycle already provides.

## Entry law

```
the palette opens → the caret is in its filter, and typing reaches it
```

The filter is found by its own `data-slot=command-input` rather than by a ref threaded through the
caller, because `CommandInput` is rendered by whoever uses the palette. Focus is never moved when
focus is already inside the popup.

## Restoration law

```
the palette closes → focus returns to whatever had it when the palette opened
```

With two deliberate limits, both of which are behaviour rather than accident:

- Focus is only pulled back **when it is still inside the palette being closed**. Running a command
  navigates, and dragging a reader back from a place they chose to go is worse than leaving them.
- Restoration runs in the wrapper's own effect. By the time it runs, Phase 11's `inert` has been
  lifted, because that lift lives in a child effect and effects run child-first — the same ordering
  Phase 11 had to find by measurement.

## Phase 11 interaction

**Containment must remain intact and is not re-implemented here.** While the palette is open the
background stays `inert`; on close it returns to zero. Every entry probe reads `inert` alongside
focus for exactly this reason.

## QueryPanel is the control, again

`QueryPanel` composes Base UI's `Dialog` directly and is deliberately non-modal, so nothing in this
phase can reach it. Phase 08's handoff into its filter, and its zero-`inert` background, must both
still hold — that is what proves the change landed in `CommandDialog` and nowhere else.

## Accessibility requirement

- The palette is usable by keyboard alone from the moment it opens.
- Escape closes through the primitive; nothing new intercepts it.
- A reader who opens and closes the palette without choosing anything is left where they were.
- No ARIA, roles, labels or the shortcut itself change.

## Responsive contract

No layout change. Verified at 1440, 1024 and 390, with iframe dimensions labelled as compact
**browser** layout rather than as a phone.

## Acceptance probes

```
 1  baseline reproduced cold at e909b3b, including the typing probe
 2  first open after a cold load — caret in the filter
 3  second open — caret in the filter
 4  each candidate mechanism measured alone, before the pair is kept
 5  type immediately after opening — the characters reach the filter
 6  the shortcut is unchanged
 7  forward containment          8, 9  reverse containment
10  Escape closes               11  restoration to the summoning control
12  command execution — navigate, and do not drag the reader back
13  reopen after execution      14  Properties regression, all three of entry, containment, restore
15  QueryPanel regression — still focused, still non-modal
16  background inert while the palette is open
17  inert back to zero on close
18  domain regression on an entity with no run for the period
19, 20, 21  1440, 1024, 390
```

Cold-load evidence is required; HMR state is not baseline evidence. Trusted keys are sent one at a
time — Phase 11 recorded that a burst outruns Base UI's animation-frame guard bounce.

## Explicit exclusions

```
timers, polling, frame chasing        a hand-written focus trap
a second focus system                 changing ⌘K / Ctrl+K
changes to command discovery,         changes to Properties, properties-store
  filtering, results or navigation      or the Alt+Enter laws
making QueryPanel modal               re-implementing Phase 11 containment
domain or workspace changes           anything under .HITL/step*.txt
```

## Expected files

```
src/components/ui/command.tsx                          the only source change
.HITL/phase12-command-palette-focus.md
.HITL/phase12-command-palette-focus-browser-closure.md
```

The Phase 12 brief was given inline rather than as a file, so unlike Phases 07–11 there is no
`.HITL/phase12.txt` to track. Nothing is invented to stand in for one.

## Frozen systems

```
CommandMenu, the ⌘K listener, the command set and its results
QueryPanel and everything under the query architecture
properties-store, PropertiesShortcut, PropertiesSheet and the Alt+Enter laws
use-modal-background-inert and both shared wrappers' containment
src/views/payroll/**, src/app/server/** — expected domain diff: zero
.HITL/step03.txt, .HITL/step05.txt, .HITL/step06.txt — untracked, unrelated, untouched
```

## Design-system invariant

> **A surface that exists to be typed into takes the caret when it opens, and hands the reader's
> place back when it closes.** Where the primitive cannot say what the origin was — a controlled
> dialog with no trigger — the surface remembers it itself, and lets go of anyone who has since
> chosen to be somewhere else.

## Stop condition

Phase 12 freezes when the baseline is reproduced cold, the mechanism is chosen by measurement rather
than by precedent, the contract is committed first, entry and restoration are corrected once in
`CommandDialog`, Properties remains correct, the QueryPanel remains correct and non-modal, Phase 11
containment remains correct, cold-load evidence passes, `check-types`, `lint` and `build` are green,
the design audit is at budget and the tracked tree is clean. Phase 13 does not begin.
