// Type Imports
import type { CountryCode, CurrencyCode, IsoDate, Money } from '@/types/common/primitive-types'

/**
 * How a country's statutory contributions and withholding are calculated.
 *
 * These profiles are **simplified and illustrative**. Real CPF, EPF and Vietnamese social
 * insurance are banded by age, wage and residency status, and withholding follows a table rather
 * than a flat rate. What matters for the frontend is that the calculation is driven by a
 * per-country record instead of constants hard-coded for one country, so a Malaysian payslip
 * shows EPF and SOCSO rather than CPF.
 *
 * The Statutory Pack Center is the surface that will own the real thing: versioned packs with
 * effective dates, impact simulation before adoption, and governed overrides. Nothing here is
 * editable law, and nothing here should be presented to a user as compliance.
 */

export interface StatutoryContribution {
  /** Component code written onto the payslip, e.g. 'CPF_EE', 'EPF_ER'. */
  code: string

  label: string
  party: 'employee' | 'employer'

  /** Percentage of contributable wages, e.g. 20 for 20%. */
  rate: number

  /**
   * Monthly contributable-wage ceiling in the profile's currency. Null means uncapped.
   * Wages above the ceiling do not attract the contribution.
   */
  ceiling: Money | null
}

export interface StatutoryProfile {
  id: string
  countryCode: CountryCode

  /** Every rate and ceiling in the profile is denominated in this. */
  currency: CurrencyCode

  /** Shown wherever the profile is named, e.g. 'Singapore · CPF (simplified)'. */
  label: string

  contributions: StatutoryContribution[]

  /** Flat withholding on gross less employee contributions. Simplified on purpose. */
  tax: {
    code: string
    label: string
    rate: number
  }

  /** Hours in a standard month, used to derive an hourly rate for overtime. */
  monthlyHours: number

  effectiveFrom: IsoDate
}
