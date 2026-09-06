---
name: xforge-design-system
description: Enforce this repo's design system when building or changing any UI. Use when creating or editing a page, view, dashboard, card, table, form or component under src/app or src/views; when picking colours, spacing or typography; when adding a component to src/components/ui; or when reviewing UI for consistency. Also use when asked to audit design drift, or when a change "looks off" compared with the rest of the app.
---

# xForge design system

The system is shadcn/ui (`style: base-vega`) on Tailwind 4, with tokens as CSS variables in
`src/app/globals.css` and 50 primitives in `src/components/ui`.

Most design drift in this repo is not someone inventing a new look. It is someone rebuilding
something the system already provides, slightly differently. The rules below exist because that
has already happened, at the counts shown.

## Discovery first — before writing any UI

Never start from a blank component. In order:

1. **Read the tokens.** `src/app/globals.css` holds the whole vocabulary. There is one `@theme`
   block; everything visual should resolve to a name in it.
2. **List the primitives.** `ls src/components/ui` — 50 of them. Check before building anything
   that looks like a button, input, table, card, badge, dialog, popover or chart.
3. **Find the nearest precedent.** Another view has almost certainly solved this shape already.
   Match it rather than inventing a second pattern.

Only after all three come up empty is new construction the right answer.

## Reuse decision

| Situation | Do this |
|---|---|
| A primitive in `src/components/ui` fits | Use it directly |
| A primitive fits but needs different props | Wrap it in a view component; do not fork it |
| Two or three primitives compose into it | Compose in `src/views/...`, keep `ui/` untouched |
| Genuinely new and reusable | Add to `src/components/ui` following the existing file's shape |
| Genuinely new and single-use | Keep it in `src/views/...` |

`src/components/ui` is generated-adjacent — it tracks upstream shadcn. Prefer wrapping over editing.

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

**Current state: zero.** All 59 inherited palette usages were converted; the audit below should
stay at zero. A light/dark pair collapses to one token — `text-green-600 dark:text-green-400`
became `text-success`, because the token is already theme-aware and the pair only ever hand-rolled
what the token does for free.

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
  <CardTitle className='text-lg font-semibold'>Run history</CardTitle>
  <CardDescription>7 runs</CardDescription>
  <CardAction><Badge>4 open</Badge></CardAction>
</CardHeader>
```

**Current state: zero faked titles.** Every card header uses the primitives, and the check below
should stay at zero.

The action goes in `CardAction`, and the layout classes come off `CardHeader` — `flex
justify-between` existed only to force the two-column row the grid produces by itself once a
card-action slot is present.

## Other primitives

- `<Button>` not `<button>`; `<Input>`/`<InputGroup>` not `<input>`. A raw `<button>` gets none of
  the app's focus ring, which is visible the moment it sits beside a real `Button`.
- **Exception: fixed visual conventions.** A few things are deliberately not themeable and stay on
  literal colours: `src/assets/svg/logo.tsx` (brand gradient), the `yellow` variant in
  `components/ui/rating.tsx` (gold stars are the star metaphor, not a status), and the default
  colour props of the canvas effects `bg-silk.tsx` / `background-ripple.tsx` (a canvas cannot read a
  Tailwind class). Each is a convention that must survive a theme change, which is the opposite of
  what a token is for.
- **Exception: hidden file inputs.** A native file picker cannot be styled, so the pattern is a
  hidden `<input type='file'>` clicked programmatically by a `Button`, or one owned by a library
  through `getInputProps`. Those five stay raw — wrapping them in `<Input>` would style an element
  nobody sees and break the library's prop spreading.
- Tables that sort, filter or paginate use TanStack Table following
  `src/views/datatables/datatable-invoice.tsx`, including its
  `// eslint-disable-next-line react-hooks/incompatible-library` on `useReactTable`.
- Charts use `ChartContainer` + `ChartConfig` from `src/components/ui/chart`, with series colours as
  `var(--chart-N)`.

## Server components and hydration

Prefer server components. Two established traps, both already documented in the code:

- **Never format money or dates with `Intl` in a server-rendered component.** Node and the browser
  ship different ICU versions and disagree on spacing and negatives, which is a hydration mismatch.
  Use `src/utils/money.ts`.
- **Never read the clock inside a component.** Read it once in the page and pass the result down as
  a value. See `src/app/(pages)/dashboard/payroll/page.tsx`.

Reach for a client component only when you need state or an event handler. A sparkline or a static
chart does not — see `payroll-stat-card.tsx`, which draws SVG directly to stay on the server.

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
- Pointer targets are **24×24 CSS px** minimum (WCAG 2.2 AA). This is the *web* figure — 44pt/48dp
  is the native-app rule and does not apply here. `Button size='icon'` is `size-9` (36px), fine.
- **Focus must not be obscured** (WCAG 2.2 AA). The app has a sticky header and fixed sidebar; check
  that a keyboard-focused control in a long page is not hidden behind them.
- Focus indicators are **≥2px and ≥3:1** against the adjacent colour. This is stricter than WCAG AA
  requires (it is the AAA Focus Appearance criterion) and is a house rule — visible alone is not
  enough.
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
  `none` on other sortable columns). A chevron is invisible to a screen reader. All six sortable
  tables use the shared `ariaSortFor` helper in `src/utils/table-utils.ts` — do not inline a copy.
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
- Tooltips must be reachable without hover — hover-only tooltips exclude keyboard users.
- Match chart type to data: trend → line, comparison → bar, proportion → pie (and never pie beyond
  five categories).

The primitives in `src/components/ui` are built on **Base UI** (25 files). Dialog, Popover, Select
and friends already handle focus trapping, escape, and ARIA wiring. Use them rather than hand-rolling
focus management — a hand-rolled trap is nearly always worse than the primitive's.

Spend boldness in one place. If a view has a striking element, everything around it stays quiet.
Before shipping, remove one thing.

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

These are the checks behind the counts above. Run them before claiming a UI change is consistent.
A check that has never been seen failing is decoration — run a new check against the offending code
first, watch it go red, then fix.

```bash
# palette colours that should be semantic tokens (target: 0 in files you touched)
grep -rnE "\b(bg|text|border)-(red|green|blue|yellow|orange|purple|pink|gray|slate|zinc|sky|emerald)-[0-9]{2,3}" src/views src/app src/components/shared --include=*.tsx

# hardcoded hex
grep -rnE "#[0-9a-fA-F]{6}\b" src/views src/app src/components/shared --include=*.tsx

# card headers faking a title instead of using CardTitle.
# Must look INSIDE the header: a file-level grep counts a metric value in CardContent as a title,
# which is how this check once reported 29 files when 17 were affected.
python - <<'EOF'
import io, os, re
H = re.compile(r'<CardHeader[^>]*>(.*?)</CardHeader>', re.S)
A = re.compile(r'<CardAction[^>]*>.*?</CardAction>', re.S)
T = re.compile(r"<span className='text-lg font-semibold'>")
for d, _, fs in os.walk('src'):
    for f in fs:
        if not f.endswith('.tsx'): continue
        p = os.path.join(d, f)
        for m in H.finditer(io.open(p, encoding='utf-8').read()):
            if T.search(A.sub('', m.group(1))): print(p)
EOF

# raw elements where a primitive exists. Exclude hidden and library-owned file inputs — see the
# exception below; without the filter this reports 6 and 5 of them are correct.
grep -rnE "<(button|input)[ >]" src/views src/app src/components/shared --include=*.tsx | grep -vE "type='file'|getInputProps"
```

Then the real gates:

```bash
pnpm check-types && pnpm lint && pnpm build
```

There is no test framework in this repo, so those three plus looking at the page are the whole
verification story.

## Anti-patterns

- Building a card header out of spans because it is faster than importing three primitives.
- Reaching for `text-green-600` because there is no `success` token — use `chart-2`.
- Editing `src/components/ui/*` to change one usage instead of wrapping it.
- Copying a pattern from the sibling repos (`afenda-xForge-v5`, `v4`, `afeda-Xforge`). They use
  Biome + ultracite and different conventions; this repo is ESLint + Prettier.
- Adding a client boundary for something that renders fine on the server.
- Declaring a UI change consistent without running the audit greps above.

## Reference

`references/figma-methodology.md` — the discovery-and-reuse workflow this skill is modelled on,
extracted from Figma's official design-system skills. Read it when extending this skill or when
setting up a Figma library that has to stay in step with this code.
