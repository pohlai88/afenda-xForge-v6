/**
 * ! Seed data for legal entities. Swap for real queries when the database lands —
 * ! src/app/server/actions.ts is the only place that reads it.
 *
 * Five companies across three countries and three currencies. The shape of the group is chosen
 * so that consolidation has something real to prove: two entities share a country but not a
 * balance sheet, two share a currency but not a country, and one of them has not calculated
 * September at all.
 */

// Type Imports
import type { LegalEntity } from '@/types/hrm/entity-types'

export const legalEntities: LegalEntity[] = [
  {
    id: 'ent-sg',
    code: 'SG',
    name: 'Afenda Pte. Ltd.',
    countryCode: 'SG',
    currency: 'SGD',
    registrationNumber: '201912345K',
    timezone: 'Asia/Singapore',
    statutoryProfileId: 'SG-2026'
  },
  {
    id: 'ent-my',
    code: 'MY',
    name: 'Afenda Malaysia Sdn. Bhd.',
    countryCode: 'MY',
    currency: 'MYR',
    registrationNumber: '202001234567 (1234567-X)',
    timezone: 'Asia/Kuala_Lumpur',
    statutoryProfileId: 'MY-2026'
  },
  {
    id: 'ent-mfg',
    code: 'MFG',
    name: 'Afenda Manufacturing Sdn. Bhd.',
    countryCode: 'MY',
    currency: 'MYR',
    registrationNumber: '201803009182 (1290182-A)',
    timezone: 'Asia/Kuala_Lumpur',
    statutoryProfileId: 'MY-2026'
  },
  {
    id: 'ent-vn',
    code: 'VN',
    name: 'Afenda Vietnam Co. Ltd.',
    countryCode: 'VN',
    currency: 'VND',
    registrationNumber: '0316482910',
    timezone: 'Asia/Ho_Chi_Minh',
    statutoryProfileId: 'VN-2026'
  },
  {
    id: 'ent-feed',
    code: 'FEED',
    name: 'Afenda Feed Vietnam Co. Ltd.',
    countryCode: 'VN',
    currency: 'VND',
    registrationNumber: '0109774523',
    timezone: 'Asia/Ho_Chi_Minh',
    statutoryProfileId: 'VN-2026'
  }
]

export const entityById = new Map(legalEntities.map(entity => [entity.id, entity]))

/** Throws rather than returning undefined: an unknown entity id in the seed is a seed bug. */
export const entityFor = (entityId: string): LegalEntity => {
  const entity = entityById.get(entityId)

  if (!entity) throw new Error(`Unknown legal entity '${entityId}'.`)

  return entity
}
