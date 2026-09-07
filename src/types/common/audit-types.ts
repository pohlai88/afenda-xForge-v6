/**
 * One thing that happened, as the record proves it.
 *
 * Six fields, none of which knows what a pay run is: when, who, what, and a line of detail. That is
 * why this lives here rather than in a domain — it was already the shape three different payroll
 * modules produced (`auditEvents` for a run, `filingAuditEvents` for a statutory return,
 * `settlementEvents` for a bank payment) and the shape one shared timeline consumed. 360 Query is
 * simply the fourth reader, and the alternative — a parallel event DTO for it to map into — would
 * have been a second vocabulary for exactly the same six fields.
 *
 * It stays deliberately thin. There is no metadata bag, no severity, no link and no payload: an
 * event is evidence to read, and anything richer belongs to the domain that owns the record.
 *
 * `@/types/payroll/run-workspace-types` re-exports it, so every existing importer is unchanged.
 */

import type { IsoDateTime } from '@/types/common/primitive-types'

export interface AuditEvent {
  id: string
  at: IsoDateTime

  /**
   * Who did it, already resolved to a name.
   *
   * A person where the record stores one, and the system that acted where it does not — 'Payroll
   * engine', 'Bank'. Never invented: an unattributed change reads 'Unknown' rather than borrowing
   * the nearest actor.
   */
  actor: string

  /** What happened, as a short phrase. */
  action: string

  /** One line of supporting evidence, when the record carries any. */
  detail?: string

  /** What sort of event it is, which is how a timeline decides its mark. */
  kind: 'system' | 'user' | 'exception' | 'approval'
}
