// Third-party Imports
import { EllipsisVerticalIcon } from 'lucide-react'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CircularProgress } from '@/components/ui/circular-progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const listItems = ['Share', 'Update', 'Refresh']

export type VehicleCondition = {
  condition: string
  details: string
  progressValue: number
  changePercentage: string
  progressClassName?: string
}

type Props = {
  title: string
  vehicleConditionData: VehicleCondition[]
  className?: string
}

const VehiclesConditionCard = ({ title, vehicleConditionData, className }: Props) => {
  return (
    <Card className={className}>
      <CardHeader className='flex items-center justify-between'>
        <span className='text-lg font-semibold'>{title}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant='ghost' size='icon' className='text-muted-foreground size-6 rounded-full' />}
          >
            <EllipsisVerticalIcon />
            <span className='sr-only'>Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuGroup>
              {listItems.map((item, index) => (
                <DropdownMenuItem key={index}>{item}</DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col justify-between gap-4'>
        {vehicleConditionData.map((condition, index) => (
          <div key={index} className='flex items-center justify-between gap-2'>
            <div className='flex items-center justify-between gap-3'>
              <CircularProgress
                value={condition.progressValue}
                size={52}
                strokeWidth={5}
                showLabel
                labelClassName='text-xs'
                progressClassName={condition.progressClassName}
                className='stroke-border'
              />
              <div className='flex flex-col gap-0.5'>
                <span className='text-base font-medium'>{condition.condition}</span>
                <span className='text-muted-foreground text-sm'>{condition.details}</span>
              </div>
            </div>
            <Badge className='bg-primary/10 text-primary h-6 rounded-sm px-3 py-1'>{condition.changePercentage}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default VehiclesConditionCard
