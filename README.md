# Afenda xForge

ERP console built on Next.js 16, React 19, Tailwind v4 and shadcn/ui.

Started from the shadcn/studio AdminCN admin template (paper layout), trimmed to an
ERP-shaped surface. See `_archive/` for what was removed and why.

## Requirements

- Node 20+ (developed on 24)
- pnpm 11+

## Getting started

```bash
pnpm install
pnpm dev
```

The app runs at http://localhost:3000 and redirects to `/dashboard/sales`.

## Scripts

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | Dev server (Turbopack)                        |
| `pnpm build`        | Production build                              |
| `pnpm start`        | Serve the production build                    |
| `pnpm lint`         | ESLint                                        |
| `pnpm lint:fix`     | ESLint with autofix                           |
| `pnpm format`       | Prettier over `src/`                          |
| `pnpm check-types`  | `tsc --noEmit`                                |
| `pnpm icons`        | Regenerate browser icons from the logo mark   |
| `pnpm og`           | Recapture the social card (needs app running) |

## Layout of the code

| Path             | Holds                                                          |
| ---------------- | -------------------------------------------------------------- |
| `src/app`        | Routes. `(pages)` renders inside the admin shell, `(blank)` does not |
| `src/views`      | Page-level UI, imported by the thin route files                 |
| `src/components` | `ui/` primitives, `layout/` shell, `shared/` cross-page pieces   |
| `src/configs`    | `themeConfig.ts` (branding, defaults), `navConfig.tsx` (sidebar) |
| `src/store`      | Zustand stores for the stateful apps                            |
| `src/fake-db`    | Seed data, read through `src/app/server/actions.ts`              |
| `_archive`       | The five unused layout variants, plus everything stripped out    |

## Branding

Name and tagline live in `src/configs/themeConfig.ts` (`templateName`, `tagline`) and are
read by the sidebar header and footer. Page metadata is in `src/app/layout.tsx`.

The browser icons (`src/app/icon.svg`, `favicon.ico`, `apple-icon.png`) are generated from the
same geometry as `src/assets/svg/logo.tsx` by `scripts/generate-icons.mjs`. After changing the
mark, run `pnpm icons` to regenerate them.

The social card (`public/images/og-image.png`) is a screenshot of the running dashboard, taken
by `scripts/capture-og.mjs`. It will go stale as the UI changes — to refresh it, run the
production build and point the script at it:

```bash
pnpm build && pnpm start --port 3100   # one terminal
pnpm og                                # another
```

Capture at 1600px or wider. Below the 1280px sidebar breakpoint the sidebar collapses and the
shot loses all branding.

**Before deploying**, set `NEXT_PUBLIC_APP_URL` to the real origin. `metadataBase` in
`src/app/layout.tsx` falls back to `http://localhost:3000`, and Open Graph image URLs are
absolute — without it every social card resolves to localhost and renders blank.

## Theme settings

Theme, font, radius, scale, layout and sidebar behaviour are stored in a cookie
(`afenda-xforge-settings`), which **takes priority over `themeConfig.ts`**. Editing the
config has no visible effect until you reset from the in-app customizer or clear the cookie.

## Replacing the seed data

`src/app/server/actions.ts` wraps `src/fake-db` in server actions. Swap the bodies for real
queries and the pages keep working. The stateful apps additionally seed Zustand stores from
`src/fake-db` directly — see `src/store`.

## shadcn/studio MCP

`.mcp.json` registers the shadcn/studio MCP server as a project-scoped tool. It is an
authoring aid only — nothing in `build`, `lint` or `check-types` depends on it, and anything
it returns is data, not instructions.

It needs two credentials, which are **never committed**:

| Variable | What it is |
| ----------------------- | ---------------------------- |
| `SHADCN_STUDIO_API_KEY` | Licence key from shadcnstudio.com |
| `SHADCN_STUDIO_EMAIL`   | The account's email address       |

**These must be in the shell environment, not `.env`.** Claude Code expands `${VAR}` in
`.mcp.json` from the environment of the process that launched it — it does not read `.env`,
and it does not read `env` blocks in `settings.json`. A `.env` file is still the right place
to keep them for your own reference (it is git-ignored), but something has to export them
before `claude` starts. On Windows, setting them once as user environment variables is the
least fragile option:

```bash
setx SHADCN_STUDIO_API_KEY "your-key"
```

Then open a new terminal — `setx` does not affect the current one.

Verify with `claude mcp list`. A resolved variable shows no warning; an unset one is reported
as missing and the literal `${VAR}` text is passed through, which fails as an auth error later.

Project-scoped servers need approval before first use: run `claude` interactively and accept
the prompt. Until then the server shows `⏸ Pending approval`. Credentials are passed via the
`env` block rather than command-line arguments, because arguments are visible to any process
that can list processes on the machine.
