# Shared and global defect register

Defects that are **reachable from a product surface but not owned by it**: they live in a shared
primitive or in the global application shell, they reproduce outside the surface that found them,
and the surface neither introduced nor worsened them.

This register exists so those defects survive the freeze of the page that discovered them. A page
contract freezes a page. It does not certify that every inherited primitive beneath it is
defect-free, and a debt recorded only inside a frozen page's release narrative stops being
discoverable the moment that page is closed.

## Acceptance ownership law

A reachable failure **blocks** a page freeze when the page owns it, the page introduced or
regressed it, or the page can only function by relying on the broken behaviour.

A failure may be carried here as **non-blocking shared debt** only when all five are proven:

1. reproduced outside the discovering page;
2. owned by a shared primitive or the global shell;
3. existed independently of the discovering page;
4. the discovering page did not introduce or worsen it;
5. recording it does not label the behaviour a pass.

Nothing in this register is a `PASS`. Every entry is `OPEN_SHARED_DEBT` until its owning programme
repairs it.

---

## SD-001 — Properties sheet does not restore focus when it closes

|                    |                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| **Status**         | `OPEN_SHARED_DEBT` — `e682393` has merged and the defect still reproduces; see _Re-run after the merge_ |
| **Owner boundary** | `SHARED_PRIMITIVE` — `src/components/shared/PropertiesSheet.tsx`, `src/components/ui/sheet.tsx`         |
| **Discovered by**  | P02 Entity Payroll Workspace, automated browser keyboard acceptance, 2026-09-10                         |
| **Affects**        | every consumer of `PropertiesSheet`                                                                     |

**Expected.** Closing the Properties sheet returns focus to the control it was opened from — the
`ObjectCommands` trigger, or the row command trigger in a governed table.

**Observed.** Focus falls to `<body>`. A keyboard reader who opens Properties and closes it is
returned to the start of the document, losing their position in the task.

**Reproduction.** On `/payroll/entities/ent-sg`: Tab to _Commands for Afenda Pte. Ltd._ (37 presses
from load), `Shift+F10`, ArrowDown to _Properties_, `Enter`, then `Escape`.
Focus before: `BUTTON` _Commands for Afenda Pte. Ltd._, then `BUTTON` _Close_ inside the sheet.
Focus after: `BODY`. Deterministic, 5 of 5 repetitions.

**Control-route reproduction.** `/payroll/runs` (P04 run queue), same shared component, 3 of 3.
Also reproduces when the sheet is closed by its own _Close_ button rather than by `Escape`, so it is
not specific to the `Escape` path.

**Diagnosis.** Focus _entry_ is correct — it lands on _Close_ and is trapped inside the dialog.
Only the exit is unhandled. `SheetContent` passes no `finalFocus`, and the sheet is opened
programmatically from a menu item rather than from a `Sheet` trigger, so the primitive has no
recorded trigger to return focus to.

**Why P02 did not fix it.** P02 does not own the primitive, did not introduce the behaviour, and
does not depend on it to function — the surrounding menu interaction restores focus correctly on its
own. Repairing it inside P02 would mean either editing a shared primitive from a page pass or
forking it behind a P02-only workaround. Both were explicitly rejected: the fix belongs once, in the
primitive, for every consumer.

**Repair note for the owning programme.** The fix is at the primitive, not at the call sites: give
the sheet a way to record and restore the element it was summoned from, the way
`ObjectContextMenu` already does with `finalFocus` and the way `QueryPanel` does with its
`returnFocus` ref. Doing it per consumer would put the same logic in four places and leave the fifth
without it.

### Fix in flight — authored outside the frozen line, 2026-09-10

`e682393` _"fix(ux): Properties takes the focus it opens with"_ on
`payroll/phase10-properties-focus` rewrites `PropertiesSheet.tsx` from 89 lines to 216 and makes
entry and restoration one lifecycle: focus is captured into a `restoreTo` ref at the instant it is
taken, a callback ref covers the first open, and an effect covers reopens and every close. It
carries a 289-line browser closure record, `.HITL/phase10-properties-sheet-focus-browser-closure.md`
(`79a6771`) — 22 probes, all PASS, at 1440, 1024 and 390, measured with capturing
`focusin`/`focusout` against `document.activeElement`.

**This does not close SD-001 yet**, and the entry stays `OPEN_SHARED_DEBT`. Verified against this
line of code: `e682393` is NOT an ancestor of `main` or `dev`. `PropertiesSheet.tsx` at `5f1370b` is
still the 89-line version with zero occurrences of `restoreTo` or `takeFocus`, so the defect is live
in the frozen line exactly as recorded. A debt cannot be closed in a tree against a commit that tree
does not contain — the same rule the acceptance policy applies to everything else here.

**Closes when** `payroll/phase12-command-palette-focus` (which contains `e682393`) merges to `main`,
and the reproduction above is re-run against the merged tree and fails to reproduce. Then, and only
then, this entry closes citing `e682393`.

### Correction to the diagnosis above, from the author of the fix

The original repair note suggested giving the sheet a way to record and restore its summoning
element. That is what `e682393` does, so the direction was right. But one implication needs
correcting, because it would mislead the next reader:

**Declaring `finalFocus` on the sheet would not have fixed this.** Base UI restores focus on
_unmount_, and this popup does not unmount — it stays in the document carrying `data-closed`. So a
declared `finalFocus` has no moment to run. Corroborated independently in this tree, in code that
predates the fix: `ObjectCommands.tsx:309` already records _"the popup does not unmount on close — it
stays in the document carrying `data-closed` — so there is no unmount to hook either"_, and
`QueryPanel.tsx:244` keeps its own `finalFocus` while noting it _"is Base UI's to run"_ and adding an
explicit restoration beside it rather than relying on it. Three surfaces have now reached the same
conclusion separately.

The absence of `finalFocus` on `SheetContent` was reported accurately — it is genuinely not there at
`5f1370b` — but it was the wrong thing to point at. Restoration had to become an explicit effect
keyed on `open`. That is the durable lesson, and it is why this correction is recorded rather than
quietly edited away.

### Re-run after the merge, 2026-09-10 — the condition was met and the defect survived it

The closing condition above has now been tested and **did not hold**. `e682393` is an ancestor of
`main` (it arrived with the `5465d07` merge) and `PropertiesSheet.tsx` in this tree is the 222-line
version carrying `restoreTo` and `takeFocus`. The reproduction was re-run against that tree and
**still ends at `BODY`**. SD-001 therefore stays open, and the "closes when" clause above is
superseded by this section rather than satisfied by it.

**What actually happens now**, measured on `/payroll/entities/ent-sg` against a settled dev render:

| Path into Properties                                    | Focus after `Escape`                    | Verdict  |
| ------------------------------------------------------- | --------------------------------------- | -------- |
| `Alt+Enter` from the commands trigger, no menu involved | the trigger, `:focus-visible` true      | **PASS** |
| `Shift+F10` → _Properties_ → `Enter`, the SD-001 path   | the _Properties_ menu item, then `BODY` | **FAIL** |

So the restoration lifecycle `e682393` built is correct — the `Alt+Enter` row proves it works when
the summoning element outlives the sheet. The residual defect is narrower than the original and is
about **which element is captured**: `takeFocus` records `document.activeElement`, which on the menu
path is the _Properties_ item. Closing the inspector also closes the menu. The close effect fires
first and focuses the item while it is still connected, so the guard `target?.isConnected` passes;
the menu popup then unmounts and takes focus with it. Sampled at 250ms intervals, focus sat on the
menu item and was on `BODY` by the time the popup was gone. The declared `finalFocus` fallback
(`restoreTo.current?.isConnected ? … : true`) is never reached, because the explicit effect has
already spent the restoration on a doomed node.

This is why the original "5 of 5" observation and this one agree on the symptom and disagree about
the cause: focus reaching `BODY` was read as _no restoration_, when it is now _restoration to
something about to be destroyed_.

**Fix authored in this tree, not yet verified in a browser.** `durableFocusTarget` in
`PropertiesSheet.tsx` resolves the captured element to one that will outlive the popup: an element
inside a `[role="menu"]` resolves to that menu's owner through `aria-labelledby` → the trigger's
`id`, falling back to `[aria-controls]`. Both attributes are ARIA the menu already emits, so this
needs no Base UI internals and no timer. An element outside any popup is durable already and is
returned untouched. `pnpm check-types` and `pnpm lint` pass on it.

**Not verified, and deliberately not claimed as fixed.** The browser session degraded before the
menu path could be re-run against the change — CDP `Runtime.evaluate` timing out, then key and
pointer delivery ceasing to reach a page whose server render was clean at HTTP 200. Nothing was
measured after the edit. The `Alt+Enter` PASS and the `Shift+F10` FAIL in the table above were both
measured _before_ it.

**Closes when** the `Shift+F10` → _Properties_ → `Escape` path is re-run against this tree on a
settled render and focus lands on the _Commands for …_ trigger, in both themes, repeated enough
times to rule out the intermittency this session hit. Until then this entry stays
`OPEN_SHARED_DEBT` and the code carries an unverified fix — which is worse than an unfixed defect
to anyone who reads the diff and assumes it was tested.

---

## SD-002 — Dead anchors in the global shell footer

|                    |                                                                                 |
| ------------------ | ------------------------------------------------------------------------------- |
| **Status**         | `REPAIRED` 2026-09-10                                                           |
| **Owner boundary** | `GLOBAL_SHELL / SHARED_PRIMITIVE` — `src/components/layout/Footer.tsx`          |
| **Discovered by**  | P02 Entity Payroll Workspace, automated browser keyboard acceptance, 2026-09-10 |
| **Affects**        | every route in the application                                                  |

**Expected.** No dead control participates in keyboard traversal. A control that takes a tab stop
does something when it is activated.

**Observed.** The footer renders _Support_ and _Docs_ as anchors with `href="#"`. Both take a tab
stop and neither does anything. They are stops 84 and 85 of 85 in the P02 traversal.

**Reproduction.** On `/payroll/entities/ent-sg`, Tab from page start through to the footer.
Focus before: the preceding footer stop. Focus after: the dead anchor itself — focus behaviour is
correct, the control is inert. Every traversal.

**Control-route reproduction.** Present on `/payroll` (P01, `FROZEN_V1`), `/payroll/runs` and
`/dashboard/ecommerce`.

**Why P02 did not fix it.** Inherited AdminCN template scaffolding, declared at
`Footer.tsx:9` onwards. It is app-wide, it predates P02, and it is already present on a page that
froze with it. P02 neither introduced nor worsened it, and changing the global shell during a page
pass is out of boundary.

**Repair note for the owning programme.** Either give the two links real destinations or remove
them. A dead control is worse than an absent one: it spends a tab stop and a reader's attention to
deliver nothing.

**Repaired, 2026-09-10.** Removed. `footerLinks`, the `Link` import and the flex row that held them
are gone, and the footer is now the copyright line alone. The traversal is two stops shorter and
every remaining stop does something.

---

## SD-003 — `--muted-foreground` fails WCAG AA for normal text in the light theme

|                    |                                                                         |
| ------------------ | ----------------------------------------------------------------------- |
| **Status**         | `REPAIRED` 2026-09-10                                                   |
| **Owner boundary** | `DESIGN_SYSTEM` — `src/app/globals.css`, the `--muted-foreground` token |
| **Discovered by**  | H01 People, measured visual validation in both themes, 2026-09-10       |
| **Affects**        | every route in the application, light theme only                        |

**Expected.** Normal text meets WCAG AA at 4.5:1. The design system's quality floor states this
without exemption, and `text-muted-foreground` is the app's standard secondary-text token.

**Observed.** In the light theme, `text-muted-foreground` on `--background` measures **4.35:1**
against a required 4.5:1. It passes in dark. The shortfall is small and uniform, so it reaches
every secondary label, sub-line identifier, unit caption and description in the product.

**Reproduction.** Emulate `prefers-color-scheme: light`, load any route, run
`.claude/skills/xforge-design-system/scripts/measure.js` and read `contrastWorst`. On `/hrm` it is
five of five remaining failures, all at 4.35: a card description, a table count, `EMP-013`, a
country code and a compensation basis.

**Control-route reproduction.** Present on `/payroll/runs`, which reports 22 light-theme contrast
failures sharing the same 4.35 ratio on its muted text. Present on `/payroll`.

**Why H01 did not fix it.** The repair is a change to a global token with an app-wide ripple —
every surface in the product moves. The design system's own rule for changing the system is _edit,
do not redraw_, and re-tiering a semantic token during a page pass is out of boundary. H01 neither
introduced nor worsened it: the page uses the token exactly as every other surface does.

**Not to be confused with the defect H01 did own and fix.** H01 initially paired `text-warning` and
`text-success` with a tinted surface, which measured **1.88:1** in light while looking correct in
dark. That was H01's own and was corrected to the `-strong` variants `globals.css` documents for
tinted surfaces. Only the inherited 4.35 token shortfall is carried here.

**Repair note for the owning programme.** Darken `--muted-foreground` in the light block until it
clears 4.5:1 against `--background` and `--card`, then re-measure every dashboard in both themes —
the token is load-bearing across the product, and this is precisely the kind of change that looks
safe in one theme and moves in the other.

**Repaired, 2026-09-10.** `--muted-foreground` moved from `oklch(0.556 0 0)` to `oklch(0.545 0 0)`
in the light block. The repair note above was almost right and understated the problem: the binding
surface is not the white card. `--muted`, `--secondary`, `--accent` and `--sidebar-accent` are all
`oklch(0.97 0 0)`, secondary text sits on them constantly, and 0.556 measured 4.73 on white but
4.34 on that grey — which is the 4.35 this entry recorded. 0.545 clears AA on every light surface:
4.96 on white, 4.75 on the sidebar, 4.54 on the grey.

**Verified.** Measured in the light theme after the change: `/hrm` 5 contrast failures → **0**,
`/payroll/runs` 22 → **4**. Every remaining failure is a different defect — see below.

**What the repair isolated, and did not fix.** The four survivors on `/payroll/runs` measure
**2.34:1**, not 4.35, and they are not this token. They are the run-queue stage rail's `(not
started)` label and its step numbers at 10–12px. That is a payroll-owned defect on a surface whose
page contract (P03) has not been authored, so it is not shared debt and is not carried here. It
belongs in the P03 contract's local defect pass.

---

## Cross-references

- P02 contract: `.architecture/payroll/P02-entity-payroll-workspace.yaml`, sections
  `automated_keyboard_acceptance` and `p02_local_defect_pass`.
- Evidence tables: `.architecture/ux/manual-acceptance-ledger.md`, the P02 automated browser
  acceptance entries.

Both entries are carried through the P02 freeze as declared shared debt. Neither is a P02 defect and
neither blocks P02 V1.
