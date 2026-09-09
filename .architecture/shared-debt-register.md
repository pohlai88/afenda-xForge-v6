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

|                    |                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| **Status**         | `OPEN_SHARED_DEBT`                                                                              |
| **Owner boundary** | `SHARED_PRIMITIVE` — `src/components/shared/PropertiesSheet.tsx`, `src/components/ui/sheet.tsx` |
| **Discovered by**  | P02 Entity Payroll Workspace, automated browser keyboard acceptance, 2026-09-10                 |
| **Affects**        | every consumer of `PropertiesSheet`                                                             |

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

---

## SD-002 — Dead anchors in the global shell footer

|                    |                                                                                 |
| ------------------ | ------------------------------------------------------------------------------- |
| **Status**         | `OPEN_SHARED_DEBT`                                                              |
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

---

## Cross-references

- P02 contract: `.architecture/payroll/P02-entity-payroll-workspace.yaml`, sections
  `automated_keyboard_acceptance` and `p02_local_defect_pass`.
- Evidence tables: `.architecture/ux/manual-acceptance-ledger.md`, the P02 automated browser
  acceptance entries.

Both entries are carried through the P02 freeze as declared shared debt. Neither is a P02 defect and
neither blocks P02 V1.
