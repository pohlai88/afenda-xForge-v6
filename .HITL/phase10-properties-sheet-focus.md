# Phase 10 — Properties takes the focus it opens with

```
branch base:          ead5011   (09 browser closure)
branch:               payroll/phase10-properties-focus
status:               contract — implementation follows in a second commit
```

**Phase 10 repairs the shared `PropertiesSheet` lifecycle. It is not an Alt+Enter feature and it is
not a Payroll feature.** Alt+Enter is one of three routes that reach the same sheet, and all three
are measured below producing the same failure, which is how the ownership was decided rather than
assumed.

## Problem

Opening Properties leaves the reader outside it. The sheet is modal, it covers the workspace, and
focus stays on whatever summoned it — a back link, a context-menu item — with nothing inside the
sheet focused and no focus event fired at all.

The consequence is not cosmetic. **Measured: with the sheet open, `Tab` moved focus to a control
behind it.** A keyboard reader is walking page content underneath an open modal inspector, which is
the failure a modal exists to prevent.

## Measured baseline

Taken at `ead5011`, on a server started from this tree, with capturing `focusin`/`focusout`
listeners on the document. Open state read from `data-open` / `data-closed` on the popup, never from
counting `[role=dialog]` — Phase 09 nearly reported a false defect that way.

| Route | Which open | Active element after open | Focus events |
| --- | --- | --- | --- |
| `entity_payroll`, Alt+Enter | first after page load | `A role=button` "Group payroll" — **outside** | none |
| `entity_payroll`, Alt+Enter | second | `A role=button` "Group payroll" — **outside** | none |
| `entity_payroll`, right-click → Properties | first after page load | `DIV role=menuitem` — **outside** | none |
| `payroll_run`, Alt+Enter | first after page load | `A role=button` "All runs" — **outside** | none |

**The Phase 10 brief frames this as a first-open defect. It is not.** First and subsequent opens
behave identically, on every route, and nothing ever enters the sheet. Phase 09's closure recorded
one reading where a first open landed on the Close button; that measurement was taken immediately
after an HMR update rather than a cold load and does not reproduce. **Phase 09's commits are not
amended** — this record supersedes that one observation and says so.

That the framing was wrong makes the phase simpler, not larger: there is one law to write and no
warm-up case to special-case.

Structure of the sheet, measured while open:

```
popup                     [data-slot=sheet-content], tabIndex -1
tabbables inside          DIV[tabindex=0]  the scroll viewport holding the fields
                          BUTTON[tabindex=0]  aria-label="Close"
sheet element before open  absent from the document — it mounts on demand
```

## Answers the implementation is built on

| Question | Measured answer |
| --- | --- |
| What receives focus on first open? | Nothing. The summoning element keeps it. |
| On second open? | The same. |
| Is there a difference? | **No.** |
| Does the invocation method change it? | Only *which* element outside the sheet keeps focus, never that focus stays outside. |
| Does the Properties DOM exist before opening? | No — it mounts on demand and unmounts after closing. |
| Does Base UI attempt initial focus? | It declares one. `createDefaultInitialFocus` returns `true` for any non-touch interaction, meaning "the first tabbable inside the popup". No focus event of any kind is observed, so the attempt does not reach an element. |
| Is an intended target declared by us? | No. `PropertiesSheet` passes no `initialFocus` and relies on that default. |
| Is it mount, registration, ref, or primitive? | **The primitive, in this composition.** Not registration: the pointer route fails identically and never touches Phase 09's store. Not ref timing: nothing of ours schedules focus at all. The sheet is a `Dialog.Root` opened by controlled state with **no `Dialog.Trigger`** — the same shape Phase 08 found in `QueryPanel`, where an explicitly declared `initialFocus` also moved nothing. |

Why Base UI's initial focus does not run in a triggerless controlled dialog is **not claimed here**.
It was not proven, and a guess written into a contract becomes the next reader's fact. What is proven
is that it does not run, in two independent popups, and that the app must therefore state the entry
itself.

## Shared ownership

`PropertiesSheet` is the lowest layer that knows all three things at once:

```
Properties became open              it owns the `open` prop
the Properties content exists       it renders the content
the intended first target exists    it renders the popup and the controls inside it
```

Every route already converges on it — Phase 09 proved that — so a fix there is a fix for all of
them. Nothing goes into `PropertiesShortcut`, `ObjectCommands`, a page, a view or an object type.

## Base UI primitive behaviour

`SheetContent` renders `Dialog.Popup` inside `Dialog.Portal` with a `Dialog.Backdrop`, and
`Dialog.Root` is left at its default `modal`, so the sheet is modal and Base UI owns the focus trap.
The popup carries `tabIndex: -1` from Base UI's own `FOCUSABLE_POPUP_PROPS`, which is what makes the
container itself a legitimate focus target rather than a hack.

`SheetContent` spreads its props onto `Dialog.Popup`, so `initialFocus` can be declared from
`PropertiesSheet` without editing the shared `sheet.tsx` primitive.

**Base UI is not replaced, wrapped in a second primitive, or supplemented with Radix.** The
implementation states the entry the primitive already has an API for, and falls back to the repo's
own established in-popup handoff only if the primitive still moves nothing — the pattern
`ObjectCommands` uses for its menu and Phase 08 used for the query panel, both of which act on mount
and use no timer.

## First-open and subsequent-open lifecycle

One law, because the measurement found one behaviour:

```
every open, first or fiftieth, by any route
        ↓
the popup mounts
        ↓
focus enters the Properties surface
```

There is no warm-up open, and the implementation contains no branch that could create one.

## Intended focus target

**The popup container**, not the Close button and not the scroll viewport.

Properties is read-oriented — it renders no field a person can edit, by design, and this phase does
not change that. Landing on **Close** would arm Enter to dismiss the thing just opened, and one of
the three routes is `Alt+Enter`, so a reader still holding Enter would close the inspector they asked
for. Landing on the **scroll viewport** would be arbitrary: it is a scroll container, not a control.

The container is the right target because Base UI already gives it `tabIndex: -1`, it is what the
primitive itself focuses on the touch path, it puts the reader inside the trap so `Tab` reaches the
content and `Shift+Tab` reaches Close, and it announces the dialog rather than one control within it.
It is the same choice for every object type, so no branching is possible.

## Focus entry law

```
Properties opens  →  focus is inside the popup
```

No object-type branching. No invocation-specific focusing. No timer: the popup mounts on demand, so
mounting is the deterministic moment the target exists, and that is the only signal used.

## Focus restoration law

Unchanged and not re-implemented. Phase 09 measured restoration working — Escape from an `Alt+Enter`
open returned focus to the summoning control — and this phase must not regress it. Restoration is
verified again on all three routes.

Entry and restoration are separate contracts; fixing the first must not rewrite the second.

## Invocation parity

```
Alt+Enter            → Properties, focus inside
right-click → Properties → focus inside
Shift+F10 → Properties   → focus inside
```

The summoning mechanism differs; the opened lifecycle does not.

## Accessibility requirement

- A keyboard reader is never left behind an open modal inspector.
- `Tab` and `Shift+Tab` stay within the sheet while it is open, through Base UI's own trap — **no
  focus trap is hand-written here**.
- Escape closes, through the primitive.
- Closing returns focus meaningfully.
- No ARIA, roles, labels or screen-reader semantics change.
- The pointer route remains, so nothing becomes keyboard-only.

## Responsive contract

No layout change; this phase adds no markup a reader sees. Verified at **1440**, **1024** and
**390**, with the real viewport recorded and iframe dimensions labelled as compact **browser** layout
rather than as a phone.

## Acceptance probes

1. Baseline: focus stays outside the sheet — recorded above for four route/open combinations.
2. `entity_payroll`, fresh load, Alt+Enter: focus inside the sheet.
3. Second open: identical.
4. `payroll_run`, fresh load, Alt+Enter: identical.
5. Fresh load, right-click → Properties: identical.
6. Fresh load, Shift+F10 → Properties: identical.
7. The next keypress after opening operates inside Properties, not behind it.
8. `Tab` stays within the sheet.
9. `Shift+Tab` stays within the sheet.
10. Escape closes, judged by `data-open`/`data-closed`, never by counting `[role=dialog]`.
11. Restoration after an `Alt+Enter` open.
12. Restoration after a pointer open.
13. All three routes converge on one lifecycle.
14. `ent-sg` Properties still shows the same entity and fields.
15. `ent-feed` Properties still states awaiting data and invents no run or inclusion.
16. Run Properties still inspects the run, not the employee.
17. Shift+F10 → Ask about this still lands focus in the query filter (Phase 08).
18. An object with no Properties capability is unaffected.
19. First open on a second workspace reached by in-app navigation, without a reload.
20. 1440. 21. 1024. 22. 390 compact browser layout.

## Explicit exclusions

Not permissions for later.

```
a hand-written focus trap            replacing or wrapping the Base UI primitive
timers, polling or frame chasing     a second sheet or dialog primitive
object-type focus branching          making Properties editable
invocation-specific focusing         changes to the Properties command grammar
changes to properties-store.ts       changes to the Alt+Enter eligibility or editable-target law
changes to QueryPanel or providers   changes to the workspace system
anything under .HITL/step*.txt       the /payroll 390 card clipping
```

## Expected files

```
src/components/shared/PropertiesSheet.tsx
.HITL/phase10-properties-sheet-focus.md
.HITL/phase10.txt
.HITL/phase10-properties-sheet-focus-browser-closure.md
```

A runtime diff beyond that one component is evidence the ownership decision was wrong.

## Frozen systems

```
properties-store.ts, PropertiesShortcut, the Alt+Enter eligibility and editable-target laws
ObjectCommands, the command list, its order and Properties-last
QueryPanel, the query store, QueryProvider, queryProviderFor, query actions, every provider
the Find object adapter, ObjectContext, PublishObjectContext, the object-context store
the workspace system — customisation, persistence, sizes, ordering, hide/restore, Reset
src/views/payroll/**, src/app/server/**, every payroll object identity
components/ui/sheet.tsx — the shared primitive is composed, not edited
.HITL/step03.txt, .HITL/step05.txt, .HITL/step06.txt — untracked, unrelated, untouched
```

## Stop condition

Phase 10 freezes when the defect is reproduced and recorded, the contract is committed, the entry
law lives in `PropertiesSheet` alone, first and subsequent opens behave identically, all three routes
pass, the trap holds in both Tab directions, Escape closes on real open state, restoration still
works on every route, the Phase 08 query probe passes, domain truth is unchanged, `check-types`,
`lint` and `build` are green, the design audit is at budget, the evidence is recorded honestly and
the tracked tree is clean. Phase 11 does not begin.
