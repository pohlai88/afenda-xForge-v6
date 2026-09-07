# Audit permission consistency review

**Open.** Raised in Phase 04B, still open after Phase 04D.

`payroll.audit.view` is granted to three roles in `src/fake-db/payroll/settings.ts` — Payroll
administrator, Finance approver, Auditor — and was checked nowhere in `src/` until 360 Query's audit
questions started enforcing it. Six surfaces still show audit or provenance evidence without
checking it.

This note exists so that gap is a decision rather than an oversight. **Do not gate any of them until
each has been classified**, and do not assume the answer is `payroll.audit.view` for all six.

## Surfaces

| #   | Surface                                 | Evidence shown                              | Derived from                        | Gate today |
| --- | --------------------------------------- | ------------------------------------------- | ----------------------------------- | ---------- |
| 1   | Run workspace, `?view=audit` tab        | run history                                 | `auditEvents(run, nameOf)`          | none       |
| 2   | Employee drilldown, Activity            | that employee's slice of the run history    | `auditEvents` filtered              | none       |
| 3   | Employee drilldown, Source trace        | how each pay line was calculated            | `sourceTrace(row, run)`             | none       |
| 4   | Filing inspector, History               | prepared / submitted / accepted or rejected | `filingAuditEvents(filing, nameOf)` | none       |
| 5   | Settlement inspector, History           | the bank's own record of a payment          | `settlementEvents(row, batch)`      | none       |
| 6   | `View audit trail` command on a pay run | links to surface 1                          | `payRunCommands`                    | none       |

Enforced today: the pay run audit question and the settlement audit question in 360 Query, both
server-side in `src/app/server/query-actions.ts`.

## The question to answer first

`payroll.audit.view` reads as _"may read the audit trail"_. Whether that is the right gate differs
per surface, and at least three readings are defensible:

- **Surfaces 1, 4, 5** are audit trails in the plain sense — who did what, when, and what the bank
  or the authority said back. `payroll.audit.view` is the obvious candidate.
- **Surface 3** is not history at all. Source trace answers _how was this figure calculated_, which
  is arguably part of reading a payslip rather than part of reading an audit trail; gating it could
  make the payslip unexplainable to somebody entitled to see the payslip.
- **Surface 2** sits between the two, and its content is a filtered view of surface 1.
- **Surface 6** is a command, not evidence. A command that navigates to a gated surface should
  disappear with it, so it follows whatever surface 1 decides rather than being decided separately.

There is a second question behind all of them: whether a person who may see a pay run but not its
audit trail should see _nothing_ on these surfaces, or see the surface with an explicit refusal.
360 Query answers nothing, because refusal and absence must be indistinguishable when the existence
of a record is itself sensitive. That is not obviously right for a tab the reader navigated to
deliberately.

## Rules for whoever picks this up

- Classify all six before changing any. A gate added surface by surface produces exactly the
  inconsistency this note was opened about.
- The gate belongs in the server action or the page that loads the evidence, never in the component
  that renders it. Presentation is not authorization.
- Hiding a control is a courtesy on top of a refusal, never instead of one.
- Check what a refusal reveals. A differentiated empty state, a count, or a heading with nothing
  under it can each confirm that a record exists.
