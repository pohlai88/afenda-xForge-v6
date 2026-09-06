/**
 * ! Seed data for payroll configuration. Swap these exports for real queries when the database
 * ! lands — src/app/server/actions.ts is the only place that reads them.
 *
 * The statutory rates and component codes here are the same ones `pay-runs.ts` calculates
 * with, so the settings screen describes the calculation the workspace actually shows.
 */

// Type Imports
import type { PayrollSettings } from '@/types/payroll/settings-types'

// Data Imports
import { activeEmployees } from '@/fake-db/hrm/employees'

export const payrollSettings: PayrollSettings = {
  general: {
    entityName: 'Afenda Pte. Ltd.',
    registrationNumber: '201912345K',
    defaultCurrency: 'SGD',
    timezone: 'Asia/Singapore',
    payslipSender: 'payroll@afenda.com',
    rounding: 'nearest_cent'
  },

  payGroups: [
    {
      id: 'pg-sg-monthly',
      name: 'SG Monthly',
      entity: 'Afenda Pte. Ltd.',
      currency: 'SGD',
      frequency: 'monthly',
      paydayRule: '28th, or the previous working day',
      cutoffDaysBeforePayday: 4,
      employeeCount: activeEmployees.length,
      active: true
    },
    {
      id: 'pg-my-monthly',
      name: 'MY Monthly',
      entity: 'Afenda Malaysia Sdn. Bhd.',
      currency: 'MYR',
      frequency: 'monthly',
      paydayRule: 'Last working day',
      cutoffDaysBeforePayday: 5,
      employeeCount: 0,
      active: false
    }
  ],

  schedules: [
    {
      id: 'sch-2026-08',
      payGroupId: 'pg-sg-monthly',
      label: 'August 2026',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      cutoff: '2026-08-25',
      payDate: '2026-08-28',
      status: 'closed'
    },
    {
      id: 'sch-2026-09',
      payGroupId: 'pg-sg-monthly',
      label: 'September 2026',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      cutoff: '2026-09-24',
      payDate: '2026-09-28',
      status: 'open'
    },
    {
      id: 'sch-2026-10',
      payGroupId: 'pg-sg-monthly',
      label: 'October 2026',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      cutoff: '2026-10-23',
      payDate: '2026-10-28',
      status: 'upcoming'
    },
    {
      id: 'sch-2026-11',
      payGroupId: 'pg-sg-monthly',
      label: 'November 2026',
      periodStart: '2026-11-01',
      periodEnd: '2026-11-30',
      cutoff: '2026-11-24',
      payDate: '2026-11-27',
      status: 'upcoming'
    },
    {
      id: 'sch-2026-12',
      payGroupId: 'pg-sg-monthly',
      label: 'December 2026',
      periodStart: '2026-12-01',
      periodEnd: '2026-12-31',
      cutoff: '2026-12-22',
      payDate: '2026-12-24',
      status: 'upcoming'
    }
  ],

  components: [
    {
      code: 'BASE',
      label: 'Base salary',
      kind: 'earning',
      taxable: true,
      contributable: true,
      glAccount: '6100',
      active: true
    },
    {
      code: 'OT15',
      label: 'Overtime 1.5x',
      kind: 'earning',
      taxable: true,
      contributable: true,
      glAccount: '6110',
      active: true
    },
    {
      code: 'SHIFT',
      label: 'Shift allowance',
      kind: 'earning',
      taxable: true,
      contributable: true,
      glAccount: '6120',
      active: true
    },
    {
      code: 'BONUS',
      label: 'Bonus',
      kind: 'earning',
      taxable: true,
      contributable: false,
      glAccount: '6130',
      active: false
    },
    {
      code: 'TAX',
      label: 'Income tax',
      kind: 'tax',
      taxable: false,
      contributable: false,
      glAccount: '2310',
      active: true
    },
    {
      code: 'CPF_EE',
      label: 'CPF (employee)',
      kind: 'deduction',
      taxable: false,
      contributable: false,
      glAccount: '2320',
      active: true
    },
    {
      code: 'CPF_ER',
      label: 'CPF (employer)',
      kind: 'employer_contribution',
      taxable: false,
      contributable: false,
      glAccount: '6200',
      active: true
    }
  ],

  statutory: [
    {
      id: 'stat-cpf-ee',
      name: 'CPF — employee contribution',
      party: 'employee',
      rate: 20,
      ceiling: { amount: 680000, currency: 'SGD' },
      effectiveFrom: '2026-01-01'
    },
    {
      id: 'stat-cpf-er',
      name: 'CPF — employer contribution',
      party: 'employer',
      rate: 17,
      ceiling: { amount: 680000, currency: 'SGD' },
      effectiveFrom: '2026-01-01'
    },
    {
      id: 'stat-tax',
      name: 'Income tax withholding (standard rate)',
      party: 'employee',
      rate: 15,
      ceiling: null,
      effectiveFrom: '2026-01-01'
    }
  ],

  accounting: [
    {
      componentCode: 'BASE',
      debitAccount: '6100 · Salaries',
      creditAccount: '2100 · Salaries payable',
      splitByCostCentre: true
    },
    {
      componentCode: 'OT15',
      debitAccount: '6110 · Overtime',
      creditAccount: '2100 · Salaries payable',
      splitByCostCentre: true
    },
    {
      componentCode: 'SHIFT',
      debitAccount: '6120 · Allowances',
      creditAccount: '2100 · Salaries payable',
      splitByCostCentre: true
    },
    {
      componentCode: 'TAX',
      debitAccount: '2100 · Salaries payable',
      creditAccount: '2310 · Tax payable',
      splitByCostCentre: false
    },
    {
      componentCode: 'CPF_EE',
      debitAccount: '2100 · Salaries payable',
      creditAccount: '2320 · CPF payable',
      splitByCostCentre: false
    },
    {
      componentCode: 'CPF_ER',
      debitAccount: '6200 · Employer CPF',
      creditAccount: '2320 · CPF payable',
      splitByCostCentre: true
    }
  ],

  approvals: {
    secondApproverAbove: { amount: 50_000_000, currency: 'SGD' },
    approverRoles: ['Finance lead', 'Payroll manager'],
    requireWarningsAcknowledged: true,
    blockOnErrors: true,
    lockInputsOnApproval: true
  },

  notifications: [
    {
      key: 'cutoff',
      label: 'Cut-off approaching',
      description: 'Two working days before inputs close for a run.',
      email: true,
      inApp: true
    },
    {
      key: 'blocker',
      label: 'Blocking exception raised',
      description: 'Whenever a calculation raises something that stops approval.',
      email: true,
      inApp: true
    },
    {
      key: 'approval',
      label: 'Run awaiting approval',
      description: 'When a run reaches Approve and you are an approver.',
      email: true,
      inApp: true
    },
    {
      key: 'payment-returned',
      label: 'Payment returned or failed',
      description: 'When the bank returns or rejects a payment.',
      email: true,
      inApp: true
    },
    {
      key: 'digest',
      label: 'Weekly payroll digest',
      description: 'Open exceptions, upcoming deadlines and last week’s changes.',
      email: false,
      inApp: false
    }
  ],

  access: [
    {
      id: 'role-payroll-admin',
      name: 'Payroll administrator',
      description: 'Runs payroll end to end, including settings.',
      memberCount: 2,
      permissions: ['Run payroll', 'Edit inputs', 'Approve', 'Release payments', 'Edit settings']
    },
    {
      id: 'role-finance-approver',
      name: 'Finance approver',
      description: 'Reviews and approves runs; cannot edit inputs.',
      memberCount: 2,
      permissions: ['View runs', 'Approve', 'Release payments']
    },
    {
      id: 'role-hr',
      name: 'HR partner',
      description: 'Maintains employee data and clears data exceptions.',
      memberCount: 3,
      permissions: ['View runs', 'Edit inputs', 'Resolve exceptions']
    },
    {
      id: 'role-auditor',
      name: 'Auditor',
      description: 'Read-only access to every run and its audit trail.',
      memberCount: 1,
      permissions: ['View runs', 'View audit']
    }
  ]
}
