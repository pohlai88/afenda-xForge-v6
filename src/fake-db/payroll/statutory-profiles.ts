/**
 * ! Seed data for statutory profiles. Swap for real queries when the database lands.
 *
 * These profiles are SIMPLIFIED AND ILLUSTRATIVE. Real contribution schemes are banded by age,
 * wage, residency and scheme election, and withholding follows a published table rather than a
 * flat percentage. Nothing here is compliance, and nothing here should be shown to a user as
 * though it were.
 *
 * What they exist to prove is that the calculation is driven by the entity's country rather than
 * by constants written for one of them: a Malaysian payslip shows EPF, SOCSO and EIS, a
 * Vietnamese one shows social, health and unemployment insurance, and neither shows CPF.
 *
 * The Statutory Pack Center is the surface that will own the real thing — versioned packs, an
 * effective date, an impact simulation before adoption, and governed overrides.
 */

// Type Imports
import type { StatutoryProfile } from '@/types/payroll/statutory-types'
import type { LegalEntity } from '@/types/hrm/entity-types'

export const statutoryProfiles: StatutoryProfile[] = [
  {
    id: 'SG-2026',
    countryCode: 'SG',
    currency: 'SGD',
    label: 'Singapore · CPF (simplified)',
    monthlyHours: 176,
    effectiveFrom: '2026-01-01',
    contributions: [
      {
        code: 'CPF_EE',
        label: 'CPF (employee)',
        party: 'employee',
        rate: 20,
        ceiling: { amount: 680000, currency: 'SGD' }
      },
      {
        code: 'CPF_ER',
        label: 'CPF (employer)',
        party: 'employer',
        rate: 17,
        ceiling: { amount: 680000, currency: 'SGD' }
      }
    ],
    tax: { code: 'TAX', label: 'Income tax withheld', rate: 15 }
  },
  {
    id: 'MY-2026',
    countryCode: 'MY',
    currency: 'MYR',
    label: 'Malaysia · EPF, SOCSO and EIS (simplified)',
    monthlyHours: 176,
    effectiveFrom: '2026-01-01',
    contributions: [
      { code: 'EPF_EE', label: 'EPF (employee)', party: 'employee', rate: 11, ceiling: null },
      { code: 'EPF_ER', label: 'EPF (employer)', party: 'employer', rate: 13, ceiling: null },
      {
        code: 'SOCSO_EE',
        label: 'SOCSO (employee)',
        party: 'employee',
        rate: 0.5,
        ceiling: { amount: 600000, currency: 'MYR' }
      },
      {
        code: 'SOCSO_ER',
        label: 'SOCSO (employer)',
        party: 'employer',
        rate: 1.75,
        ceiling: { amount: 600000, currency: 'MYR' }
      },
      {
        code: 'EIS_EE',
        label: 'EIS (employee)',
        party: 'employee',
        rate: 0.2,
        ceiling: { amount: 600000, currency: 'MYR' }
      },
      {
        code: 'EIS_ER',
        label: 'EIS (employer)',
        party: 'employer',
        rate: 0.2,
        ceiling: { amount: 600000, currency: 'MYR' }
      }
    ],
    tax: { code: 'TAX', label: 'PCB withheld', rate: 12 }
  },
  {
    id: 'VN-2026',
    countryCode: 'VN',
    currency: 'VND',
    label: 'Vietnam · social, health and unemployment insurance (simplified)',
    monthlyHours: 176,
    effectiveFrom: '2026-01-01',
    contributions: [
      { code: 'SI_EE', label: 'Social insurance (employee)', party: 'employee', rate: 8, ceiling: null },
      { code: 'SI_ER', label: 'Social insurance (employer)', party: 'employer', rate: 17.5, ceiling: null },
      { code: 'HI_EE', label: 'Health insurance (employee)', party: 'employee', rate: 1.5, ceiling: null },
      { code: 'HI_ER', label: 'Health insurance (employer)', party: 'employer', rate: 3, ceiling: null },
      { code: 'UI_EE', label: 'Unemployment insurance (employee)', party: 'employee', rate: 1, ceiling: null },
      { code: 'UI_ER', label: 'Unemployment insurance (employer)', party: 'employer', rate: 1, ceiling: null }
    ],
    tax: { code: 'TAX', label: 'PIT withheld', rate: 10 }
  }
]

const byId = new Map(statutoryProfiles.map(profile => [profile.id, profile]))

export const statutoryProfileFor = (entity: LegalEntity): StatutoryProfile => {
  const profile = byId.get(entity.statutoryProfileId)

  if (!profile) throw new Error(`Unknown statutory profile '${entity.statutoryProfileId}'.`)

  if (profile.currency !== entity.currency) {
    throw new Error(`Profile ${profile.id} is in ${profile.currency}; ${entity.name} pays ${entity.currency}.`)
  }

  return profile
}
