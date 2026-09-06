# afenda-xForge-v6

## Gotchas

- **This repo uses ESLint + Prettier. The sibling xForge repos (v5, v4, afeda-Xforge) use Biome + ultracite.** Don't carry their tooling, config, or commands over — they will look familiar and be wrong here.
- **pnpm.** `package.json` has no `packageManager` field, so nothing in it says so; the signal is `pnpm-lock.yaml`.
- **Not a monorepo.** `pnpm-workspace.yaml` declares `packages: ["."]` — a single Next.js app. The file's presence suggests workspaces that don't exist.
- **`_archive/` is dead template scaffolding**, kept from the AdminCN baseline (`f79c8c3`) and already excluded in `eslint.config.mjs`. Don't edit it, fix its lint, or treat it as reference for how this app works.

## Verifying a change

There is no test framework and no test files. To check work:

```
pnpm check-types   # tsc --noEmit
pnpm build         # next build
pnpm lint          # eslint
```

## Formatting

A `PostToolUse` hook (`.claude/hooks/format.mjs`) runs Prettier on each file after it's written, so files change on disk right after an edit — that's expected, not a conflict. Don't hand-match the style; the hook applies it.

ESLint is deliberately not in that hook: `eslint --fix` on one file costs ~4.9s here because `eslint.config.mjs` resolves imports through `tsconfig.json`. So `import/order` and `consistent-type-imports` are *not* auto-fixed on edit — run `pnpm lint:fix` before finishing a change that adds imports.
