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
          required: true,
          movable: false,
          allowedSizes: ['half', 'two-thirds', 'full'],
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
          required: true,
          movable: false,
          allowedSizes: ['one-third', 'half'],
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

          // A row of metrics, laid out side by side. Below two-thirds they stack and it stops being
          // a strip, which is the only thing it is.
          allowedSizes: ['two-thirds', 'full'],
          defaultSize: 'full',
          content: <PayrollKpiStrip metrics={parts.metrics} caption={parts.kpiCaption} />
        },
        {
          id: 'gross-to-net',
          title: 'Gross to net',
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
          required: true,
          movable: false,
          allowedSizes: ['one-third', 'half'],
          defaultSize: 'one-third',
          content: <PaymentReadiness percent={parts.readiness.percent} checks={parts.readiness.checks} />
        },
        {
          id: 'run-history',
          title: 'Run history',

          // The table engine. Narrowed, a table does not become smaller, it becomes worse: the
          // columns that get dropped are the ones the reader came for.
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

          // Two series over six runs against a shared axis. At half width the run labels collide.
          allowedSizes: ['two-thirds', 'full'],
          defaultSize: 'full',
          content: <PayrollCostTrend points={parts.costTrend} currencySymbol={parts.currencySymbol} />
        }
      ]
    }
  ]
})
