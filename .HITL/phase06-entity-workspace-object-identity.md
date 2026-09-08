# Phase 06 — The company payroll workspace is an object

```
branch base:          48ce950   (05E governance)
branch:               payroll/phase06
status:               contract — implementation follows in a second commit
```

Phase 05 gave `/payroll/entities/[entityId]` a composable workspace. It never gave it an identity.
This phase makes the company's payroll workspace a first-class business object, using the object
grammar the rest of payroll already runs on.

## Problem

`entity_payroll` is already a business object in this product. `entityPeriodObject` mints it, the
group control matrix renders its commands, and it carries a `type`, an `id`, a `label` and an
`href`. But on the company's **own** workspace it has none of that. The object exists in the list
it appears in and evaporates on the page that is about it.

Doctrine `business_objects.identity_rule` (D09):

> The same object MUST NOT become a different conceptual identity because it appears in another
> Afenda domain.

## Evidence

| Claim | Evidence |
| --- | --- |
| The entity workspace publishes no object context | `PublishObjectContext` has exactly one consumer: `src/views/payroll/run/payroll-run-workspace.tsx:911` |
| So its breadcrumb leaf renders the id | `Breadcrumbs.tsx:79` overrides the leaf only when a subject is published; otherwise `labelForSegment('ent-sg')` falls through `SEGMENT_LABELS` to `'ent-sg' → 'ent sg' → 'Ent Sg'` |
| So it is never recorded in Recents | `RecentRecorder.tsx:33` records the published active object and nothing else |
| It exposes no contextual commands | `ObjectContextMenu` / `ObjectCommandsButton` appear in `payroll-run-workspace.tsx` and `DataTable.tsx`; the entity page imports neither |
| It exposes no Properties | `PropertiesSheet` consumers: `payroll-run-workspace.tsx`, `run-queue-table.tsx`. No `entityPayrollProperties` exists in `payroll-objects.ts` |
| The same object has commands elsewhere | `entity-control-matrix.tsx:292-293` renders `entityPeriodObject` + `entityPeriodCommands` |
| The page already holds every fact needed | `page.tsx` loads `entity`, `runs`, `currentRun`, `entityStateOf(...)`, `entityStateDetail(...)` before render |

## Operator consequence

An operator working one company's payroll cannot ask what the company is, cannot copy its
registration number, cannot favourite it, cannot see it in Recents afterwards, and reads
**"Home / Payroll / Entities / Ent Sg"** at the top of the screen — the database id, title-cased.
The identical company, one click up in the group matrix, is "Afenda Pte. Ltd." with a menu.

## Normative doctrine

| Rule | Requirement |
| --- | --- |
| `business_objects` D09 | `SHOULD_support`: open, context_menu, properties, search_related, audit, copy_reference. `identity_rule` binding. |
| `orientation` D17 (critical) | `where_am_i`, `what_is_this`. Breadcrumb `semantic_role: 'location and hierarchy'`. |
| `properties` D04 | Properties is the canonical read-oriented inspector; `rendering.normal_object: inspector_or_workspace_group`. |
| `context_menu` D03 | `command_order`, `properties_position: last`, `irrelevant_commands_MUST_be_omitted`. |
| `preserve_context` D05 | `state_SHOULD_preserve` includes `recent_objects`. |
| `ux_acceptance` | "Important objects expose contextual actions." / "Important objects expose Properties." |
| `capability_without_chrome` | Capability without new permanent chrome. |

## Domain authority

Everything rendered comes from data the page already fetches. Nothing new is invented:

```
LegalEntity          id, code, name, countryCode, currency,
                     registrationNumber, timezone, statutoryProfileId
runs                 getPayRunsForEntity(entity.id)
currentRun           reference, periodStart, periodEnd, employeeCount, status
group standing       entityStateOf(run for the open period) + entityStateDetail(...)
```

Prohibited here: approval status, risk, forecast, lineage, audit evidence, cross-entity totals.
There is **no entity-level audit trail** in this domain, so no audit command is offered.

## Existing implementation to reuse

```
ObjectContextMenu        src/components/shared/ObjectCommands.tsx    right-click / Shift+F10
PropertiesSheet          src/components/shared/PropertiesSheet.tsx   the inspector
PublishObjectContext     src/components/layout/PublishObjectContext.tsx
entityPeriodObject       src/views/payroll/payroll-objects.ts        the identity, already minted
```

The precedent to match is `payroll-run-workspace.tsx`: wrap the header in `ObjectContextMenu`,
mount `PropertiesSheet`, mount `PublishObjectContext`. Nothing new is built.

## Phase objective

`/payroll/entities/[entityId]` becomes a first-class `entity_payroll` object:

1. publishes its object context — breadcrumb leaf reads the company name, page enters Recents;
2. offers contextual commands on its header by right-click and Shift+F10;
3. exposes Properties;
4. inherits favouriting and 360 Query entrance from the shared command layer.

## Ownership boundary

`entity_payroll` identity is minted in **one** place. `entityPeriodObject` is refactored to
delegate to the new `entityPayrollObject` so a single function owns the fact that this object's
label is the company name and its href is its workspace. Two functions minting one identity is the
drift this phase exists to remove, not to double.

The entity page is a server component. Object identity is mounted through one thin client
composition, `src/views/payroll/entity-identity.tsx`, which receives **serializable props only** and
builds the commands and property sections client-side. Commands carry Lucide icon components and
`onSelect` closures; neither crosses the server/client boundary.

## Data/state authority

No new state, no new store, no persistence. The object context store and the favourite store are
consumed exactly as the run workspace consumes them.

## Interaction contract

- Right-click anywhere on the page header opens the object menu.
- Shift+F10 / Menu key opens it from any focused control in the header.
- Commands, in `command_order`:

| Command | Condition | Family |
| --- | --- | --- |
| Open current run | a run exists | read |
| Copy registration number | always | search |
| Add to / remove from favourites | supplied by the shared layer | — |
| Properties | always, last | — |

  360 Query does **not** appear: `queryProviderFor('entity_payroll')` is undefined and
  `query-providers.ts` states that an absent type is absent everywhere — "no Ask about this, no
  empty panel, no disabled item". Writing that provider is a separate phase.

- Properties sections:

```
Identity        Name, Code, Country, Currency, Registration number, Timezone
Payroll         Displayed run, Period, Employees on this run, Runs on record
Group standing  State for the open period, and whether it is in the group total
System          Statutory profile, Id
```

- A company with **no** pay run keeps its identity. Its commands omit Open current run and its
  Payroll section says the payroll has not started rather than showing an empty period.

## Accessibility contract

- The context menu is Base UI's, so focus trapping, escape and ARIA come from the primitive.
- Properties opens in the existing `Sheet`; the sheet owns focus return.
- No control loses a focus ring; no new focus trap is written by hand.
- The menu is reachable by keyboard without a pointer (Shift+F10 from the header's existing
  focusable controls — the back link and the workspace overflow).

## Keyboard contract

Shift+F10 and the Menu key, handled by `ObjectContextMenu` as it already is on the run workspace.
**No new global shortcut.** Doctrine names `Alt+Enter` as the Properties shortcut; it is
unimplemented app-wide and fixing it belongs to the shared layer, not to this phase.

## Responsive contract

No layout change at any width. The header keeps its current composition; the menu is an overlay.
Verify at 1440, 1024 and 390 that the header does not reflow and the page does not scroll sideways.

## Acceptance probes

1. `/payroll/entities/ent-sg` breadcrumb leaf reads **Afenda Pte. Ltd.**, not "Ent Sg".
2. Navigating away and back shows the company in Recents.
3. Right-click the header → menu with Open current run, Copy registration number, favourite,
   Properties last.
4. Shift+F10 from the back link opens the same menu.
5. Properties shows only proven fields; the run row matches the run the page is displaying.
6. `/payroll/entities/ent-feed` (the company awaiting data) states its group standing truthfully.
7. A company with no runs keeps identity and omits Open current run.
8. No sideways scroll and no header reflow at 1440 / 1024 / 390.
9. Leaving the page clears the published context — the breadcrumb on the next page is its own.

## Explicit exclusions

```
entity_payroll query provider      server/database persistence
entity-level audit trail           Alt+Enter global shortcut
compare companies (D19)            new routes
edit/Properties-as-Edit            changes to the group matrix
new permanent header chrome        new table, store or primitive
```

## Files expected to change

```
src/views/payroll/payroll-objects.ts                    + object, commands, properties
src/views/payroll/entity-identity.tsx                   new, client composition
src/app/(pages)/payroll/entities/[entityId]/page.tsx    mount identity around the header
```

## Files/systems frozen

```
src/components/shared/WorkspaceCustomisation.tsx      Phase 05
src/lib/workspace/workspace-layout-persistence.ts     Phase 05E
src/types/common/workspace-types.ts                   Phase 05C/05D
src/components/shared/ObjectCommands.tsx              shared object grammar
src/components/shared/PropertiesSheet.tsx             shared inspector
src/components/layout/PublishObjectContext.tsx        shared
src/components/layout/Breadcrumbs.tsx                 already correct
src/views/payroll/group/entity-control-matrix.tsx     except the identity delegation
```

## Stop condition

Contract written, implemented, gates green, browser probes run at the widths claimed, two commits,
working tree clean. Then stop. Phase 07 is not inferred from the exclusions above.
