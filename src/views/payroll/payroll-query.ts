'use client'

/**
 * Payroll's side of the 360 Query contract: which questions a pay run can be asked, and what
 * answering one actually means.
 *
 * The shared panel in `src/components/shared/QueryPanel.tsx` renders these; it does not know what
 * an exception is, and it must never learn. Everything domain-shaped lives here — the vocabulary,
 * the relationship being traversed, and the server action that applies the actor before returning
 * anything.
 *
 * One question, deliberately. Every question in this file has to be a thing the domain can prove
 * from records it already holds; padding the list to make the panel look capable is how a query
 * surface starts answering questions the data cannot support.
 */

// Type Imports
import type { ObjectContext } from '@/types/common/object-context-types'
import type { QueryAnswer, QueryProvider, QuerySuggestion } from '@/types/common/query-types'

// Action Imports
import {
  payRunCalculationChanges,
  payRunEmployeesWithOpenExceptions,
  payRunQueryCapabilities,
  settlementHistory,
  settlementQueryCapabilities,
  settlementSameReasonFailures
} from '@/app/server/query-actions'

// Find Imports
import { resultsFromHits } from '@/lib/find/find-sources'

const OPEN_EXCEPTIONS = 'open-exceptions'
const CALCULATION_CHANGES = 'calculation-changes'

/**
 * A pay run's questions, and which of them this reader may be offered.
 *
 * Search is unconditional. Audit is not: a reader without audit rights gets nothing from the audit
 * question, and advertising a question whose only possible answer is a refusal is the interface
 * claiming a capability the reader does not have. Hiding it is not the authorization — the action
 * behind it refuses on its own — it is only the difference between offering something and offering
 * something that cannot work.
 */
const payRunSuggestions = async (): Promise<QuerySuggestion[]> => {
  const capabilities = await payRunQueryCapabilities()

  const questions: QuerySuggestion[] = [
    {
      id: OPEN_EXCEPTIONS,
      mode: 'search',

      // "Affected by", not "with". An exception can name a department rather than a person, and
      // then it is attributed to everyone in it — so the answer legitimately contains people who do
      // not own the exception. A label saying "employees with" would describe a narrower question
      // than the one the domain actually answers.
      label: 'Who is affected by open exceptions?',
      keywords: ['exception', 'blocker', 'blocking', 'outstanding', 'people', 'who', 'affected']
    }
  ]

  if (capabilities.calculationChanges) {
    questions.push({
      id: CALCULATION_CHANGES,
      mode: 'audit',
      label: 'What changed since the last calculation?',
      keywords: ['calculation', 'recalculated', 'diff', 'delta', 'version', 'changed', 'net']
    })
  }

  return questions
}

/**
 * A pay run's questions.
 *
 * `modes` declares what this provider is capable of answering — search and audit. What a given
 * reader is *offered* comes from the questions actually published above, so a reader without audit
 * rights sees no audit control at all. Support is not show.
 *
 * Predict is absent from both, and absent is the honest state: this domain stores no forecast, only
 * lifecycle facts, and dressing a due-date countdown as a prediction would complete the acronym by
 * lying.
 */
export const payRunQueryProvider: QueryProvider = {
  type: 'payroll_run',
  modes: ['search', 'audit'],
  suggestions: payRunSuggestions,

  run: async (object: ObjectContext, suggestionId: string): Promise<QueryAnswer> => {
    // The server decides what is in either answer — who may see it, and what the record proves.
    // Nothing is filtered on the way out.
    if (suggestionId === OPEN_EXCEPTIONS) {
      return { kind: 'objects', items: resultsFromHits(await payRunEmployeesWithOpenExceptions(object.id)) }
    }

    if (suggestionId === CALCULATION_CHANGES) {
      return { kind: 'events', items: await payRunCalculationChanges(object.id) }
    }

    throw new Error(`Unknown pay run question: ${suggestionId}`)
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Settlement                                                                                   */
/* -------------------------------------------------------------------------------------------- */

const SAME_REASON_FAILURES = 'batch-same-reason'
const PAYMENT_HISTORY = 'payment-history'

/**
 * A payment's questions, and unlike a pay run's they are not the same for every payment.
 *
 * Whether a payment can be asked what else failed for the same reason is a fact about that payment
 * — it needs a stated reason and a file to compare within — so the server decides and this composes
 * the wording. The check is a capability, not the gate: both questions re-check permission where
 * they run, so nothing rests on this call having been made.
 */
const settlementSuggestions = async (object: ObjectContext): Promise<QuerySuggestion[]> => {
  const capabilities = await settlementQueryCapabilities(object.id)
  const questions: QuerySuggestion[] = []

  if (capabilities.sameReasonFailures) {
    questions.push({
      id: SAME_REASON_FAILURES,
      mode: 'search',
      label: 'What else in this batch failed for the same reason?',
      keywords: ['batch', 'file', 'failed', 'returned', 'rejected', 'reason', 'same']
    })
  }

  if (capabilities.history) {
    questions.push({
      id: PAYMENT_HISTORY,
      mode: 'audit',
      label: 'What happened to this payment?',
      keywords: ['history', 'bank', 'released', 'settled', 'returned', 'rejected', 'timeline']
    })
  }

  return questions
}

/**
 * A payment's provider, registered by type and nothing else.
 *
 * It publishes no `ObjectContext` of its own: the payments table already builds one per row for the
 * context menu, and 360 Query takes that value. Nothing about a payment reaches the shell's
 * orientation state, which is the point — a nested object can be asked about without becoming what
 * the page is about.
 *
 * Predict is absent here for the same reason it is absent from a pay run: this domain records what
 * a bank did, not what one will do.
 */
export const settlementQueryProvider: QueryProvider = {
  type: 'settlement',
  modes: ['search', 'audit'],
  suggestions: settlementSuggestions,

  run: async (object: ObjectContext, suggestionId: string): Promise<QueryAnswer> => {
    if (suggestionId === SAME_REASON_FAILURES) {
      return { kind: 'objects', items: resultsFromHits(await settlementSameReasonFailures(object.id)) }
    }

    if (suggestionId === PAYMENT_HISTORY) {
      return { kind: 'events', items: await settlementHistory(object.id) }
    }

    throw new Error(`Unknown settlement question: ${suggestionId}`)
  }
}
