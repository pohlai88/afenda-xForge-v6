# Afenda Payroll Frontend Architecture & Future Development Context

## 0. Purpose of this document

This document preserves the **product, frontend, UX, architecture, benchmark, Shadcn Studio, and development-method decisions** established during the Payroll programme.

It deliberately excludes:

- code already written;
- commits;
- implementation status;
- technical repairs made during development;
- backend work;
- temporary implementation decisions.

The purpose is to give future development agents and engineers the context required to continue Afenda Payroll **without rediscovering the architecture or drifting back into generic SaaS/dashboard design**.

---

# 1. Core development philosophy

## Frontend first

Afenda Payroll follows this order:

> **Business concept → frontend interaction → visible state/object model → required domain truth → backend implementation**

The frontend is not a cosmetic layer over a backend model.

The product experience defines what information, objects, states, actions and explanations are actually necessary.

Therefore:

- do not expand backend machinery merely because a domain model could theoretically support it;
- do not create backend capability before a frontend surface proves why the user needs it;
- do not allow technical completeness to compensate for an unclear product experience;
- if the concept cannot be understood and operated through the frontend, the feature is not yet correctly designed.

A backend gap discovered during frontend design should initially be treated as:

> **FRONTEND CONTRACT GAP**

rather than an invitation to immediately build the backend.

---

# 2. Afenda product thesis

The governing product idea is:

> **We resolve the complexity. You enjoy the simplicity.**

Afenda combines three common software models:

### Traditional SaaS

Good at:

- navigation;
- pages;
- dashboards;
- forms.

Weakness:

- the user has to know where everything lives.

### Desktop/operator software

Good at:

- dense operation;
- keyboard-driven work;
- staying inside a task;
- handling large data volumes.

Weakness:

- often difficult to understand.

### Afenda

Target:

> **Find + Operate + Understand**

The system should help the user:

1. orient;
2. find;
3. operate;
4. explore;
5. compose;
6. understand why something happened.

---

# 3. UX doctrine — enduring principles

## 3.1 Objects before routes

Business objects should have stable identity.

Examples:

- company;
- employee;
- pay run;
- payment;
- filing;
- statement;
- payroll input;
- exception.

The user should think:

> “Find this payroll / employee / filing.”

rather than:

> “Which page do I need to remember?”

---

## 3.2 Drill down while preserving context

Default pattern:

> **Summary → drill down → inspect → act → return to the same context**

Avoid unnecessary full-page navigation.

Prefer:

- drawers;
- sheets;
- inspectors;
- tabs;
- workspace groups;
- contextual dialogs.

Create a new route only when a capability genuinely represents an independent work context.

---

## 3.3 Capability without permanent chrome

A capability may exist without occupying permanent screen space.

Use:

- persistent button — only for the dominant action;
- contextual action — when relevant;
- overflow menu — lower-frequency actions;
- context menu — object commands;
- inspector — detailed work;
- global Find — discovery.

Do not display every possible capability simultaneously.

---

## 3.4 One consequential primary action

A primary work surface should normally have **one obvious next action**.

Avoid rows such as:

`Run payroll | Recalculate | Import | Export | Reports | Settings | Payments`

The existence of a capability does not justify permanent button chrome.

---

## 3.5 Truth before convenience

A critical doctrine:

> **The UI must never communicate a state, certainty, relationship, obligation, or financial meaning it cannot prove.**

Examples:

- do not infer statutory treatment from a component label;
- do not invent a filing obligation;
- do not imply an employee transfer history when history does not exist;
- do not display a mixed-currency group total without a governed FX basis;
- do not imply cash is fungible across separate legal employers;
- do not offer a PDF action when no real PDF artifact exists.

---

## 3.6 Smallest legitimate blocker scope

Payroll blockers should stop the smallest legitimate scope.

Examples:

| Problem | Correct scope |
|---|---|
| Missing employee bank account | employee payment |
| Missing OT approval | employee/input |
| Unclassified allowance | employee/component |
| Unresolved transfer | employee |
| Invalid statutory rule pack | jurisdiction/run |
| Invalid employer statutory registration | legal entity filing/release |
| Invalid payroll period | run |

Core principle:

> **One employee problem must not stop unrelated employees unless the underlying rule genuinely applies to the entire run/entity.**

---

# 4. Visual doctrine

Afenda should feel like:

> **A serious financial operating system, not a startup dashboard template.**

Target character:

- quiet;
- dense;
- precise;
- low decoration;
- long-session readable;
- financially serious;
- modern but not fashionable for its own sake.

## Visual rules

### Colour

Colour carries:

- success;
- warning;
- blocking/error;
- selection;
- focus;
- category where genuinely necessary.

Colour should not be decorative.

Semantic meaning:

| Meaning | Colour role |
|---|---|
| Ready / completed / successful | success |
| Review / warning / approaching risk | warning |
| Blocking / failure | destructive |
| Neutral movement / information | neutral/info |
| Excluded/inert | muted |

Chart series colours are **not status colours**.

---

### Cards

Cards are not the default layout unit.

Prefer:

- alignment;
- spacing;
- bands;
- lists;
- tables;
- rails;
- open sections.

Use cards only where information genuinely forms an independent object or group.

Avoid:

- card inside card;
- KPI card grids by default;
- bento dashboards;
- decorative stat cards.

---

### Tables

Operational payroll work naturally belongs in dense tables.

Afenda uses one governed operational table engine.

Use it for:

- payroll populations;
- company control;
- payment settlements;
- filing registries;
- large operational datasets.

Do not mechanically force every small table into the engine.

Simple read-only/detail/preview/configuration tables may remain simple.

---

# 5. Payroll product model

## 5.1 Essential Payroll

Definition:

> **Pay correctly, selectively, visibly and explainably.**

Essential Payroll includes:

- legal employer setup;
- payroll calendar;
- pay groups;
- currencies;
- bank/payment configuration;
- employee payroll identity;
- employment/assignment;
- effective compensation;
- semantic pay components;
- data intake/migration;
- opening balances/YTD;
- payroll inputs;
- payroll run;
- calculation;
- review;
- approval;
- payment;
- statutory minimum;
- Pay Statement;
- audit/source/explanation;
- selective processing;
- partial payroll;
- supplementary payroll;
- corrections;
- off-cycle payroll;
- final pay;
- employee/legal-employer movement.

---

## 5.2 Advanced Payroll / Workforce

Advanced capabilities produce controlled payroll inputs.

Examples:

- attendance;
- shifts;
- clocking;
- overtime;
- leave;
- claims;
- ESS;
- MSS;
- approvals/workflows;
- integrations;
- analytics.

Advanced systems **must not bypass the payroll snapshot/calculation boundary**.

---

## 5.3 Pro HR / People Platform

Pro capabilities operate upstream of payroll.

Examples:

- onboarding;
- offboarding;
- inter-company transfer;
- recruitment;
- L&D;
- skills;
- career;
- talent;
- performance;
- recognition;
- compensation planning.

They should ultimately produce canonical:

> HR → employment → assignment → compensation → payroll input

rather than directly manipulating payroll results.

---

# 6. Payroll event model

The target payroll experience must support distinct events:

- Regular;
- Supplementary;
- Correction;
- Off-cycle;
- Final Pay.

These are not merely labels.

Eventually each should have a legitimate processing meaning.

Important principle:

> A correction should not casually mutate historical paid/released payroll.

Historical results should remain explainable and stable.

---

# 7. Employee movement / transfer architecture

Movement should ultimately be effective-dated.

Target dimensions include:

- legal employer;
- branch;
- location;
- department;
- cost centre;
- position;
- manager;
- pay group;
- employment basis.

## Inter-company transfer

This is particularly important for group Payroll.

A transfer should expose:

- previous legal employer;
- next legal employer;
- effective date;
- payroll responsibility;
- currency consequence;
- statutory consequence;
- split-period treatment where relevant;
- audit trail.

The UI must never reconstruct this history from current values alone.

---

# 8. Pay Statement architecture

The Pay Statement is a **first-class employee object**.

It is not simply a PDF.

Target philosophy:

> **Web statement first. PDF is an output.**

Target content:

- employer;
- employee;
- payroll period;
- payment date;
- earnings;
- deductions;
- employee statutory;
- employer statutory;
- claims/reimbursements separated from reward;
- net pay;
- payment status;
- payment reference;
- calculation version;
- statement revision;
- line explanation;
- source/change explanation.

The Pay Statement should become an important bridge:

> My Pay → My Work → My Employment / HR

---

# 9. Future Total Rewards connection

Payroll should naturally lead into the broader employee-value architecture.

Canonical hierarchy:

**DLBB Total Rewards Programme**

→ **THE UNFAIR GAME**

→ Journey 01 — Harvest Tomorrow — **YOUR VALUE / C&B**

→ Journey 02 — Build Your Edge — **YOUR CAPABILITY / L&D**

→ Journey 03 — Make Your Move — **YOUR PATH / Career**

→ Journey 04 — Make Your Mark — **YOUR CONTRIBUTION / Recognition**

→ Journey 05 — Play the Long Game — **YOUR WELLBEING**

Important:

THE UNFAIR GAME is not:

- competition;
- employee ranking;
- payroll substitute;
- guaranteed financial outcome.

It is an **employee-choice platform**.

Core cycle:

> Discover → Choose → Act → Build → Review → Next Move

Harvest Tomorrow value categories:

- Core Pay;
- Protected Benefits;
- Flex Wallet;
- Business Expenses;
- Incentives & Rewards.

Business Expenses must not inflate employee reward value.

---

# 10. Payroll route architecture

Payroll currently requires **eight primary work contexts**.

These are justified independent pages/workspaces.

| Sequence | Workspace | Route |
|---|---|---|
| P01 | Group Payroll Control Centre | `/payroll` |
| P02 | Entity Payroll Workspace | `/payroll/entities/[entityId]` |
| P03 | Payroll Runs | `/payroll/runs` |
| P04 | Payroll Run Control Centre | `/payroll/runs/[runId]` |
| P07 | Payments | `/payroll/payments` |
| P08 | Compliance | `/payroll/compliance` |
| P09 | Reports | `/payroll/reports` |
| P10 | Payroll Settings | `/payroll/settings` |

The remaining evaluation items are **embedded work surfaces**, not justification for new primary routes.

---

# 11. Full frontend evaluation sequence

Use this sequence for future page-by-page development.

## P01 — Group Payroll Control Centre

`/payroll`

Purpose:

> Understand whether group payroll is on track and where intervention is required.

---

## P02 — Entity Payroll Workspace

`/payroll/entities/[entityId]`

Purpose:

> Understand and operate payroll for one legal employer.

---

## P03 — Payroll Runs

`/payroll/runs`

Purpose:

> Find and triage payroll runs across entities and periods.

---

## P04 — Payroll Run Control Centre

`/payroll/runs/[runId]`

This is the operational centre of gravity.

Purpose:

> Process one payroll population selectively, visibly and explainably.

---

## P05 — Employee Payroll Inspector

Embedded in P04.

Purpose:

> Understand and resolve one employee's payroll result without leaving the run.

---

## P06 — Pay Statement

Embedded employee surface.

Purpose:

> Present the employee's payroll result as a comprehensible first-class statement.

---

## P07 — Payments

Purpose:

> Fund, release, monitor and reconcile payroll settlements.

---

## P08 — Compliance

Purpose:

> Understand statutory readiness and operate filing work without inventing legal obligations.

---

## P09 — Reports

Purpose:

> Produce precise payroll outputs and comparisons without compromising currency/domain truth.

---

## P10 — Settings

Purpose:

> Configure actual payroll authority and clearly distinguish live settings from future/read-only contracts.

---

## P11 — Payroll Input / Import

Embedded workflow.

Target process:

> Upload → Identify → Map → Validate → Resolve → Preview → Import → Reconcile

---

## P12 — Employee Movement / Transfer

Embedded workflow.

Purpose:

> Manage effective-dated employment movement and its payroll consequences.

---

## P13 — Close & Evidence

Embedded within the run context.

Purpose:

> Prove that payroll was correctly reviewed, approved, paid, reconciled and closed.

Long-term target includes a Closure Manifest.

---

# 12. P01 — Group Payroll Control Centre target

This is the first page to evaluate.

## Core question

The page should answer:

> **Across the entire group, will everybody who can legitimately be paid be paid correctly and on time — and where does the operator need to act?**

It is **not**:

- a generic executive dashboard;
- a calculator;
- an employee register;
- a payment ledger;
- a report catalogue;
- a compliance filing page.

---

# 13. Enterprise benchmark lessons for P01

We benchmarked the operating principles of major enterprise SaaS platforms.

## Workday

Borrow:

- centralized payroll status;
- pay-cycle command-centre thinking;
- employee-change visibility;
- payroll status monitoring;
- recommended work/tasks;
- anomaly drill-down.

Do not copy Workday's visual implementation.

---

## SAP Payroll Control Center

Borrow:

- exception-first operation;
- validation discipline;
- issue remediation;
- alert ownership;
- payroll KPI monitoring.

Strongest lesson:

> Payroll problems should become resolvable work, not merely report rows.

---

## Oracle Payroll Activity Center

Borrow:

- current vs prior-period comparison;
- gross/deduction/contribution/net comparison;
- variance clarity;
- detailed reconciliation.

---

## Deel / modern global payroll SaaS

Borrow:

- global legal-entity visibility;
- jurisdiction awareness;
- modern presentation;
- payroll-cost visibility.

---

## Afenda synthesis

Target:

> Workday command-centre thinking  
> + SAP exception discipline  
> + Oracle reconciliation clarity  
> + modern global visibility  
> + Afenda simplicity and contextual operation.

---

# 14. P01 information hierarchy

P01 should read vertically as:

> **WHERE / WHEN / SCOPE**

↓

> **ARE WE ON TRACK?**

↓

> **WHAT NEEDS ATTENTION?**

↓

> **WHICH ENTITY NEEDS ACTION?**

↓

> **WHAT CHANGED?**

↓

> **WHAT MUST BE FUNDED / PAID?**

↓

> **WHAT HAPPENS NEXT?**

This hierarchy is more important than the individual components.

---

# 15. P01 ideal frontend anatomy

## 15.1 Header / orientation

Must show:

- Payroll;
- selected payroll period;
- group scope;
- legal-employer count;
- jurisdiction count;
- currency count.

Recommended scope controls:

- Period;
- Company;
- Jurisdiction;
- Currency basis.

Limit permanent global filters.

Primary action:

> **Open run queue**

Lower-frequency actions belong in overflow.

---

## 15.2 Group payroll hero

Dominant message:

> **X of Y companies on track**

Supporting information:

- total employees;
- ready;
- needs review;
- blocked;
- next payroll deadline.

This is preferred over making Employer Cost the dominant hero.

Why:

P01 is an **operational command surface**, not primarily a financial-reporting page.

---

## 15.3 Payroll readiness

Processing readiness should distinguish:

- Ready;
- Needs Review;
- Blocked;
- Excluded.

Settlement lifecycle should be treated as a separate dimension:

- Not Released;
- Released;
- Processing;
- Paid.

Do not combine them into one overloaded status vocabulary.

---

## 15.4 Needs Attention

Maximum roughly 3–5 high-value items.

Each item should expose:

- severity;
- affected object/scope;
- plain-language reason;
- consequence;
- deadline when relevant;
- one action.

Do not expose a giant alert archive.

---

## 15.5 Next Actions

Target:

- ranked work;
- actual task;
- affected scope;
- due context;
- direct destination.

Do not use:

> Quick Actions

containing generic links to Reports, Payments, Compliance, Settings.

Navigation is not work.

---

## 15.6 Entity Control Matrix

This is the **centrepiece of P01**.

Recommended columns:

- Company;
- Payroll Period;
- People;
- Ready;
- Issues;
- Payday;
- Net Pay;
- Payroll State.

Optional:

- employer cost;
- funding state;
- approval state;
- statutory readiness.

Company row opens:

> P02 Entity Payroll Workspace

This should remain a proper dense table, not become a card grid.

---

# 16. Entity state model

Potential payroll states:

- Not Started;
- Preparing;
- Needs Review;
- Blocked;
- Ready;
- In Review;
- Approved;
- Payment Processing;
- Paid;
- Closed.

Important:

> Payroll lifecycle state should not be confused with payment or compliance sub-state.

For example:

**Payroll: Ready**  
**Payments: 3 held**  
**Compliance: Review**

may all be simultaneously true.

---

# 17. P01 employee changes

Target section:

> **Changes Affecting Payroll**

Potential categories:

- new joiners;
- terminations;
- inter-company transfers;
- salary changes;
- pay-group changes;
- unpaid leave;
- bank changes.

Use a compact list/matrix.

Do not create one card per change category.

Inter-company transfer deserves group-level visibility because it affects multiple legal employers.

---

# 18. P01 variance

Target question:

> **What changed from the previous comparable payroll?**

Measures:

- employees;
- gross payroll;
- net payroll;
- employer cost.

Then show major drivers such as:

- new hires;
- salary changes;
- overtime;
- terminations;
- bonus.

Prefer:

> exact values + explanation

before defaulting to charts.

Employer cost direction is **neutral**.

Higher employer cost is not automatically bad.

---

# 19. Funding and payment exposure

Show funding/payment exposure **by currency**.

Example conceptual model:

- MYR;
- SGD;
- VND.

Do not automatically show:

> Group Payroll Total = RM X

unless the system has a governed FX methodology.

Also do not imply balances held by different companies are freely transferable.

---

# 20. P01 statutory snapshot

Keep this deliberately compact.

Purpose:

> Is statutory readiness threatening payroll delivery?

Show:

- ready companies;
- companies requiring review;
- capability gaps;
- nearest material statutory deadline when actually known.

Do not duplicate the Compliance workspace here.

---

# 21. P01 payroll timeline

Show the next few meaningful dates:

- payroll payday;
- approval deadline;
- funding deadline;
- statutory deadline;
- close deadline.

Prefer a short chronological list/rail.

Do not default to a full monthly calendar.

---

# 22. P01 responsive philosophy

Mobile/compact should not simply stack every desktop block indefinitely.

Preserve the operational spine:

1. Group state;
2. Attention;
3. Companies;
4. Next Actions.

Secondary analytics may collapse below.

The compact page should still allow the operator to understand the situation within seconds.

---

# 23. P01 anti-patterns

Automatically challenge or reject:

- giant donut charts;
- 8–12 equal KPI cards;
- generic quick-action grids;
- mixed-currency totals;
- decorative colour;
- AI summary boxes without operational value;
- full employee tables;
- duplicated compliance/payment/report work;
- card-grid replacement for legal-entity control;
- navigation disguised as tasks;
- charts that hide exact values;
- charts created merely to make the page look analytical.

---

# 24. P01 evaluation standard

Recommended scoring:

| Dimension | Weight |
|---|---:|
| Immediate orientation | 15% |
| Payroll operational usefulness | 20% |
| Issue/action clarity | 15% |
| Entity-level control | 15% |
| Drill-down quality | 10% |
| Information hierarchy/density | 10% |
| Domain/financial truth | 10% |
| Visual/responsive quality | 5% |

Recommended minimum:

> **85 / 100**

Hard failures override the numerical score.

---

# 25. Shadcn Studio strategy

Shadcn Studio is an **implementation accelerator and pattern library**.

It is not product authority.

Authority remains:

> Afenda UX doctrine → payroll architecture → accepted page specification → existing Afenda patterns → Studio evidence.

---

## 25.1 Existing Afenda first

Search order:

1. existing Afenda view;
2. existing Afenda primitive/component;
3. Shadcn Studio page/block/component;
4. existing Base UI/shadcn primitive composition;
5. custom composition.

Do not create a custom view merely because Studio is inconvenient.

---

## 25.2 Studio compatibility

Afenda is standardized around:

> **Shadcn + Base UI / base-vega**

Do not introduce:

- a second primitive system;
- Radix-only dependency;
- a second theme;
- a second app shell;
- a second sidebar;
- a second table engine.

Studio blocks are inspected before adoption.

Possible outcomes:

### REUSE_EXISTING

Afenda already solves the problem.

### REFINE_EXISTING

Afenda owns the right composition but needs improvement.

### COMPOSE_EXISTING

Existing primitives can compose the requirement.

### ADAPT_STUDIO

Studio offers materially better compatible structure.

Adapt:

- anatomy;
- interaction;
- hierarchy.

Retokenise into Afenda.

### CUSTOM_AFTER_PREFLIGHT

Custom composition is justified only after existing repo + Studio investigation fail.

### REJECT_STUDIO

The Studio implementation conflicts with:

- Base UI;
- doctrine;
- semantics;
- accessibility;
- shell ownership;
- table ownership;
- theme ownership.

---

# 26. Studio catalog architecture

The long-term Studio relationship should remain:

> **Studio upstream**

↓

> **Local vendor metadata catalog**

↓

> **Stable Studio resolver IDs**

↓

> **Page-specific candidate mapping**

↓

> **Preflight decision evidence**

↓

> **Application implementation**

The page specification itself should **not duplicate Studio metadata** such as:

- block counts;
- registry URLs;
- tier labels;
- vendor descriptions.

Those belong in the Studio catalog.

This prevents vendor metadata drift from contaminating product specifications.

---

# 27. Shared Studio evidence

Do not inspect the same block separately for every section.

Use evidence groups.

Example:

### Metric hierarchy evidence

One Statistics pattern may inform:

- Group Hero;
- Readiness;
- Variance;
- Funding Exposure.

### Operational-list evidence

A Widget pattern may inform:

- Needs Attention;
- Next Actions;
- Employee Changes;
- Statutory Snapshot;
- Upcoming Events.

This dramatically reduces unnecessary Studio inspection.

---

# 28. Frontend preflight philosophy

Before material frontend work, ask:

> **Can we reuse Afenda? If not, what is the minimum evidence necessary to prove the next implementation path?**

The objective is:

> **minimum sufficient discovery**

not:

> maximum catalog coverage.

---

# 29. Decision confidence

Before accessing Studio, classify confidence.

## High confidence

Repo + specification already prove the decision.

Result:

> do not inspect Studio.

---

## Medium confidence

Likely direction is known, but one Studio reference could materially improve or overturn the decision.

Result:

> inspect only 1–2 strong references.

---

## Low confidence

Interaction/composition remains genuinely unresolved.

Result:

> use structured Studio exploration.

---

# 30. RUI / CUI / IUI

These are **three different modes**, not a sequence.

## RUI — Refine UI

Use when:

- a current Afenda view exists;
- ownership is correct;
- a concrete frontend defect exists.

Principle:

> **Edit, don't redraw.**

Before touching the UI, state the defect.

Examples:

- hierarchy weak;
- too much chrome;
- actions duplicated;
- density wrong;
- responsive composition poor.

A valid RUI conclusion is:

> Current Afenda is already better. Stop.

---

## CUI — Create UI

Use only when:

- accepted specification requires a genuinely new composition;
- existing repo reuse has failed.

Study Studio for:

- layout DNA;
- component combinations;
- interaction mechanics;
- responsive behavior.

Principle:

> **Synthesize, never copy.**

---

## IUI — Inspire UI

Use when:

- the interaction itself is uncertain;
- multiple legitimate directions exist;
- alternatives are genuinely useful.

Study a few diverse references.

Then:

> choose a direction and stop browsing.

Do not invoke IUI by default.

For P01, the interaction architecture is already sufficiently defined, so IUI should be uncommon.

---

# 31. Evidence budgets

Suggested Studio inspection limits:

| Mode | Typical Studio sources |
|---|---:|
| REUSE_EXISTING | 0 |
| RUI / REFINE | 0–2 |
| COMPOSE_EXISTING | 0–1 |
| CUI / ADAPT | 1–2 |
| CUSTOM_AFTER_PREFLIGHT | max ~3 |
| IUI | 2–3 genuinely diverse patterns |

Going beyond the budget should require a reason.

Stop when additional Studio examples no longer change the design decision.

---

# 32. Section-level development

Do not require the entire page to be resolved before working on an independent section.

Example:

P01 may contain:

- Header — already clearly reusable;
- Entity Matrix — clearly reusable;
- Attention — still unresolved;
- Hero — requires refinement.

The high-confidence sections should not be blocked merely because one unrelated section still needs Studio evidence.

Therefore future development should operate at:

> **page architecture level + section implementation level**

rather than one monolithic page PASS/FAIL.

---

# 33. Skill-utilisation architecture

To keep future development efficient, frontend skills should follow a layered model.

## Lightweight core

Load for any frontend decision.

Owns only immutable invariants:

- frontend first;
- Base UI;
- semantic tokens;
- existing Afenda first;
- no second shell/theme/table system;
- truth before presentation.

---

## Frontend preflight

Load only for material frontend composition.

Owns:

- reuse decision;
- Studio routing;
- evidence budget;
- RUI/CUI/IUI choice;
- section unlock.

---

## Deep design-system guidance

Load when actually needed for:

- implementation;
- visual QA;
- measurement;
- detailed spacing/type/surface rules;
- accessibility;
- debugging;
- screenshot comparison.

Do not consume the full deep design-system context merely to answer a simple reuse question.

---

## React/Next.js best practices

Load when implementing/refactoring React.

Important recurring principles:

- derive state instead of duplicating it;
- avoid effects for event-driven state;
- keep client boundaries focused;
- prefer server ownership where possible;
- preserve URL-addressable shareable state;
- avoid unnecessary subscriptions/renders;
- lazy-load genuinely heavy optional UI.

---

# 34. Skill governance

Future skills should not accumulate indefinitely.

A new skill must prove:

1. unique trigger;
2. unique output;
3. no current owner.

If not:

> extend an existing skill or reference instead.

Mutable facts should not live inside skill prose.

Examples:

- component counts → script/config;
- Studio metadata → catalog;
- routes → architecture;
- payroll semantics → payroll doctrine;
- design tokens → CSS/design-system;
- page contract → page YAML.

Skills should describe **how to reason and act**, not become copies of repository facts.

---

# 35. Frontend audit model

Future audits should distinguish three levels.

## Level 1 — Target Product Contract

What the page **should eventually be**.

Defined independently of current implementation.

---

## Level 2 — Current Frontend Evidence

What the current screen actually communicates and allows.

---

## Level 3 — Implementation Status

Whether target behavior is actually available and validated.

Never conflate the three.

This was one of the most important lessons from the payroll/YAML audit process.

---

# 36. Source audit versus visual audit

Reading source can validate:

- information hierarchy;
- component ownership;
- action placement;
- URL state;
- semantics;
- duplicated controls;
- fake actions;
- structural responsive intent.

It cannot fully validate:

- spacing;
- actual wrapping;
- visual balance;
- dark-mode appearance;
- sticky behavior;
- focus order;
- keyboard interaction;
- touch ergonomics;
- overflow;
- visual regressions.

Therefore:

> **Source/composition validation is not the same as rendered UI validation.**

Final UI approval requires the rendered application.

---

# 37. Future visual-validation method

For each page:

1. Render the target route.
2. Capture desktop with sidebar expanded.
3. Capture desktop with sidebar collapsed.
4. Capture tablet.
5. Capture mobile.
6. Check light theme.
7. Check dark theme.
8. Verify focus order.
9. Verify sheets/dialogs.
10. Verify table overflow.
11. Verify empty states.
12. Verify loading states.
13. Compare against the accepted page specification.
14. Refine until the page satisfies the target rather than merely looking acceptable.

---

# 38. Recommended next development sequence

The correct continuation is:

## Step 1

Take **P01 specification** as the clean target.

Do not alter the target to accommodate the existing implementation.

---

## Step 2

Render the current `/payroll`.

---

## Step 3

Compare every visible current element against P01.

Classify:

- **KEEP**
- **REFINE**
- **REPLACE**
- **REMOVE**
- **ADD**

---

## Step 4

For every REFINE / REPLACE / ADD:

1. check existing Afenda;
2. assign confidence;
3. select RUI / CUI / IUI where appropriate;
4. inspect minimum Studio evidence;
5. decide the frontend shape.

---

## Step 5

Produce the accepted P01 visual/composition contract.

---

## Step 6

Implement frontend only.

Backend/domain gaps discovered during implementation remain explicit contract gaps.

---

## Step 7

Render and validate P01.

Only once P01 passes should evaluation proceed to:

> **P02 Entity Payroll Workspace**

and repeat the same process.

---

# 39. Final governing model

The entire future development programme can be reduced to this:

> **Define the ideal product independently.**

↓

> **Use the UX/payroll doctrine to constrain it.**

↓

> **Benchmark giant SaaS for proven operating principles, not layouts.**

↓

> **Search existing Afenda before creating anything.**

↓

> **Use Shadcn Studio as evidence and implementation acceleration, not authority.**

↓

> **Choose RUI, CUI or IUI according to uncertainty.**

↓

> **Consume the minimum evidence required to make a decision.**

↓

> **Design and validate the frontend first.**

↓

> **Expose backend/domain gaps only after the UI proves they are necessary.**

↓

> **Render, measure and visually validate before calling the page complete.**

The objective is not to build the most features.

The objective is:

> **A payroll product where complexity is absorbed by the system, the operator immediately understands what matters, exceptions become actionable work, and every number or state on the screen can be explained and trusted.**