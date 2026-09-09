# Phase 08 — 360 Query hands focus to the panel it opened

```
branch base:          8995222   (07 browser closure)
branch:               payroll/phase08-query-focus
status:               contract — implementation follows in a second commit
```

**This is a shared 360 Query interaction correction. It is not a Payroll-specific feature.**
Payroll is where it was found, and both providers Payroll owns reproduce it, which is how it was
established that the defect belongs to the shared query surface and not to either domain.

## Problem

Opening 360 Query leaves the reader's focus behind, on the menu that has just closed. The panel is
open, its filter input is mounted and enabled, and nothing has focus inside it. A keyboard user is
stranded: the next Tab continues from a control inside a dismissed popup, and typing goes nowhere
the panel can see.

The panel already declares what should happen — `initialFocus={inputRef}` on its `Dialog.Popup`.
The declaration produces no focus event.

## Evidence

Measured on this branch at `8995222`, against a dev server started from this tree, with a capturing
`focusin`/`focusout` listener on the document.

**`entity_payroll`, keyboard invocation** on `/payroll/entities/ent-sg`:

```
before invocation    A | role=button        the "Group payroll" back link
after menu opens     A | role=menuitem      IN-OPEN-MENU
after panel opens    DIV | role=menuitem    IN-CLOSED-MENU
focus events between the item being activated and the panel being open:   none
```

**`payroll_run`, keyboard invocation** on `/payroll/runs/run-sg-2026-09`: identical. Panel open,
`document.activeElement` still the menu item, now inside a popup carrying `data-closed`.

**Pointer invocation**: the same result. Right-clicking the header and clicking **Ask about this**
leaves `document.activeElement` on the closed menu item, with the panel open. The Phase 07 closure
recorded the pointer path as unaffected; that was read from a screenshot showing a caret in the
filter input, and the DOM measurement contradicts it. **The defect is both modalities, not keyboard
only.** Phase 07's record is not amended — this supersedes that one observation and says so here.

Two further facts, both measured, that decide the shape of the fix:

| Fact | Evidence |
| --- | --- |
| The popup is absent from the DOM while closed | `document.querySelector('[data-slot=query-panel]')` returns `null` between invocations, and returns an element once open. Mounting is therefore a real, deterministic signal. |
| Nothing steals focus — nothing ever sets it | The capturing listener records **zero** `focusin` after the command is activated. This is not a race between two focus owners; the panel's entry focus simply never happens. |

Why the primitive's `initialFocus` does not fire is **not** claimed here. It was not proven, and a
guess written into a contract becomes a fact the next reader inherits. What is proven is that the
declaration does not move focus, on either path, for either provider.

## Shared ownership

The defect sits between two shared files and belongs to neither domain:

```
src/components/shared/ObjectCommands.tsx   composes Ask about this for every askable type
src/components/shared/QueryPanel.tsx       mounted once in the app shell, owns the panel
```

Both Payroll providers reproduce it, and neither contains a line about focus. A fix inside
`payroll-query.ts`, `query-actions.ts`, the entity page or the run workspace would be the same bug
repaired once per domain and left open for the next one.

## Existing focus behaviour

What already works and must not be disturbed:

- **The menu's own keyboard handoff.** `KeyboardFocusHandoff` in `ObjectCommands.tsx` moves focus
  into the context-menu popup when it was opened from the keyboard, by rendering *inside* the popup
  and acting on mount. Verified again in this phase's baseline: `Shift+F10` lands on the first
  enabled item and arrows drive the list.
- **Return focus on close.** `QueryPanel`'s `close()` calls `focusTarget(returnFocus.current)?.focus()`,
  where `returnFocus` is the control the panel was summoned from, and `Dialog.Popup` carries
  `finalFocus` aimed at the same element. Phase 07 observed Escape returning focus to the
  "Group payroll" back link. **This works and is not being replaced.**
- **Non-modality.** The panel is a `Dialog` with `modal={false}` and `disablePointerDismissal`, so the
  workspace stays interactive and clicking it does not dismiss the question. Entry focus must not
  turn the panel into a trap.

## Desired focus lifecycle

```
invoke Ask about this            pointer or keyboard, any provider
        ↓
openQuery(object, returnFocus)   the store records the summoning control
        ↓
QueryPanel opens                 popup mounts
        ↓
the panel's filter input takes focus
        ↓
the reader types, filters, arrows and selects without touching the pointer
        ↓
Escape or the close control
        ↓
focus returns to the control the panel was summoned from
```

## Invocation paths

Both must behave identically, because the contract belongs to the panel and not to a modality:

```
right-click a supported object → Ask about this
Shift+F10 on a supported object → Ask about this
```

The overflow twin `ObjectCommandsButton` opens the same command list through a `DropdownMenu` and is
covered by the same fix, since it also ends in `openQuery`.

## Focus restoration law

Unchanged. Closing returns focus to the control the panel was summoned from, resolved through
`focusTarget` — the element itself when focusable, its nearest focusable ancestor when not, and
nothing at all when neither, in which case Base UI's own restoration decides. Focus is never sent to
`document.body`, the page root, or an arbitrary first control. The existing restoration is not
replaced in order to fix entry.

## Accessibility requirement

- A keyboard user is never left behind a panel that has just opened.
- The focused element is visible and carries the app's focus ring.
- Tab proceeds through the panel's own controls in document order; the panel is non-modal by design,
  so Tab may also leave it, and that stays true.
- Escape closes, through the primitive's own handling. No new key interception is written.
- Screen-reader semantics are untouched: no roles, labels or `aria-*` change.

## Implementation boundary

The fix belongs in **`src/components/shared/QueryPanel.tsx`** — the lowest layer that knows both
that the panel has opened and which control is its first working one. It is the only file that holds
`inputRef` and the only one that should.

Rules the implementation is held to:

- **No timers.** No `setTimeout`, no polling, no animation-frame chasing. The popup mounts on open,
  which is a deterministic lifecycle signal, and the repo already uses exactly that signal for the
  context menu's own handoff.
- **No provider awareness.** No object type, no provider id, no selector supplied by a domain.
- **No new interface fields.** `QueryProvider`, `queryProviderFor`, the store payload, the server
  actions, `QueryMode`, `FindResult` and `AuditEvent` are untouched.
- **The declared intent stays.** `initialFocus={inputRef}` remains on the popup. It states what the
  panel wants of the primitive, it is harmless when the panel has already focused its own input, and
  removing it would hide the fact that the primitive is expected to do this.
- **The target is the filter input** — `[data-slot=command-input]`, visible, enabled, keyboard
  operable, the same control on every provider, and the first thing a reader would use. Not the
  popup container, not the title.

## Responsive behaviour

No layout changes. The focus lifecycle is verified at **1440, 1024 and 390** with the actual viewport
recorded, including the iframe dimensions where an iframe is used. The `/payroll` narrow-width card
clipping recorded in the Phase 06 closure stays out of scope.

## Acceptance probes

1. Baseline: before the fix, focus stays behind the panel — recorded above for both providers.
2. `entity_payroll`, `Shift+F10` → Ask about this: the filter input owns focus.
3. `payroll_run`, same: identical, proving the fix is shared.
4. Right-click → Ask about this: the filter input owns focus.
5. Typing immediately after opening reaches the filter and narrows the questions.
6. Tab proceeds through the panel's controls in a logical order.
7. Escape closes, through the existing behaviour.
8. Closing returns focus to the summoning control.
9. Two providers pass with no provider-specific focus code anywhere.
10. An object with no provider still offers no Ask about this — capability detection is untouched.
11. 1440. 12. 1024. 13. 390.
14. Suggestions and answers still render and execute.
15. Properties still opens and behaves as before.

## Explicit exclusions

Not permissions for later.

```
focus code in any provider           changes to ObjectCommands' command list or ordering
a provider-supplied focus selector   changes to Properties, Audit or Ask about this visibility
a new QueryProvider field            changes to provider lookup or FIND registration
a focus trap on a non-modal panel    replacing the existing return-focus behaviour
setTimeout-based scheduling          the /payroll 390 card clipping
```

## Expected files

```
src/components/shared/QueryPanel.tsx
.HITL/phase08-query-panel-focus-handoff.md
.HITL/phase08.txt
.HITL/phase08-query-panel-focus-handoff-browser-closure.md
```

A diff touching a provider, a server action or a Payroll page is a warning sign.

## Frozen systems

```
QueryProvider and every provider       ObjectCommands and its command grammar
queryProviderFor and the registry      Properties and PropertiesSheet
the query store payload                the Find object adapter
server query actions                   the entity page, the run workspace, the table engine
QueryMode, FindResult, AuditEvent
```

## Stop condition

Phase 08 freezes when the defect is reproduced and recorded, the contract is committed, the shared
fix is implemented in the panel alone, both providers and both invocation paths are observed to pass,
focus restoration still passes, the three widths pass, `check-types`, `lint` and `build` are green,
the design audit is at budget, the browser evidence is recorded honestly and the tree is clean.
Phase 09 does not begin.
