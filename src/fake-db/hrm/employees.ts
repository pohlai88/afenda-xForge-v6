/**
 * ! Seed data for the HRM module. Swap these exports for real queries when the database
 * ! lands — src/app/server/actions.ts is the only place that reads them.
 *
 * Currency is SGD and the statutory components are named for CPF. Both are one-line changes
 * if this company runs somewhere else; nothing downstream depends on the choice.
 */

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

export const departments: Department[] = [
  { id: 'dept-eng', name: 'Engineering', code: 'ENG', costCenter: 'CC-1000', headEmployeeId: 'emp-001' },
  { id: 'dept-sales', name: 'Sales', code: 'SLS', costCenter: 'CC-2000', headEmployeeId: 'emp-009' },
  { id: 'dept-ops', name: 'Operations', code: 'OPS', costCenter: 'CC-3000', headEmployeeId: 'emp-015' },
  { id: 'dept-fin', name: 'Finance', code: 'FIN', costCenter: 'CC-4000', headEmployeeId: 'emp-020' },
  { id: 'dept-people', name: 'People', code: 'PPL', costCenter: 'CC-5000', headEmployeeId: 'emp-023' },
  { id: 'dept-support', name: 'Customer Support', code: 'SUP', costCenter: 'CC-6000', headEmployeeId: 'emp-026' }
]

export const locations: WorkLocation[] = [
  { id: 'loc-sg', name: 'Singapore HQ', country: 'Singapore', timezone: 'Asia/Singapore' },
  { id: 'loc-kl', name: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  { id: 'loc-remote', name: 'Remote (APAC)', country: 'Singapore', timezone: 'Asia/Singapore' }
]

type Seed = {
  n: number
  first: string
  last: string
  dept: string
  title: string

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

const buildCompensation = (seed: Seed): Compensation => ({
  basis: seed.hourly ? 'hourly' : 'annual',
  amount: { amount: Math.round(seed.salary * 100), currency: 'SGD' },
  effectiveFrom: '2026-01-01'
})

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

      // emp-013 has no bank details on file — this is what raises the blocking exception
      // on the open pay run, so the dashboard has something real to surface.
      bankAccountLast4: seed.n === 13 ? undefined : String(4000 + seed.n * 7).slice(-4),
      taxIdentifierLast4: seed.n === 22 ? undefined : String(8000 + seed.n * 3).slice(-4)
    },
    createdAt: `${seed.hired}T00:00:00.000Z`,
    updatedAt: '2026-09-01T09:00:00.000Z'
  }
}

const seeds: Seed[] = [
  { n: 1, first: 'Priya', last: 'Raman', dept: 'dept-eng', title: 'VP Engineering', salary: 228000, hired: '2019-02-04' },
  { n: 2, first: 'Marcus', last: 'Tan', dept: 'dept-eng', title: 'Staff Engineer', salary: 168000, hired: '2020-06-15', manager: 'emp-001' },
  { n: 3, first: 'Amara', last: 'Okafor', dept: 'dept-eng', title: 'Senior Engineer', salary: 138000, hired: '2021-09-01', manager: 'emp-001' },
  { n: 4, first: 'Wei', last: 'Lim', dept: 'dept-eng', title: 'Senior Engineer', salary: 132000, hired: '2022-03-14', manager: 'emp-001' },
  { n: 5, first: 'Diego', last: 'Santos', dept: 'dept-eng', title: 'Engineer', salary: 96000, hired: '2024-01-08', manager: 'emp-002' },
  { n: 6, first: 'Hana', last: 'Kimura', dept: 'dept-eng', title: 'Engineer', salary: 92000, hired: '2024-07-22', manager: 'emp-002' },
  { n: 7, first: 'Tomas', last: 'Novak', dept: 'dept-eng', title: 'Junior Engineer', salary: 66000, hired: '2026-02-02', manager: 'emp-002', status: 'onboarding' },
  { n: 8, first: 'Leila', last: 'Haddad', dept: 'dept-eng', title: 'QA Engineer', salary: 84000, hired: '2023-05-19', manager: 'emp-001', loc: 'loc-kl' },

  { n: 9, first: 'Grace', last: 'Chen', dept: 'dept-sales', title: 'VP Sales', salary: 210000, hired: '2019-08-12' },
  { n: 10, first: 'Owen', last: 'Fitzgerald', dept: 'dept-sales', title: 'Account Executive', salary: 108000, hired: '2022-11-07', manager: 'emp-009' },
  { n: 11, first: 'Sofia', last: 'Marino', dept: 'dept-sales', title: 'Account Executive', salary: 104000, hired: '2023-02-20', manager: 'emp-009' },
  { n: 12, first: 'Kwame', last: 'Mensah', dept: 'dept-sales', title: 'Sales Development Rep', salary: 72000, hired: '2025-04-01', manager: 'emp-009', loc: 'loc-kl' },
  { n: 13, first: 'Yuki', last: 'Tanaka', dept: 'dept-sales', title: 'Sales Development Rep', salary: 70000, hired: '2026-06-15', manager: 'emp-009', status: 'onboarding' },
  { n: 14, first: 'Ravi', last: 'Menon', dept: 'dept-sales', title: 'Solutions Consultant', salary: 118000, hired: '2021-10-04', manager: 'emp-009' },

  { n: 15, first: 'Nadia', last: 'Petrova', dept: 'dept-ops', title: 'Head of Operations', salary: 176000, hired: '2020-01-20' },
  { n: 16, first: 'Julian', last: 'Reyes', dept: 'dept-ops', title: 'Operations Manager', salary: 112000, hired: '2022-08-15', manager: 'emp-015' },
  { n: 17, first: 'Farah', last: 'Aziz', dept: 'dept-ops', title: 'Logistics Coordinator', salary: 68000, hired: '2023-11-06', manager: 'emp-016', loc: 'loc-kl' },
  { n: 18, first: 'Bram', last: 'de Vries', dept: 'dept-ops', title: 'Warehouse Lead', salary: 58000, hired: '2024-04-29', manager: 'emp-016' },
  { n: 19, first: 'Ines', last: 'Cardoso', dept: 'dept-ops', title: 'Warehouse Associate', salary: 42000, hired: '2025-01-13', manager: 'emp-018', type: 'part_time', fte: 0.6 },

  { n: 20, first: 'Ahmed', last: 'Karim', dept: 'dept-fin', title: 'Finance Director', salary: 195000, hired: '2019-11-11' },
  { n: 21, first: 'Clara', last: 'Bianchi', dept: 'dept-fin', title: 'Financial Analyst', salary: 98000, hired: '2023-07-03', manager: 'emp-020' },
  { n: 22, first: 'Samuel', last: 'Adeyemi', dept: 'dept-fin', title: 'Payroll Specialist', salary: 86000, hired: '2024-09-16', manager: 'emp-020' },

  { n: 23, first: 'Mei', last: 'Wong', dept: 'dept-people', title: 'Head of People', salary: 164000, hired: '2020-09-07' },
  { n: 24, first: 'Oliver', last: 'Brandt', dept: 'dept-people', title: 'Talent Partner', salary: 92000, hired: '2023-03-27', manager: 'emp-023' },
  { n: 25, first: 'Zara', last: 'Iqbal', dept: 'dept-people', title: 'People Operations', salary: 74000, hired: '2025-06-02', manager: 'emp-023' },

  { n: 26, first: 'Lucas', last: 'Moreau', dept: 'dept-support', title: 'Support Manager', salary: 102000, hired: '2021-05-17' },
  { n: 27, first: 'Aisha', last: 'Rahman', dept: 'dept-support', title: 'Support Specialist', salary: 62000, hired: '2024-02-12', manager: 'emp-026', loc: 'loc-remote' },
  { n: 28, first: 'Nikolai', last: 'Volkov', dept: 'dept-support', title: 'Support Specialist', salary: 60000, hired: '2025-08-25', manager: 'emp-026', loc: 'loc-remote' },
  { n: 29, first: 'Elena', last: 'Rossi', dept: 'dept-support', title: 'Support Specialist', salary: 61000, hired: '2024-10-01', manager: 'emp-026', type: 'contract' },

  // Leavers — kept on file so turnover and first-year attrition are computable.
  { n: 30, first: 'Peter', last: 'Nowak', dept: 'dept-eng', title: 'Engineer', salary: 94000, hired: '2024-11-04', status: 'terminated', left: '2026-05-30', reason: 'voluntary' },
  { n: 31, first: 'Sinead', last: "O'Connor", dept: 'dept-sales', title: 'Account Executive', salary: 100000, hired: '2025-09-15', status: 'terminated', left: '2026-06-28', reason: 'voluntary' },
  { n: 32, first: 'Hassan', last: 'Al-Farsi', dept: 'dept-ops', title: 'Operations Analyst', salary: 78000, hired: '2023-01-09', status: 'terminated', left: '2026-03-31', reason: 'involuntary' },
  { n: 33, first: 'Marta', last: 'Kowalski', dept: 'dept-support', title: 'Support Specialist', salary: 58000, hired: '2025-11-03', status: 'terminated', left: '2026-07-31', reason: 'voluntary' },
  { n: 34, first: 'George', last: 'Papadopoulos', dept: 'dept-fin', title: 'Accountant', salary: 88000, hired: '2018-04-16', status: 'terminated', left: '2026-02-27', reason: 'retirement' },
  { n: 35, first: 'Anya', last: 'Sharma', dept: 'dept-eng', title: 'Contract Engineer', salary: 90000, hired: '2025-10-01', status: 'terminated', left: '2026-04-30', reason: 'end_of_contract', type: 'contract' },

  // On leave — counted in headcount, excluded from nothing, but visible to HR.
  { n: 36, first: 'Camille', last: 'Dubois', dept: 'dept-eng', title: 'Senior Engineer', salary: 130000, hired: '2022-01-24', manager: 'emp-001', status: 'on_leave' },
  { n: 37, first: 'Ben', last: 'Carter', dept: 'dept-sales', title: 'Account Executive', salary: 106000, hired: '2023-08-14', manager: 'emp-009', status: 'notice_period' }
]

export const employees: Employee[] = seeds.map(build)

export const activeEmployees = employees.filter(e => e.status !== 'terminated')
