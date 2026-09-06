// Type Imports
import type { DepartmentCost } from '@/utils/payroll-metrics'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Util Imports
import { formatMoney } from '@/utils/money'

type Props = {
  departments: DepartmentCost[]
  className?: string
}

const PayrollByDepartment = ({ departments, className }: Props) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Cost by department</CardTitle>
        <CardDescription>Employer cost, this run</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-5'>
        {departments.map(department => (
          <div key={department.departmentId} className='flex flex-col gap-2'>
            <div className='flex items-baseline justify-between gap-2'>
              <span className='flex items-baseline gap-2'>
                <span className='text-sm font-medium'>{department.name}</span>
                <span className='text-muted-foreground text-xs'>
                  {department.employees} {department.employees === 1 ? 'person' : 'people'}
                </span>
              </span>
              <span className='text-sm font-semibold'>{formatMoney(department.cost)}</span>
            </div>
            <div className='flex items-center gap-3'>
              <Progress value={department.share} className='h-1.5' />
              <span className='text-muted-foreground w-10 shrink-0 text-right text-xs'>
                {department.share.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default PayrollByDepartment
