# Payroll module

Payroll is a module inside the existing AdminCN application, not a second app. It uses the app
shell, sidebar, header, theme, `src/components/ui` primitives, TanStack Table conventions and
server-action data access exactly as the rest of the app does. There is no payroll token system,
no wrapper components, and no payroll-only layout.

## Routes

| Route                   | Status | What it is                                                                                   |
| ----------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `/payroll`              | built  | Overview dashboard (the former `/dashboard/payroll`, which now redirects).                   |
| `/payroll/runs`         | built  | Run queue: the run that needs working, the year so far, every run. Rows open the workspace.  |
| `/payroll/runs/[runId]` | built  | **The operations workspace.** Most of a payroll cycle happens here.                          |
| `/payroll/payments`     | built  | Payment centre: funding vs obligation, readiness gates, batches, every settlement, re-issue. |
| `/payroll/compliance`   | built  | Statutory filings per run: next due, the year so far, every filing, inspector with actions.  |
| `/payroll/reports`      | built  | Eight reports from the same aggregations the screens use; CSV and Excel; recent exports.     |
| `/payroll/settings`     | built  | Ten sections in the account-settings pattern, `?section=` in the URL.                        |

Importing inputs is not a route: it is the **Import inputs** dialog on the run workspace header
(Upload → Validate → Review → Import), so the file lands on the run it belongs to.

`runId` accepts the run id (`run-2026-09`) or the reference (`PR-2026-09`).

## Layers

```
src/types/payroll/pay-run-types.ts        domain: PayRun, Payslip, PayRunException
src/types/payroll/run-workspace-types.ts  view models: PayrollRunRow, PayVarianceLine, AuditEvent…
src/types/payroll/run-queue-types.ts      view models: PayRunQueueRow, RunQueueSummary
src/fake-db/payroll/pay-runs.ts           seed (computed from the employee seed; swap for queries)
src/app/server/actions.ts                 the only place that reads the seed
src/utils/payroll-metrics.ts              run-level aggregations + status/severity vocabularies
src/utils/payroll-workspace.ts            row builder, variance, inputs, source trace, audit, recon
src/utils/payroll-queue.ts                queue rows, lifecycle vocabulary, year summary, CSV export
src/types/payroll/compliance-types.ts     domain + view models: StatutoryFiling, FilingRow, ComplianceSummary
src/fake-db/payroll/filings.ts            seed computed from payslip components (CPF_EE, CPF_ER, TAX)
src/utils/payroll-compliance.ts           filing vocabulary, rows, summary, the transition rule, audit, CSV
src/types/payroll/report-types.ts         ReportDefinition, ReportTable(s), ReportExport
src/utils/payroll-reports.ts              the catalogue and every report's builder (server)
src/utils/export-report-utils.ts          CSV / Excel file writing (browser)
src/views/dashboards/payroll/*            overview dashboard blocks
src/views/payroll/run/*                   the workspace and its domain components
src/views/payroll/runs/*                  the run queue: focal run, year to date, run table
src/views/payroll/compliance/*            focal filing, year, filings table, inspector, stage rail
src/views/payroll/reports/*               catalogue, report sheet (parameters + preview), recent exports
src/types/payroll/settlement-types.ts     payments: FundingAccount, SettlementBatch, Settlement
src/fake-db/payroll/settlements.ts        seed, one settlement per payslip, computed from pay-runs
src/utils/payroll-payments.ts             settlement rows, funding summary, readiness gates, timeline
src/views/payroll/payments/*              funding summary, readiness, batches, table, inspector
src/types/payroll/settings-types.ts       configuration shapes, one per settings section
src/fake-db/payroll/settings.ts           seed — the same rates and codes pay-runs.ts calculates with
src/views/payroll/settings/*              SettingsSection shell + ten sections + tabs
src/views/payroll/run/payroll-import.tsx  Upload → Validate → Review → Import dialog
```

## Payments

`/payroll/payments` reuses the Payments dashboard's shape with payroll's questions. The headline
is the obligation, not the balance: `FundingSummary` leads with net pay still to release for the
current run and shows the account balance against it. `PaymentReadiness` is four gates (bank
details, approval, funding, file released), each linking to where it gets cleared.
`SettlementBatches` is one row per run; `PaymentsWorkspace` lists open returns and failures first,
then every settlement in a TanStack table, with `SettlementInspector` as a Sheet. Re-issue goes
through the `reissueSettlement` action, following the pattern under Mutations. Status words are
`EmployeePaymentStatus` — the same ones the run workspace's Payment column uses.

## Settings

`/payroll/settings` follows `src/views/pages/user-settings`: a line of tabs, `?section=` in the
URL, each section a two-column `SettingsSection` (Card) with the explanation left and the controls
right. Forms use React Hook Form + Zod with `Field` primitives, exactly like the add-user sheet.
Lists (pay groups, banking) edit through a Sheet; grids (components, accounting, notifications)
edit in place with a toast. Access is read-only here and links to Roles & Permissions.

Data flows one way: the page (server component) loads run, previous run, payslips, employees,
departments and locations, joins them once with `buildRunRows`, reads the clock once, and hands
finished rows to `PayrollRunWorkspace` (client). Components render what they are given.

## Vocabularies, decided once

Every status word and colour lives in one map and is imported, never re-decided in a component:

- Run status → `PAY_RUN_STATUS_LABELS/STYLES` (`payroll-metrics.ts`)
- Lifecycle stages → `PAYROLL_STAGES` + `PAYROLL_STAGE_LABELS` + `stageIndexForStatus`
  (Inputs → Calculate → Review → Approve → Pay → Close). The dashboard's status card and the
  workspace stage bar both read these.
- Exception severity → `EXCEPTION_SEVERITY_*` (blocking, error, warning, info). Exception status
  is derived from timestamps by `exceptionStatusOf`, never stored.
- Employee payroll status → `EMPLOYEE_PAYROLL_STATUS_*` (calculated, needs_review, blocked,
  approved, paid). Derived per row from the run status and the person's open exceptions.
- Payment status → `PAYMENT_STATUS_*` (ready, released, processing, paid, returned, failed,
  action_required). This is the settlement vocabulary `/payroll/payments` must reuse.

## Workspace anatomy

```
PayrollRunWorkspace (client)
├── PayrollRunHeader        period, pay group, status, payday countdown, calculation #, actions
├── PayrollStageBar         six-stage lifecycle, not a wizard
├── PayrollMetricRow        employees, gross, net, employer cost, net variance, open exceptions
└── Tabs (URL: ?view=)
    ├── employees           PayrollTableToolbar · PayrollBulkActions · PayrollRunTable
    │                       → PayrollEmployeeDrilldown in place of the table (URL: ?employee=):
    │                         full width, previous/next through the table's order, Back keeps
    │                         the filters and sort
    ├── exceptions          ExceptionSummary · ExceptionList → ExceptionInspector (Sheet)
    ├── reconciliation      PayrollReconciliation (current vs previous, gross-to-net, by
    │                       department, largest movers) — every figure drills into the table
    └── audit               PayrollAuditTimeline
```

The drill-down's cards, left to right: Pay (headline net, tiles, PayBreakdown), Why it changed
(PayVariance), Pay history; Exceptions, Inputs (PayrollInputs), Source trace, Activity. It replaced
a resizable side panel: the panel was capped at the table's height and gave a payslip a third of
the screen, which is not enough room to read one. The old list was: Overview (PayVariance), Pay (PayBreakdown), Inputs (PayrollInputs),
Exceptions, History, Audit (PayrollSourceTrace + timeline).

## Mutations

Every change goes through a server action in `src/app/server/actions.ts`, beside the getters.
One shape, applied everywhere:

1. The client applies the change to its local state at once (the optimistic branch), then calls
   the action inside `useTransition`.
2. The action validates with Zod, refuses business-rule violations with a message in the
   interface's voice ("Payroll cannot be approved. 2 exceptions are still blocking."), mutates
   the in-memory seed, and `revalidatePath`s the routes that read it. Refusals are returned as
   `{ ok: false, message }`, never thrown.
3. On success the client adopts the record the server sends back (its timestamps and actor win);
   on refusal it restores the snapshot and shows the message with `toast.error`.

Actors are stamped server-side from `getCurrentUser()`, a stub for the Finance head until a
session exists. The client's `CURRENT_USER_ID` is only for the optimistic stamp.

| Surface    | Actions                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| workspace  | `acknowledgeException`, `resolveException`, `reopenException`, `acknowledgeWarnings`, `recalculateRun`, `importPayrollInputs`, `markRunReviewed`, `approveRun` |
| payments   | `prepareBatch`, `releaseBatch`, `acknowledgeBatch`, `settleBatch`, `reissueSettlement`                                                                         |
| compliance | `applyFilingTransition` (prepare / submit / accept / reject, via `applyFilingAction`)                                                                          |
| reports    | `recordReportExport`                                                                                                                                           |
| settings   | `savePayrollSettingsSection`, `savePayGroup`, `addFundingAccount`, `setDefaultFundingAccount`                                                                  |

Against the fake-db a change lives for the dev-server process — enough to prove the wiring, and
each action body is the one place to swap for a query. Exports stay client-side: they produce a
file, not a state change.

### One rule: never display a state the domain cannot prove

- **Approval is one policy.** `evaluatePayrollApproval` (`utils/payroll-approval.ts`) reads the run,
  the actor and the Approval settings and returns every blocking reason. The approval dialog lists
  them; `approveRun()` refuses with the first. Neither side has its own copy of the rules.
- **Review is a record.** `PayRun.review` names the calculation it reviewed. `calculated` means
  "not yet reviewed"; `pending_approval` means reviewed. Any recalculation returns the run to
  `calculated`.
- **Stale is a run fact.** Importing inputs sets `PayRun.pendingInputs`; only a calculation clears
  it. While set, the workspace shows a persistent banner and approval is refused.
- **Recalculation recalculates.** `fake-db/payroll/inputs.ts` stores imported rows and rebuilds
  the run's payslips through the same `calculatePayslip` the seed uses, writing a
  `CalculationDiff` on the run.
- **Payment states are recorded events.** A batch moves prepared → released → accepted →
  processing → settled only through its four actions; "paid" on a payslip is the settlement the
  bank confirmed, never the payday passing.
- **Permissions are enforced server-side.** Every action checks one `PayrollPermission`; the
  actor is built from the Access roles in settings. The interface hides what the actor cannot do,
  which is a courtesy, not the gate.

## Rules this module follows

- Money is minor-unit integers, formatted at the edge with `src/utils/money.ts`. No `Intl` in
  server-rendered code, no clock reads inside components.
- Tables are TanStack through the app's existing pattern, dense rows (h-11), right-aligned
  tabular numerals, `aria-sort` via `ariaSortFor`.
- Interactive rows keep a real focusable control (the employee name is a `Button`); the row
  `onClick` is mouse convenience only.
- Skeletons never show `S$0.00` as a placeholder.
- Errors state the consequence: "Payroll cannot be approved. 2 records still have unresolved
  blocking exceptions."
