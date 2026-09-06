// Type Imports
import type { CountryCode, CurrencyCode } from '@/types/common/primitive-types'

/**
 * A legal entity: the company that employs someone, pays them, and carries the statutory
 * liability for them.
 *
 * This lives in HRM rather than payroll because the legal employer is an employment fact that
 * payroll reads, not a payroll setting. It was previously a free-text name on a pay group and a
 * single `entityName` string in payroll settings, which meant nothing could join to it: no
 * per-entity totals, no per-entity readiness, and no way to state what a group figure included.
 *
 * The country and the currency are properties of the entity, not of the run. A run inherits them.
 */
export interface LegalEntity {
  id: string

  /**
   * Short token used in run identifiers and references: 'SG', 'MY', 'MFG'. Kept separate from
   * the name so a company can be renamed without rewriting the reference of every historical run.
   */
  code: string

  name: string
  countryCode: CountryCode

  /** The currency this entity calculates and pays in. One entity, one payroll currency. */
  currency: CurrencyCode

  /** As registered with the local authority; appears on payslips and statutory filings. */
  registrationNumber: string

  /** IANA zone. Cut-off times are an entity fact, since a period closes in local business hours. */
  timezone: string

  /**
   * Which statutory profile the calculation applies. The Statutory Pack Center will own the
   * versioning of these; today it selects one of a few simplified illustrative profiles.
   */
  statutoryProfileId: string
}
