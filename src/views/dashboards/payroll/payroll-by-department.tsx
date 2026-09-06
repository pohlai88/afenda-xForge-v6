// Type Imports
import type { DepartmentCost } from '@/utils/payroll-metrics'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'
import { formatMoney } from '@/utils/money'

/** A department plus the face of whoever runs it, resolved by the caller. */
export type DepartmentRow = DepartmentCost & { headName?: string; headAvatar?: string }

type Props = {
  departments: DepartmentRow[]
  className?: string
}

const initials = (name?: string) =>
  name
    ?.split(' ')
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() ?? '—'

/**
 * Cost by department as a ranked bar list.
 *
 * The bar is the row rather than a rule underneath it: the fill runs behind the name and the
 * figures, so share is read from the same line as the amount instead of costing a second one.
 * That halves the vertical space six departments used to take and makes the ranking legible at a
 * glance, which a column of identical thin progress tracks was not.
 *
 * Not a pie, deliberately — six categories is past the point where a pie can be read, and the
 * ranking is the question anyway: which departments cost the most.
 */
const PayrollByDepartment = ({ departments, className }: Props) => {
  const leader = departments[0]?.share ?? 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Cost by department</CardTitle>
        <CardDescription>Employer cost, this run</CardDescription>
        <CardAction className='text-muted-foreground text-sm'>{departments.length} departments</CardAction>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-2'>
        {departments.map((department, index) => (
          <div
            key={department.departmentId}
            className='group relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-2'
          >
            {/* The fill is scaled against the leader, not against 100%. Every department is a
                minority of total cost, so scaling to 100 leaves every bar a stub and the
                ranking invisible. */}
            <span
              aria-hidden='true'
              className={cn(
                'absolute inset-y-0 left-0 rounded-md transition-colors',
                index === 0 ? 'bg-primary/15' : 'bg-muted'
              )}
              style={{ width: `${leader === 0 ? 0 : (department.share / leader) * 100}%` }}
            />

            <Avatar className='relative size-7 shrink-0'>
              {department.headAvatar && <AvatarImage src={department.headAvatar} alt='' />}
              <AvatarFallback className='text-[10px]'>{initials(department.headName)}</AvatarFallback>
            </Avatar>

            <span className='relative flex min-w-0 flex-1 flex-col'>
              <span className='truncate text-sm font-medium'>{department.name}</span>
              <span className='text-muted-foreground text-xs'>
                {department.employees} {department.employees === 1 ? 'person' : 'people'}
              </span>
            </span>

            <span className='relative flex shrink-0 flex-col items-end'>
              <span className='text-sm font-semibold'>{formatMoney(department.cost)}</span>
              <span className='text-muted-foreground text-xs'>{department.share.toFixed(1)}%</span>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default PayrollByDepartment
