// Type Imports
import type { Department, Employee, PaymentMethod, WorkLocation } from '@/types/hrm/employee-types'
import type { PayRun, Payslip } from '@/types/payroll/pay-run-types'
import type { ReportDefinition, ReportFormat, ReportGroup, ReportKey, ReportTables } from '@/types/payroll/report-types'
import type { Settlement } from '@/types/payroll/settlement-types'

// Util Imports
import { formatMoney } from '@/utils/money'
import { PAY_RUN_STATUS_LABELS, changeVsPrevious, costByDepartment } from '@/utils/payroll-metrics'
import {
  EMPLOYEE_PAYROLL_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  buildRunRows,
  formatDate,
  formatPeriod,
  formatSignedMoney,
  formatSignedPercent,
  reconciliationLines
} from '@/utils/payroll-workspace'

/* -------------------------------------------------------------------------------------------- */
/* Catalogue — the one list the page, the sheet and the recent-exports table all read           */
/* -------------------------------------------------------------------------------------------- */

export const REPORT_GROUP_LABELS: Record<ReportGroup, string> = {
  operations: 'Operations',
  finance: 'Finance',
  statutory: 'Statutory',
  banking: 'Banking'
}

export const REPORT_FORMAT_LABELS: Record<ReportFormat, string> = {
  csv: 'CSV',
  xlsx: 'Excel'
}

const BOTH: ReportFormat[] = ['csv', 'xlsx']

export const REPORTS: ReportDefinition[] = [
  {
    key: 'register',
    name: 'Payroll register',
    purpose: 'Every employee on the run: gross, net, change from last run, status.',
    group: 'operations',
    perRun: true,
    formats: BOTH
  },
  {
    key: 'run_summary',
    name: 'Run summary',
    purpose: 'One line per run this year: headcount, gross, net, employer cost, status.',
    group: 'operations',
    perRun: false,
    formats: BOTH
  },
  {
    key: 'overtime',
    name: 'Overtime',
    purpose: 'Who worked overtime on the run, how many hours, and what it cost.',
    group: 'operations',
    perRun: true,
    formats: BOTH
  },
  {
    key: 'gross_to_net',
    name: 'Gross-to-net',
    purpose: 'Employer cost down to net pay, one line per step.',
    group: 'finance',
    perRun: true,
    formats: BOTH
  },
  {
    key: 'cost_by_department',
    name: 'Cost by department',
    purpose: 'Employer cost and headcount per department, with each share of the total.',
    group: 'finance',
    perRun: true,
    formats: BOTH
  },
  {
    key: 'variance',
    name: 'Variance vs previous run',
    purpose: 'Each total against the run before, in money and percent.',
    group: 'finance',
    perRun: true,
    formats: BOTH
  },
  {
    key: 'statutory',
    name: 'Statutory summary',
    purpose: 'CPF employee and employer shares and tax withheld, per employee, with totals.',
    group: 'statutory',
    perRun: true,
    formats: BOTH
  },
  {
    key: 'bank_file',
    name: 'Bank file',
    purpose: 'Every settlement on the run: method, account, amount, reference, status.',
    group: 'banking',
    perRun: true,
    formats: ['csv']
  }
]

export const reportByKey = (key: ReportKey): ReportDefinition => REPORTS.find(report => report.key === key)!

/** 'PR-2026-09-payroll-register.xlsx'. The run goes first so files sort by run in a folder. */
export const reportFileName = (report: ReportDefinition, format: ReportFormat, runReference?: string) =>
  `${runReference ? `${runReference}-` : 'payroll-'}${report.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${format}`

/* -------------------------------------------------------------------------------------------- */
/* Builders — run once on the server for every run                                              */
/* -------------------------------------------------------------------------------------------- */

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
  cash: 'Cash'
}

type Sources = {

  /** Oldest first, as the store returns them. */
  runs: PayRun[]
  employees: Employee[]
  departments: Department[]
  locations: WorkLocation[]
  payslipsByRun: Record<string, Payslip[]>
  settlementsByRun: Record<string, Settlement[]>
}

const runCaption = (run: PayRun) =>
  `${run.reference} · ${formatPeriod(run.periodStart, run.periodEnd)} · ${run.employeeCount} employees`

const right = { align: 'right' as const }

export const buildReportTables = ({
  runs,
  employees,
  departments,
  locations,
  payslipsByRun,
  settlementsByRun
}: Sources): ReportTables => {
  const employeeById = new Map(employees.map(employee => [employee.id, employee]))
  const departmentNames = new Map(departments.map(department => [department.id, department.name]))

  const nameOf = (employeeId: string) => {
    const employee = employeeById.get(employeeId)

    return employee ? `${employee.firstName} ${employee.lastName}` : employeeId
  }

  const component = (slip: Payslip, code: string) =>
    slip.components.find(candidate => candidate.code === code)?.amount.amount ?? 0

  const tables: ReportTables = {
    register: {},
    run_summary: {},
    gross_to_net: {},
    cost_by_department: {},
    variance: {},
    overtime: {},
    statutory: {},
    bank_file: {}
  }

  tables.run_summary.all = {
    caption: `${runs.length} runs · ${runs[0].periodStart.slice(0, 4)}`,
    columns: [
      { key: 'run', label: 'Run' },
      { key: 'period', label: 'Period' },
      { key: 'payday', label: 'Payday' },
      { key: 'employees', label: 'Employees', ...right },
      { key: 'gross', label: 'Gross', ...right },
      { key: 'net', label: 'Net', ...right },
      { key: 'employerCost', label: 'Employer cost', ...right },
      { key: 'status', label: 'Status' }
    ],
    rows: [...runs].reverse().map(run => ({
      run: run.reference,
      period: formatPeriod(run.periodStart, run.periodEnd),
      payday: formatDate(run.payDate),
      employees: run.employeeCount,
      gross: formatMoney(run.totals.grossPay),
      net: formatMoney(run.totals.netPay),
      employerCost: formatMoney(run.totals.employerCost),
      status: PAY_RUN_STATUS_LABELS[run.status]
    }))
  }

  runs.forEach((run, index) => {
    const previous = index > 0 ? runs[index - 1] : undefined
    const slips = payslipsByRun[run.id] ?? []
    const previousSlips = previous ? (payslipsByRun[previous.id] ?? []) : []
    const currency = run.currency
    const money = (amount: number) => formatMoney({ amount, currency })
    const caption = runCaption(run)

    const rows = buildRunRows({ run, slips, previousSlips, employees, departments, locations })

    tables.register[run.id] = {
      caption,
      columns: [
        { key: 'employeeNumber', label: 'Employee number' },
        { key: 'name', label: 'Employee' },
        { key: 'department', label: 'Department' },
        { key: 'gross', label: 'Gross', ...right },
        { key: 'net', label: 'Net', ...right },
        { key: 'variance', label: 'Change vs previous', ...right },
        { key: 'status', label: 'Payroll status' },
        { key: 'payment', label: 'Payment' }
      ],
      rows: rows.map(row => ({
        employeeNumber: row.employeeNumber,
        name: row.name,
        department: row.departmentName,
        gross: formatMoney(row.gross),
        net: formatMoney(row.net),
        variance: row.variance ? formatSignedMoney(row.variance) : 'New',
        status: EMPLOYEE_PAYROLL_STATUS_LABELS[row.payrollStatus],
        payment: PAYMENT_STATUS_LABELS[row.paymentStatus]
      }))
    }

    const { totals } = run

    tables.gross_to_net[run.id] = {
      caption,
      columns: [
        { key: 'line', label: 'Line' },
        { key: 'amount', label: 'Amount', ...right }
      ],
      rows: [
        { line: 'Total employer cost', amount: formatMoney(totals.employerCost) },
        { line: 'Employer contributions', amount: `−${formatMoney(totals.employerContributions)}` },
        { line: 'Gross pay', amount: formatMoney(totals.grossPay) },
        { line: 'Employee statutory', amount: `−${formatMoney(totals.employeeDeductions)}` },
        { line: 'Income tax', amount: `−${formatMoney(totals.employeeTaxes)}` },
        { line: 'Net pay', amount: formatMoney(totals.netPay) }
      ]
    }

    tables.cost_by_department[run.id] = {
      caption,
      columns: [
        { key: 'department', label: 'Department' },
        { key: 'employees', label: 'Employees', ...right },
        { key: 'cost', label: 'Employer cost', ...right },
        { key: 'share', label: 'Share of total', ...right }
      ],
      rows: costByDepartment(slips, employees, departments, currency)
        .filter(department => department.employees > 0)
        .map(department => ({
          department: department.name,
          employees: department.employees,
          cost: formatMoney(department.cost),
          share: `${department.share.toFixed(1)}%`
        }))
    }

    tables.variance[run.id] = {
      caption: previous ? `${caption} · against ${previous.reference}` : `${caption} · first run, nothing to compare`,
      columns: [
        { key: 'line', label: 'Line' },
        { key: 'current', label: 'Current', ...right },
        { key: 'previous', label: 'Previous', ...right },
        { key: 'change', label: 'Change', ...right },
        { key: 'percent', label: 'Change %', ...right }
      ],
      rows: [
        {
          line: 'Employees',
          current: run.employeeCount,
          previous: previous?.employeeCount ?? '—',
          change: previous
            ? `${run.employeeCount - previous.employeeCount >= 0 ? '+' : ''}${run.employeeCount - previous.employeeCount}`
            : '—',
          percent: previous
            ? formatSignedPercent(((run.employeeCount - previous.employeeCount) / previous.employeeCount) * 100)
            : '—'
        },
        ...reconciliationLines(run, previous).map(line => ({
          line: line.label,
          current: formatMoney(line.current),
          previous: line.previous ? formatMoney(line.previous) : '—',
          change: line.previous
            ? formatSignedMoney({ amount: line.current.amount - line.previous.amount, currency })
            : '—',
          percent: formatSignedPercent(changeVsPrevious(line.current, line.previous ?? undefined))
        }))
      ]
    }

    tables.overtime[run.id] = {
      caption,
      columns: [
        { key: 'name', label: 'Employee' },
        { key: 'department', label: 'Department' },
        { key: 'hours', label: 'Hours', ...right },
        { key: 'rate', label: 'Rate', ...right },
        { key: 'amount', label: 'Amount', ...right }
      ],
      rows: slips
        .map(slip => ({ slip, overtime: slip.components.find(candidate => candidate.code === 'OT15') }))
        .filter(({ overtime }) => overtime)
        .sort((a, b) => b.overtime!.amount.amount - a.overtime!.amount.amount)
        .map(({ slip, overtime }) => ({
          name: nameOf(slip.employeeId),
          department: departmentNames.get(employeeById.get(slip.employeeId)?.departmentId ?? '') ?? '—',
          hours: overtime!.quantity ?? slip.hoursOvertime ?? 0,
          rate: overtime!.rate ? formatMoney(overtime!.rate) : '—',
          amount: formatMoney(overtime!.amount)
        }))
    }

    const statutoryRows = slips
      .map(slip => ({
        name: nameOf(slip.employeeId),
        employeeNumber: employeeById.get(slip.employeeId)?.employeeNumber ?? slip.employeeId,
        cpfEmployee: component(slip, 'CPF_EE'),
        cpfEmployer: component(slip, 'CPF_ER'),
        tax: component(slip, 'TAX')
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const statutoryTotal = statutoryRows.reduce(
      (sum, row) => ({
        cpfEmployee: sum.cpfEmployee + row.cpfEmployee,
        cpfEmployer: sum.cpfEmployer + row.cpfEmployer,
        tax: sum.tax + row.tax
      }),
      { cpfEmployee: 0, cpfEmployer: 0, tax: 0 }
    )

    tables.statutory[run.id] = {
      caption,
      columns: [
        { key: 'employeeNumber', label: 'Employee number' },
        { key: 'name', label: 'Employee' },
        { key: 'cpfEmployee', label: 'CPF employee', ...right },
        { key: 'cpfEmployer', label: 'CPF employer', ...right },
        { key: 'tax', label: 'Tax withheld', ...right },
        { key: 'total', label: 'Total', ...right }
      ],
      rows: [
        ...statutoryRows.map(row => ({
          employeeNumber: row.employeeNumber,
          name: row.name,
          cpfEmployee: money(row.cpfEmployee),
          cpfEmployer: money(row.cpfEmployer),
          tax: money(row.tax),
          total: money(row.cpfEmployee + row.cpfEmployer + row.tax)
        })),
        {
          employeeNumber: '',
          name: 'Total',
          cpfEmployee: money(statutoryTotal.cpfEmployee),
          cpfEmployer: money(statutoryTotal.cpfEmployer),
          tax: money(statutoryTotal.tax),
          total: money(statutoryTotal.cpfEmployee + statutoryTotal.cpfEmployer + statutoryTotal.tax)
        }
      ]
    }

    tables.bank_file[run.id] = {
      caption,
      columns: [
        { key: 'employeeNumber', label: 'Employee number' },
        { key: 'name', label: 'Employee' },
        { key: 'method', label: 'Method' },
        { key: 'account', label: 'Account' },
        { key: 'amount', label: 'Amount', ...right },
        { key: 'reference', label: 'Reference' },
        { key: 'status', label: 'Status' }
      ],
      rows: (settlementsByRun[run.id] ?? []).map(settlement => ({
        employeeNumber: employeeById.get(settlement.employeeId)?.employeeNumber ?? settlement.employeeId,
        name: nameOf(settlement.employeeId),
        method: PAYMENT_METHOD_LABELS[settlement.method],
        account: settlement.accountLast4 ? `•••• ${settlement.accountLast4}` : '—',
        amount: formatMoney(settlement.amount),
        reference: settlement.reference ?? '',
        status: PAYMENT_STATUS_LABELS[settlement.status]
      }))
    }
  })

  return tables
}
