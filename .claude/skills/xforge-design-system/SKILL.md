---
name: xforge-design-system
description: "PREFLIGHT THIS BEFORE ANY UI WORK IN THIS REPO — it is the only design gate here, and skipping it is how the same bugs keep recurring. Use when creating or editing any page, view, dashboard, card, table, chart, form or component under src/app or src/views; when choosing colours, semantic tokens, spacing, radius or typography; when adding to src/components/ui or composing Base UI and shadcn primitives; when working on accessibility, ARIA, contrast, focus rings, keyboard navigation, headings or dark mode; when screenshotting or measuring a page. Also use for DEBUGGING any UI or browser problem: a component that crashes or will not open, a menu, popover, dialog or Base UI primitive misbehaving, a hydration or streaming oddity, DOM queries returning duplicate or zero-sized nodes, browser automation that stops responding to clicks or keys, or an eslint/Prettier loop. Also use when auditing design drift, when a change \"looks off\" next to the rest of the app, and before claiming any UI change is verified or consistent."
---

# xForge design system

The system is shadcn/ui (`style: base-vega`) on Tailwind 4, with tokens as CSS variables in
`src/app/globals.css` and 53 primitives in `src/components/ui`.

**Counts last verified 2026-09-06.** Every number below is regenerable: the code counts
come from `scripts/audit.py`, the page measurements from `scripts/measure.js`. If a count
here disagrees with the script, the script is right and this file is stale.

Most design drift in this repo is not someone inventing a new look. It is someone rebuilding
something the system already provides, slightly differently. The rules below exist because that
has already happened, at the counts shown.

## Screen intent and archetype

Name the archetype before designing. These are not interchangeable, and most drift here is dashboard
habits applied to a screen that is not a dashboard.

| Archetype | The reader is | Leads with |
|---|---|---|
| Overview / dashboard | scanning, then drilling | one dominant figure, or what needs attention |
| Operational workbench | working a list, inspecting in place | the work and its filters, not a hero figure |
| Queue / inbox | triaging in order | what is unresolved, worst or oldest first |
| Record detail | reading one object | identity, state, and what can be done to it |
| Workflow / transaction | completing steps in order | position in the flow and what blocks it |
| Settings / configuration | finding one thing to change | navigable sections, not a summary |
| Analysis / report | comparing and reconciling | the comparison, at full precision |

Then write one sentence before any markup:

> The user is here to **____**. They must notice **____** first. The primary action is **____**.
> Everything else is supporting.

That sentence decides the layout. A 60px hero figure is right on `/payroll`, where one consolidated
number *is* the point, and wrong on a settings screen, where nothing is. **The measures in the next
section are diagnostics for the archetype you named, never targets to hit.**

## Look at the app before changing it

Reading code tells you what a page contains. It does not tell you what it looks like, and design
quality is not visible in an import list. A payroll dashboard was once built here that passed every
code check — distinct components, correct tokens, no repeated blocks — and still looked flat next to
its neighbours, because nobody had opened them.

Before building or judging a screen:

1. `preview_start` with the `afenda-xforge` config in `.claude/launch.json`. No preview
   tool in this session? `pnpm dev` and open the route; the point is a running page, not
   a particular tool.
2. **Screenshot two or three peer dashboards first**, not your own page. `/dashboard/ecommerce` and
   `/dashboard/sales` are the densest, and `/payroll` is the current high-water mark for an
   operational screen. This is the baseline; without it "looks fine" means nothing. Read it with the
   caveat in the first measure below: peers are a baseline, not automatically a standard to meet.
3. Screenshot the page you are changing, at the same viewport, **in both themes**, and put
   them side by side. The one colour disaster this file records looked fine in light and
   only broke in dark, so a single-theme pass would have shipped it.
4. Only then write code.

Measure what a screenshot cannot state precisely. These four caught real defects that code review
missed entirely:

- **Type scale of the largest number.** Only meaningful once you have named the archetype. An
  overview should lead with one dominant figure — `/dashboard/ecommerce` and `/payroll` both sit at
  60px. A workbench should not: `/payroll/runs/[runId]` tops out at 24px and is correct, because the
  work is the table. `/dashboard/sales` is also 24px and is *not* correct, because it is an overview
  with no focal point. Same number, opposite verdicts, decided by the archetype and nothing else.
- **Faces and imagery, when the rows are people.** Measured: ecommerce 24, sales 37. People listed by
  name with no avatar read as a spreadsheet. Does not apply when the rows are not people — `/payroll`
  lists companies and carries zero images, correctly.
- **Ink per card.** Share of the card actually covered by text or graphic, sampled by
  `scripts/measure.js`; `/payroll` runs 0.28–0.63 and below ~0.2 is mostly air. Charts score low
  legitimately. Never compute it by summing leaf rectangles — they overlap, and that version returned
  1.96 for a ratio whose ceiling is 1.
- **Tinted elements.** Backgrounds with real hue: ecommerce 5, `/payroll` 13, sales 19. A handful of
  status tints and icon chips is the whole budget. Near zero is flat; far above 20 means someone is
  colouring for decoration.

Screenshots verify; they do not design. Take the baseline **before** writing, not after — the whole
failure above was using the camera only to confirm work already finished.

### Taking the measurements

Run `scripts/measure.js` in `javascript_tool` on the page. It returns the four measures above plus
the heading counts, the radius/gap tallies, and a `renderedOk` guard.

**Run it in both themes.** The one colour disaster this file records was dark-mode-only and looked
fine in light, so a single-theme pass would not have caught the incident that justifies the rule.

**Check `renderedOk` before trusting a single number.** When it is false you measured a shell, not a
page, and every figure below it is fiction. In dev, Next streams the server HTML inside a
`<div hidden>` under `<body>` and promotes it on hydration; when hydration fails the content stays
in that hidden div, so nodes are queryable, `innerText` is nearly empty and every rect is 0x0.
Open a fresh tab, and if that still fails restart the dev server rather than reading the numbers.

## Discovery first — before writing any UI

Never start from a blank component. In order:

1. **Read the tokens.** `src/app/globals.css` holds the whole vocabulary. There is one `@theme`
   block; everything visual should resolve to a name in it.
2. **List the primitives.** `ls src/components/ui` — 53 of them, 27 of them on Base UI. Check before building anything
   that looks like a button, input, table, card, badge, dialog, popover or chart.
3. **Find the nearest precedent.** Another view has almost certainly solved this shape already.
   Match it rather than inventing a second pattern.

Only after all three come up empty is new construction the right answer.

## Reuse decision

One order, always, and stop at the first rung that holds:

**existing primitive → compose existing primitives → wrap an existing primitive → create new.**

| Situation | Do this |
|---|---|
| A primitive in `src/components/ui` fits | Use it directly |
| A primitive fits but needs different props | Wrap it in a view component; do not fork it |
| Two or three primitives compose into it | Compose in `src/views/...`, keep `ui/` untouched |
| Genuinely new and reusable | Add to `src/components/ui` following the existing file's shape |
| Genuinely new and single-use | Keep it in `src/views/...` |

`src/components/ui` is generated-adjacent — it tracks upstream shadcn. Prefer wrapping over editing.

**Create new only when what exists is incompatible in semantics, behaviour, accessibility or
token model.** An inconvenient API is not a reason to rebuild — it is the definition of a wrap.
Rebuilding because the props are named awkwardly is how a system ends up with two of everything,
and the second one never gets the accessibility work the first one already had.

## Visual composition

Judge hierarchy before decoration. A composed screen has a clear first, second and third level of
attention. An assembled one has ten things at the same weight.

- **Spend emphasis once.** If a view has a striking element, everything around it stays quiet. Two
  competing focal points read the same as none.
- **Cards group things that belong together.** A card is not the default container for every block,
  and a card inside a card needs the hierarchy to genuinely be two levels deep — usually a heading, a
  separator or whitespace does that job without the extra frame.
- **Reach for alignment, type weight, whitespace and grouping before a border, background, chip, icon
  or shadow.** Most of "this looks off" is spacing and alignment, not missing decoration.
- **Colour carries semantic state, category, selection, focus, or one deliberate emphasis.** Nothing
  else. Never add a tint to move a measurement: a page that scores well because someone added tints
  is worse than the flat page it replaced, and the measure has then been destroyed as a signal.
- Before shipping, take one non-essential element out and see whether anything was actually lost.

## Spacing, radius and type

Spacing is the largest single source of "this looks off" and it is invisible in a diff. Everything
resolves to a step on Tailwind's 4px scale from the one `@theme` block, and **an arbitrary value is
always wrong** — `p-[13px]`, `gap-[18px]`. If no step fits, the layout is wrong, not the scale.

Two rules matter more than the exact steps. **The same relationship takes the same step everywhere**,
because card gaps of 24px in one grid and 20px in the next read as broken even though neither value
is wrong. And **space is a claim of grouping**: if two things sit closer to each other than to
anything else you have said they belong together, so check that before reaching for a border to say
it instead.

Radius comes from `--radius` and its derivatives, never a literal, and nested corners want the inner
radius smaller than the outer. Type hierarchy comes from position, weight and space before size —
`font-normal` to `font-medium` separates two levels without spending a step on the ramp. Never
shrink type to make content fit: cut it, disclose it, or give it its own surface.

**Budgets, measured on `/payroll`:** at most 8 distinct `radii` and 8 distinct `gaps` per page.

The step table, radius tiers and the type ramp are in `references/scales-and-surfaces.md`.

## Colour: semantic tokens only

**Never use Tailwind palette colours** (`text-green-600`, `bg-sky-500`, `border-slate-200`) or hex
values in `src/views` or `src/app`. They ignore the theme, so they do not move when the theme does.

| Meaning | Token |
|---|---|
| Good / positive / approved | `success` |
| Warning / pending / attention | `warning` |
| Informational / connected / neutral-blue | `info` |
| Bad / error / blocking | `destructive` |
| Secondary text, inert state | `muted-foreground` |
| Categories in a set — file types, chart series | `chart-1` … `chart-5` |

**`chart-1`…`chart-5` are a categorical palette, not semantic colours.** Their job is to be
distinguishable from each other inside one chart, and their hues legitimately differ between light
and dark. Using them for status once put `chart-5` (warning) at ΔE 20 from `destructive` in dark
mode, so a Warning and a Blocking exception were the same colour — while looking fine in light.
Use them for sets of peers; never to mean something.

Note `--primary` in this theme is monochrome (near-black in light, near-white in dark). It is not a
hue and cannot stand in for a status colour.

Soft badges and icon chips use a tint of the token, not the solid colour:
`bg-destructive/10 text-destructive`, `bg-success/15 text-success`.

Status colours are decided once, in `PAY_RUN_STATUS_STYLES` (`src/utils/payroll-metrics.ts`) for
pay runs. A component renders the status; it does not re-decide the colour.

**Current state: zero named ramps, 16 `white`/`black` remaining.** All 59 inherited ramp usages
were converted. The 16 are `bg-black` scrims and `text-white` in inherited template views, found
only when the check was widened -- `white` and `black` ignore the theme exactly as much as
`slate-200` does, and the earlier "zero" was the check being too narrow rather than the tree being
clean. Budgeted as inherited debt in `scripts/audit.py`, not as permission. A light/dark pair collapses to one token — `text-green-600 dark:text-green-400`
became `text-success`, because the token is already theme-aware and the pair only ever hand-rolled
what the token does for free.

## Elevation and surface

One elevation model. Mixing two is a drift signature that survives review because each card looks
fine on its own. **Border is the default separator; shadow means the surface genuinely floats above
the page.** A resting card takes a border or a shadow, never both — both is how a shadcn page starts
to look like a template.

Shadow is never the only signal that something is interactive, and **shadows barely read in dark
mode**, so a component that separates by shadow alone disappears in one theme and not the other.
That is the same class of bug as the `chart-5` incident: fine in light, broken in dark, invisible
unless you screenshot both.

Tiers are in `references/scales-and-surfaces.md`.

## Cards: use the primitives, not lookalikes

`CardHeader` is a CSS grid whose layout is driven by `data-slot` attributes:

- `has-data-[slot=card-description]:grid-rows-[auto_auto]`
- `has-data-[slot=card-action]:grid-cols-[1fr_auto]`

A hand-rolled `<span className='text-lg font-semibold'>` title emits no slot, so those rules never
fire and the header has to be forced with `flex justify-between`. It looks right today only because
`--font-heading` currently aliases `--font-sans`. The moment anyone sets a real heading font or
changes card spacing, every file using the primitives moves and every file faking them does not.

```tsx
// Wrong — no data-slot, grid never engages
<CardHeader className='flex items-center justify-between'>
  <span className='text-lg font-semibold'>Run history</span>
  <Badge>4 open</Badge>
</CardHeader>

// Right — the grid places these itself
<CardHeader>
  <CardTitle>Run history</CardTitle>
  <CardDescription>7 runs</CardDescription>
  <CardAction><Badge>4 open</Badge></CardAction>
</CardHeader>
```

**Current state: zero faked titles.** Every card header uses the primitives, and the check below
should stay at zero.

### A card title is not a heading until you say so

`CardTitle` renders a `<div>`. That is upstream shadcn's choice and it is defensible, because a card
is not always a section of the document. But when a card **is** a section of the page — and on these
dashboards it almost always is — its title has to join the document outline. `CardTitle` spreads its
props, so this needs no change to `ui/`:

```tsx
// Renders a div. Invisible to "next heading" navigation.
<CardTitle>Can the group pay?</CardTitle>

// Joins the outline.
<CardTitle role='heading' aria-level={2}>Can the group pay?</CardTitle>
```

Take the level from the page, not from the component: the page `<h1>` is level 1, a top-level card
section is 2, a card nested inside one is 3.

**Current state: 0 of 83 card titles carry heading semantics, across 68 files.** Measured
consequence: `/payroll` renders one heading for six card sections, and `/dashboard/ecommerce` and
`/dashboard/sales` render none at all, so a screen-reader user has no way to skip between sections
on any of the three. This is inherited and the raw-elements rule applies unchanged — do not
bulk-convert 68 files, add the two attributes to the cards on a page you are already changing. The
check below counts what is left.

The action goes in `CardAction`, and the layout classes come off `CardHeader` — `flex
justify-between` existed only to force the two-column row the grid produces by itself once a
card-action slot is present.

## Other primitives

- `<Button>` not `<button>`; `<Input>`/`<InputGroup>` not `<input>`. A raw `<button>` gets none of
  the app's focus ring, which is visible the moment it sits beside a real `Button`.
- **A control that navigates uses `render`, never nesting.** Wrapping a `Button` in a `Link` puts an
  `<a>` inside a `<button>`: invalid HTML, and one control that takes two tab stops. Base UI's
  `render` prop replaces the rendered element instead, and `nativeButton={false}` is what tells it
  the element is no longer a real button so it supplies the role and keyboard behaviour an anchor
  does not have for free.

  ```tsx
  // Wrong — an anchor inside a button
  <Link href='/payroll/runs'><Button>All runs</Button></Link>

  // Right — the Button *is* the link
  <Button render={<Link href='/payroll/runs' />} nativeButton={false}>All runs</Button>
  ```

  **Current state: zero nested pairs**, against 143 `render={<…>}` call sites, 34 of them passing
  `nativeButton`. The check below should keep it at zero.
- **Exception: fixed visual conventions.** A few things are deliberately not themeable and stay on
  literal colours: `src/assets/svg/logo.tsx` (brand gradient), the `yellow` variant in
  `components/ui/rating.tsx` (gold stars are the star metaphor, not a status), and the default
  colour props of the canvas effects `bg-silk.tsx` / `background-ripple.tsx` (a canvas cannot read a
  Tailwind class). Each is a convention that must survive a theme change, which is the opposite of
  what a token is for.
- **Current state: 25 in 18 files, all inherited** — counted by the repaired check below, which
  replaced a `grep -P` one-liner that never ran in this shell and so reported a clean tree the whole
  time. Every one is in an AdminCN template view — `apps/mail`,
  `apps/chat`, `apps/contact`, `pages/user-settings`, `apps/calendar`. The payroll module is at
  zero and should stay there. Do not bulk-convert the template views: that is a redraw, not an
  edit, and the diff would be unreviewable. Convert one when you are already changing it.
- **Exception: hidden file inputs.** A native file picker cannot be styled, so the pattern is a
  hidden `<input type='file'>` clicked programmatically by a `Button`, or one owned by a library
  through `getInputProps`. Those five stay raw — wrapping them in `<Input>` would style an element
  nobody sees and break the library's prop spreading.
- Tables that sort, filter or paginate use TanStack Table following
  `src/views/datatables/datatable-invoice.tsx`. That file carries
  `// eslint-disable-next-line react-hooks/incompatible-library` on `useReactTable`, but do not copy
  the suppression in by reflex: add it only when lint actually reports the rule on your call, and
  keep the one-line reason next to it. A suppression pasted ahead of the error hides the next real
  one.
- Charts use `ChartContainer` + `ChartConfig` from `src/components/ui/chart`, with series colours as
  `var(--chart-N)`.

## Base UI underneath

27 of the primitives in `src/components/ui` are built on **Base UI** (`@base-ui/react`, currently
1.6.0). Dialog, Popover, Select and friends already handle focus trapping, escape and ARIA wiring.
Use them rather than hand-rolling focus management — a hand-rolled trap is nearly always worse than
the primitive's.

Three of its conventions show up constantly here, and getting them wrong is the usual way a new
component drifts:

- **State arrives as data attributes, not props you thread through.** Style off `data-open`,
  `data-closed`, `data-checked`, `data-active`, `data-invalid`, `data-highlighted` and their
  siblings, the way every primitive already does. Do not mirror open/checked state into React state
  so you can branch on it — the attribute is already there and is always correct.
- **`render` replaces the element**, which is what the navigation rule above is built on. It is also
  how a trigger borrows a `Button`: `<DropdownMenuTrigger render={<Button variant='ghost' />}>`.
- **A new primitive that needs its own `render` prop composes `useRender` with `mergeProps`.** See
  `badge.tsx`. Five files do this; none hand-roll the prop merging, because merging by hand drops
  the event handlers Base UI needs to keep working.

For the API itself — which parts a component has, what a given data attribute is called, what a hook
returns — reach for the installed `base-ui` skill instead of guessing or reading `node_modules`. For the
handful of Base UI facts that have already cost this repo a crash or a dead keyboard path — the
`Menu.Group` ancestor requirement, `indeterminate`, the missing `initialFocus`, portalled menu items
bubbling to the row underneath — read `references/debugging.md` first; it is shorter and specific. Two
caveats. It tracks upstream and is currently written at 1.8.0, so treat anything it marks as 1.7.0
or later as unavailable until `@base-ui/react` is upgraded here. And it is an API reference, not a
design authority: where it and this file disagree about how something should look or compose, this
file wins.

## Interaction surface selection

Match the surface to the size of the task, not to the amount you have to show. The full matrix —
Tooltip, Popover, DropdownMenu, Sheet, Dialog, AlertDialog, full page — is in
`references/scales-and-surfaces.md`.

**Prefer contextual continuation.** When someone picks one row out of a table and the next task can
finish without losing the filters, sort and scroll they built to get there, a Sheet beats navigating
away. Throwing that state away is the most common reason a workbench becomes tiring to use.

**But do not let a Sheet become a small application.** Promote it to a full page once it needs nested
navigation, more than one substantial table, extended editing, or a URL someone will send to a
colleague. The payroll employee inspector went from a side panel to a full-width drill-down for
exactly that reason.

## Action hierarchy

One visually dominant action per action region, and a page header, a toolbar, a card footer and a
dialog footer are each their own region. Everything else steps down: secondary as `outline`, quiet as
`ghost`, the rest behind an overflow menu.

**A destructive action never sits at equal weight beside the primary one.** Put it in the overflow,
or give it `variant='destructive'` only inside the confirmation where destroying *is* the primary
action. Equal weight side by side is how someone cancels a pay run they meant to approve.

## Server components and hydration

Prefer server components. Two established traps, both already documented in the code:

- **Never format money or dates with `Intl` in a server-rendered component.** Node and the browser
  ship different ICU versions and disagree on spacing and negatives, which is a hydration mismatch.
  Money goes through `src/utils/money.ts` (`formatMoney`, `formatMoneyCompact`, `formatMajorUnits`,
  `currencySymbol`). Dates go through `src/utils/payroll-workspace.ts` (`formatDate` for a calendar
  date, `formatInstant` for a timestamp, `formatPeriod` for a range) — hand-rolled for exactly the
  same reason, so do not reach for `Intl.DateTimeFormat` or `toLocaleDateString` because the money
  rule only named money. Those three currently sit in a payroll util because payroll is the only
  caller; the moment a second module needs them, move them to a shared `src/utils/date.ts` rather
  than importing payroll from elsewhere or writing a second copy.
- **Never read the clock inside a component.** Read it once in the page and pass the result down as
  a value. See `src/app/(pages)/dashboard/payroll/page.tsx`.

Reach for a client component only when you need state or an event handler. A sparkline or a static
chart does not — see `payroll-stat-card.tsx`, which draws SVG directly to stay on the server.

## Loading and pending states

Empty and error states are covered under *Data display*. Loading is the third, and on a
server-component app the boundary placement is a design decision, not a technical one.

- **Route transition** — `loading.tsx` renders the page shell: header, section frames, skeletons
  where content will land. The reader should recognise the page before the data arrives.
- **Streaming** — a `<Suspense>` boundary around the slow part, not the whole page. One boundary
  around everything throws away the reason to be on the server: the fast half waits for the slow.
- **Action pending** — the control that was pressed holds the state, keeps its width, disables, and
  sets `aria-busy`. Never move the layout because a button is thinking.

**A skeleton matches the geometry it replaces** — same height, same columns, same row count. The
wrong shape trades a spinner for a layout shift, which is worse, because the reader has already
started reading. No spinner where the layout is known. Nothing at all under ~200ms, since a skeleton
that appears and vanishes reads as a glitch.

**A pending figure is not a partial figure.** *Partial is a state* covers a total missing a company;
loading is a total that is not there yet. They must not look alike, and the caveat must never render
before the number it qualifies — a figure that looks complete for 300ms has already been read.

## Interface writing

Words are design material, not decoration. On an ERP product this is most of what "polished"
actually means — more than colour or spacing.

- **Name things by what people control, not by how the system is built.** A person manages
  notifications, not webhook config; a pay run, not a `PayRun` record.
- **One action keeps one name through the whole flow.** The button that says Approve produces a
  toast that says Approved and a status that reads Approved. Two words for one thing reads as two
  things — that is why the run status card says "Approval" in both its badge and its track.
- **Errors do not apologise and are never vague.** Say what happened and what to do about it, in the
  interface's voice. "Yuki Tanaka has no bank account on file — payment cannot be issued" is right;
  "Something went wrong" is not.
- **An empty state is an invitation to act**, not a shrug. "Nothing outstanding on this run" beats
  "No data".
- **Each element does exactly one job.** A label labels, an example demonstrates. Nothing quietly
  does double duty.
- Active voice, sentence case, plain verbs, no filler. Specific beats clever.

## Quality floor

Not negotiable, and not a separate "accessibility pass" — a change is not done without these.

- Responsive down to mobile.
- **Visible keyboard focus.** Never remove a focus ring without replacing it.
- `prefers-reduced-motion` respected by anything that animates.
- Contrast meets WCAG AA: **4.5:1** for normal text, **3:1** for large text and UI boundaries.
- Pointer targets are **24×24 CSS px** minimum. Treat that as a house rule, not a transcription:
  WCAG 2.5.8 (AA) sets 24×24 but exempts targets that have 24px of spacing around them, ones with an
  equivalent control elsewhere on the page, inline targets inside a sentence, targets styled by the
  user agent, and targets where the size is essential. We do not take those exemptions, because
  arguing one costs longer than meeting the size. 44pt/48dp is the native-app figure and does not
  apply here. `Button size='icon'` is `size-9` (36px), fine.
- **Focus must not be obscured** (WCAG 2.2 AA). The app has a sticky header and fixed sidebar; check
  that a keyboard-focused control in a long page is not hidden behind them.
- Focus indicators are **≥2px thick and ≥3:1** against the adjacent colour. This is a house rule that
  is *informed by* WCAG 2.4.13 Focus Appearance (AAA), not a transcription of it: that criterion is
  written in terms of a minimum area and a 3:1 contrast between the focused and unfocused states of
  the indicator, with its own exceptions. Ours is the simpler shape-and-contrast test, deliberately,
  because it is checkable by eye. Visible alone is not enough either way.
- Every component states its role, accessible name, and applicable state (selected / pressed /
  expanded / sorted). Accessibility does not scale down with project size; it is the one area with
  no "small project" exemption.
- Any drag interaction needs a single-pointer and keyboard alternative (WCAG 2.2 AA).
- Interactive rows and cards need a real focusable control, not just an `onClick` on the container.
  See `payroll-run-history.tsx`: the row click is mouse convenience, the `<Link>` in the reference
  cell is the actual affordance.

## Data display

This is a data-dense product, so these carry more weight here than generic UI advice.

- **Sortable tables need `aria-sort`** on the active column header (`ascending` / `descending`,
  `none` on other sortable columns). A chevron is invisible to a screen reader. All 11 sortable
  tables use the shared `ariaSortFor` helper in `src/utils/table-utils.ts` — do not inline a
  copy. Regenerate with `grep -rl ariaSortFor src --include=*.tsx | wc -l`.
- **A chart is not screen-reader accessible on its own.** Give it a text alternative — either an
  `aria-label` summarising the insight, or the same figures rendered as text nearby.
  `payroll-run-status.tsx` does the latter deliberately: the gross-to-net bridge chart's numbers also
  appear as exact amounts, because someone signing off a pay run needs the cents.
- **Show a legend whenever a chart has more than one series.** Two series with no key is a puzzle.
- Never rely on colour alone to carry meaning — pair it with a label, icon or shape. This is also why
  the stat cards show a direction arrow *and* a tone colour.
- Data marks need ≥3:1 against the background; data labels ≥4.5:1. Grid lines stay low-contrast so
  they do not compete with the data.
- Empty and error states are designed, not blank: "No runs match" with the query echoed, not an empty
  axis frame.
- **Partial is a state, and it is the one that gets skipped.** A figure aggregated from sources where
  one is missing is not a number with a caveat, it is a different number. Say so next to the figure,
  name what is missing, link to it, and never let the total imply completeness. `/payroll` is the
  worked example: the 60px group total carries "4 of 5 entities included · awaiting data: Afenda Feed
  Vietnam · current group total is incomplete" in a `role='status'` beside it, the movement breakdown
  says the two periods "do not cover the same companies, so this is not a like-for-like movement",
  and the funding table refuses to sum three currencies into one reassuring number. The failure this
  prevents is silent and expensive: a total that omits a company, shown as if it did not.
- Tooltips must be reachable without hover — hover-only tooltips exclude keyboard users.
- **The page never scrolls sideways.** `measure.js` returns `scrollsSideways`; `true` is a defect at
  every breakpoint. A wide table scrolls *inside its own container*, and that container has a visible
  edge so the reader knows there is more.
- **The identity column stays put** when a table scrolls horizontally. A scrolled table where every
  visible column is a number and none is a name is unreadable.
- **Column priority is declared, not emergent:** identity, status, the figure the question is about,
  then the rest. The tail hides first when width runs out. Decide this when you build the table;
  at 768px there is no good default.
- **Row height is a budget.** An avatar, a badge, a two-line cell and a row action each cost height,
  and height is how many rows fit — which is the actual job of a workbench.
- **A unit is never implied.** Say the currency and the basis next to the figure, especially where
  more than one is on screen: `/payroll` shows each company in its own currency beneath the reported
  one, and refuses to add three currencies into a single total.
- **Identifiers are quieter than names.** A person or company reads first; `EMP-0142`, a run
  reference or a bank reference sits underneath in `text-xs text-muted-foreground`, often
  `font-mono`. Reverse that and every row looks like a database dump.
- **A table is for scanning first.** Column order follows the question being asked, numbers sit
  right, labels sit left, and anything decorative earns its place against the row height it costs.
- **Every figure that sits in a column gets `tabular-nums`.** Proportional digits are
  different widths, so a money column jitters and a total stops lining up under the numbers
  it sums — on a payroll product that reads as a bug in the arithmetic. This is already the
  practice (177 usages across 58 files) but it lives per call site, not in the theme, so it
  is one forgotten class away from drifting. Pair it with right alignment for numbers; text
  stays left, dates stay left.
- Match chart type to data: trend → line, comparison → bar, proportion → **bar or 100% stacked bar**.
  Pie and donut are the exception here, not the default for proportion: this is an ERP, the reader is
  comparing and reconciling magnitudes rather than gesturing at a split, and angles are much harder
  to compare than lengths. Reach for a pie only when the point genuinely is part-of-whole, the
  categories are at most five, and nobody needs to rank the slices. `/payroll` shows the shape to
  copy — country share is a table with a percentage column, not a pie.

## React 19 in this repo

`useEffect` appears 65 times in `src`, and it is the most reliable source of subtle UI bugs. Two
checks before adding another:

```tsx
// Wrong — derived state in an effect (extra render, can desync)
const [total, setTotal] = useState(0)
useEffect(() => { setTotal(gross - deductions) }, [gross, deductions])

// Right — compute during render
const total = gross - deductions
```

```tsx
// Wrong — event logic in an effect, fires on any dependency change
useEffect(() => { if (run.approved) toast('Approved') }, [run])

// Right — event logic in the handler that caused it
const handleApprove = async () => { await approve(run); toast('Approved') }
```

Mutating state in place (`items.push(x); setItems(items)`) does not re-render, and matters more here
because the React Compiler is on — see the `incompatible-library` opt-out in the datatables.

## Changing the system itself

Building a screen and changing the system are different jobs. The second one is where drift comes
from, so it has its own discipline.

- **Edit, do not redraw.** Make the minimal in-place change: the token or component in scope, plus
  whatever must follow. Leave everything else byte-for-byte alone. Do not re-tier tokens, rename
  unrelated things, or tidy the palette "while you're here" — that is how a one-line fix becomes an
  unreviewable diff.
- **Scope the ripple, not just the edit.** Renaming a semantic token orphans every component
  referencing it. The alias layer is what contains the blast radius: re-pointing
  `chart-2 → success` is usually cheaper and safer than changing what every call site names.
- **Deprecate before removing.** Keep the old name working alongside the new one, then remove it in
  a later pass. Never a silent rename.
- **One term per concept, everywhere.** If the status is "Approval" in the badge, it is "Approval"
  in the track. Two words for one thing reads as two things.
- **One vocabulary across the component API.** If it is `variant` on one component it is not `type`
  or `mode` on the next.
- **After fixing something, ask what else holds a copy of that fact.** The status labels lived in two
  maps that agreed until they didn't, and a finished run rendered a lowercase "closed". That failure
  mode is the reason this rule exists.

What this repo deliberately does **not** need yet: semver on the design system, a changelog, a
deprecation policy, an ADR folder. Those become worthwhile at more than one consumer or a versioned
external release. Until then they are ceremony — a decision worth keeping is a comment beside the
code it governs, or a section in this file.

When a general reference and this file disagree, **this file wins**. If you reject a pattern, record
it with the condition that would reverse the decision, so the next person recognises the trigger
instead of re-arguing it.

## Audit

```bash
python .claude/skills/xforge-design-system/scripts/audit.py     # add -v to list every hit
pnpm check-types && pnpm lint && pnpm build                      # the real gates
```

`scripts/audit.py` holds every check behind the counts in this file, with the reasoning for each
regex beside it. It exits non-zero when a count is above its budget, so it is a gate rather than a
ritual, and there is no test framework here to do that job instead.

Budgets are a **ratchet**. Zero stays zero; inherited debt is budgeted at today's count so it can
only go down. When you clear something, lower its budget in the same commit, or the next person
inherits your slack. The script prints `DOWN` when a count has improved and the budget is stale.

Scope is `src/views`, `src/app`, `src/components/shared` for every check, so all the counts in this
file are comparable. `src/components/ui` is out of scope deliberately: it tracks upstream shadcn, so
a palette colour or raw `<button>` there is upstream's decision, and rewriting it is exactly the
"edit, do not redraw" failure described above.

**A check that has never gone red is decoration.** Point a new one at code that should fail and
watch it fail before you trust it. Two checks in this file were fiction until that was done: a
`grep -P` one-liner that this shell cannot run at all reported a clean tree while 25 raw elements
sat in the template views, and a `\b` in a regex had been saved as a literal backspace.

## Anti-patterns

- Building a card header out of spans because it is faster than importing three primitives.
- Reaching for `text-green-600` for a positive state. There **is** a `success` token — use it. Never
  substitute a `chart-*` token for a status: that is the mistake the colour section documents, and
  saying it here as advice was this file contradicting itself. If a status genuinely has no token,
  add one rather than borrowing from the categorical palette.
- Editing `src/components/ui/*` to change one usage instead of wrapping it.
- Copying **code** from the sibling repos (`afenda-xForge-v5`, `v4`, `afeda-Xforge` — that
  last one is spelled that way on disk, it is not a typo to fix). They use Biome + ultracite
  and different conventions; this repo is ESLint + Prettier. Borrowing *judgement* from them
  is fine and is what `references/figma-methodology.md` does; borrowing code is not.
- Adding a client boundary for something that renders fine on the server.
- Wrapping a `Button` in a `Link` to make it navigate, instead of `render` + `nativeButton={false}`.
- Mirroring a Base UI open/checked state into React state to branch on, when `data-open` /
  `data-checked` is already on the element.
- Declaring a UI change consistent without running the audit greps above.

## Reference

`references/debugging.md` — read before diagnosing any UI bug, and before trusting a number you
measured in a browser. Covers the hidden streaming copy of the page that makes DOM counts lie, the
ways the browser automation degrades silently, the Base UI facts that have already bitten, and which
upstream skill owns which question.

`references/scales-and-surfaces.md` — the lookup tables: spacing steps, radius tiers, the type
ramp, elevation tiers and the interaction-surface matrix. Consult it while writing a component. The
decisions live in this file; that one holds the values.

`references/figma-methodology.md` — the discovery-and-reuse workflow this skill is modelled on,
extracted from Figma's official design-system skills. Read it when extending this skill or when
setting up a Figma library that has to stay in step with this code.

`scripts/audit.py` — the gate. `--selftest` proves every check still fires, `--strict` fails when a
count has improved and a budget is stale.

`scripts/measure.js` — the page probe. Returns the four archetype diagnostics plus contrast
failures, numbers missing `tabular-nums`, undersized pointer targets, the outline counts and the
radius/gap tallies. Run it in both themes.
