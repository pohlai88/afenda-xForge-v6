/**
 * ! Seed data for the HRM module. Swap these exports for real queries when the database
 * ! lands — src/app/server/actions.ts is the only place that reads them.
 *
 * Each employee belongs to a legal entity, and the entity fixes the currency their salary is
 * denominated in. A Malaysian hire is paid in ringgit and a Vietnamese one in dong; nothing in
 * the seed converts between them, because conversion is a reporting concern and belongs to
 * consolidation, not to a payslip.
 */

// Data Imports
import { entityFor } from '@/fake-db/hrm/entities'

// Util Imports
import { fromMajorUnits } from '@/utils/money'

// Type Imports
import type {
  Compensation,
  Department,
  Employee,
  EmploymentStatus,
  EmploymentType,
  TerminationReason,
  WorkLocation
} from '@/types/hrm/employee-types'

/**
 * `parentId` is what makes the structure a hierarchy rather than a flat list. Customer Support
 * reports into Operations here; the other five are top-level and say so by leaving it unset.
 *
 * Undefined means "no parent recorded", and H03 renders that as a root rather than guessing one.
 * Rooting an orphan under whichever department looks plausible would make the tree look complete
 * when it is not, which is the failure `domain_truth` exists to prevent.
 */
export const departments: Department[] = [
  { id: 'dept-eng', name: 'Engineering', code: 'ENG', costCenter: 'CC-1000', headEmployeeId: 'emp-001' },
  { id: 'dept-sales', name: 'Sales', code: 'SLS', costCenter: 'CC-2000', headEmployeeId: 'emp-009' },
  { id: 'dept-ops', name: 'Operations', code: 'OPS', costCenter: 'CC-3000', headEmployeeId: 'emp-015' },
  { id: 'dept-fin', name: 'Finance', code: 'FIN', costCenter: 'CC-4000', headEmployeeId: 'emp-020' },
  { id: 'dept-people', name: 'People', code: 'PPL', costCenter: 'CC-5000', headEmployeeId: 'emp-023' },
  {
    id: 'dept-support',
    name: 'Customer Support',
    code: 'SUP',
    parentId: 'dept-ops',
    costCenter: 'CC-6000',
    headEmployeeId: 'emp-026'
  }
]

export const locations: WorkLocation[] = [
  { id: 'loc-sg', name: 'Singapore HQ', country: 'Singapore', countryCode: 'SG', timezone: 'Asia/Singapore' },
  { id: 'loc-kl', name: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY', timezone: 'Asia/Kuala_Lumpur' },
  { id: 'loc-jb', name: 'Johor Bahru plant', country: 'Malaysia', countryCode: 'MY', timezone: 'Asia/Kuala_Lumpur' },
  { id: 'loc-hcm', name: 'Ho Chi Minh City', country: 'Vietnam', countryCode: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'loc-hanoi', name: 'Hanoi', country: 'Vietnam', countryCode: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'loc-remote', name: 'Remote (APAC)', country: 'Singapore', countryCode: 'SG', timezone: 'Asia/Singapore' }
]

type Seed = {
  n: number
  first: string
  last: string
  dept: string
  title: string

  /** Legal employer. Defaults to the Singapore company, which is where the seed started. */
  entity?: string

  /** Annual salary in major units — converted to minor units below. */
  salary: number
  hired: string
  manager?: string
  status?: EmploymentStatus
  type?: EmploymentType
  fte?: number
  loc?: string
  left?: string
  reason?: TerminationReason
  hourly?: boolean
}

const pad = (n: number) => String(n).padStart(3, '0')

const buildCompensation = (seed: Seed): Compensation => {
  const currency = entityFor(seed.entity ?? 'ent-sg').currency

  return {
    basis: seed.hourly ? 'hourly' : 'annual',
    amount: fromMajorUnits(seed.salary, currency),
    effectiveFrom: '2026-01-01'
  }
}

const build = (seed: Seed): Employee => {
  const status = seed.status ?? 'active'

  return {
    id: `emp-${pad(seed.n)}`,
    employeeNumber: `EMP-${pad(seed.n)}`,
    firstName: seed.first,
    lastName: seed.last,
    workEmail: `${seed.first.toLowerCase()}.${seed.last.toLowerCase()}@afenda.com`,
    avatar: `/images/avatars/avatar-${((seed.n - 1) % 20) + 1}.webp`,
    status,
    employmentType: seed.type ?? 'full_time',
    fte: seed.fte ?? 1,
    entityId: seed.entity ?? 'ent-sg',
    departmentId: seed.dept,
    positionTitle: seed.title,
    managerId: seed.manager,
    locationId: seed.loc ?? 'loc-sg',
    workArrangement: seed.n % 3 === 0 ? 'hybrid' : seed.n % 7 === 0 ? 'remote' : 'onsite',
    hireDate: seed.hired,
    terminationDate: seed.left,
    terminationReason: seed.reason,
    compensation: buildCompensation(seed),
    payroll: {
      payFrequency: 'monthly',
      paymentMethod: 'bank_transfer',

      // A few people have no bank details and no tax identifier on file. These are the gaps
      // that raise the blocking and warning exceptions, so every readiness state on screen is
      // derived from a real record rather than asserted.
      bankAccountLast4: MISSING_BANK_EMPLOYEE_IDS.has(`emp-${pad(seed.n)}`)
        ? undefined
        : String(4000 + seed.n * 7).slice(-4),
      taxIdentifierLast4: MISSING_TAX_ID_EMPLOYEE_IDS.has(`emp-${pad(seed.n)}`)
        ? undefined
        : String(8000 + seed.n * 3).slice(-4)
    },
    createdAt: `${seed.hired}T00:00:00.000Z`,
    updatedAt: '2026-09-01T09:00:00.000Z'
  }
}

const seeds: Seed[] = [
  {
    n: 1,
    first: 'Priya',
    last: 'Raman',
    dept: 'dept-eng',
    title: 'VP Engineering',
    salary: 228000,
    hired: '2019-02-04'
  },
  {
    n: 2,
    first: 'Marcus',
    last: 'Tan',
    dept: 'dept-eng',
    title: 'Staff Engineer',
    salary: 168000,
    hired: '2020-06-15',
    manager: 'emp-001'
  },
  {
    n: 3,
    first: 'Amara',
    last: 'Okafor',
    dept: 'dept-eng',
    title: 'Senior Engineer',
    salary: 138000,
    hired: '2021-09-01',
    manager: 'emp-001'
  },
  {
    n: 4,
    first: 'Wei',
    last: 'Lim',
    dept: 'dept-eng',
    title: 'Senior Engineer',
    salary: 132000,
    hired: '2022-03-14',
    manager: 'emp-001'
  },
  {
    n: 5,
    first: 'Diego',
    last: 'Santos',
    dept: 'dept-eng',
    title: 'Engineer',
    salary: 96000,
    hired: '2024-01-08',
    manager: 'emp-002'
  },
  {
    n: 6,
    first: 'Hana',
    last: 'Kimura',
    dept: 'dept-eng',
    title: 'Engineer',
    salary: 92000,
    hired: '2024-07-22',
    manager: 'emp-002'
  },
  {
    n: 7,
    first: 'Tomas',
    last: 'Novak',
    dept: 'dept-eng',
    title: 'Junior Engineer',
    salary: 66000,
    hired: '2026-02-02',
    manager: 'emp-002',
    status: 'onboarding'
  },
  {
    n: 8,
    first: 'Leila',
    last: 'Haddad',
    dept: 'dept-eng',
    title: 'QA Engineer',
    salary: 84000,
    hired: '2023-05-19',
    manager: 'emp-001',
    loc: 'loc-kl'
  },

  { n: 9, first: 'Grace', last: 'Chen', dept: 'dept-sales', title: 'VP Sales', salary: 210000, hired: '2019-08-12' },
  {
    n: 10,
    first: 'Owen',
    last: 'Fitzgerald',
    dept: 'dept-sales',
    title: 'Account Executive',
    salary: 108000,
    hired: '2022-11-07',
    manager: 'emp-009'
  },
  {
    n: 11,
    first: 'Sofia',
    last: 'Marino',
    dept: 'dept-sales',
    title: 'Account Executive',
    salary: 104000,
    hired: '2023-02-20',
    manager: 'emp-009'
  },
  {
    n: 12,
    first: 'Kwame',
    last: 'Mensah',
    dept: 'dept-sales',
    title: 'Sales Development Rep',
    salary: 72000,
    hired: '2025-04-01',
    manager: 'emp-009',
    loc: 'loc-kl'
  },
  {
    n: 13,
    first: 'Yuki',
    last: 'Tanaka',
    dept: 'dept-sales',
    title: 'Sales Development Rep',
    salary: 70000,
    hired: '2026-06-15',
    manager: 'emp-009',
    status: 'onboarding'
  },
  {
    n: 14,
    first: 'Ravi',
    last: 'Menon',
    dept: 'dept-sales',
    title: 'Solutions Consultant',
    salary: 118000,
    hired: '2021-10-04',
    manager: 'emp-009'
  },

  {
    n: 15,
    first: 'Nadia',
    last: 'Petrova',
    dept: 'dept-ops',
    title: 'Head of Operations',
    salary: 176000,
    hired: '2020-01-20'
  },
  {
    n: 16,
    first: 'Julian',
    last: 'Reyes',
    dept: 'dept-ops',
    title: 'Operations Manager',
    salary: 112000,
    hired: '2022-08-15',
    manager: 'emp-015'
  },
  {
    n: 17,
    first: 'Farah',
    last: 'Aziz',
    dept: 'dept-ops',
    title: 'Logistics Coordinator',
    salary: 68000,
    hired: '2023-11-06',
    manager: 'emp-016',
    loc: 'loc-kl'
  },
  {
    n: 18,
    first: 'Bram',
    last: 'de Vries',
    dept: 'dept-ops',
    title: 'Warehouse Lead',
    salary: 58000,
    hired: '2024-04-29',
    manager: 'emp-016'
  },
  {
    n: 19,
    first: 'Ines',
    last: 'Cardoso',
    dept: 'dept-ops',
    title: 'Warehouse Associate',
    salary: 42000,
    hired: '2025-01-13',
    manager: 'emp-018',
    type: 'part_time',
    fte: 0.6
  },

  {
    n: 20,
    first: 'Ahmed',
    last: 'Karim',
    dept: 'dept-fin',
    title: 'Finance Director',
    salary: 195000,
    hired: '2019-11-11'
  },
  {
    n: 21,
    first: 'Clara',
    last: 'Bianchi',
    dept: 'dept-fin',
    title: 'Financial Analyst',
    salary: 98000,
    hired: '2023-07-03',
    manager: 'emp-020'
  },
  {
    n: 22,
    first: 'Samuel',
    last: 'Adeyemi',
    dept: 'dept-fin',
    title: 'Payroll Specialist',
    salary: 86000,
    hired: '2024-09-16',
    manager: 'emp-020'
  },

  {
    n: 23,
    first: 'Mei',
    last: 'Wong',
    dept: 'dept-people',
    title: 'Head of People',
    salary: 164000,
    hired: '2020-09-07'
  },
  {
    n: 24,
    first: 'Oliver',
    last: 'Brandt',
    dept: 'dept-people',
    title: 'Talent Partner',
    salary: 92000,
    hired: '2023-03-27',
    manager: 'emp-023'
  },
  {
    n: 25,
    first: 'Zara',
    last: 'Iqbal',
    dept: 'dept-people',
    title: 'People Operations',
    salary: 74000,
    hired: '2025-06-02',
    manager: 'emp-023'
  },

  {
    n: 26,
    first: 'Lucas',
    last: 'Moreau',
    dept: 'dept-support',
    title: 'Support Manager',
    salary: 102000,
    hired: '2021-05-17'
  },
  {
    n: 27,
    first: 'Aisha',
    last: 'Rahman',
    dept: 'dept-support',
    title: 'Support Specialist',
    salary: 62000,
    hired: '2024-02-12',
    manager: 'emp-026',
    loc: 'loc-remote'
  },
  {
    n: 28,
    first: 'Nikolai',
    last: 'Volkov',
    dept: 'dept-support',
    title: 'Support Specialist',
    salary: 60000,
    hired: '2025-08-25',
    manager: 'emp-026',
    loc: 'loc-remote'
  },
  {
    n: 29,
    first: 'Elena',
    last: 'Rossi',
    dept: 'dept-support',
    title: 'Support Specialist',
    salary: 61000,
    hired: '2024-10-01',
    manager: 'emp-026',
    type: 'contract'
  },

  // Leavers — kept on file so turnover and first-year attrition are computable.
  {
    n: 30,
    first: 'Peter',
    last: 'Nowak',
    dept: 'dept-eng',
    title: 'Engineer',
    salary: 94000,
    hired: '2024-11-04',
    status: 'terminated',
    left: '2026-05-30',
    reason: 'voluntary'
  },
  {
    n: 31,
    first: 'Sinead',
    last: "O'Connor",
    dept: 'dept-sales',
    title: 'Account Executive',
    salary: 100000,
    hired: '2025-09-15',
    status: 'terminated',
    left: '2026-06-28',
    reason: 'voluntary'
  },
  {
    n: 32,
    first: 'Hassan',
    last: 'Al-Farsi',
    dept: 'dept-ops',
    title: 'Operations Analyst',
    salary: 78000,
    hired: '2023-01-09',
    status: 'terminated',
    left: '2026-03-31',
    reason: 'involuntary'
  },
  {
    n: 33,
    first: 'Marta',
    last: 'Kowalski',
    dept: 'dept-support',
    title: 'Support Specialist',
    salary: 58000,
    hired: '2025-11-03',
    status: 'terminated',
    left: '2026-07-31',
    reason: 'voluntary'
  },
  {
    n: 34,
    first: 'George',
    last: 'Papadopoulos',
    dept: 'dept-fin',
    title: 'Accountant',
    salary: 88000,
    hired: '2018-04-16',
    status: 'terminated',
    left: '2026-02-27',
    reason: 'retirement'
  },
  {
    n: 35,
    first: 'Anya',
    last: 'Sharma',
    dept: 'dept-eng',
    title: 'Contract Engineer',
    salary: 90000,
    hired: '2025-10-01',
    status: 'terminated',
    left: '2026-04-30',
    reason: 'end_of_contract',
    type: 'contract'
  },

  // On leave — counted in headcount, excluded from nothing, but visible to HR.
  {
    n: 36,
    first: 'Camille',
    last: 'Dubois',
    dept: 'dept-eng',
    title: 'Senior Engineer',
    salary: 130000,
    hired: '2022-01-24',
    manager: 'emp-001',
    status: 'on_leave'
  },
  {
    n: 37,
    first: 'Ben',
    last: 'Carter',
    dept: 'dept-sales',
    title: 'Account Executive',
    salary: 106000,
    hired: '2023-08-14',
    manager: 'emp-009',
    status: 'notice_period'
  }
]

/**
 * The other four entities, generated rather than hand-written.
 *
 * Ninety-odd rows typed out by hand would be ninety chances to make a currency or a manager id
 * wrong, and none of them would be more realistic for the effort. Every value below is derived
 * from the row's index, so the seed is identical on every run — which matters, because the
 * screenshots and the reconciliation checks are compared against fixed numbers.
 */
type Cohort = {
  entity: string
  loc: string
  dept: string
  titles: string[]

  /** Annual salary band in the entity's own major units: ringgit for MY, dong for VN. */
  band: [number, number]

  /** Rounded to this, so generated salaries read like salaries rather than like hashes. */
  round: number
  count: number
  lead?: number
}

const MY_FIRST = ['Nurul', 'Aiman', 'Siti', 'Faizal', 'Wei Ling', 'Jun Hao', 'Kavitha', 'Ramesh', 'Azlan', 'Mei Xin']
const MY_LAST = ['Abdullah', 'Ibrahim', 'Tan', 'Lim', 'Subramaniam', 'Rajan', 'Hassan', 'Yeo', 'Chong', 'Zainal']
const VN_FIRST = ['Minh', 'Anh', 'Huong', 'Duc', 'Lan', 'Quang', 'Thao', 'Hieu', 'Trang', 'Khanh']
const VN_LAST = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Dang', 'Bui', 'Do', 'Ngo']

const namesFor = (entity: string) =>
  entity === 'ent-vn' || entity === 'ent-feed' ? { first: VN_FIRST, last: VN_LAST } : { first: MY_FIRST, last: MY_LAST }

const cohorts: Cohort[] = [
  {
    entity: 'ent-my',
    loc: 'loc-kl',
    dept: 'dept-sales',
    titles: ['Country Manager', 'Account Executive', 'Sales Development Rep'],
    band: [72_000, 240_000],
    round: 1_000,
    count: 9,
    lead: 0
  },
  {
    entity: 'ent-my',
    loc: 'loc-kl',
    dept: 'dept-support',
    titles: ['Support Team Lead', 'Support Specialist'],
    band: [48_000, 96_000],
    round: 1_000,
    count: 8,
    lead: 0
  },
  {
    entity: 'ent-my',
    loc: 'loc-kl',
    dept: 'dept-fin',
    titles: ['Finance Manager', 'Accounts Executive'],
    band: [66_000, 150_000],
    round: 1_000,
    count: 4,
    lead: 0
  },
  {
    entity: 'ent-my',
    loc: 'loc-kl',
    dept: 'dept-people',
    titles: ['People Partner'],
    band: [60_000, 96_000],
    round: 1_000,
    count: 3
  },

  {
    entity: 'ent-mfg',
    loc: 'loc-jb',
    dept: 'dept-ops',
    titles: ['Plant Manager', 'Shift Supervisor', 'Line Operator', 'Maintenance Technician'],
    band: [36_000, 180_000],
    round: 1_000,
    count: 24,
    lead: 0
  },
  {
    entity: 'ent-mfg',
    loc: 'loc-jb',
    dept: 'dept-fin',
    titles: ['Cost Accountant'],
    band: [60_000, 96_000],
    round: 1_000,
    count: 2
  },
  {
    entity: 'ent-mfg',
    loc: 'loc-jb',
    dept: 'dept-people',
    titles: ['HR Executive'],
    band: [48_000, 84_000],
    round: 1_000,
    count: 2
  },
  {
    entity: 'ent-mfg',
    loc: 'loc-jb',
    dept: 'dept-eng',
    titles: ['Process Engineer'],
    band: [72_000, 120_000],
    round: 1_000,
    count: 2
  },

  {
    entity: 'ent-vn',
    loc: 'loc-hcm',
    dept: 'dept-eng',
    titles: ['Engineering Lead', 'Senior Engineer', 'Engineer'],
    band: [240_000_000, 1_100_000_000],
    round: 1_000_000,
    count: 10,
    lead: 0
  },
  {
    entity: 'ent-vn',
    loc: 'loc-hcm',
    dept: 'dept-support',
    titles: ['Support Specialist'],
    band: [180_000_000, 420_000_000],
    round: 1_000_000,
    count: 6
  },
  {
    entity: 'ent-vn',
    loc: 'loc-hanoi',
    dept: 'dept-fin',
    titles: ['Finance Executive'],
    band: [240_000_000, 480_000_000],
    round: 1_000_000,
    count: 2
  },

  {
    entity: 'ent-feed',
    loc: 'loc-hanoi',
    dept: 'dept-ops',
    titles: ['Operations Manager', 'Feed Mill Supervisor', 'Mill Operator'],
    band: [180_000_000, 900_000_000],
    round: 1_000_000,
    count: 16,
    lead: 0
  },
  {
    entity: 'ent-feed',
    loc: 'loc-hanoi',
    dept: 'dept-fin',
    titles: ['Accounts Executive'],
    band: [200_000_000, 380_000_000],
    round: 1_000_000,
    count: 2
  },
  {
    entity: 'ent-feed',
    loc: 'loc-hanoi',
    dept: 'dept-people',
    titles: ['HR Executive'],
    band: [180_000_000, 340_000_000],
    round: 1_000_000,
    count: 2
  }
]

const HIRE_YEARS = ['2019', '2020', '2021', '2022', '2023', '2024', '2025']

const generate = (start: number): Seed[] => {
  const generated: Seed[] = []
  let n = start

  // The first row of a cohort marked `lead` manages the rest of it, so reporting lines stay
  // inside one company. A manager in another country would break every org rollup.
  const leadOf = new Map<string, string>()

  for (const cohort of cohorts) {
    const names = namesFor(cohort.entity)
    const spread = cohort.band[1] - cohort.band[0]

    for (let i = 0; i < cohort.count; i++) {
      const isLead = cohort.lead === 0 && i === 0
      const titleIndex = isLead ? 0 : 1 + ((i * 3) % Math.max(1, cohort.titles.length - 1))
      const raw = cohort.band[1] - ((i * 37 + n * 11) % (spread || 1))
      const salary = Math.max(cohort.band[0], Math.round(raw / cohort.round) * cohort.round)
      const key = `${cohort.entity}:${cohort.dept}`

      generated.push({
        n,
        first: names.first[(n * 7) % names.first.length],
        last: names.last[(n * 3) % names.last.length],
        entity: cohort.entity,
        dept: cohort.dept,
        loc: cohort.loc,
        title: cohort.titles[Math.min(titleIndex, cohort.titles.length - 1)],
        salary: isLead ? cohort.band[1] : salary,
        hired: `${HIRE_YEARS[(n * 5) % HIRE_YEARS.length]}-${String(((n * 4) % 12) + 1).padStart(2, '0')}-${String(((n * 6) % 27) + 1).padStart(2, '0')}`,
        manager: isLead ? undefined : leadOf.get(key)
      })

      if (isLead) leadOf.set(key, `emp-${pad(n)}`)
      n++
    }
  }

  return generated
}

const generatedSeeds = generate(38)

// Two planted holes, both needed by the readiness story and nothing else. The first raises the
// blocking exception that leaves Manufacturing unable to advance; the second gives Vietnam a
// warning that has been acknowledged, so "Review" means something other than "untouched".
const mfgNoBank = generatedSeeds.find(seed => seed.entity === 'ent-mfg' && seed.dept === 'dept-ops' && seed.manager)
const vnNoTaxId = generatedSeeds.find(seed => seed.entity === 'ent-vn' && seed.dept === 'dept-eng' && seed.manager)

export const MISSING_BANK_EMPLOYEE_IDS = new Set(['emp-013', mfgNoBank ? `emp-${pad(mfgNoBank.n)}` : ''])
export const MISSING_TAX_ID_EMPLOYEE_IDS = new Set(['emp-022', vnNoTaxId ? `emp-${pad(vnNoTaxId.n)}` : ''])

// One leaver and one new joiner outside Singapore, so group headcount moves for a reason other
// than the Singapore run.
const withMovement = generatedSeeds.map(seed => {
  if (seed.entity === 'ent-my' && seed.dept === 'dept-support' && seed.n % 7 === 3) {
    return {
      ...seed,
      status: 'terminated' as EmploymentStatus,
      left: '2026-06-30',
      reason: 'voluntary' as TerminationReason
    }
  }

  if (seed.entity === 'ent-vn' && seed.dept === 'dept-support' && seed.n % 5 === 0) {
    return { ...seed, hired: '2026-09-01', status: 'onboarding' as EmploymentStatus }
  }

  return seed
})

export const employees: Employee[] = [...seeds, ...withMovement].map(build)

export const activeEmployees = employees.filter(e => e.status !== 'terminated')
