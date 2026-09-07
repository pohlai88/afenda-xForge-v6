// Type Imports
import type { PayRun } from '@/types/payroll/pay-run-types'
import type { WorkspaceDefinition } from '@/types/common/workspace-types'
import type { BridgeStep } from '@/utils/payroll-metrics'
import type { ReadinessCheck } from '@/utils/payroll-payments'

// Component Imports
import PayrollByDepartment, { type DepartmentRow } from '@/views/dashboards/payroll/payroll-by-department'
import PayrollCostTrend, { type CostTrendPoint } from '@/views/dashboards/payroll/payroll-cost-trend'
import PayrollExceptionQueue, { type ExceptionRow } from '@/views/dashboards/payroll/payroll-exception-queue'
import PayrollGrossToNet from '@/views/dashboards/payroll/payroll-gross-to-net'
import PayrollKpiStrip, { type KpiMetric } from '@/views/dashboards/payroll/payroll-kpi-strip'
import PayrollOvertimeTrend, { type OvertimePoint } from '@/views/dashboards/payroll/payroll-overtime-trend'
import PayrollRunHistory from '@/views/dashboards/payroll/payroll-run-history'
import PayrollRunStatus from '@/views/dashboards/payroll/payroll-run-status'
import PaymentReadiness from '@/views/payroll/payments/payment-readiness'

type Parts = {
  run: PayRun
  runs: PayRun[]
  basePath: string
  currencySymbol: string
  daysToCutoff: number | null
  blockingCount: number
  exceptions: ExceptionRow[]
  departmentFilter?: { id: string; name: string }
  metrics: KpiMetric[]
  kpiCaption: string
  grossToNet: BridgeStep[]
  readiness: { percent: number; checks: ReadinessCheck[] }
  overtime: { points: OvertimePoint[]; target: number; hours: number; cost: string }
  departments: DepartmentRow[]
  selectedDepartmentId?: string
  costTrend: CostTrendPoint[]
}

/**
 * What one company's payroll workspace is made of.
 *
 * The page still does the joins; this says which of the results are modules, what each one is
 * called, and what a person may truthfully be allowed to do with it. That division is the whole
 * point of the declaration: layout is decided in one place by the shared grid, and every judgement
 * a layout is not entitled to make — whether a warning may be hidden, whether a table survives at a
 * third of the width — is made here, by payroll, next to the components it is about.
 *
 * Two bands, and they were already here before this file was: the workspace opens with what needs
 * acting on and closes with what is worth knowing, under a heading that promises nothing below it
 * needs action today. That promise is why the bands are data rather than a divider — a reorder that
 * lifted a trend chart above the exception queue would make the page lie, and a rule written as a
 * heading cannot stop it.
 *
 * `required` and `movable` are the two things this file says about what a person may do. Required
 * means hiding it would mislead. Immovable means more: an immovable module holds its place, and a
 * movable one may not cross it — so the control band reads as run state and what blocks it, then
 * the figures, then whether the money can move, then the record of previous runs, and shuffling
 * inside those groups cannot turn that sentence into a different one.
 */
export const entityWorkspace = (parts: Parts): WorkspaceDefinition => ({
  id: 'payroll.entity',

  zones: [
    {
      id: 'control',

      modules: [
        {
          id: 'run-status',
          title: 'Run status',

          // The answer to "what state is this in", which orientation requires a workspace to give.
          // It opens the page because it is what the page is about, so it neither hides nor moves.
          //
          // Half was declared legal before anyone had looked at it there. At 468px the gross, tax,
          // deductions and net figures run into each other — `S$284,464.95S$36,787.76` with no gap
          // between two different facts — and the six-step tracker and the reference both wrap.
          required: true,
          movable: false,
          allowedSizes: ['two-thirds', 'full'],
          defaultSize: 'two-thirds',
          content: (
            <PayrollRunStatus run={parts.run} daysToCutoff={parts.daysToCutoff} blockingCount={parts.blockingCount} />
          )
        },
        {
          id: 'exceptions',
          title: 'Exception queue',

          // What is stopping the run. A workspace that let this be hidden would be showing figures
          // it knows to be blocked and saying nothing about it, and one that let it be moved would
          // let the run's state and the reason it cannot proceed stop being read together.
          //
          // Every width is truthful: it is a column of one-line reasons in a fixed-height scroller,
          // so a wider queue is the same rows against a longer measure, with the severity moving to
          // the right where it stays paired with its row. Narrow is the default because it belongs
          // beside the run, not because the others break.
          required: true,
          movable: false,
          allowedSizes: ['one-third', 'half', 'two-thirds', 'full'],
          defaultSize: 'one-third',
          content: (
            <PayrollExceptionQueue
              exceptions={parts.exceptions}
              departmentFilter={parts.departmentFilter}
              runReference={parts.run.reference}
              runId={parts.run.id}
              basePath={parts.basePath}
            />
          )
        },
        {
          id: 'kpi-strip',
          title: 'Headline figures',

          // Three measures read against each other, which is the only thing this is. At half the
          // first sparkline is cut off by its divider, the captions wrap to different depths and
          // the three deltas stop sharing a baseline; at one-third they stack and it is a list.
          allowedSizes: ['two-thirds', 'full'],
          defaultSize: 'full',
          content: <PayrollKpiStrip metrics={parts.metrics} caption={parts.kpiCaption} />
        },
        {
          id: 'gross-to-net',
          title: 'Gross to net',

          // Four labelled steps and a money axis. Verified readable at half; at one-third the
          // steps and the axis have nowhere to go.
          allowedSizes: ['half', 'two-thirds', 'full'],
          defaultSize: 'two-thirds',
          content: <PayrollGrossToNet steps={parts.grossToNet} currencySymbol={parts.currencySymbol} />
        },
        {
          id: 'payment-readiness',
          title: 'Payment readiness',

          // Whether the money can actually move. Hiding it would leave a workspace that looks ready
          // and is not — and it is the last thing this run has to say about itself, so it also
          // holds the line between the run and the record of runs below it.
          //
          // Wider reads better than narrow: each gate and its reason fit on one line. Full width is
          // where it breaks, because the Fix that clears a gate ends up a thousand pixels from the
          // gate it clears, and a remedy that far from its blocker is not the same control.
          required: true,
          movable: false,
          allowedSizes: ['one-third', 'half', 'two-thirds'],
          defaultSize: 'one-third',
          content: <PaymentReadiness percent={parts.readiness.percent} checks={parts.readiness.checks} />
        },
        {
          id: 'run-history',
          title: 'Run history',

          // The table engine. Narrowed, a table does not become smaller, it becomes worse: the
          // columns that get dropped are the ones the reader came for. Measured on this run, the
          // table is 736, 572 and 408 pixels wider than its card at the three narrower widths.
          allowedSizes: ['full'],
          defaultSize: 'full',
          content: (
            <PayrollRunHistory runs={parts.runs} selectedReference={parts.run.reference} basePath={parts.basePath} />
          )
        }
      ]
    },

    {
      id: 'trends',
      title: 'Trends',
      description: 'How this run compares with the six before it. Nothing here needs action today.',

      modules: [
        {
          id: 'overtime-trend',
          title: 'Overtime against target',
          allowedSizes: ['half', 'two-thirds', 'full'],
          defaultSize: 'half',
          content: (
            <PayrollOvertimeTrend
              points={parts.overtime.points}
              target={parts.overtime.target}
              currentHours={parts.overtime.hours}
              currentCost={parts.overtime.cost}
            />
          )
        },
        {
          id: 'by-department',
          title: 'Cost by department',
          allowedSizes: ['half', 'two-thirds', 'full'],
          defaultSize: 'half',
          content: (
            <PayrollByDepartment
              departments={parts.departments}
              runReference={parts.run.reference}
              selectedDepartmentId={parts.selectedDepartmentId}
              basePath={parts.basePath}
            />
          )
        },
        {
          id: 'cost-trend',
          title: 'Cost and headcount',

          // Two series over six runs against a shared axis. At half the chart keeps three of the
          // six run labels and drops the rest, and the bars run past the plot area into the
          // legend — six runs are what it is for, so three of them is a different chart.
          allowedSizes: ['two-thirds', 'full'],
          defaultSize: 'full',
          content: <PayrollCostTrend points={parts.costTrend} currencySymbol={parts.currencySymbol} />
        }
      ]
    }
  ]
})
