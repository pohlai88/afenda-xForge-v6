// PostToolUse hook (see .claude/settings.json): run Prettier on the file Claude
// just wrote. It never fails the tool call — formatting is not a gate.
//
// Only the edited file is formatted, and Prettier's CLI entry is invoked
// directly rather than through node_modules/.bin/prettier (a shell shim that
// costs an extra process: ~454ms vs ~673ms per edit).
//
// ESLint is deliberately NOT run here. `eslint --fix` on one file costs ~4.9s
// in this repo, because eslint.config.mjs resolves imports through
// tsconfig.json and so builds a full TypeScript program on every invocation.
// That belongs in `pnpm lint` and CI, not on every edit. The cost of that
// choice: import/order and consistent-type-imports stay manual.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, isAbsolute, relative } from "node:path";

let input = "";

for await (const chunk of process.stdin) {
  input += chunk;
}

let filePath;

try {
  const payload = JSON.parse(input);

  filePath = payload.tool_response?.filePath ?? payload.tool_input?.file_path;
} catch {
  process.exit(0);
}

if (typeof filePath !== "string") {
  process.exit(0);
}

const rel = relative(process.cwd(), filePath).replaceAll("\\", "/");
const outsideRepo = rel.startsWith("..") || isAbsolute(rel);

// _archive/ is dead template material (eslint ignores it too); the rest is
// generated or tooling state.
const skipped = /^(\.claude|\.next|_archive|node_modules)\//.test(rel);

if (outsideRepo || skipped) {
  process.exit(0);
}

function prettierEntry() {
  try {
    const req = createRequire(`${process.cwd()}/package.json`);

    return `${dirname(req.resolve("prettier/package.json"))}/bin/prettier.cjs`;
  } catch {
    return null;
  }
}

const entry = prettierEntry();

if (!entry) {
  process.exit(0);
}

// --ignore-unknown lets Prettier decide what it can parse, so no extension
// list here drifts out of sync with the plugins in .prettierrc.
// Arg array, no shell: a path containing quotes or `$(...)` is inert.
spawnSync(process.execPath, [entry, "--write", "--ignore-unknown", rel], {
  stdio: "inherit",
});

process.exit(0);
