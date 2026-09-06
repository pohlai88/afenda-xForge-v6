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

Still carrying template artwork: `public/images/og-image.png`.

## Theme settings

Theme, font, radius, scale, layout and sidebar behaviour are stored in a cookie
(`afenda-xforge-settings`), which **takes priority over `themeConfig.ts`**. Editing the
config has no visible effect until you reset from the in-app customizer or clear the cookie.

## Replacing the seed data

`src/app/server/actions.ts` wraps `src/fake-db` in server actions. Swap the bodies for real
queries and the pages keep working. The stateful apps additionally seed Zustand stores from
`src/fake-db` directly — see `src/store`.
