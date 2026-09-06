/**
 * ! Seed data for payroll configuration. Swap these exports for real queries when the database
 * ! lands — src/app/server/actions.ts is the only place that reads them.
 *
 * The statutory rules and component codes here are DERIVED from the statutory profiles that
 * `pay-runs.ts` calculates with, rather than retyped beside them. The two used to be written out
 * separately and agreed only by hand; a settings screen that describes a calculation the engine
 * is not performing is worse than no settings screen.
 */

// Type Imports
import type {
  PayComponentDefinition,
  PayGroup,
  PaySchedule,
  PayrollSettings,
  StatutoryRule
} from '@/types/payroll/settings-types'

// Data Imports
import { activeEmployees } from '@/fake-db/hrm/employees'
import { legalEntities } from '@/fake-db/hrm/entities'
import { statutoryProfiles } from '@/fake-db/payroll/statutory-profiles'

const countOf = (entityId: string) => activeEmployees.filter(e => e.entityId === entityId).length

/** Payday wording per entity, matching the rule `pay-runs.ts` actually applies. */
const PAYDAY_RULE: Record<string, string> = {
  'ent-sg': '28th, or the previous working day',
  'ent-my': 'Last working day',
  'ent-mfg': 'Last working day',
  'ent-vn': '5th of the following month',
  'ent-feed': '5th of the following month'
}

const CUTOFF_DAYS: Record<string, number> = { 'ent-sg': 4, 'ent-my': 5, 'ent-mfg': 5, 'ent-vn': 7, 'ent-feed': 7 }

const payGroups: PayGroup[] = legalEntities.map(entity => ({
  id: `pg-${entity.code.toLowerCase()}-monthly`,
  name: `${entity.code} Monthly`,
  entityId: entity.id,
  currency: entity.currency,
  frequency: 'monthly' as const,
  paydayRule: PAYDAY_RULE[entity.id],
  cutoffDaysBeforePayday: CUTOFF_DAYS[entity.id],
  employeeCount: countOf(entity.id),
  active: true
}))

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const lastDayOf = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

const isoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const minusDays = (date: string, days: number) => {
  const at = new Date(`${date}T00:00:00.000Z`)

  at.setUTCDate(at.getUTCDate() - days)

  return at.toISOString().slice(0, 10)
}

const SG_PAY_DAY: Record<number, number> = { 8: 28, 9: 28, 10: 28, 11: 27, 12: 24 }

const paydayFor = (entityId: string, year: number, month: number) => {
  if (entityId === 'ent-sg') return isoDate(year, month, SG_PAY_DAY[month] ?? 28)

  if (entityId === 'ent-vn' || entityId === 'ent-feed') {
    return month === 12 ? isoDate(year + 1, 1, 5) : isoDate(year, month + 1, 5)
  }

  return isoDate(year, month, lastDayOf(year, month))
}

/**
 * Schedules for the rest of the year, one series per pay group.
 *
 * September matters more than it looks. Afenda Feed Vietnam has no September run, and without a
 * schedule there would be nothing to separate "the period is open and nobody has run it" from
 * "there is no September". The open schedule is what lets the group surface say the first.
 */
const buildSchedules = (): PaySchedule[] => {
  const built: PaySchedule[] = []

  for (const group of payGroups) {
    for (const month of [8, 9, 10, 11, 12]) {
      const payDate = paydayFor(group.entityId, 2026, month)

      built.push({
        id: `sch-${group.entityId.replace('ent-', '')}-2026-${String(month).padStart(2, '0')}`,
        payGroupId: group.id,
        label: `${MONTH_NAMES[month - 1]} 2026`,
        periodStart: isoDate(2026, month, 1),
        periodEnd: isoDate(2026, month, lastDayOf(2026, month)),
        cutoff: minusDays(payDate, group.cutoffDaysBeforePayday),
        payDate,
        status: month < 9 ? 'closed' : month === 9 ? 'open' : 'upcoming'
      })
    }
  }

  return built
}

/**
 * Statutory rules, flattened from the profiles the engine calculates with.
 *
 * Singapore's ids are pinned to their original values because the compliance inspector selects
 * the rules behind a filing by id prefix. Renaming them would silently empty that panel.
 */
const SG_RULE_ID: Record<string, string> = { CPF_EE: 'stat-cpf-ee', CPF_ER: 'stat-cpf-er' }

const ruleId = (countryCode: string, code: string) =>
  countryCode === 'SG' ? SG_RULE_ID[code] : `stat-${countryCode.toLowerCase()}-${code.toLowerCase().replace(/_/g, '-')}`

const buildStatutoryRules = (): StatutoryRule[] =>
  statutoryProfiles.flatMap(profile => [
    ...profile.contributions.map(rule => ({
      id: ruleId(profile.countryCode, rule.code),
      name: rule.label,
      countryCode: profile.countryCode,
      currency: profile.currency,
      componentCode: rule.code,
      profileId: profile.id,
      party: rule.party,
      rate: rule.rate,
      ceiling: rule.ceiling,
      effectiveFrom: profile.effectiveFrom
    })),
    {
      id: profile.countryCode === 'SG' ? 'stat-tax' : `stat-${profile.countryCode.toLowerCase()}-tax`,
      name: profile.tax.label,
      countryCode: profile.countryCode,
      currency: profile.currency,
      componentCode: profile.tax.code,
      profileId: profile.id,
      party: 'employee' as const,
      rate: profile.tax.rate,
      ceiling: null,
      effectiveFrom: profile.effectiveFrom
    }
  ])

/** Statutory components for every country, so a rule always has a component to post to. */
const statutoryComponents: PayComponentDefinition[] = statutoryProfiles.flatMap(profile =>
  profile.contributions.map(rule => ({
    code: rule.code,
    label: rule.label,
    kind: rule.party === 'employee' ? ('deduction' as const) : ('employer_contribution' as const),
    taxable: false,
    contributable: false,
    glAccount: rule.party === 'employee' ? '2310' : '2330',
    countryCode: profile.countryCode,
    active: true
  }))
)

export const payrollSettings: PayrollSettings = {
  general: {
    groupName: 'Afenda Group',
    homeEntityId: 'ent-sg',
    reportingCurrency: 'SGD',
    fxBasis: 'pay_date_spot',
    payslipSender: 'payroll@afenda.com',
    rounding: 'nearest_cent'
  },

  entities: legalEntities,

  payGroups,

  schedules: buildSchedules(),

  components: [
    ...statutoryComponents,
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
    }

    // CPF, EPF, SOCSO, EIS and the Vietnamese insurances are not listed here: they come from
    // `statutoryComponents` above, derived from the same profiles the engine calculates with.
    // Listing them twice is how a settings screen starts describing a calculation nobody runs.
  ],

  statutory: buildStatutoryRules(),

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
    approverRoles: ['role-payroll-admin', 'role-finance-approver'],
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

  // Membership is by employee id so the server can build an actor from it. The Finance head
  // (emp-020) administers payroll; the payroll specialist (emp-022) prepares and reviews runs.
  access: [
    {
      id: 'role-payroll-admin',
      name: 'Payroll administrator',
      description: 'Runs payroll end to end, including settings.',
      memberIds: ['emp-020', 'emp-022'],
      permissions: [
        'payroll.view',
        'payroll.process',
        'payroll.review',
        'payroll.approve',
        'payroll.payment.release',
        'payroll.payment.reissue',
        'payroll.settings.manage',
        'payroll.report.export',
        'payroll.audit.view'
      ]
    },
    {
      id: 'role-finance-approver',
      name: 'Finance approver',
      description: 'Reviews and approves runs; cannot edit inputs.',
      memberIds: ['emp-020', 'emp-021'],
      permissions: [
        'payroll.view',
        'payroll.approve',
        'payroll.payment.release',
        'payroll.report.export',
        'payroll.audit.view'
      ]
    },
    {
      id: 'role-hr',
      name: 'HR partner',
      description: 'Maintains employee data and clears data exceptions.',
      memberIds: ['emp-005', 'emp-006', 'emp-007'],
      permissions: ['payroll.view', 'payroll.process', 'payroll.review']
    },
    {
      id: 'role-auditor',
      name: 'Auditor',
      description: 'Read-only access to every run and its audit trail.',
      memberIds: ['emp-021'],
      permissions: ['payroll.view', 'payroll.audit.view', 'payroll.report.export']
    }
  ]
}
