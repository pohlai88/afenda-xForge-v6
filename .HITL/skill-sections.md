# Draft sections for SKILL.md

Five sections written to close the gap where `measure.js` measures something SKILL.md never sets a
standard for. Insertion points below. Every `‹…›` is a value I could not read from here — fill it
from `src/app/globals.css` or from one `measure.js` run before you commit the section, because a
number invented in a document is exactly the drift this file exists to stop.

| Section                    | Goes after                      | Gates which measurement           |
| -------------------------- | ------------------------------- | --------------------------------- |
| Spacing and radius         | Visual composition              | `radii`, `gaps`                   |
| Type scale                 | Spacing and radius              | `largest`, `headings`, `h1`       |
| Elevation and surface      | Colour: semantic tokens only    | `tinted` (reads with it)          |
| Loading and pending states | Server components and hydration | none yet — see the note           |
| Density and overflow       | inside Data display             | `scrollsSideways`, `smallTargets` |

---

## Spacing and radius

Spacing is the largest single source of "this looks off", and it is invisible in a diff. The scale
is Tailwind's 4px base as declared in the one `@theme` block. Everything resolves to a step on it.

**Never an arbitrary value.** `p-[13px]`, `gap-[18px]`, `mt-[7px]` are all off-scale by definition.
If no step fits, the layout is wrong, not the scale.

Use tiers, not judgement per element. The tier is decided by the relationship, not by how it looks
in isolation:

| Relationship                                                                 | Step     | Typical     |
| ---------------------------------------------------------------------------- | -------- | ----------- |
| Inside one control — icon to its label, badge padding                        | `1`–`2`  | `gap-1.5`   |
| Between tightly related elements — label and its value, a stat and its delta | `2`–`3`  | `gap-2`     |
| Between groups inside a card — header to body, one field group to the next   | `4`–`6`  | `space-y-4` |
| Between cards in a grid                                                      | `4`–`6`  | `gap-6`     |
| Between page sections                                                        | `8`–`12` | `space-y-8` |

Two rules that matter more than the exact numbers:

- **The same relationship gets the same step everywhere.** A page where card gaps are 24px in one
  grid and 20px in the next reads as broken even though neither value is wrong.
- **Space groups things.** If two elements are closer to each other than to anything else, you have
  claimed they belong together. Check that claim is true before reaching for a border to say it.

**Radius** comes from `--radius` and its derivatives, never a literal. Three tiers is the whole
budget: ‹small — badges, inputs, chips›, ‹medium — buttons, popovers›, ‹large — cards, sheets›. A
badge inside a card should not share the card's radius by accident; nested corners want the inner
radius smaller than the outer one or the gap between them reads as a printing error.

**Budget, from `measure.js`:** a page should return at most ‹4› distinct `radii` and ‹5› distinct
`gaps`. Run it against `/payroll` and `/dashboard/ecommerce` and set these to what the good pages
actually do rather than to a round number. Anything far above means someone is spacing by eye.

## Type scale

The ramp is fixed and short. Hierarchy comes from position, weight and space before it comes from
size, and a page that needs a sixth size usually needs less content.

| Role          | Size      | Where                                                                 |
| ------------- | --------- | --------------------------------------------------------------------- |
| Hero figure   | 60px      | The one consolidated number on an **overview** only. Never elsewhere. |
| Page title    | ‹fill›    | One `<h1>` per page.                                                  |
| Section title | ‹fill›    | `CardTitle` with `role='heading' aria-level={2}`.                     |
| Body          | ‹fill›    | Default.                                                              |
| Secondary     | ‹fill›    | `text-muted-foreground`. Labels, captions, helper text.               |
| Identifier    | `text-xs` | `EMP-0142`, run references. Often `font-mono`.                        |

- **Exactly one `<h1>` per page.** `measure.js` returns `h1`; anything but 1 is a defect. Zero means
  the page has no title in the outline, more than one means it has no title at all.
- **A workbench tops out at 24px and that is correct.** `/payroll/runs/[runId]` is the reference.
  The archetype decides this, not taste — see the type-scale measure above.
- **Weight before size.** Going from `font-normal` to `font-medium` separates two levels without
  adding a size to the ramp. At most three weights on a page.
- **Never shrink type to make content fit.** Cut the content, move it behind a disclosure, or give
  it its own surface. A 12px table that had to be 12px is a layout that lost an argument.
- **Line length caps at ‹65–75› characters** for anything read as prose. Full-width paragraphs on a
  1920px monitor are unreadable regardless of how correct the font size is.
- Every figure in a column carries `tabular-nums` — see _Data display_. `measure.js` now reports
  `numbersMissingTabularNums`, scoped to table cells.

## Elevation and surface

One elevation model. Mixing two is a drift signature that survives every code review because each
individual card looks fine.

**Border is the default separator. Shadow means the surface genuinely floats above the page.**

| Tier            | Treatment                      | What it is                                             |
| --------------- | ------------------------------ | ------------------------------------------------------ |
| Page            | `bg-background`                | The canvas.                                            |
| Resting surface | `bg-card` + border             | Cards, panels, table containers. No shadow.            |
| Raised          | `bg-popover` + border + shadow | Popover, DropdownMenu, Select, Tooltip, Sheet, Dialog. |
| Scrim           | overlay token                  | Behind a modal surface only.                           |

- **A resting card gets a border or a shadow, never both.** Both is the most common way a shadcn
  page starts to look like a template.
- **Shadow is never the only signal that something is interactive.** Hover elevation is decoration
  on top of a real affordance, not a substitute for one.
- **Shadows barely read in dark mode.** A dark-theme surface separates by border and by a lighter
  `bg-card` against `bg-background`, so a component that relies on shadow alone disappears in one
  theme and not the other. This is the same class of bug as the `chart-5` incident: fine in light,
  broken in dark, invisible unless you screenshot both.
- Do not nest three surfaces. A card inside a card inside a panel means the hierarchy is wrong; a
  heading and whitespace almost always replace the third frame.

## Loading and pending states

Empty and error states are covered in _Data display_. Loading is the third, and on a
server-component app the boundary placement is a design decision, not a technical one.

Three distinct states, three different answers:

- **Route transition** — `loading.tsx` renders the page shell: header, section frames, and skeletons
  where the content will be. The reader should recognise the page before the data lands.
- **Streaming data** — a `<Suspense>` boundary around the slow part, not the whole page. Wrapping
  everything in one boundary throws away the reason to be on the server at all: the fast half waits
  for the slow half.
- **Action pending** — the control that was pressed carries the state. It keeps its width, becomes
  disabled, and sets `aria-busy`. Never move the layout because a button is thinking.

Rules:

- **A skeleton matches the geometry it replaces.** Same height, same column count, same number of
  rows. A skeleton of the wrong shape trades a spinner for a layout shift, which is worse — the
  reader has already started reading by the time it moves.
- **No spinner where the layout is known.** A spinner is for an unknown duration and an unknown
  shape. A table that is always ten rows gets ten skeleton rows.
- **Do not flash.** Anything that resolves in under ‹200ms› should show nothing at all; a skeleton
  that appears and vanishes reads as a glitch.
- **A pending figure is not a partial figure.** _Partial is a state_ covers a total that is missing a
  company. Loading is a total that is not there yet. They must not look the same, and the caveat
  must never render before the number it qualifies — a figure that appears complete for 300ms and
  then grows a warning has already been read.
- **Optimistic updates need a defined failure path.** If the row moves before the server confirms,
  decide now what it looks like when the server refuses.

_No measurement gates this section yet._ The honest options are a Lighthouse CLS number in CI, or
leaving it as a review item — do not invent a check here to make the section symmetrical with the
others.

## Density and overflow

Add inside _Data display_.

- **The page never scrolls sideways.** `measure.js` returns `scrollsSideways`; `true` is a defect at
  every breakpoint, no exceptions. A table that is too wide scrolls _inside its own container_, and
  the container has a visible edge so the reader knows there is more.
- **The identity column stays put.** When a table scrolls horizontally, the column that says which
  row this is — employee, company, run reference — is sticky. A scrolled table where every column
  is a number and none of them is a name is unreadable.
- **Column priority is declared, not emergent.** In order: identity, status, the figure the question
  is about, then everything else. When width runs out, the tail hides first. Decide the order when
  you build the table, because at 768px there is no good default.
- **Row height is a budget.** An avatar, a badge, a two-line cell and a row action each cost height,
  and height is how many rows fit on screen — which is the actual job of a workbench. Anything
  decorative earns its place against that cost.
- **Density never shrinks a target below 24×24.** A compact table row still needs its row action to
  meet the pointer target rule. `measure.js` returns `smallTargets`; check it at the densest
  breakpoint, not just at desktop width.
- **Decide what a wide table does on mobile, per table.** Horizontal scroll with a sticky identity
  column, priority hiding, or a stacked card list. All three are defensible; not choosing is not.
  ‹Record the choice for the payroll tables here once made.›
