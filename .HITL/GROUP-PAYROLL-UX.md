# Group Payroll Control — UX specification

The acceptance document for the surface. It describes screens, hierarchy, states, interaction and
wording. It contains no types, no file paths and no algorithms; those live in the implementation
plan. When the two disagree about what the user sees, this file wins.

Internally the surface is **Group Payroll Control**. The navigation says "Group".

---

## 1. The two constitutional rules

Everything below follows from these. They are the acceptance test for any future change.

> **No consolidated number without coverage.**
> **No financial number without explanation.**

A number that cannot say what it included, and cannot show how it was built, does not ship.

---

## 2. Hierarchy

```
Group  →  Entity  →  Run  →  Employee
/payroll   /payroll/entities/[id]   /payroll/runs/[id]   ?employee=
```

Each level is a real page with its own URL. Every level drills down without losing the level above:
a back link, never the browser button as the only route home.

### Analytical context survives the drill

Drilling must not cost the user the view they built. Someone looking at September, in ringgit, at
pay-date spot, consolidated by cost centre, who opens Malaysia and comes back, lands on exactly that
view again.

The group view is fully described by its URL, so the drill carries a single return path and the back
link restores it. If it is absent the back link falls back to a plain group view, so a shared or
hand-typed entity link still works.

**Security rule:** a return path arrives from the URL and is therefore untrusted input. It is
accepted only when it is a same-origin path beginning with the payroll route. Anything else is
discarded silently in favour of the fallback. A navigation target taken raw from a query parameter
is an open-redirect, and this is the one place the pattern could be introduced.

---

## 3. Four orthogonal dimensions, never collapsed

The most common failure in consolidation screens is one status column pretending to answer several
questions. It does not.

| Question             | Answer                   | Where it shows                  |
| -------------------- | ------------------------ | ------------------------------- |
| Has it calculated?   | Included · Missing       | Coverage column, coverage lines |
| Can it advance?      | Blocked · Review · Ready | State column, readiness card    |
| Is the figure final? | Final · Provisional      | Coverage column, hero, drawer   |
| Has it finished?     | Paid · Closed            | State column                    |

Singapore in September is **included**, **blocked**, **provisional** and **not ready**, all at once.
The matrix must be able to say all four about one row.

### Finality is its own truth

"Included" means the number is in the total. It does not mean the number is settled. An entity whose
calculation is included but not yet approved can still move, and a reader who takes "included" for
"final" has been misled by omission.

So finality is stated in **amount, not only count**. "2 provisional" is weak; what a finance lead
needs is how much of the total can still change:

```
2 calculations provisional · RM 1,204,880 · 25% of the total
```

Finality is derived, never stored twice: approved, paid and closed are final; calculated and pending
approval are provisional. A missing entity has no finality at all, because it has no figure.

The three reader questions are therefore distinct and each has its own answer on screen:

| Coverage | Is it in the number? |
| Readiness | Can payroll proceed? |
| Finality | Can the number still move? |

### State tiers, not a status rainbow

Seven states render in four visual weights, so the eye sorts them before reading them.

| Tier       | States                     | Treatment            |
| ---------- | -------------------------- | -------------------- |
| Incomplete | Awaiting data, In progress | Muted                |
| Attention  | Blocked, Review            | Destructive, Warning |
| Proceed    | Ready                      | Success              |
| Complete   | Paid, Closed               | Muted                |

Never seven equally saturated badges.

---

## 4. Page anatomy

```
GroupHeader        group · period · reporting currency · FX basis · view · compare
GroupHero          value · delta · coverage · readiness · explain
GroupReadiness     included / ready / blocked / review / awaiting
EntityControlMatrix   ← the working centre
GroupMovement      where the change came from
ConsolidateBy      dimension selector · table · restrained chart
GroupTrend         last six periods
LineageDrawer      bottom sheet, opened from anywhere
```

The matrix is the centre of the page. Everything above frames it; everything below explains it.

---

## 5. Header

Controls, left to right: group name (text, not a control, while there is one group), period,
reporting currency, FX basis, view, compare.

- **View** offers "Operational payroll" enabled and "Financial allocation" present but disabled.
  The seam is visible before the second view exists, so nobody later assumes the first view meant
  both.
- **Compare** offers "Previous period" now; "Same month last year", "Budget" and "Custom" are the
  same control's later values.
- The meta line states scale: "Afenda Group · 5 entities · 3 countries · 3 currencies".

Every selector is shareable through the URL and survives a reload.

### Freshness — how old is this truth?

A consolidated figure carries an unasked question: how current is it? The header answers quietly, on
one muted line beside the meta line.

```
Newest calculation 24 Sep 2026 · rates 30 Sep 2026
```

**The trap this avoids.** The obvious implementation stamps the render time, which claims freshness
the domain cannot prove: it reports when the page was opened, not when the payroll was calculated. A
page reloaded at midnight would look freshly consolidated while resting on a fortnight-old run. It
would also read the clock during render, which this codebase forbids because server and browser
disagree.

Freshness is therefore two facts the domain can prove: the newest calculation timestamp among the
**included** runs, and the date of the exchange rates in use. Both are data, not clock reads. When
the newest included calculation is more than a few days old, the line says so in words rather than
leaving the reader to subtract dates.

---

## 6. Hero — four truths in one block

```
Employer cost
RM 4,821,330                              ← dominant, one per page
+3.8% vs August 2026                      ← what changed
4 of 5 entities included · 2 provisional  ← completeness and finality
⚠ Afenda Feed Vietnam has no calculation
RM 1,204,880 of this total can still move ← finality, in money
1 of 5 ready to pay                       ← operational readiness
                                          [ Explain ]
```

The delta sits inline to the right of the figure as a small chip carrying a direction icon, so the
number and its movement read as one statement rather than two stacked lines.

Rules:

- **One dominant figure per page.** Employer cost. Net pay is secondary and lives in the readiness
  card, reachable in full through the drawer's measure toggle. Two competing 60px figures would push
  the delta and coverage lines into footnote position, and those are what make the number
  trustworthy.
- **Qualifiers are siblings of the number, not a footnote.** Coverage sits inside the same block, at
  body size, immediately under the delta.
- **The missing entity is named and linked**, never counted anonymously.
- **The figure itself is the explain trigger**, as well as the button. It is a real control with an
  accessible name that includes the amount.
- When coverage is incomplete, the delta carries "incomplete" so a comparison is never read as
  final.

---

## 7. Coverage is three measures

Missing a dormant company is not missing the largest business unit. So:

| Measure                | Reads                     |
| ---------------------- | ------------------------- |
| Entity coverage        | 4 of 5 entities included  |
| Employee coverage      | 91% of expected headcount |
| Expected cost coverage | 88% of expected cost      |

Expectation is the previous period, because that is the only expectation the domain can prove. The
hero shows entity coverage; the drawer and the readiness card show all three. Together they answer
the real question: **is this total materially complete?**

---

## 8. Entity Control Matrix

The working surface. A dense table, not a summary.

| Column        | Content                                             |
| ------------- | --------------------------------------------------- |
| Entity        | Name, links to the entity page                      |
| Country       | Country name                                        |
| Currency      | Local currency code                                 |
| Employees     | Count, or an em dash when there is no calculation   |
| Employer cost | Reporting figure, with the local amount beneath it  |
| Δ             | Change against the comparison basis, with direction |
| State         | Badge, tiered per section 3, with a one-line detail |
| Coverage      | Included or Missing                                 |

Behaviour:

- **Selection.** Checkbox column, select-all-matching-filter, and a floating bar summarising the
  selection (section 10).
- **Facets.** Country, currency, state and coverage. Shareable facets live in the URL.
- **A missing row shows em dashes, never zeros.** Zero is a claim; absence is the truth.
- **The four dimensions are told apart by kind of mark, not by four badges.** State is the badge.
  Coverage and finality are an icon with plain text. A row wearing four saturated badges is
  unreadable; a row with one badge and two quiet marks is not.
- **A badge appears only when the state is exceptional.** A settled row carries plain text, which
  keeps attention on the rows that need it.
- **Sorting** on every figure, sorting the raw amount rather than the formatted string.
- **The footer refuses to sum mixed currencies** and says why: "5 entities · 3 currencies · filter by
  entity to total".
- Row click is mouse convenience; the entity name is the real keyboard affordance.
- Any row opens the lineage drawer for that entity.

---

## 9. Group Movement — variance concentration

Answers the question a group finance lead actually asks: not "what is the total" but "where did the
change come from".

```
Group movement
+RM 184,220 vs August 2026

Malaysia Manufacturing   +RM 92,100   ████████
Singapore                +RM 47,310   ████
Vietnam Feed             +RM 31,820   ███
Central Kitchen          +RM 18,400   ██
Other                     −RM 5,410   ▌
```

- Ranked by absolute contribution, largest first.
- Sign, direction icon and bar direction all carry the meaning. Colour alone never does.
- Every row opens the lineage drawer for that contribution.
- **The bar sits behind the text, not beside it.** The row is a single line with the label and the
  figure over a tinted fill, so the list stays dense and scannable at a glance.
- **The fill is a proportion of the largest contributor, not of the total**, so the leader fills its
  row and the ranking is legible. A minimum visible width keeps a tiny contributor such as "Other"
  from vanishing to nothing.
- **A row shows a hover affordance only if it can actually be opened.** A row that cannot drill is
  not styled as though it can.
- When either period is incomplete, the block says so above the list, because a movement between two
  differently-covered periods is not a like-for-like movement. Where possible it also states the
  like-for-like figure over the entities present in both periods.

---

## 10. Selection semantics

The floating bar states the same three truths as the hero, for the subset.

Complete selection:

```
3 entities selected
Employer cost   MYR 2,821,440
Coverage        3 of 3 included · all final
Currency        converted to MYR · pay-date spot
```

Incomplete selection:

```
3 entities selected
Employer cost   MYR 2,102,221
Coverage        2 of 3 included
⚠ Vietnam Feed has no calculation. Selection total is incomplete.
```

Never "3 selected · RM2.1m". A selection total obeys the same constitutional rules as the headline.

---

## 11. Consolidate by — the dimension workspace

A dimension selector, a table, and a restrained chart. Dimensions: entity, country, currency,
department, cost centre, component. Region and others are added as the domain gains them.

```
Employer cost by cost centre

Cost centre       Employees   Cost        Share    Δ
Operations              562   RM 1.28m    26.5%   +3.4%
F&B                     421   RM 930k     19.3%   −1.2%
Manufacturing           381   RM 842k     17.5%   +5.1%
```

- **Any dimension row opens the same lineage drawer.** This is deliberate: headline, entity row,
  selection, movement row and dimension subtotal all explain themselves identically, which makes
  this interaction the direct precursor to Report Studio's "explain this cell".
- Shares are of covered cost, and the coverage line is repeated beneath the table whenever the
  period is incomplete.
- The chart is secondary to the table. Numbers first.

---

## 12. Lineage drawer

A **bottom** sheet, because a financial bridge needs horizontal room and reads as a wide table. The
house rule this establishes:

> Bottom drawer for a number or a selection. Right sheet for a single record.

Four layers, always in this order:

**A. Identity**

```
Group employer cost · September 2026
Reporting currency MYR · FX basis pay-date spot
```

**B. Bridge**

```
Local payroll at budget rates      RM 4,763,910
FX movement                           +RM 57,420
                                   ─────────────
Reporting total                    RM 4,821,330
```

The bridge must read as arithmetic, not as three more list rows. Four things make it do so:

- It sits in **its own bordered well**, separated from the sections around it.
- Contributing lines pair a **muted label with a plain-weight figure**.
- The rule above the total is a **real separator element**, not a border on the total row.
- The **whole total row** is promoted in size and weight, with the label pushed left and the figure
  right.

The negative line carries a bare minus sign and no colour. If a rounding residual ever exists it
appears as its own line, "FX rounding adjustment", and is never absorbed.

**C. Composition**

```
Entity        Local        Rate     Converted     Included
Singapore     S$338,120    3.113    RM1,052,662   Yes
Malaysia      RM1,820,400  1.000    RM1,820,400   Yes
Vietnam       ₫8,214,000k  0.00018  RM653,120     Yes
Feed          —            —        —             No
```

**D. Evidence**

```
Source calculations
PR-SG-2026-09    Calculation #8    Blocked
PR-MY-2026-09    Calculation #5    Approved
PR-MFG-2026-09   Calculation #4    Blocked
PR-VN-2026-09    Calculation #6    Review
Afenda Feed Vietnam   no calculation for September 2026
```

References link to their run workspace. The entity with no calculation is listed and claims nothing.

A measure toggle in the header switches between employer cost, net pay and gross pay without closing
the drawer.

---

## 13. Wording

- Sentence case everywhere. One name per concept across the whole flow.
- "Included" and "ready" are different words for different facts and are never swapped.
- Empty states invite action: "No entity is blocked this period", never "No data".
- Absences are stated, not implied: "Afenda Feed Vietnam has no calculation for September 2026".
- Errors name the consequence: "No pay-date spot rate from VND to SGD for September 2026, so Afenda
  Vietnam is not included in this total".
- Never "N/A". Either an em dash with a nearby explanation, or a sentence.

---

## 14. Visual rules

- One dominant figure per page. Everything else quiet.
- Semantic tokens only. Categorical chart colours are for sets of peers, never for status.
- Status colour is always paired with a label; colour alone never carries meaning.
- Money is right-aligned with tabular numerals. Local amounts sit beneath reporting amounts, smaller
  and muted.
- Tinted surfaces are budgeted: state badges, the hero's tiles, the coverage warning, chart series.
  No tinted card backgrounds.
- Before shipping, remove one thing.

---

## 15. Responsive and accessible

- Down to 390 wide. The matrix scrolls horizontally inside its own container; the page never does.
- The bottom drawer takes most of the viewport height on a phone and scrolls internally, with its
  footer pinned.
- Every selector has a visible label and a keyboard-reachable trigger.
- Sortable columns expose their sort state to assistive technology.
- Every chart carries a text alternative stating the same figures, because someone signing off a
  payroll needs the numbers, not the shape.
- Focus rings are never removed, and a focused control is never hidden behind the sticky header.
- Closing the drawer by keyboard returns focus to the exact figure that opened it.

---

## 16. Acceptance checks

The surface is done when all of these hold.

1. Every consolidated amount equals its entity composition exactly.
2. An excluded entity contributes nothing to cost, headcount or any denominator.
3. A blocked entity may be included but is never counted as ready.
4. An awaiting-data entity never renders a zero amount in any currency.
5. Changing reporting currency changes denomination only, never a local source value.
6. Changing FX basis changes the reporting total and FX movement, never local payroll.
7. Explaining a dimension subtotal reconciles exactly to the headline measure.
8. A mixed-currency footer never shows a raw sum.
9. Coverage is legible at 1280 wide without hovering.
10. The drawer's bridge arithmetic adds up to the cent, on every measure.
11. Every state, coverage value and empty state has been seen on screen, not only in code.
12. Keyboard alone can reach every figure, open its explanation, and return.
13. Freshness names the newest **included** calculation, and never moves merely because the page was
    reloaded.
14. Provisional is stated in money as well as count, and an entity that is included but unapproved is
    never presented as final.
15. Drilling from group to entity and returning restores the exact view that was left: period,
    currency, basis, dimension and comparison.
16. A return path pointing anywhere but the payroll routes is discarded, and the fallback is used.

---

## 17. Keep this pattern

Two documents per flagship surface, one UX and one engineering, with the UX document winning on
anything the user can see. It is the strongest anti-drift mechanism available here, because it stops
a single file from quietly trading a product decision for an implementation convenience.

The surfaces still to come each get the same pair: the Statutory Pack Center, Report Studio, Payment
Control, and My Pay.
