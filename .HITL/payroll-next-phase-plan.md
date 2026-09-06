# Payroll — next phase plan

Prepared 2026-09-06 against `.HITL/payroll-architecture.txt`. Order follows the directive:
compliance, then reports, then real server actions behind the mutations that are local state today.

## 1. Where the module stands

| Directive surface                     | Status          | Where                                                        |
| ------------------------------------- | --------------- | ------------------------------------------------------------ |
| `/payroll` overview                   | built           | `app/(pages)/payroll/page.tsx`, `views/dashboards/payroll/*` |
| `/payroll/runs` queue                 | built           | `views/payroll/runs/*`, `utils/payroll-queue.ts`             |
| `/payroll/runs/[runId]` workspace     | built           | `views/payroll/run/*` (20 files, incl. import dialog)        |
| `/payroll/payments`                   | built           | `views/payroll/payments/*`, `utils/payroll-payments.ts`      |
| `/payroll/settings`                   | built           | `views/payroll/settings/*` (10 sections, RHF + Zod on 4)     |
| `/payroll/compliance`                 | **not started** | no route, no types, no seed                                  |
| `/payroll/reports`                    | **not started** | no route; the aggregations it needs already exist            |
| Global command (Ctrl+K) payroll items | partial         | `assets/data/search.ts` has 4 payroll entries                |

Data layer today: `app/server/actions.ts` is `'use server'` and **read-only** — nine payroll getters
over module-level seed arrays in `fake-db/payroll/{pay-runs,settlements,settings}.ts`. There is no
mutating server action anywhere in the app, no `revalidatePath`, no `useTransition`.

Vocabularies already decided once (reuse, never re-declare): run status, lifecycle stages, exception
severity/status, employee payroll status, payment status (`payroll-metrics.ts`,
`payroll-workspace.ts`), run lifecycle (`payroll-queue.ts`).

## 2. `/payroll/compliance`

**Question the page answers** (directive §58): _what must be filed, by when, for how much, and has it
been?_

### Data

New `types/payroll/compliance-types.ts`:

```
FilingKind      'cpf_contribution' | 'income_tax_withholding' | 'annual_return'
FilingStatus    'not_started' | 'prepared' | 'submitted' | 'accepted' | 'rejected'
StatutoryFiling { id, kind, payRunId?, period {start,end}, dueDate, status,
                  amount: Money, employeeCount, submittedAt?, submittedBy?, reference?,
                  acknowledgedAt?, rejectionReason?, breakdown: { code, label, amount }[] }
ComplianceDeadline { id, label, dueDate, filingId?, kind }   // the calendar row
```

New `fake-db/payroll/filings.ts` — **computed from payslips**, the same way pay-runs are computed
from employees: CPF filing per run = Σ `CPF_EE` + `CPF_ER` components; tax withholding per run = Σ
`TAX`; one annual return row for the year. Closed runs → `accepted`, the open run → `not_started`
or `prepared`, one past run `rejected` so the state renders. Statutory rules in
`payrollSettings.statutory` supply names, rates and ceilings; the filing amount reconciles against
them (a mismatch is an exception, surfaced with the existing `ExceptionBadge`).

Getters to add to `actions.ts`: `getFilings(payRunId?)`, `getComplianceDeadlines()`.

New `utils/payroll-compliance.ts`: `FILING_STATUS_LABELS/STYLES` (one map, semantic tokens),
`filingsForRun`, `complianceSummary` (due next, overdue count, filed-vs-owed for the year),
`daysUntil` reusing `daysBetween`.

### Screen

Same skeleton as `/payroll/runs` so the module reads as one system:

```
Page header
├── ComplianceFocus        col-span-4  the next filing due: kind, period, amount, due-in countdown
│                                      (the page's one large figure), status, "Prepare filing" /
│                                      "Mark submitted" / "Download file"
├── ComplianceYear         col-span-2  filed vs owed this year, on-time rate, Progress track
└── FilingsTable           col-span-full  every filing: kind, period, due, amount, employees,
                                      status, submitted by (face), reference, row → Sheet
FilingInspector (Sheet)                breakdown by component, reconciliation vs statutory rules,
                                      audit trail (reuse PayrollAuditTimeline), actions
Deadline calendar                      a month strip of due dates, not a full calendar app —
                                      driven by ComplianceDeadline rows
```

Reuse: `Card*`, `Badge`, `Table*`, `ToggleGroup` status chips with counts, `Sheet`, `Progress`,
`ExceptionBadge`, `PayrollAuditTimeline`, `ariaSortFor`, `formatMoney`, `formatDate`/`formatPeriod`.
Domain components that earn a file: `filing-status-badge.tsx` (Badge → payroll meaning, per
directive §3), `filings-table.tsx`, `filing-inspector.tsx`, `compliance-focus.tsx`,
`compliance-year.tsx`, `deadline-strip.tsx`.

Mutations (local state first, wired in phase 3): `prepareFiling`, `markSubmitted(reference)`,
`recordResponse(accepted | rejected, reason)`.

Interface writing: "CPF for September 2026 is due in 9 days — S$61,204.10 for 31 employees."
Rejected state says what to do: "Rejected by CPF Board: 2 NRICs do not match. Fix in the
employee profile and resubmit."

## 3. `/payroll/reports`

**Question the page answers:** _give me the numbers finance and auditors ask for, in the file they
ask for, without re-deriving them._

### Data

No new seed. Every report is a function that already exists or is one `reduce` away:

| Report                | Source                                                   | Export exists |
| --------------------- | -------------------------------------------------------- | ------------- |
| Payroll register      | `buildRunRows` + `exportPayrollRegisterToCsv`            | CSV           |
| Run summary           | `buildRunQueue` + `exportRunQueueToCsv`                  | CSV           |
| Gross-to-net          | `grossToNetBridge(run)`                                  | —             |
| Cost by department    | `costByDepartment(...)`                                  | —             |
| Overtime              | `overtimeSummary(...)` per run                           | —             |
| Statutory summary     | Σ CPF_EE / CPF_ER / TAX per run (shared with compliance) | —             |
| Bank file             | settlements per batch (`getSettlements`)                 | —             |
| Variance vs prior run | `reconciliationLines`, `largestMovers`                   | —             |

New `types/payroll/report-types.ts`: `ReportDefinition { key, name, description, group, params,
formats }`, `ReportParams { runId?, payGroupId?, from?, to? }`, `ReportExport { id, reportKey,
params, format, createdAt, createdBy, rows }` (recent-exports history, seeded with a few rows).

New `utils/payroll-reports.ts`: `REPORTS` catalogue (the single list the page, the command palette
and the settings "notifications" section can all read), `runReport(key, params)` → rows + columns,
`exportRows(rows, format)` — CSV via `papaparse` (already used), XLSX via `xlsx` (already a
dependency, unused so far). **No PDF**: nothing in the repo renders PDF and adding a renderer is a
new dependency with no named pain; a printable HTML view covers the audit case.

### Screen

```
Page header + "Run" and "Pay group" selectors (URL: ?run= ?group=, same as the overview)
├── ReportCatalogue     col-span-4  grouped list (Operations · Finance · Statutory · Banking),
│                                   each row: name, one-line purpose, formats, "Generate" → Sheet
├── PayrollTrend        col-span-2  cost + headcount over runs (reuse the existing
│                                   PayrollCostTrend, not a second chart)
└── RecentExports       col-span-full  who exported what, when, which params; re-download
ReportSheet                         parameters (Select for run/group, ToggleGroup for format),
                                    preview table (first 25 rows, TanStack), Export button →
                                    toast "Export created · 31 rows · PR-2026-09-register.xlsx"
```

Reuse: `Select`, `ToggleGroup`, `Sheet`, `Table*`, `Card*`, `PayrollCostTrend`, the two existing
CSV exporters. New domain files: `report-catalogue.tsx`, `report-sheet.tsx`, `recent-exports.tsx`.

Command palette: add the catalogue's reports to `assets/data/search.ts` so "Export payroll
register" resolves from Ctrl+K (directive §39).

## 4. Wiring local mutations to server actions

Inventory of what mutates `useState` today and confirms with a toast (12 handlers, 3 surfaces):

| Surface               | Handler                             | Server action to add                                                                                      |
| --------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| run workspace         | `handleAcknowledge`                 | `acknowledgeException(runId, exceptionId)`                                                                |
|                       | `handleResolve`                     | `resolveException(runId, exceptionId)`                                                                    |
|                       | `handleReopen`                      | `reopenException(runId, exceptionId)`                                                                     |
|                       | `handleRecalculate`                 | `recalculateRun(runId, employeeIds?)`                                                                     |
|                       | `handleAcknowledgeSelectedWarnings` | `acknowledgeWarnings(runId, employeeIds)`                                                                 |
|                       | `handleApprove`                     | `approveRun(runId, calculationVersion, note?)`                                                            |
|                       | `handleImport`                      | `importInputs(runId, rows)`                                                                               |
| payments              | `handleReissue`                     | `reissueSettlement(settlementId)`                                                                         |
| settings (8 sections) | Save / Discard per section          | `savePayrollSettings(section, values)`, `createPayGroup`, `addFundingAccount`, `setDefaultFundingAccount` |
| compliance (new)      | prepare / submit / respond          | `prepareFiling`, `submitFiling`, `recordFilingResponse`                                                   |

Export handlers stay client-side; they produce a file, not a state change.

### Pattern (one, applied everywhere)

1. **Actions live in `app/server/actions.ts`** next to the getters, `'use server'` already set.
   Each mutates the in-memory seed array and returns the updated record; `revalidatePath` the
   route(s) that read it. Against the fake-db this persists for the dev-server process, which is
   enough to prove the wiring; each body is a single place to swap for a query.
2. **Every action validates with Zod** (`zod` is installed; directive §38): id shape, status
   transition allowed (`approveRun` refuses unless status ∈ {calculated, pending_approval} and no
   open blocking/error exceptions — the same rule `PayrollApprovalDialog` shows), calculation
   version matches. Refusals return `{ ok: false, message }` in the interface's voice: "Payroll
   cannot be approved. 2 exceptions are still blocking." Never throw for a business refusal.
3. **Client keeps its optimistic layer.** The existing `setRun(...)` updates become the optimistic
   branch of `useTransition` + `startTransition(async () => { const result = await action(...);
if (!result.ok) { revert; toast.error(result.message) } })`. `toast.success` moves after the
   await. No new state shape: `refreshRows` still derives row status from the mutated run.
4. **`CURRENT_USER_ID` moves server-side** — the action stamps `acknowledgedBy`/`approvedBy`
   from a `getCurrentUser()` stub in `actions.ts`, so no client can name its own approver.
5. **Audit events** derive from the mutated record as today (`auditEvents`), so the timeline needs
   no wiring of its own.

Order of wiring: exceptions (3, smallest) → approve (the one with a real gate) → recalculate +
import → reissue → settings → compliance. Each step: `pnpm check-types && pnpm lint && pnpm build`
plus clicking the action in the browser and reloading to see it persisted.

## 5. Studio blocks judged (from `/iui` analysis)

Four catalogue blocks were read for mechanics only (charts-component-3, timeline-component,
download, user-schedule). Styling, CDN assets and animation were ignored; nothing is installed.

| Mechanic                                             | Source block       | Verdict                        | Why                                                                                                                                                                                                              |
| ---------------------------------------------------- | ------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status rail with done / current / error dots         | timeline-component | take                           | A filing is a linear audited state machine. Render it with the same shape as `PayrollStageBar`, inline in the filing inspector; no new timeline primitive, `ui/timeline.tsx` already exists for the audit trail. |
| Status chips with counts above a list                | user-schedule-02   | take                           | Same control the run queue already uses (`ToggleGroup`), so build on that, not the block's hand-rolled underline buttons. Used for filings and for recent exports.                                               |
| Select parameters, then one action                   | download-02        | take the flow, not the visuals | The report sheet is exactly select run / group / format → Export. The block has no async state; ours needs generating → ready → failed via `useTransition`.                                                      |
| Custom tooltip with a per-period breakdown           | charts-component-3 | maybe                          | Only if the reports trend chart gains a second series. The existing `PayrollCostTrend` already shows a legend and figures as text.                                                                               |
| Bar list click-to-filter with removable chip         | charts-component-3 | skip                           | The overview's cost-by-department list already drills into exceptions and is better.                                                                                                                             |
| One card per report in a grid                        | download-03/05     | skip                           | Card soup (directive §41). A grouped list with format badges reads faster and holds 8 reports in less space.                                                                                                     |
| Sidebar checkbox filters with "+N more"              | user-schedule-01   | skip                           | Three filing kinds and one pay group do not need a sidebar.                                                                                                                                                      |
| Month / day carousels for a schedule                 | user-schedule-02   | skip                           | Not calendar-aware; a plain month strip of due dates driven by data is enough.                                                                                                                                   |
| Overflow Share / Export / Refresh menu on every card | all four           | skip                           | Dead chrome.                                                                                                                                                                                                     |

Net: the two new pages are composed from the run queue's own patterns (focal card, year card,
chip-filtered table, sheet inspector) plus the existing chart and timeline primitives. The only
genuinely new interaction is the async export state on the report sheet.

## 6. Out of scope, deliberately

- A second app shell, token set or wrapper primitives (directive §3, §56).
- Installing studio blocks or anything Radix: 25 primitives here are Base UI.
- PDF rendering, a calendar library, a charting library beyond the existing Recharts wrapper.
- Auth: `getCurrentUser()` is a stub until the session exists.
