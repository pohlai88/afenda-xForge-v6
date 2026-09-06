// Type Imports
import type { EmployeePaymentStatus } from '@/types/payroll/run-workspace-types'

// Component Imports
import { Badge } from '@/components/ui/badge'

// Util Imports
import { cn } from '@/lib/utils'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from '@/utils/payroll-workspace'

/** Badge → payment meaning. The one place a settlement status becomes a word and a colour. */
const SettlementStatusBadge = ({ status, className }: { status: EmployeePaymentStatus; className?: string }) => (
  <Badge className={cn('h-auto rounded-sm px-1.5 py-0.5 text-xs', PAYMENT_STATUS_STYLES[status], className)}>
    {PAYMENT_STATUS_LABELS[status]}
  </Badge>
)

export default SettlementStatusBadge
