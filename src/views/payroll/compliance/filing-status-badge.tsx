// Type Imports
import type { FilingStatus } from '@/types/payroll/compliance-types'

// Component Imports
import { Badge } from '@/components/ui/badge'

// Util Imports
import { cn } from '@/lib/utils'
import { FILING_STATUS_LABELS, FILING_STATUS_STYLES } from '@/utils/payroll-compliance'

/** Badge → filing meaning. The one place a filing status becomes a word and a colour. */
const FilingStatusBadge = ({ status, className }: { status: FilingStatus; className?: string }) => (
  <Badge className={cn('whitespace-nowrap', FILING_STATUS_STYLES[status], className)}>
    {FILING_STATUS_LABELS[status]}
  </Badge>
)

export default FilingStatusBadge
