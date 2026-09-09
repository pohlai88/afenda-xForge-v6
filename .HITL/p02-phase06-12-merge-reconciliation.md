# P02 ↔ Phase 06–12 merge reconciliation

```
merge parents:        e291972   payroll/phase12-command-palette-focus  (ours)
                      a36f620   origin/main                            (theirs)
merge base:           2341199   05D baseline
status:               MERGED / STATICALLY VERIFIED
                      MANUAL ACCEPTANCE PENDING
                      NOT PUSHED
```

Two lines of work met here. Phases 06–12 gave payroll objects an identity, a menu, Properties and a
focus lifecycle. P01/P02 rebuilt the entity workspace around a different object. The textual merge
conflicted in two files; the regression that mattered was in neither of them.

## Canonical object decision

```
/payroll/entities/[entityId]      canonical object = legal_entity
P01 group control matrix row      contextual object = entity_payroll
```

These are intentionally distinct and both are correct. `legal_entity` is the stable cross-domain
company identity. `entity_payroll` is the company *on one period*, which is what the group matrix
lists. The P02 workspace publishes `legal_entity` and only `legal_entity`.

### P02 evidence

| Question | Evidence |
| --- | --- |
| Why `legal_entity` | `P02:2961` — "Object type is `legal_entity`, not `entity_payroll`: P02 is a payroll workspace around the legal entity, and the entity's conceptual identity must stay stable across Afenda domains." |
| Is it canonical | Yes, and frozen: `P02:44` — "the legal employer is the `legal_entity` business object, not a heading — a company outlives any one period" |
| Is `entity_payroll` superseded | Only as *this page's* subject. It remains P01's object. |
| What `ObjectCommandsButton` operates on | `legal_entity`; same list as right-click, Properties last |
| Did P02 remove `PublishObjectContext` | **No.** P02 does not mention it. Zero occurrences in 224KB, and P02 never addresses breadcrumb, Recents or Favourites. Omission, not decision. |
| Does P02 have a `divergences` section | No. None exists. |

That last row is why the lost capabilities below are recorded as reconciled rather than superseded:
nothing in the contract supersedes them.

## Why `entity_payroll` still exists

It is not legacy. The group control matrix publishes it for a company-on-a-period row, its Find
adapter entry resolves it, and its 360 Query provider answers on it. Deleting or re-pointing it
would regress P01. Two entries in every registry, because they are two objects — not one object
spelled twice.

## The three semantic reconciliation edits

The merge resolved textually and left the entity route with **no object-context publisher at all**.
Every downstream capability dispatches on `ObjectContext.type`, so all of them failed together.

| File | Change | Why |
| --- | --- | --- |
| `src/views/payroll/entity/entity-identity.tsx` | mount `PublishObjectContext {...object}` | Lowest P02 component that already holds `legalEntityObject(entity)`. P02's presentation untouched; no new chrome. |
| `src/lib/find/find-object-adapter.ts` | register `legal_entity` in `FIND_OBJECT_TYPES` | An unregistered type has its favourite command withheld and its recorded recent dropped. |
| `src/app/server/find-actions.ts` | resolve `legal_entity` in `resolveObjectTargets` | Registration alone is **not** sufficient — see below. |

All three are at the registry/composition layer. None is a page-local special case.

### Why the third edit exists — browser evidence, not reasoning

After the first two edits the recent was still silently destroyed. Observed on the running dev
server:

```
sessionStorage['afenda.find.recent']
  before palette open   [{"kind":"object","type":"legal_entity","id":"ent-sg"}]
  after  palette open   []

server log
  POST /payroll/runs 200
    └─ ƒ resolveObjectTargets([{"id":"ent-sg","kind":"object","type":"legal_entity"}]) in 2ms
```

`resolveObjectTargets` carried branches for `payroll_run`, `entity_payroll` and `employee` and none
for `legal_entity`. It returned empty, and `forgetUnresolvedRecent` cannot distinguish an
unresolvable type from a company the reader may no longer see, so the entry was dropped. The page
named itself correctly and remained unreachable through Find.

Recorded because the inference was wrong before the measurement was taken: registering the type
looked sufficient and was not.

## Phase 06 capability disposition

```
Object publication            RETAINED, migrated to legal_entity
Breadcrumb                    RETAINED through legal_entity publication
Recents                       RETAINED through publication + Find registration + resolver
Favourites                    RETAINED through legal_entity Find capability
Right-click                   SUPERSEDED by P02 legal_entity commands
Shift+F10                     SUPERSEDED by P02 legal_entity commands
Properties                    SUPERSEDED by P02 legalEntityProperties
Alt+Enter                     RETAINED through publication and shared Properties capability
ObjectCommandsButton          P02 addition, retained
Find                          RETAINED, migrated to legal_entity
360 Query                     entity_payroll provider retained for P01;
                              legal_entity Payroll-context provider DEFERRED
```

## 360 Query divergence — APPROVED

```
legal_entity 360 Query on the P02 workspace:   INTENTIONALLY DEFERRED
classification:                                REQUIRES_CONTEXTUAL_QUERY_PROVIDER_DISPATCH
```

The `entity_payroll` provider is **not** aliased to `legal_entity` and **not** moved.

`QUERY_PROVIDERS` is a flat `Record<string, QueryProvider>` and `query-providers.ts` calls its
lookup "the only type dispatch 360 Query is allowed to perform". Registering payroll questions on
`legal_entity` would therefore make Payroll semantics part of the cross-domain legal-entity
identity, everywhere, for every future domain that publishes a company. Moving the provider would
additionally regress the P01 matrix, which still legitimately publishes `entity_payroll`.

The capability is not deleted. It is **not globally valid for `legal_entity` under the current
type-only provider registry.** Its absence on this workspace is permitted until that architecture
exists.

### Future architecture trigger

> Before `legal_entity` gains domain-specific 360 Query capability, extend provider resolution so
> queryability can depend on both stable object identity and working/domain context.
>
> Do not overload the global `legal_entity` provider with Payroll-only semantics.

Not designed and not implemented here.

## Browser evidence

Directly observed, on the running dev server:

| Probe | Result | Evidence |
| --- | --- | --- |
| R1 breadcrumb is human-readable | **PASS** | `Home / Payroll / Entities / Afenda Pte. Ltd.`; `h1` = `Afenda Pte. Ltd.`; twice, two tabs |
| R2 Recent created | **PASS** | `{"kind":"object","type":"legal_entity","id":"ent-sg"}` |
| R9 `legal_entity` resolution, pre-fix | **FAIL** | recent emptied to `[]`; server log above |

Not obtained:

| Probe | Result |
| --- | --- |
| R9 post-fix resolution | NOT VERIFIED — browser harness failure |
| R3 Favourites | NOT VERIFIED — browser harness failure |
| R4 right-click, R5 Shift+F10 | NOT VERIFIED — browser harness failure |
| R6 Properties, R7 Alt+Enter | NOT VERIFIED — browser harness failure |
| R8 `ObjectCommandsButton` | NOT VERIFIED — browser harness failure |
| R10 Ask about this | NOT VERIFIED — governed by the approved divergence above |
| R11 `ent-feed` truth | NOT VERIFIED — browser harness failure |
| R12 no duplicate identity | NOT VERIFIED in browser; whole-tree source search clean |
| R13/R14/R15 phase 10/11/12 focus | NOT VERIFIED — browser harness failure |

### Harness failure mode, exactly as observed

```
streamed HTML ceased promoting to the interactive client
document.body.innerText collapsed to shell-only content (146 chars, chrome only)
server continued returning 200
page titles remained correct
element/pane coordinate mapping degraded — ref clicks resolved to unscaled DOM coordinates
```

Reproduced across two tabs and a fresh same-origin iframe. A shipped control that had opened
correctly earlier in the same session — the command palette trigger — was retried first and failed
identically, per the rule that a flaky harness is never grounds to change working code.

No static or code evidence in this record is reported as a browser PASS.

## Static gates

```
pnpm check-types          PASS
pnpm lint                 PASS
pnpm build                PASS
design audit --strict     PASS, all checks at budget
```

## Orphan disposition

`src/views/payroll/entity-identity.tsx` — the Phase 06 composition — is **deleted**. Confirmed zero
importers first. Its capabilities have each migrated, been superseded, or been explicitly deferred
above. Git history is the rollback mechanism; a second identity composition living in `src/**` is
not.

`src/views/payroll/entity-workspace.tsx` remains deleted, as P02 deleted it. The feature branch never
modified it, so it resolved with no conflict and no decision. Restoring it would be a P02 contract
change, not a merge resolution.

## What this checkpoint is not

Manual acceptance is still required for every NOT VERIFIED row. Until a person works them by hand
this branch is `MERGED / STATICALLY VERIFIED`, not release-ready, and not pushed.
