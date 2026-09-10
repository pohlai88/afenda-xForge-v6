# afenda-xForge-v6

## Gotchas

- **This repo uses ESLint + Prettier. The sibling xForge repos (v5, v4, afeda-Xforge) use Biome + ultracite.** Don't carry their tooling, config, or commands over — they will look familiar and be wrong here.
- **pnpm.** `package.json` has no `packageManager` field, so nothing in it says so; the signal is `pnpm-lock.yaml`.
- **Not a monorepo.** `pnpm-workspace.yaml` declares `packages: ["."]` — a single Next.js app. The file's presence suggests workspaces that don't exist.
- **`_archive/` is dead template scaffolding**, kept from the AdminCN baseline (`f79c8c3`) and already excluded in `eslint.config.mjs`. Don't edit it, fix its lint, or treat it as reference for how this app works.

## UX doctrine

`.architecture/ux/afenda-ui-ux-doctrine.yaml` is the product's normative UX
doctrine. When frontend implementation presents multiple valid UX choices,
resolve them against it.

- `MUST` / `MUST_NOT` are binding.
- `SHOULD` requires a documented reason to override.
- `MAY` is optional.

It outranks any single registry item. Do not create a domain-local interaction
pattern that contradicts a global doctrine merely because a Shadcn Studio block
implements it differently — that is a `REFERENCE` case, not a licence.

The doctrine's `decision_rules` section resolves the recurring choices directly:
navigate vs. drill down vs. drawer vs. workspace group, what earns a persistent
control vs. a context menu vs. an overflow, and when a new page is justified at
all. `ux_acceptance` is the per-surface checklist; `anti_patterns` is the
`MUST_NOT` list. Read the relevant section before designing a surface, not after.

The YAML is the only authority. Prose drafts of it under `.HITL/` are
superseded — don't resolve a UX question against them.

## Architecture contracts

`.architecture/**/*.yaml` is a three-tier contract system, and every file states
its own place in it under `authority_chain`:

| Tier      | `authority`                          | Files                                        | Ids                      |
| --------- | ------------------------------------ | -------------------------------------------- | ------------------------ |
| doctrine  | `product-ux`                         | `ux/afenda-ui-ux-doctrine.yaml`              | `D01`–`D20`              |
| programme | `payroll-programme`, `hrm-programme` | `<domain>/afenda-<domain>-architecture.yaml` | `A01`–`A17`, `B01`–`B11` |
| page      | `page-contract`                      | `P0n-*.yaml`, `H0n-*.yaml`                   | `P01`–`P11`, `H01`–`H03` |

Cite the governing id in a comment where the reasoning would otherwise be
re-derived — ``Doctrine: `floating_query` (D12)``. The id is what makes the
contract findable from the code, and `pnpm lint:contracts` resolves it.

`pnpm lint:contracts` (`scripts/contract-lint.py`, PyYAML) checks the part of a
contract that is mechanically decidable, so drift is caught here rather than by a
later session discovering the contract describes a repo that no longer exists:

- every contract parses, and carries `schema_version` / `status` / `authority`
- a page contract carries `id` / `route` / `workspace` / `archetype` /
  `authority_chain` / `component_ownership`, its `id` matches its filename, and
  its `route` has a page under `src/app/(pages)`
- every repo path a contract names exists — declared paths are `ERROR`, paths
  mentioned in prose are `WARN`, and paths under `expected_new` are allowed to be
  absent
- every `D..`/`A..`/`B..`/`P..`/`H..` cited in a `src` comment resolves, and a
  citation naming a section agrees with that section's real id
- P02's `component_ownership.consumer_check` is re-run and diffed against the
  record, which the contract itself says must never be inferred from

It judges facts, never design. Whether a surface leads with the right figure is
what the contract prose and a human reader are for.

## Shadcn Studio frontend authority

Frontend work is standardised on the Shadcn Studio Admin Template that this app is
already built from. Search Studio before writing custom UI; don't hand-recreate
something the registry already has.

```
Existing implementation in src/views    ← always look here first
        ↓
Shadcn Studio page   (@ss-pages)
        ↓
Shadcn Studio block  (@ss-blocks)
        ↓
Shadcn Studio component (@ss-components, @shadcn-studio)
        ↓
shadcn/ui primitive in src/components/ui
        ↓
custom composition in src/views/<area>/<name>.tsx
```

The order is **SEARCH → SELECT → COMPOSE → IMPLEMENT → VISUALLY VALIDATE → REFINE**.
Never go straight from a requirement to custom JSX. Prefer composition over
abstraction, an existing component variant over one-off styling, and semantic
theme tokens over arbitrary colours. Preserve the template's visual language —
no parallel design-system layer, no `AfendaButton`-style wrapper primitives, no
second theme architecture.

**Compatibility is decided per item, never assumed.** This app has zero
`@radix-ui/*` packages and 25 of its 50 primitives on `@base-ui/react`, and a
second primitive system must never be introduced. But `components.json` sets
`style: base-vega`, so the registry serves Studio's **Base UI** variant
(`src/registry/base/…`) — "Studio is Radix" was true of the default style and is
not true here. Resolve the item first, then judge it:

```
Resolved Studio item — pnpm exec shadcn view <item>
        ↓
read dependencies, imports, styles
        ↓
@radix-ui in dependencies, or a Radix import?     → REJECT
Base UI + semantic tokens only?                   → ADOPT eligible
Base UI but palette utility classes?              → ADAPT — retokenise first
Useful UX, incompatible implementation?           → REFERENCE — rebuild it here
```

- `pnpm exec shadcn view @ss-blocks/<name>` prints a registry item without
  writing a file. Read before installing, every time.
- `pnpm exec shadcn add ...` is safe for `src/components/ui` primitives, which
  resolve to the base-vega (Base UI) variant. Anything else needs the gate above.
- Blocks in particular carry palette utility classes (`text-green-600`,
  `bg-sky-400/10`); `src/views` and `src/app` have zero. ADAPT means retokenising
  those, not shipping them.
- Never run `install-theme`. `globals.css` is the design system.

`.claude/commands/{cui,iui,rui,ftc}.md` are the four Studio workflows and carry
the detail. The `xforge-design-system` skill holds the tokens and quality floor;
load it before writing UI. The gate above is restated as
`implementation_policy` in the UX doctrine — the two agree, and the doctrine
decides the interaction question that the gate does not.

## Verifying a change

There is no test framework and no test files. To check work:

```
pnpm check-types     # tsc --noEmit
pnpm build           # next build
pnpm lint            # eslint
pnpm lint:contracts  # scripts/contract-lint.py
```

## Formatting

A `PostToolUse` hook (`.claude/hooks/format.mjs`) runs Prettier on each file after it's written, so files change on disk right after an edit — that's expected, not a conflict. Don't hand-match the style; the hook applies it.

ESLint is deliberately not in that hook: `eslint --fix` on one file costs ~4.9s here because `eslint.config.mjs` resolves imports through `tsconfig.json`. So `import/order` and `consistent-type-imports` are _not_ auto-fixed on edit — run `pnpm lint:fix` before finishing a change that adds imports.
