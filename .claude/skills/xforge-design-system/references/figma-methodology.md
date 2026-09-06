# Design-system methodology, extracted from Figma's official skills

Source: `figma@claude-plugins-official` v2.2.91, skills `figma-generate-library`,
`figma-generate-design`, `figma-code-connect`. Extracted 2026-09-06.

Those skills drive Figma's MCP server. This file keeps only the parts that are **tool-independent** —
the discovery, reuse and validation discipline — because that is what transfers to a code-side
design system. The Figma Plugin API mechanics are deliberately omitted; if you need them, the
plugin cache still holds the originals at
`~/.claude/plugins/cache/claude-plugins-official/figma/2.2.91/skills/`.

Note: the `figma` plugin is currently **disabled** in user settings, and its MCP server needs an
OAuth flow. Neither affects this document.

---

## 1. Phases, in order, no skipping

`figma-generate-library` refuses to let creation start before discovery finishes. The phase list:

| Phase | Purpose | Gate |
|---|---|---|
| **0. Discovery** | Read the codebase, read the existing system, search available libraries, lock scope, print a **gap analysis** | No writes at all until this is done |
| **1. Foundations** | Tokens before anything else — primitives, then semantics aliased to them | Every planned token exists |
| **2. Structure** | Pages/skeleton and foundation docs | Navigable |
| **3. Components** | One at a time, atoms before molecules, validate each | Bindings verified per component |
| **4. Integration + QA** | Mappings, a11y, naming audit, **unresolved-bindings audit** | No hardcoded values remain |

> "Do not move to the next phase until the current phase's required actions and acceptance checks
> are complete. If a phase cannot pass, stop and report the blocker. No best-effort substitutions.
> No quiet approximations."

The transferable idea: **tokens exist before components, and components exist before screens.** A
screen built before its tokens will hardcode values, and those hardcodes are what drift later.

## 2. The reuse decision matrix

Searched twice — once in discovery, and again immediately before creating each component.

**Reuse** when all hold:
- the property API matches the need (same variant axes, compatible types)
- the token binding model is compatible
- naming conventions match
- it is actually editable

**Rebuild** when any hold:
- API incompatibility (different property names, wrong variant model)
- token model incompatible (hardcoded values, different schema)
- ownership — you cannot modify it

**Wrap** when it looks right but the API is wrong: nest it inside a new component and expose a clean
API on the wrapper.

**Priority order:** local existing → subscribed library → available-but-unsubscribed library →
create new.

This maps directly onto the code side: existing `ui/` primitive → compose primitives → wrap a
primitive → write something new.

## 3. Rules worth stealing verbatim

From `figma-generate-library` §3 and `figma-generate-design` "Best Practices":

- **Variables before components.** "No token = no component."
- **Inspect before creating.** Discover existing conventions and match them, rather than imposing
  new ones.
- **Bind visual properties to tokens by default** — fills, strokes, padding, radius, gap. Exceptions
  are deliberate fixed geometry, not convenience.
- **Always search before building.** "The design system likely has the component, variable or style
  you need. Manual construction and hardcoded values should be the exception, not the rule."
- **Prefer instances over manual builds**, so things stay linked and move when the system moves.
- **Componentize by default.** Do not ship a flat tree of one-off frames that needs a second
  "make it componentized" pass.
- **Validate before proceeding.** Never build on unvalidated work.
- **Match existing conventions** — if the file already has screens, match their naming and layout.

## 4. Anti-patterns, adapted

Figma's list, kept where it applies outside Figma:

- Starting to create before scope is locked.
- Ignoring existing conventions and imposing new ones.
- Skipping the search step before planning new components.
- Hardcoding any fill / stroke / spacing / radius value in a component.
- Creating components before foundations exist.
- Building on unvalidated work from the previous step.
- Retrying a failed step without understanding the error first.
- Starting component work "because the user said build the button" without completing discovery.

The last one is the most human of them, and the easiest to commit.

## 5. What did not transfer

Left out on purpose:

- Plugin API mechanics — `use_figma` call structure, node IDs, `combineAsVariants`, font loading,
  0–1 colour ranges, page-context resets.
- The phase-checklist communication contract (`Phase N Checklist`, task IDs `P0.a`). It suits a
  20–100-call Figma build; it is overhead for a code change.
- Variant-matrix rules (cap at 30 combinations, `INSTANCE_SWAP` for icons). React props have no
  variant explosion problem.
- Code Connect template syntax — only relevant if this repo later maps components to a Figma
  library. `figma-code-connect` is the reference if that day comes.

## 6. If a Figma library is added later

`figma-code-connect` maps Figma components to code components via `.figma.ts` files, so Dev Mode
shows real code for a selected component. That is the mechanism that would keep a Figma library and
`src/components/ui` from diverging. It needs the plugin re-enabled and the MCP server authorised.

---

# Appendix: cherry-picks from other skills

Extracted 2026-09-06, same approach as the Figma extraction above — take the durable guidance,
leave the skill disabled. Rationale: these skills are either aimed at greenfield work that fights
an established design system, or aimed at libraries this repo does not use. Enabling them whole
would cost listing tokens every session and import advice that contradicts the system.

## Taken

**`frontend-design`** (Anthropic, `claude-plugins-official`) — the "Restraint and self-critique" and
"More on writing in design" sections, now the *Interface writing* and *Quality floor* sections of
SKILL.md. The rest of that skill is brand-defining work ("take one real aesthetic risk", pick
display faces you would not use elsewhere) and is the wrong instinct for maintaining a purchased
template's system. The skill remains enabled and is still the right tool for a greenfield page.

**`typescript-react-reviewer`** — the `useEffect` abuse patterns (derived state in an effect, event
logic in an effect) and state-mutation detection. Applicable: 65 `useEffect` sites in `src`.
Left behind: its `useFormStatus` and `use(promise)` React 19 gotchas — real, but this repo has zero
call sites for either, so including them would be speculative bloat.

**`web-accessibility`** — the WCAG AA contrast thresholds (4.5:1 / 3:1) only. Left behind: its
focus-trap implementation and `.sr-only` CSS. Base UI already handles focus trapping in the
overlay primitives, and Tailwind already ships `sr-only` (114 uses in `src`). Copying either would
add a worse hand-rolled version of something that exists.

## Rejected outright

**`creative-frontend-aesthetics`** — optimises for novelty against a system that needs conformity.
Its rules ("avoid Inter / Roboto / system fonts", "avoid solid backgrounds, layer gradients and
geometric patterns") directly contradict this repo's `--font-sans` and solid `--background`.
Good skill; wrong problem. Keep it disabled for this repo.

**`prototyper-ui`** — a component library this repo does not depend on. It was recommended on the
strength of its description mentioning "Tailwind v4 + Base UI"; checking `package.json` showed
`prototyper-ui` is not installed.

**`react-aria-components`** — installed at 1.19.0 but imported in **zero** files. The real primitive
layer is Base UI (25 files in `src/components/ui`). Worth noting separately as a dead dependency
that could be removed.

## Taken from `ui-ux-pro-max` (afenda-xForge-v5)

The most substantial UI/UX skill on this machine: 72 files, 3.6 MB, a Python search engine over
CSV corpora (79 styles, 192 palettes, 74 font pairings, 119 UX guidelines, 25 chart types, 22
stacks) plus **11 test files and a relevance-regression baseline**. Battle-tested literally — it
ships with tests.

Its architecture does not transfer: the value is in the searchable dataset and its `search.py`,
which needs the skill's own directory. What transferred is the distilled rule set from
`references/quick-reference.md`, now the *Data display* section and the WCAG 2.2 additions to the
*Quality floor* in SKILL.md.

**Scoping trap worth recording.** That skill keeps two rule sets apart on purpose:
`references/pro-rules.md` is native/mobile (44pt touch targets, safe areas, haptics) and
`references/quick-reference.md` is web/desktop. Borrowing from the wrong one is easy and produces
confident, wrong guidance — the web pointer-target minimum is **24×24 CSS px** (WCAG 2.2 AA), not
44pt. This appendix took only from the web file.

Also borrowed: its priority ordering, which is a better triage order than "fix what looks wrong" —
Accessibility and Touch/Interaction are CRITICAL; Performance, Style, Layout, Navigation are HIGH;
Typography/Colour, Animation, Forms are MEDIUM; Charts are LOW *as a category*, though on a
data-dense product the chart rules matter more than that ranking suggests.

**Audit findings when this rule set was run against the payroll dashboard:**

- `aria-sort` missing on every sortable table in the repo, including the one written this session.
  Fixed in `payroll-run-history.tsx`; the five in `src/views/datatables` remain.
- The cost-and-headcount chart plots two series with no legend.
- Neither payroll chart carries a text alternative. The gross-to-net bridge is mitigated — the run
  status card repeats its figures as exact amounts — but the trend chart is not.

## Not taken

**`material-design-3-*`** (8 skills, ~150 KB in v5) — a complete, high-quality design system, and
that is exactly the problem: this repo already has one (shadcn base-vega). Importing MD3 tokens,
elevation and motion rules would create a second, competing system.

**`design-consistency-auditor`, `impeccable-design-polish`, `authoring-design-system`,
`reviewing-design-system`, `typeset`** (v5 and afeda-Xforge) — not yet examined in depth. Worth a
look before extending this skill further; they are the same author's prior passes at this problem.

## Taken from the five in-house design skills (v5 / afeda-Xforge)

Examined 2026-09-06: `design-consistency-auditor`, `impeccable-design-polish`,
`authoring-design-system`, `reviewing-design-system` (all in afenda-xForge-v5) and `typeset`
(afeda-Xforge). These are the same author's prior passes at this problem and are the strongest
material found anywhere in this survey — stronger than the public skills.

**`authoring-design-system/references/amend.md`** — the delta discipline, now the *Changing the
system itself* section. Its core moves: edit-not-redraw (minimal in-place change, everything else
byte-for-byte unchanged, no palette churn "while you're here"); scope the **ripple** rather than the
edit site, because a renamed semantic token orphans every component referencing it; and the
observation that **the alias layer contains the blast radius** — re-pointing an alias often turns a
breaking change into a non-breaking one. That is exactly what the `chart-2 = good` mapping is.

**`authoring-design-system/references/governance.md`** — taken mainly for its **omit-below-threshold
rule**: versioning, changelog, deprecation policy and contribution model are *fully omittable* when
the system is single-maintainer, single-consumer and not a versioned external release, and
"manufacturing a governance gap there is a false-revise". v6 is below that threshold, so the skill
says so explicitly rather than importing ceremony. The trigger for revisiting is recorded.

**`reviewing-design-system/references/buildability-bar.md`** — a 13-condition review bar with
pass/gap signals. Taken: condition 10's numeric a11y bar (the AAA Focus Appearance ≥2px/3:1 as a
*house rule* above AA, plus per-component role/name/state, and "collapse: none — a11y is
non-negotiable"); condition 11's "one term per concept"; condition 6's single API vocabulary
(`variant` everywhere, not `type` on one component and `mode` on the next). Left behind: the DTCG
token format, the five-part component spec, and the delta-review reporting template — all aimed at a
documented design system as a deliverable, which this repo does not produce.

**`typeset/references/xforge.md`** — the best-written thing in the survey, and taken for method
rather than content. It refuses to adopt a good pattern into the repo because the pain it solves does
not exist there, states the measurement (two greps, dated), and names **the single trigger that would
reverse the verdict** so it is recognised rather than re-argued. Two rules lifted from it: *where a
general reference and this file disagree, the repository wins*, and record rejections with their
reversal condition. Its own framing of the underlying defect is worth quoting: "a fact acquires a
second source, the two agree, and go on agreeing, until they do not."

**`afeda-Xforge/CLAUDE.md` "Two habits"** — "Having fixed something in one place, ask what else holds
a copy of that fact" and "a check that has never gone red is decoration". Both are now in SKILL.md.
The first is precisely the bug that produced a lowercase "closed" badge this session.

**`design-consistency-auditor`** — its method was already independently arrived at here: discover
the project's own tokens and conventions from the codebase rather than assuming them, and keep
accessibility as a separate pass. Its audit-phase ordering (colour → components → spacing →
typography) is sound. Two cautions: its examples use DaisyUI naming (`base-100`, `base-content`),
not shadcn; and its "AI Slop Prevention" section ("push for distinctive designs with personality",
avoid "safe, boring color choices") contradicts the rest of the skill — novelty advice inside a
consistency auditor. Not taken.

**`impeccable-design-polish`** — taken for its mode taxonomy (audit / critique / polish / harden) and
one operating rule: *prefer a few decisive fixes over broad cosmetic churn*, which is edit-not-redraw
by another name. Its AI-tell list (purple-blue glow gradients, generic three-card feature rows) is
marketing-page material and does not describe this product's failure modes.
