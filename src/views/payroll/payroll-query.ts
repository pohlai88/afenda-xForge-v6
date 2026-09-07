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
import { payRunCalculationChanges, payRunEmployeesWithOpenExceptions } from '@/app/server/query-actions'

// Find Imports
import { resultsFromHits } from '@/lib/find/find-sources'

const OPEN_EXCEPTIONS = 'open-exceptions'
const CALCULATION_CHANGES = 'calculation-changes'

const payRunSuggestions = (): QuerySuggestion[] => [
  {
    id: OPEN_EXCEPTIONS,
    mode: 'search',

    // "Affected by", not "with". An exception can name a department rather than a person, and then
    // it is attributed to everyone in it — so the answer legitimately contains people who do not
    // own the exception. A label saying "employees with" would describe a narrower question than
    // the one the domain actually answers.
    label: 'Who is affected by open exceptions?',
    keywords: ['exception', 'blocker', 'blocking', 'outstanding', 'people', 'who', 'affected']
  },
  {
    id: CALCULATION_CHANGES,
    mode: 'audit',
    label: 'What changed since the last calculation?',
    keywords: ['calculation', 'recalculated', 'diff', 'delta', 'version', 'changed', 'net']
  }
]

/**
 * A pay run's questions.
 *
 * `modes` says what the provider can actually answer, which is now search and audit. Predict is
 * still absent, and absent is the honest state: this domain stores no forecast, only lifecycle
 * facts, and dressing a due-date countdown as a prediction would complete the acronym by lying.
 * Declaring a mode the provider cannot answer would put a control in the panel that never has
 * anything behind it.
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
