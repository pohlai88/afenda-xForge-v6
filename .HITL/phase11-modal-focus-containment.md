# Phase 11 — a modal keeps the keyboard

```
branch base:          79a6771   (10 browser closure)
branch:               payroll/phase11-modal-focus-containment
status:               contract — implementation follows in a second commit
```

**Phase 11 repairs shared modal keyboard containment. It is not a Properties feature, not a Command
Palette feature, and not a Payroll feature.** Both of those surfaces were measured failing the same
way, which is how the ownership was decided rather than assumed.

## Problem

While a modal is open the page behind it is still in the tab order. Tab far enough and focus leaves
the modal, lands on the document, and then walks the sidebar and the workspace underneath — with the
modal still open and covering them.

## Measured browser evidence

At `79a6771`, cold loads, capturing `focusin` listeners, open state read from `data-open` /
`data-closed`.

**Properties (`PropertiesSheet`)**, `/payroll/entities/ent-sg`, `Alt+Enter`:

```
popup → Tab → scroll viewport → Tab → Close → Tab → focus guard
guard, left alone for 2.5s      → focus stays on the guard, no bounce, no events
guard → Tab                     → BODY, and it stays there; the sheet is still open
```

**Command Palette (`CommandDialog`)**, same page, `⌘K`:

```
opened   → focus on BODY, background not inert
Tab      → sidebar link, behind the palette
Tab      → the next sidebar link
```

Both surfaces, both cold-loaded. Phase 10 recorded this on Properties and reproduced it on the
palette; this phase measured the mechanism rather than the symptom.

One correction to the Phase 10 record, which does not change its conclusion: the guard **sometimes**
does bounce — one measured sequence read `viewport → Close → guard → viewport`. It is not reliable,
and the failing state above is reproducible. Phase 10's commits are not amended.

## Affected shared surfaces

```
PropertiesSheet   via components/ui/sheet.tsx    → Dialog.Popup
Command Palette   via components/ui/dialog.tsx   → Dialog.Popup
```

Two wrappers, one primitive, one composition law between them.

## Unaffected control surface

**`QueryPanel` is deliberately non-modal** (`modal={false}`, `disablePointerDismissal`) and composes
Base UI's `Dialog` **directly** rather than through either wrapper. It must stay non-modal: Phase 08
exists because a reader is meant to keep working beside it. It is the control that proves this phase
does not turn every portal into a trap.

## Base UI behaviour, from the installed source

Version confirmed as **1.6.0**.

| Fact | Where |
| --- | --- |
| `modal` defaults to `true` | `dialog/root/useRenderDialogRoot.js` — `modal: modalProp = true` |
| So both surfaces are already modal | Neither wrapper passes `modal` |
| Focus containment is two sentinel guards around the popup | `FloatingFocusManager` renders `FocusGuard` before and after `children` when `shouldRenderGuards` |
| The guards bounce on focus | `onFocus` → `enqueueFocus(getTabbableContent()[0])`, and the last tabbable for the leading guard |
| **The bounce is scheduled, not immediate** | `enqueueFocus` defers to an animation frame |
| The background is marked `aria-hidden`, never `inert` | `markOthers(insideElements, { ariaHidden: modal, mark: false })` — `markOthers` accepts an `inert` option and `FloatingFocusManager` never passes it |
| No Dialog prop exposes it | Nothing in `dialog/**/*.d.ts` mentions `inert` |

## Root cause

`aria-hidden` is correct for a screen reader and does nothing for a Tab key. Containment therefore
rests entirely on the guards, and the guards bounce a frame late — sometimes not at all. When the
bounce is missed there is somewhere outside to land, because the background is still tabbable.

Two failures compound: a scheduled bounce, and a tab order that still contains the whole page.
**Only the second is ours to fix**, and fixing it makes the first harmless.

## Shared ownership

The two wrappers in `src/components/ui`, through one shared hook. Not a new abstraction and not a
third dialog: the same three lines in each wrapper, calling one function that says what a modal
means.

The QueryPanel is untouched because it does not use either wrapper — which is also why "put it in
the wrappers" is the right boundary rather than a convenient one.

## Focus-guard mechanics

The guards stay exactly as Base UI renders them. §8's law is the one this phase adopts: a guard may
legitimately take transient focus; what must not happen is focus **escaping the modal through it**.

## Forward traversal law

```
last thing inside → Tab → the guard, and back to the first thing inside
```

Measured after the fix at the real viewport:
`popup → viewport → Close → guard → guard → viewport → Close`.

## Reverse traversal law

```
first thing inside → Shift+Tab → the guard, and back to the last thing inside
```

Measured: `viewport → guard → guard → Close → viewport`.

## Modal containment law

**While an Afenda modal is open, the page behind it is `inert`.**

`inert` is the platform's own statement that a subtree is not there — out of the tab order, out of
hit-testing, out of the accessibility tree. It is structural, not temporal: no key is intercepted,
no timer runs, no second focus trap competes with the primitive's. If the guards bounce, nothing
changes; if they miss, there is nowhere outside to land.

"Background" is every direct child of `<body>` that does not contain the popup, which excludes the
portal by structure rather than by name.

## Entry-focus interaction

Phase 10's entry focus is untouched and must keep passing on the first open, every later open, and
through all three routes. **`inert` and entry focus interact in one direction that had to be found by
measurement:** a first attempt lifted `inert` a microtask late, and Phase 10's restoration then
called `focus()` on an element that was still inert — which silently does nothing, leaving the reader
with focus nowhere and the page dimmed out of the tab order. The lift must happen in the same commit
as the close, which is why open state is passed to the wrapper rather than read back off the DOM.

## Restoration interaction

Unchanged in behaviour and verified on both routes and both surfaces. Restoration runs in the
caller's effect; effects run child-first, so the wrapper's lift precedes it.

## Accessibility requirement

- A keyboard reader cannot reach page content behind an open modal.
- Tab and Shift+Tab traverse the modal; the guards remain the boundary.
- Escape closes, through the primitive; nothing new intercepts it.
- Background content becomes non-interactive to pointer as well, which is what a modal already
  claims visually.
- The non-modal QueryPanel keeps the page reachable, deliberately.
- No ARIA, roles or labels change.

## Responsive contract

No layout change. Verified at 1440, 1024 and 390, with iframe dimensions labelled as compact browser
layout rather than as a phone.

## Acceptance probes

1. Properties baseline escape. 2. Command Palette baseline escape.
3. Properties forward containment. 4. Properties reverse containment.
5. Palette forward containment. 6. Palette reverse containment.
7. A guard may take focus; the next focus is still inside.
8. Properties first-open entry. 9. Subsequent entry. 10. Alt+Enter. 11. Right-click. 12. Shift+F10.
13. Properties Escape and restoration. 14. Palette opens as before. 15. Palette Escape and
restoration. 16. QueryPanel stays non-modal and keeps Phase 08's handoff.
17. Background unreachable by Tab while Properties is open. 18. Pointer still works inside the modal.
19. `ent-feed` truth. 20. Run Properties identity. 21. 1440. 22. 1024. 23. 390 compact.

Cold-load evidence is required; HMR state is not baseline evidence.

## Explicit exclusions

```
a hand-written focus trap            a global document Tab handler
timers, polling, frame chasing       replacing or wrapping the Base UI primitive
making QueryPanel modal              changes to command discovery, filtering or ⌘K
changes to Properties content        changes to the Alt+Enter laws or properties-store
domain or workspace changes          the /payroll 390 card clipping
anything under .HITL/step*.txt
```

## Expected files

```
src/hooks/use-modal-background-inert.ts   new — the law, once
src/components/ui/sheet.tsx               calls it
src/components/ui/dialog.tsx              calls it
src/components/shared/PropertiesSheet.tsx passes its open state through
src/components/ui/command.tsx             passes its open state through
.HITL/phase11-modal-focus-containment.md
.HITL/phase11.txt
.HITL/phase11-modal-focus-containment-browser-closure.md
```

## Frozen systems

```
QueryPanel and everything under the query architecture
properties-store, PropertiesShortcut and the Alt+Enter laws
ObjectCommands, the command grammar, Properties-last
the workspace system, the Find adapter, ObjectContext
src/views/payroll/**, src/app/server/** — expected domain diff: zero
.HITL/step03.txt, .HITL/step05.txt, .HITL/step06.txt — untracked, unrelated, untouched
```

## Design-system invariant

This phase establishes one law that every modal added later inherits by using the shared wrappers:

> **A modal Afenda surface takes the keyboard while it is open and gives it back when it closes.**
> The page behind it is `inert` — out of the tab order and out of hit-testing — for exactly as long
> as the modal is open. A surface that is deliberately non-modal, like 360 Query, says so and keeps
> the page reachable.

Recorded because it is what the implementation actually guarantees, and no further than that.

## Stop condition

Phase 11 freezes when the escape is reproduced on both surfaces, the root cause is proven from the
installed primitive, the contract is committed, containment is corrected once in the shared layer,
both surfaces are contained in both directions, entry focus and restoration still pass on every
route, the QueryPanel is still non-modal, cold-load evidence passes, `check-types`, `lint` and
`build` are green, the design audit is at budget and the tracked tree is clean. Phase 12 does not
begin.
