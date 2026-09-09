# Phase 09 — Alt+Enter opens Properties

```
branch base:          62cdfe9   (08 browser closure)
branch:               payroll/phase09-properties-shortcut
status:               contract — implementation follows in a second commit
```

**Phase 09 is a shared object-interaction correction. It is not a Payroll-domain feature.**
Payroll is where every first-class object currently lives, so it is where the gap is measurable; the
shortcut belongs to the object contract and any object that joins it later inherits the shortcut
without being asked to.

## Problem

Doctrine names three ways to reach an object's commands and its inspector. Two of them work:

```
Shift+F10  → contextual commands   implemented, proven in Phases 06 and 08
right-click → contextual commands  implemented
Alt+Enter  → Properties            not implemented anywhere in the app
```

`keyboard.default_bindings.properties: 'Alt+Enter'` (D15) and `properties.invocation.default_shortcut:
'Alt+Enter'` (D04) both name it. Phase 06's contract deferred it explicitly — *"Doctrine names
`Alt+Enter` as the Properties shortcut; it is unimplemented app-wide and fixing it belongs to the
shared layer, not to this phase."* This is that shared layer.

The consequence is small and constant: a reader working an object by keyboard must go through the
context menu and down a list to reach the one command that answers *what exactly is this*, while the
binding their hands already know does nothing at all.

## Browser evidence

Measured on this branch at `62cdfe9`, against a dev server started from this tree, with a capturing
`keydown` listener on the document.

`entity_payroll` on `/payroll/entities/ent-sg`, focus on the header's back link:

```
focused before      A | role=button        "Group payroll"
event               Enter alt=true shift=false ctrl=false meta=false
isTrusted           true
defaultPrevented    false
event target        the same anchor
Properties state    unchanged — zero dialogs in the document
```

`payroll_run` on `/payroll/runs/run-sg-2026-09`, focus on "All runs": identical.

Two things this proves and one it rules out. The key **does** reach application code, so no browser
or OS layer is swallowing it. Nothing consumes it — `defaultPrevented` is `false` — so there is no
existing handler to compete with. And the gap is a genuine absence rather than a broken handler.

The pointer route works and is the behaviour to match: right-click the run header → **Properties**
opens `Pay run | PR-SG-2026-09 | Properties — what this object is, not what to do with it.`

**Also measured, and it decides the focus law below:** opening Properties through the pointer leaves
`document.activeElement` on the context-menu item, outside the sheet, with the sheet open and its
Close button tabbable. That is Properties' existing behaviour today, not something this phase
introduces.

## Doctrine requirement

| Rule | Requirement |
| --- | --- |
| `properties` D04 | `canonical_question: 'What exactly is this object?'`; `invocation.default_shortcut: 'Alt+Enter'` |
| `keyboard` D15 | `default_bindings.properties: 'Alt+Enter'`, `open: 'Enter'`, `context_menu: 'Shift+F10'` |
| `keyboard` D15 `invariant` | `pointer_equivalent_MUST_exist: true` — the shortcut is added beside the pointer route, never instead of it |

`open: 'Enter'` is the reason bare Enter must never open Properties: the same key already means
something else in this vocabulary.

## Shared ownership

Properties is currently owned **per call site**. Every surface holds its own open state, mounts its
own `PropertiesSheet` with its own sections, and hands `onOpenProperties` to `ObjectCommands`:

```
entity-identity.tsx          entity_payroll
payroll-run-workspace.tsx    payroll_run, and an employee
run-queue-table.tsx          a run selected from the queue
```

Nothing above those files knows that an object has an inspector. The shell publishes *identity*
through `object-context-store` and knows nothing about Properties.

So the lowest layer that knows both **which object the page is about** and **how to open its
Properties** does not exist yet, and this phase creates exactly that seam — the same shape the repo
already uses twice, for the same reason:

```
object-context-store   the page publishes what it is about; the breadcrumb reads it
query-store            a surface publishes what is being asked about; the panel reads it
properties-store       a surface registers the inspector it mounts; the shortcut reads it   ← new
```

**`PropertiesSheet` registers itself.** It is the one shared component every inspector already goes
through, it already receives the object and the opener, and registering there means **no domain file
changes at all** — no page, no workspace, no provider learns that a shortcut exists.

## Shortcut scope

```
Alt+Enter → the Properties inspector for the object the current page has published
```

Not the focused row, not the hovered cell, not the last thing clicked. The published
`ObjectContext` is what the breadcrumb leaf names and what Recents remembers — it is the app's
existing answer to *what is this page about*, and reusing it means the shortcut cannot drift into a
second notion of "current object".

A page that publishes nothing has no current object, and Alt+Enter does nothing there.

## Eligibility law

```
a Properties inspector is registered for the page's published object
→ Alt+Enter opens it

otherwise
→ no-op, and the event is not consumed
```

The registry records inspectors that **exist**, which is the same fact the context menu uses: a
surface that mounts a `PropertiesSheet` for an object is the surface that passes `onOpenProperties`
for it. The shortcut is therefore never a second source of capability truth — it cannot make
Properties appear for an object that does not have it, and it cannot withhold it from one that does.

An object with an inspector that is *not* the page's subject — an employee row inside a run
workspace — is reachable through its own row menu and not through Alt+Enter, because the shortcut
acts on what the page is about.

## No object-type branching

The implementation contains no `if (type === …)` anywhere. It matches a published identity against a
registry keyed by `type:id` and knows nothing else. An object type added later inherits Alt+Enter by
mounting the same `PropertiesSheet` every other object already mounts.

## Keyboard-event law

Consumed only when **all** of these hold:

```
event.key === 'Enter'
event.altKey === true
event.ctrlKey === false
event.metaKey === false
event.shiftKey === false
```

so `Enter`, `Shift+Enter`, `Ctrl+Enter`, `Meta+Enter` and `Alt+`anything-else are all left alone.
The identity of the shortcut is read from the modifier flags and `event.key`, never from a printable
character.

## Editing and input safety

The shortcut does nothing when the event originates in a control the reader is composing in:

```
input, textarea, select, [contenteditable], [role=textbox], [role=combobox]
```

This is not the blacklist the repo already rejected. That objection — recorded beside the command
palette's own listener — was about a **bare** `/`, a printable key with no modifier, whose list of
forbidden places kept growing. Alt+Enter is a modified binding like `⌘K`, and the difference that
justifies one guard rather than none is that **Enter is a key text controls genuinely use**: the
360 Query filter is a `role=combobox` input, and a table search box is an `input`. Stealing from
someone mid-sentence is the failure this guard exists to prevent, and it is one rule rather than a
list that grows.

Everything else is fair game. A focused link, button, table row, chart or the page body all reach
the shortcut.

## Browser default behaviour

`preventDefault()` is called **only** when Afenda actually opens something. When there is no
published object, no registered inspector, or the target is editable, the event is left entirely
alone — not prevented, not stopped, not marked. Propagation is never interfered with; the listener
is a passive document-level observer in the capture-free default phase, like the two shortcuts the
app already ships.

## Properties identity

The inspector opened by Alt+Enter is the same component instance the context menu opens, holding the
same object, so the fields are identical by construction rather than by agreement. Nothing is
rebuilt from route params, a stale row, a parent workspace, or a generic company surrogate.

## Focus law

**Whatever Properties does today, both paths do.** Phase 09 does not implement entry focus for the
sheet and does not copy Phase 08's `QueryPanel` handoff into it, because the two are not the same
problem and because §14 of this phase forbids a second focus solution where the primitive already
owns one.

Measured today, the pointer path leaves focus outside the sheet. If Alt+Enter behaves the same, that
is parity and this phase is done; the shared entry-focus behaviour of `PropertiesSheet` is then a
**separate** defect to be recorded as the next unresolved capability rather than fixed here. If
Alt+Enter behaves *worse* than the pointer path, that is a Phase 09 defect and is corrected.

The measurement decides, and it is taken on both paths.

## Focus restoration

Unchanged, and owned by the sheet's own primitive. Closing does not send focus to `document.body`,
the page root, or an arbitrary first control. Measured on both paths.

## Interaction precedence

```
Shift+F10   → contextual commands, Properties last within them
right-click → contextual commands, Properties last within them
Alt+Enter   → Properties directly
```

All three reach the same inspector. The context menu's order, the position of Properties within it,
Audit availability, Ask about this availability, Find registration and the query providers are
untouched.

## Discoverability

The menu primitives already carry a `Shortcut` slot (`ContextMenuShortcut`, `DropdownMenuShortcut`),
and `ObjectCommandItems` renders the Properties item once for both menu families — so the hint can
be added in exactly one place from exactly one string, which is the condition this phase set for
showing it at all.

It is rendered **only when the shortcut would actually work on that object** — when the menu's object
is the page's published subject. An employee row's Properties opens an inspector that Alt+Enter does
not reach, and labelling it with a binding that does nothing there would be the menu lying about a
capability, which is the same rule that keeps *Ask about this* off objects with no provider.

Functional parity is the phase; this is one line of it, and it does not become a shortcut
documentation system.

## Accessibility

- The pointer route and `Shift+F10` both still reach Properties. Nothing becomes keyboard-only.
- Properties stays discoverable in the menu, now labelled with its binding where the binding applies.
- No focus ring is removed, no ARIA changes, no roles change, no screen-reader semantics move.
- Escape and the Close control keep working through the sheet's own primitive.
- The shortcut never fires while the reader is composing text.

## Responsive behaviour

No layout change; the shortcut adds no chrome. Verified at **1440**, **1024** and **390**, with the
actual viewport recorded and iframe dimensions labelled as such.

At 390 the probe is **compact-layout** verification — that Properties is still reachable through the
pointer UI and that nothing regresses. It is not a claim that a physical phone has Alt+Enter, and the
record will not pretend otherwise.

## Acceptance probes

1. Baseline: Alt+Enter opens nothing on a Properties-capable object — recorded above for both objects.
2. `entity_payroll`: Alt+Enter opens Properties for the current entity.
3. `payroll_run`: same, proving the mechanism is shared.
4. The fields shown match right-click → Properties exactly.
5. `Shift+F10` → Properties still works.
6. right-click → Properties still works.
7. A surface with no published object, or an object with no inspector: Alt+Enter does nothing and
   opens no inspector.
8. Focus inside an editable control: the documented boundary holds, nothing is hijacked.
9. `Enter`, `Shift+Enter`, `Ctrl+Enter`, `Meta+Enter` do not open Properties.
10. Focus entry after Alt+Enter matches the pointer path.
11. Escape closes.
12. Focus restoration after close, measured on both paths.
13. `Shift+F10` → Ask about this still opens the query panel and Phase 08's focus handoff still lands
    in the filter.
14. `ent-feed`: Alt+Enter opens truthful Properties — awaiting data stated, no September run and no
    group inclusion invented.
15. 1440. 16. 1024. 17. 390 compact layout.

## Explicit exclusions

Not permissions for later.

```
a second Properties implementation        object-type branching anywhere
per-page or per-object keydown listeners  a general shortcut registry or settings surface
entry focus for PropertiesSheet           a shortcut-help overlay or badge
user-customisable bindings                changes to ObjectCommands' command list or order
changes to QueryPanel, the query store,   changes to the workspace system
  providers or query actions              the /payroll 390 card clipping
a Properties button on any page           anything under .HITL/step03.txt
```

## Expected files

```
src/lib/properties-store.ts                   new — the registry and the binding's one definition
src/components/shared/PropertiesSheet.tsx     registers itself while mounted
src/components/layout/PropertiesShortcut.tsx  new — the single shell listener
src/app/(pages)/layout.tsx                    mounts it once, beside RecentRecorder
src/components/shared/ObjectCommands.tsx      renders the hint beside Properties where it applies
.HITL/phase09-properties-shortcut.md
.HITL/phase09.txt
.HITL/phase09-properties-shortcut-browser-closure.md
```

Every runtime file is shared. **A diff touching a Payroll page, view, provider or server action is
the wrong ownership decision** and is not what this phase produces.

## Frozen systems

```
QueryPanel, query store, QueryProvider, queryProviderFor, query actions, every provider
the workspace system — customisation, persistence, sizes, ordering, hide/restore, Reset
the Find object adapter and its registrations
ObjectContext, PublishObjectContext, the object-context store
every Payroll page, view and server action
the context menu's command list, order and Properties-last position
.HITL/step03.txt — untracked, unrelated, and not to be touched
```

## Stop condition

Phase 09 freezes when the baseline gap is reproduced and recorded, the contract is committed, one
shared implementation exists, both objects pass, the pointer and `Shift+F10` routes are unchanged,
non-capable surfaces stay silent, the editable-target and modifier laws are proven in the browser,
focus entry and restoration are measured on both paths, the Phase 08 regression probe passes,
`check-types`, `lint` and `build` are green, the design audit is at budget, the evidence is recorded
honestly and the tracked tree is clean. Phase 10 does not begin.
