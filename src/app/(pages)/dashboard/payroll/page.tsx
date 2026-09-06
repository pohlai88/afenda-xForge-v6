// Next Imports
import { permanentRedirect } from 'next/navigation'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * The payroll dashboard moved to `/payroll` when payroll became a module with its own routes.
 * Bookmarks and links to the old path still land in the right place, query string intact.
 */
const LegacyPayrollDashboard = async ({ searchParams }: Props) => {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') params.set(key, value)
  }

  const query = params.toString()

  permanentRedirect(query ? `/payroll?${query}` : '/payroll')
}

export default LegacyPayrollDashboard
