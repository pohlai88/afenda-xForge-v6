/**
 * Afenda 360 Query: the contract for "what do I want to know about THIS thing?".
 *
 * Find locates. Properties identifies. Drilldown explains what is already in front of you. This
 * explores what is connected to it — so it starts from an object rather than from a string, and it
 * cannot be asked without one.
 *
 * Three things keep it from becoming a query language. A question is a *stable identity the domain
 * published*, never text the user composed, because nothing here parses language and pretending
 * otherwise would be a lie the interface tells. An answer is a small discriminated union of shapes
 * the app already renders, because a related business object is a `FindResult` and an action is an
 * `ObjectCommand`, and a second version of either would drift from the first. And every question is
 * executed by the domain that owns the relationship, because only payroll knows what an open
 * exception is.
 *
 * Doctrine: `floating_query` (D12) in `.architecture/ux/afenda-ui-ux-doctrine.yaml`.
 */

import type { AuditEvent } from '@/types/common/audit-types'
import type { FindResult } from '@/types/common/find-types'
import type { ObjectContext } from '@/types/common/object-context-types'

/**
 * The SAP half of CRUD-SAP, which `CommandFamily` already names.
 *
 * Declared in full because the vocabulary is the doctrine's, not this phase's. A provider
 * advertises only the modes it can actually answer, and nothing is rendered for a mode no provider
 * offers — support is not the same as show.
 */
export type QueryMode = 'search' | 'audit' | 'predict'

/**
 * One question the domain is prepared to answer about an object.
 *
 * The `id` is what executes; the `label` is only what a person reads. That split is the whole
 * reason there is no free-text query here — typing filters this list, and selecting an entry runs a
 * deterministic query the domain wrote, so the panel never has to pretend it understood a sentence.
 */
export type QuerySuggestion = {
  id: string
  mode: QueryMode
  label: string

  /** Extra words the filter may match, never displayed. */
  keywords?: readonly string[]
}

/**
 * What a question comes back as.
 *
 * Two shapes, both of which already existed. A related business object is a `FindResult`, so a
 * search answer opens and pins exactly like a Find result; a piece of evidence is an `AuditEvent`,
 * so an audit answer renders on the timeline the run, the filing and the payment already use.
 *
 * Neither was invented for 360 Query, and that is the test a third shape has to pass. An action is
 * an `ObjectCommand` and a fact is a Properties field — both already have owners, so neither
 * belongs here. Anything else waits for a real provider that cannot answer without it.
 */
export type QueryAnswer = { kind: 'objects'; items: FindResult[] } | { kind: 'events'; items: AuditEvent[] }

/**
 * A domain's answer to "what can be asked about this type of object, and what does it answer?".
 *
 * Deliberately four fields. It is not an entity registry — the object already exists, and this only
 * teaches 360 Query which questions that type can be asked. There is no schema here, no query
 * language, no aggregation and no authorization: `run` reaches a server action that applies the
 * actor, because presentation is not authorization.
 */
export type QueryProvider = {
  /** The `ObjectContext.type` this answers for. */
  type: string

  /** Modes with at least one real question behind them. Never padded to complete the acronym. */
  modes: readonly QueryMode[]

  /**
   * Which questions this object can actually be asked, right now.
   *
   * Async because availability is a fact about the record, not about the type. A payment that has
   * not failed cannot be asked what else failed for the same reason, and four identity fields are
   * not enough to know that — so the provider asks its own domain, server-side and under the actor,
   * before publishing a question. The alternative was offering the question to everything and
   * answering "not applicable", which is a dead question and worse than no question.
   */
  suggestions: (object: ObjectContext) => Promise<QuerySuggestion[]>

  /** Executes one published question. Unknown ids are the caller's bug, and reject. */
  run: (object: ObjectContext, suggestionId: string) => Promise<QueryAnswer>
}
