# Phase 05E — Workspace persistence (frozen)

Governance record. Written after the fact to make the 05E contract readable without reconstructing
it from conversation history or commit diffs. It describes what is already built and frozen; it is
not a brief and authorises no work.

```
05D baseline:        2341199
05E implementation:  5b889f1
Status:              implementation complete — do not amend or rewrite
```

## The sequence

| Phase | What it established                          | Commit    |
| ----- | -------------------------------------------- | --------- |
| 05A   | Module declaration                           | `db55624` |
| 05B   | Hide / restore / Reset / Customise mode      | `5b9fa68` |
| 05C   | Ordering, zones, immovable anchors           | `48b2a0b` |
| 05D   | Module sizing                                | `2341199` |
| 05E   | Browser-local persistence                    | `5b889f1` |

The order was structural rather than tidy. Persistence stores *differences from a declaration*, so
it could not have been written before the things it differs in existed. A persistence layer built
earlier would have had to store a layout, and a stored layout goes stale the day a module is
renamed.

## What is persisted

Four things, and nothing else:

```
version          the shape this build writes
order            the reader's module order
hidden           the ids they put away
sizes            only the widths that differ from the declared one
```

Not persisted: module ids as a roster, titles, zones, elements, `required`, `movable`, the set of
widths a module will stand behind, or its default width. **Those belong to the domain declaration
and may change without the stored bytes knowing.** That separation is the whole reason the stored
form is a delta rather than a layout.

The domain declaration is authoritative. Stored state is a preference checked against it.

## The seam

```
WorkspaceCustomisation
        ↓
WorkspaceLayoutPersistence      load / write / clear
        ↓
browserWorkspaceLayoutPersistence      (localStorage)
```

Consumers depend on `WorkspaceLayoutPersistence`, never on browser storage directly. The adapter is
a prop on `WorkspaceCustomisation` defaulting to the browser implementation, so a workspace can be
given different memory, or none, without touching the engine.

`localStorage` is named in exactly one file introduced by this phase:
`src/lib/workspace/workspace-layout-persistence.ts`. (`src/lib/find/recent-and-favourites.ts` also
uses it and predates 05E.) A later server-backed phase replaces the adapter; nothing above the seam
holds an opinion about where the bytes went.

Storage key: `afenda.workspace.layout:<workspaceId>` — one layout per workspace *kind*, not per
record. `payroll.entity` is one workspace whichever company is being looked at, because a layout is
a preference about a kind of screen and not about a company's figures.

`load` delivers through a callback and returns an unsubscribe, rather than returning a value. A
browser can answer immediately; something further away cannot. See the future-adapter trigger below.

## Reconciliation law

Persisted state is **untrusted input, not memory**. It may have been written by an older build,
edited by hand, or left behind by a declaration that has since gained modules, lost modules, or
narrowed which widths a module accepts. Current domain declarations win in every case.

| Condition                          | Behaviour                                                     |
| ---------------------------------- | ------------------------------------------------------------- |
| Unknown module id                  | discarded from all three deltas                                |
| Removed module                     | discarded from all three deltas                                |
| New module (absent from payload)   | recovered from the current declaration, at its declared width  |
| Invalid or unlisted size           | discarded — falls back to the declaration's `defaultSize`      |
| Hidden target that is `required`   | discarded — a required module cannot be hidden                 |
| Corrupt payload                    | defaults                                                       |
| Unsupported `version`              | defaults                                                       |
| Storage failure or blocked storage | usable non-persistent workspace                                |
| Order crossing an immovable anchor | reconciled through the shared ordering law — see below         |

An invalid size is **discarded rather than clamped**. Returning the module to the width its domain
ships is the only width certain to be true; clamping would invent one.

A new module sorts last within its own run, which is the fallback the live renderer already applies
to an id it has no rank for.

Storage failure is silent by design. `localStorage` throws rather than returns when a browser blocks
site data or hits quota, so every call is guarded. A reader in a locked-down browser gets a
workspace that works and forgets — failing to remember is not worth telling anyone about.

## Reset law

```
Reset = restore current domain defaults + clear the persisted override
```

Reset calls `clear`, not `write`. It does **not** persist a second copy of the defaults. A stored
copy of the declaration would be a second answer to a question the declaration already answers, and
would go stale the moment the domain changed its mind. Absence is the truthful record of a reader
who has customised nothing.

## Refusal law

A refused command persists nothing. Every mutator returns before it reaches the write, the same way
it already returns before the announcement — hiding an already-hidden or `required` module,
restoring one that is not hidden, moving past an anchor, or resizing to a width the domain does not
offer.

## Frozen 05C law — ordering

`movable: false` establishes a reorder boundary. An immovable module is not a member of any run; it
*is* the cut. Two modules may be arranged against each other only if they fall in the same run, so a
movable module cannot pass a fixed one, and a lone module between two fixed ones has nobody to swap
with.

Live ordering and persisted-state reconciliation read this law from **one shared segmentation
authority**: `segmentsOf` in `src/types/common/workspace-types.ts`. 05E moved it there from the
provider for exactly this reason. A stored order that puts a module on the far side of an anchor is
therefore not so much rejected as *inexpressible* once reconciled.

## Frozen 05D law — sizing

Four widths, as fractions of a six-column grid. **The persisted token is not the display label** —
a stored payload contains the token:

| Token        | Label      | Fraction | Grid                          |
| ------------ | ---------- | -------- | ----------------------------- |
| `one-third`  | Small      | 2/6      | `col-span-full lg:col-span-2` |
| `half`       | Half       | 3/6      | `col-span-full lg:col-span-3` |
| `two-thirds` | Wide       | 4/6      | `col-span-full lg:col-span-4` |
| `full`       | Full width | 6/6      | `col-span-full`               |

Height remains intrinsic — every module sizes to its own content. There are no coordinates and no
arbitrary width or height. Every module is full width below `lg` and its declared width above; a
domain never gets to say what happens on a phone.

A width equal to the module's `defaultSize` is not stored, because a module at its declared width is
not carrying an override.

## Explicit exclusions

05E did **not** introduce any of the following, and none may be inferred as authorised merely
because it appears on this list:

```
server preferences          named presets
database persistence        multiple layouts
cloud sync                  free-form placement
organization layouts        drag reorder
shared layouts              drag resize
new workspace types         react-resizable-panels
new customization dimensions
```

## Future adapter trigger — non-blocking

```
Before WorkspaceLayoutPersistence gains an asynchronous or server-backed
adapter, re-evaluate the restore effect lifecycle.

The current browser adapter performs a synchronous localStorage read, so this
is not a Phase 05E defect.

A future asynchronous implementation must guarantee that rerender/effect
cleanup cannot invalidate an in-flight restore merely because modules,
persistence identity, or workspace identity caused the effect to restart.
```

This is a precondition on the *next* adapter, not a defect in this one. It is deliberately not
solved here, and `WorkspaceCustomisation.tsx` is not to be altered for it during governance closure.

## First render

The first render is the domain default and cannot be anything else — the server has no access to a
reader's browser. The stored layout arrives on the commit after hydration, reconciled against the
declaration. That settle is contained inside the provider: nothing outside it needs to know which of
the two renders it is in.

## Verification

Rerun during this governance review, against `5b889f1` with a clean working tree:

```
pnpm check-types   PASS
pnpm lint          PASS
pnpm build         PASS
```

**Not rerun.** The browser acceptance probes recorded in the `5b889f1` commit message — hide, order
and size surviving reload independently and together; eleven refused commands writing nothing;
injected anchor-crossing orders and invalid widths reconciled; corrupt and pre-module payloads
rendering; every storage call throwing; Reset clean at 1440, 1024 and 390 — were executed in the
implementation session. They are inherited claims and were not re-executed for this record.

## Files

```
src/lib/workspace/workspace-layout-persistence.ts   seam, browser adapter, reconciliation
src/components/shared/WorkspaceCustomisation.tsx    restore-once, persist-on-change, clear-on-reset
src/types/common/workspace-types.ts                 segmentsOf — shared ordering authority
src/app/(pages)/payroll/entities/[entityId]/page.tsx   passes workspaceId
```
