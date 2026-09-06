# Payroll — plan against the review (`payroll-review.txt`)

The review's verdict: approve the frontend, do not restructure, and move from "build more
screens" to "make every displayed state operationally true". The one rule for everything below:

> Never display a payroll state that the domain cannot prove.

This plan takes the review's recommended order and marks what is buildable now against the
fake-db, and what is genuinely backend work that the frontend can only prepare for.

## What gets built now, in order

| #   | Review item                             | Status                             | Where                                                                                                                                                                                                                               |
| --- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Approval policy is one authority        | done                              | `utils/payroll-approval.ts` → `evaluatePayrollApproval(run, actor, settings)`; consumed by both `approveRun()` and the approval dialog                                                                                              |
| 2   | Review is a real domain event           | done                              | `PayRun.review` (`PayrollReview`), `markRunReviewed()` action, `calculated → pending_approval` on review, invalidated by any recalculation                                                                                          |
| 3   | Stale calculation is impossible to miss | done                              | `PayRun.pendingInputs` set by import, cleared by recalculation; persistent Alert in the workspace; approval refused while stale                                                                                                     |
| 3b  | Recalculate really recalculates         | done (fake-db)                     | import stores inputs in memory; recalculation rebuilds the run's payslips from employee + inputs, recomputes totals, writes a `CalculationDiff` on the run                                                                          |
| 4   | Payment lifecycle                       | done                              | batch statuses `draft → prepared → released → accepted → processing → settled`; `prepareBatch`, `releaseBatch`, `acknowledgeBatch`, `settleBatch` actions; a release card on `/payroll/payments` with a rail and one primary action |
| 5   | Auth + permissions                      | done (enforcement, stub identity) | `PayrollPermission` keys, role → permission map from the Access settings, `getCurrentUser()` returns an actor with roles + permissions, every mutation checks one permission server-side, UI hides what the actor cannot do         |
| 6   | Real read/write layer                   | **not now**                        | needs a database; Neon MCP failed to connect this session. Action bodies stay the seam                                                                                                                                              |
| 7   | Entity / currency contextual            | done                              | delete `CURRENCY_SYMBOL = 'S$'` from the overview and reports pages; symbol comes from the run's currency via `money.ts`; settings inputs read the entity's default currency                                                        |
| 8   | Dashboard hierarchy                     | done                              | operational first (run, exceptions, KPIs, readiness, run history), then an Analytics section (overtime, department, cost history). "Employees paid" becomes "Employees in run" until settlement proves otherwise                    |
| P1  | Input readiness surface                 | done                              | `inputReadiness(run, rows)` derived from what the calculation actually reads; a Sheet opened from the Inputs stage                                                                                                                  |
| P1  | Persist change sets                     | done                              | `CalculationDiff` on the run, shown in the approval dialog as "Changes since review"                                                                                                                                                |
| P1  | Bulk selection semantics                | done                              | "25 selected · Select all 218 matching these filters" in the bulk bar                                                                                                                                                               |
| P2  | Table scale, mutation concurrency       | **not now**                        | review says do not rebuild prematurely; thresholds noted in README                                                                                                                                                                  |

## Design decisions

- **One vocabulary for roles.** Approval settings' `approverRoles` referenced free-text names
  ("Finance lead") while Access listed different roles ("Finance approver"). They become one
  list: approver roles are Access role ids, and the approvals form offers the Access roles.
- **Review is a status transition, not a flag.** `calculated` means "calculated, not yet
  reviewed"; `pending_approval` means "reviewed, awaiting approval". Recalculation returns the
  run to `calculated`. The stage bar already draws these as Review and Approve.
- **Stale is a run fact.** `pendingInputs` lives on the run, set by the import action, cleared by
  the recalculation action. The client never decides staleness.
- **A refusal is a reason, not an error.** `evaluatePayrollApproval` returns
  `blockingReasons[]` in the interface's voice; the dialog lists them, the action returns the
  first one. Same function, both sides.
- **The batch rail reuses the filing rail's shape.** One convention for "where is this thing in
  its life" across the run workspace, compliance and payments.
- **Nothing new in `src/components/ui`.** Alert, Sheet, Card, Badge, Button, Progress, Table,
  Checkbox cover everything. Studio blocks were read for mechanics only; nothing installed.

## Added on request

- **Employee drill-down instead of a side panel.** The resizable inspector beside the table was
  capped at the table's height and gave a payslip a third of the screen. `?employee=` now swaps
  the table for a full-width drill-down: pay, why it changed and pay history on the left;
  exceptions, inputs, source trace and activity on the right; previous/next through the table's
  current order; Back returns to the same filters.

## Out of scope, stated

- A real backend and session (items 6 and the identity half of 5).
- Bank connectivity: acknowledgement and settlement are recorded, not received.
- Malaysia payroll rules. The currency plumbing is made contextual; the rule pack is not built.
