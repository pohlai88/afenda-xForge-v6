# Scales and surfaces

The lookup tables behind four rules in SKILL.md. They live here because you consult them while
writing a specific component, not on every task. **SKILL.md holds the decisions; this holds the
values.** Where the two disagree, SKILL.md wins and this file is stale.

All values measured 2026-09-06 from `src/app/globals.css` and one `scripts/measure.js` run against
`/payroll`. Regenerate rather than edit by hand.

---

## Spacing steps

Tailwind's 4px base, from the one `@theme` block. The tier is decided by the *relationship*, not by
how it looks in isolation.

| Relationship | Step | Typical |
|---|---|---|
| Inside one control — icon to its label, badge padding | `1`–`2` | `gap-1.5` |
| Between tightly related elements — a label and its value, a stat and its delta | `2`–`3` | `gap-2` |
| Between groups inside a card — header to body, field group to field group | `4`–`6` | `space-y-4` |
| Between cards in a grid | `4`–`6` | `gap-6` |
| Between page sections | `8`–`12` | `space-y-8` |

Measured on `/payroll`: 8 distinct gap values, all on-scale — 2, 4, 6, 8, 12, 16, 24px and one
compound `2px 8px`. Far above 8 distinct values means someone is spacing by eye.

## Radius tiers

From `--radius: 0.625rem`. Never a literal, and never an arbitrary value.

| Token | Computed | Use |
|---|---|---|
| `--radius-sm` | 6px | Badges, chips, small inputs |
| `--radius-md` | 8px | Buttons, inputs, popovers |
| `--radius-lg` | 10px | Cards, sheets |
| `--radius-xl` | 14px | Large panels |
| `--radius-2xl` … `--radius-4xl` | 18 / 22 / 26px | Feature surfaces, avatars |
| `rounded-full` | pill | Badges, avatars, progress tracks |

Nested corners want the inner radius smaller than the outer, or the gap between them reads as a
printing error. Measured on `/payroll`: 8 distinct values including `full` and one compound
top-only radius. `4px` is the one value that maps to no token — it is Tailwind's default `rounded`.

## Type ramp

Hierarchy comes from position, weight and space before it comes from size.

| Role | Class | Where |
|---|---|---|
| Hero figure | `text-6xl` (60px) | The one consolidated number on an **overview**. Nowhere else. |
| Page title | `text-2xl` | Exactly one `<h1>` per page. |
| Section title | `text-lg` | `CardTitle`, with `role='heading' aria-level={2}`. |
| Body | `text-sm` | The default in a product this dense. |
| Secondary | `text-xs` + `text-muted-foreground` | Labels, captions, helper text. |
| Identifier | `text-xs`, often `font-mono` | `EMP-0142`, run and bank references. |

Measured usage across payroll: `text-xs` 276, `text-sm` 135, `text-lg` 35, `text-xl` 15,
`text-2xl` 13, `text-base` 6. The ramp above is what that distribution already describes.

At most three weights on a page. Prose caps at 65–75 characters.

## Elevation tiers

One model. Mixing two is a drift signature that survives review because each card looks fine alone.

| Tier | Treatment | What it is |
|---|---|---|
| Page | `bg-background` | The canvas |
| Resting | `bg-card` + border | Cards, panels, table containers. No shadow. |
| Raised | `bg-popover` + border + shadow | Popover, DropdownMenu, Select, Tooltip, Sheet, Dialog |
| Scrim | overlay token | Behind a modal surface only |

A resting card takes a border or a shadow, never both.

## Interaction surfaces

| Surface | Use for |
|---|---|
| Tooltip | Supplementary explanation of something already on screen |
| Popover | Small local inspection or selection |
| DropdownMenu | A compact set of commands |
| Sheet | Contextual inspection or editing that must keep the workspace behind it |
| Dialog | A short interrupt that needs a decision |
| AlertDialog | A consequential confirmation |
| Full page | Deep, multi-section, multi-step, independently navigable work |

The rule that decides between them is in SKILL.md under *Interaction surface selection*: prefer
contextual continuation, but promote a Sheet to a page once it needs nested navigation, a second
substantial table, extended editing, or a shareable URL.
