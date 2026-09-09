# Phase 07 — A company's payroll can be asked about

```
branch base:          93769ea   (06 browser closure)
branch:               payroll/phase07-entity-360-query
status:               contract — implementation follows in a second commit
```

Phase 06 made `/payroll/entities/[entityId]` a first-class `entity_payroll` object: it publishes
its context, names the breadcrumb, enters Recents, carries commands and exposes Properties. It
closed with one capability deliberately open, and named it in its own commit message: there is no
`entity_payroll` query provider, so there is no **Ask about this**. This phase writes that provider.

## Problem

360 Query is the EXPLORE half of the object contract. Properties answers *what exactly is this*;
360 Query answers *what is connected to it*. A company's payroll is the one payroll object with a
workspace of its own and no way to be explored — the pay run inside it can be asked what changed
and who is blocked, and the payment inside that can be asked what else failed the same way, but the
company those both belong to answers nothing.

The absence is currently **correct**, not broken. `ObjectCommands.tsx:124` reads
`queryProviderFor(object.type) !== undefined` and omits the command when it is false, which is what
doctrine `context_menu` requires of a capability that does not exist. The defect is not in the menu.
It is that the domain has never written the questions.

## Evidence

| Claim | Evidence |
| --- | --- |
| The registry has two types and neither is a company | `query-providers.ts:19-22` — `payroll_run`, `settlement` |
| An absent type is absent everywhere by design | `query-providers.ts:10-12` — "no Ask about this, no empty panel, no disabled command" |
| The menu already asks the registry and nothing else | `ObjectCommands.tsx:124` — `const askable = queryProviderFor(object.type) !== undefined` |
| So registration alone makes the command appear | `ObjectCommands.tsx:167-175` renders the item from `askable`, between the domain commands and favourites, with Properties still last |
| The panel takes a value, not a publication | `query-store.ts:48` — `openQuery(object, returnFocus)`; nothing reaches `ObjectContextStore` |
| The object to hand it already exists and is stable | `entityPayrollObject` (`payroll-objects.ts:399`), minted once and delegated to by `entityPeriodObject` |
| A company's runs are already a domain relationship | `runsForEntity` and `latestRunFor` (`payroll-group.ts:254-258`) |
| An entity-level audit trail does not exist | Phase 06 refused an Audit command for exactly this reason; nothing in the domain records entity-level events |

## Operator consequence

Someone working one company's payroll can open the run, ask the run what changed, and ask a payment
what else failed. Standing on the company itself — the screen they spend the day on — the same
gesture offers Copy registration number and nothing that explores anything. The company is the only
rung of that ladder that cannot be asked a question, and it is the rung the reader is standing on.

## Existing query architecture

Unchanged by this phase, and restated so it is clear what is being reused rather than rebuilt.

```
entityPayrollObject(entity, href)           the subject, already minted by Phase 06
        ↓
ObjectContextMenu / ObjectCommandsButton    askable = queryProviderFor(type) !== undefined
        ↓
openQuery(object, returnFocus)              one-slot store; a value, never a publication
        ↓
QueryPanel                                  mounted once in the shell, non-modal Dialog
        ↓
queryProviderFor('entity_payroll')          the one lookup 360 Query is allowed to perform
        ↓
provider.suggestions(object) → run(object, id)
        ↓
'use server' query-actions                  applies the actor; presentation is not authorization
```

A question is a stable identity the domain published, never text a reader composed. An answer is a
`FindResult[]` or an `AuditEvent[]`, both shapes that already existed. This phase adds nothing to
either list.

## Provider ownership

**One provider for `entity_payroll`**, exported from `src/views/payroll/payroll-query.ts` beside the
two that already live there, and registered by its own `type` in `query-providers.ts` exactly as
they are. There is no menu-specific, page-specific or Properties-specific variant, and there is no
second place a company's questions may be written.

The provider operates on the `ObjectContext` it is handed. It does **not** mint identity: it never
constructs a company from an id and never re-derives a label. `entityPayrollObject` remains the
single origin of what an `entity_payroll` is called, exactly as Phase 06 left it, and the panel
title reads `object.label` straight through.

Find registration and query registration stay two registries, because the architecture already
distinguishes them: `find-object-adapter.ts` records *how a type is located and addressed*,
`query-providers.ts` records *whether a domain has written questions for it*. Phase 06's Find
correction is frozen and is not reopened, duplicated or merged into this one.

## `entity_payroll` query context

The subject the panel receives is the object the workspace already published:

```
type   'entity_payroll'
id     the legal entity id            ent-sg, ent-feed
label  the company's name             Afenda Pte. Ltd.
href   /payroll/entities/<entityId>   the workspace it was asked from
```

It carries no run, no period and no filter — deliberately. The workspace may be displaying an
earlier run through `?run=`, and the provider cannot know that, so **every question this provider
publishes must be answerable from the company alone**. A question whose truth depends on which run
the reader happens to be looking at is a question for the run's provider, which already exists.

## Supported query intents

Two, both `search`, both answerable from records the domain already holds.

### 1 — Which pay runs has this company calculated?

```
id            entity-pay-runs
mode          search
answer        objects — the company's runs as payroll_run FindResults, newest first
sublabel      period · status, the same wording Find already resolves for a run
available     when the company has at least one run on record
```

The company-to-run relationship is the one traversal an `entity_payroll` unambiguously owns, and
the answer opens each run at the address the run object already resolves. Newest first because a
question about a company's runs is asked from the present.

Gated on the company having runs, not on it having a *current* one: a company whose open period has
no calculation still has a run history, and that is precisely the case this question is most useful
in. Withheld entirely from a company with no runs at all, where the only possible answer is nothing
— Properties already states `Runs on record: None`, and a question that can only ever answer that is
a dead question.

### 2 — Who is affected by open exceptions on the latest run?

```
id            entity-open-exceptions
mode          search
answer        objects — people with unresolved exceptions, worst severity first
sublabel      employee number · open count · worst severity
available     when the company's latest run has at least one unresolved exception
```

**"On the latest run" is in the label because it is in the answer.** The provider is given a company
and nothing else, so the run it reaches is `latestRunFor(runsForEntity(...))` — the run the workspace
itself opens to. Naming it in the label is the difference between a question about a company and a
question that quietly picked a run for the reader.

"Open" and "affected by" are the run provider's own definitions, reached through the same helper
rather than a second copy: an exception attributed to this person or to their department that
nobody has resolved, acknowledged included, because acknowledging is a decision to proceed and not
a fix.

## Unsupported query intents

Named, with the reason each is absent, so the next phase recognises what would have to become true.

| Intent | Why absent |
| --- | --- |
| `audit` mode entirely | There is no entity-level audit trail. Phase 06 refused an Audit command on this ground and this phase does not reverse it by putting the same fiction behind a different control. |
| `predict` mode entirely | The domain stores lifecycle facts, not forecasts. Absent everywhere in this app for the same reason. |
| What changed? | An entity-level change history is the audit trail that does not exist. The *run's* provider answers this for a run. |
| Explain current state | Properties already states the state, and §13 of the brief is binding: 360 Query must not absorb the inspector. |
| Break this down | Cost by department is a drilldown the workspace performs in place. A query panel repeating it would be a second version of a chart that already exists. |
| Show source | No lineage record exists at entity level. The group surface owns lineage for consolidated figures. |
| What happens next? | Predict. See above. |
| Is this company in the group total? | Exclusion is provable and inclusion is not — see the next section. Properties already states the provable half; a question would have to answer the other half to be worth asking. |

Doctrine: a meaningless control MUST NOT render. Nothing above is offered disabled, greyed, or as an
empty panel.

## Domain-truth boundaries

Binding, and inherited unchanged from Phase 06.

- **Exclusion may be stated; inclusion may not.** `consolidate` excludes `awaiting_data`
  unconditionally, so exclusion is provable from the entity workspace. Inclusion also needs an FX
  rate to the reporting currency and a consolidation this path never runs. No answer, sublabel or
  label produced by this provider asserts that a company **is** in the group total.
- **No answer is generated.** Every item returned is a record the fake-db holds, rendered through
  `FindResult` — no summary sentence, no scoring, no conclusion, no advice.
- **A missing run is stated as missing.** A company with no calculation for the open period is not
  given one. Question 2 simply does not appear when the latest run has nothing outstanding, and no
  answer invents a current-period run for a company that has none.
- **Nothing is inferred from adjacency.** Two companies sharing a country or a currency are not
  related by this provider, because the domain does not record that as a relationship.
- **The server decides who sees what.** Both answers run behind `can(actor(), 'payroll.view')` in a
  `'use server'` action, refusing by returning nothing — indistinguishable from a company with no
  runs and no exceptions, so refusal never confirms existence.

## Interaction behaviour

Nothing new is built; the existing panel behaviour is inherited whole.

- **Ask about this** appears in the entity header's context menu because the registry now answers
  yes. It sits between the domain's own commands and Add to favourites; **Properties stays last**.
- The panel is the shell's single non-modal `Dialog`. The workspace stays interactive and scrollable,
  clicking it does not dismiss the question, and Escape closes.
- **Parent context is preserved.** The reader stays on `/payroll/entities/[entityId]`. There is no
  route jump to ask, and **no `/payroll/entities/[entityId]/query` route is created** — the existing
  architecture requires none, which the panel's shell mounting proves.
- Choosing a run from an answer navigates to that run's workspace, which is a change of path, so the
  panel closes. That is doctrine `subject_lifetime` — a question belongs to the page it was asked
  from — and not something this phase overrides.
- `?run=` and `?dept=` change the query string and not the path, so the panel survives them.
- The subject never reaches `ObjectContextStore`. The breadcrumb keeps saying what the page is about
  while the panel says what is being asked about.

## Accessibility and keyboard behaviour

Inherited, not re-implemented. No payroll-specific keyboard handling is added.

- Right-click and **Shift+F10** both reach the menu on the entity header, both proven in the Phase 06
  browser closure, and after registration both expose the same **Ask about this**.
- The panel takes initial focus into its filter input (`initialFocus={inputRef}`) and returns focus
  to the control it was summoned from on close (`focusTarget(returnFocus.current)`), which for a
  keyboard invocation is the header control the keypress came from.
- Escape closes. The closed popup is `inert`, so nothing behind it is reachable through a panel that
  is still animating out.
- The command is named in words a person reads; the questions are named by the domain.

## Responsive behaviour

No layout change at any width — this phase adds no chrome to the page at all. The panel is
`w-full sm:max-w-md` on the right edge, which is the existing behaviour on every surface that
already has a provider.

Verified at **1440, 1024 and 390**, using widths the harness genuinely achieves and recording the
iframe viewport where an iframe is used. At each width: the query opens and is usable, the entity
identity stays understandable, no page-level horizontal overflow appears, and the panel does not
replace the breadcrumb or the heading as the orientation of the screen.

The `/payroll` card-clipping observation recorded in the Phase 06 closure is out of scope and is not
touched.

## Acceptance probes

1. `queryProviderFor('entity_payroll')` returns the one provider, with no page-local special case.
2. Right-click the entity header: **Ask about this** is present, Properties last, no Audit command.
3. Shift+F10 exposes the same command.
4. Invoking it opens the existing panel over the workspace, with no navigation.
5. The panel's subject is the company — title reads the company name — for both `ent-sg` and
   `ent-feed`, never a route id, a run or a surrogate.
6. `ent-sg`: both questions render and answer from provable data.
7. `ent-feed`: the panel opens, the run-history question answers, and nothing fabricates a
   current-period run or a group-total inclusion.
8. A company with no run for the open period is still fully queryable.
9. A question the record cannot answer is absent — question 2 does not appear for `ent-feed` — and
   nothing renders disabled or empty in its place.
10. 1440 — panel and workspace usable.
11. 1024 — same semantics.
12. 390 — same semantics, compact.
13. Closing returns focus to the control the panel was opened from.
14. `payroll_run` still answers its own questions; the registry is not regressed.

## Explicit exclusions

Not permissions for later. Each is excluded because the domain cannot support it today.

```
entity-level audit trail            predict mode
LLM / AI / RAG / vector store       free-text query parsing
a second query registry             merging Find and Query registration
/payroll/entities/[entityId]/query  any new route
a new permanent header button       any change to ObjectCommands rendering
group-total inclusion claims        FX or consolidation performed in a provider
a new table or answer shape         duplicating Properties fields into answers
changes to the group matrix         changes to Phase 06's Find correction
```

## Expected files

```
src/app/server/query-actions.ts     capabilities + the two answers, under the actor
src/views/payroll/payroll-query.ts  entityPayrollQueryProvider, beside the other two
src/lib/query/query-providers.ts    one registration line
.HITL/phase07-entity-payroll-360-query.md
.HITL/PHASE07.txt                   the brief this came from, tracked as phase06.txt was
```

A diff wider than this is a warning sign.

## Frozen systems

Not touched by this phase:

```
the entity page and its workspace     ObjectContext and PublishObjectContext
entity-identity.tsx                   Properties and PropertiesSheet
workspace customisation/persistence   the Find object adapter and its Phase 06 correction
the table engine                      ObjectCommands rendering
QueryPanel                            query-store and query-types
```

## Stop condition

Phase 07 freezes when the contract is written, the provider is implemented through the existing
architecture, domain truth is preserved, `check-types`, `lint`, `build` and the design audit are
green, the available browser probes are recorded honestly as PASS / FAIL / NOT VERIFIED, the commits
are complete and the tree is clean. Phase 08 does not begin.
