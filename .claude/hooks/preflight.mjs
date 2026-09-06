// SessionStart preflight.
//
// Injects a short standing instruction into the model's context so UI work in this repo starts from
// the design system rather than from a blank component. It does not load the skill — nothing can
// force that — it makes the obligation and the two highest-cost traps visible before the first
// edit, which is the difference between "there is a skill" and "the skill was consulted".
//
// Deliberately short. Anything longer gets skimmed, and the detail already lives in the skill.

const preflight = `PREFLIGHT — afenda-xForge-v6 UI work

Before creating or editing anything under src/app, src/views or src/components, and before
diagnosing any UI or browser problem, load the xforge-design-system skill. It is this repo's only
design gate; there is no test framework.

Two traps that have each cost a full session:
- Two copies of the page exist in the DOM in dev (Next streams the server HTML in a <div hidden>).
  Filter DOM queries to the visible tree, or your counts and measurements are fiction.
- Before calling a control broken, try the same interaction on an existing shipped control. The
  browser automation degrades silently, and "the button is broken" has already been wrong once.

Gates: pnpm check-types && pnpm lint && pnpm build, plus looking at the page in both themes.
Detail: .claude/skills/xforge-design-system/SKILL.md and references/debugging.md`

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: preflight
    }
  })
)
