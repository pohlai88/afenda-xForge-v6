/**
 * Which object types can be asked a question, and who answers it.
 *
 * The same shape as the Find object adapter beside it, and for the same reason: this is capability
 * glue, not a registry of business objects. A type appearing here does not bring an object into
 * existence — the object exists in the domain first, and this only records that the domain has
 * written questions for it. There is one lookup, by `ObjectContext.type`, and it is the only type
 * dispatch 360 Query is allowed to perform.
 *
 * A type that is absent is absent everywhere: no "Ask about this", no empty panel, no disabled
 * command. Doctrine `context_menu` requires a capability that does not exist to be omitted rather
 * than shown greyed out.
 */

import type { QueryProvider } from '@/types/common/query-types'

import { payRunQueryProvider } from '@/views/payroll/payroll-query'

const QUERY_PROVIDERS: Record<string, QueryProvider> = {
  [payRunQueryProvider.type]: payRunQueryProvider
}

export const queryProviderFor = (type: string): QueryProvider | undefined => QUERY_PROVIDERS[type]
