// React Imports
import type { ReactElement } from 'react'

// Third-party Imports
import { EllipsisVerticalIcon, ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

// Component Imports
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Util Imports
import { cn } from '@/lib/utils'

const listItems = ['Share', 'Update', 'Refresh']

type Props = {
  title: string
  transactions: {
    icon: ReactElement
    paymentMethod: string
    platform: string
    amount: string
    paymentType: string
    iconClassName?: string
  }[]
  className?: string
}

const TransactionsCard = ({ title, transactions, className }: Props) => {
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
        {transactions.map((transaction, index) => {
          return (
            <div key={index} className='flex items-center justify-between gap-2'>
              <div className='flex items-center justify-between gap-4'>
                <Avatar size='lg' className='rounded-sm after:border-0'>
                  <AvatarFallback
                    className={cn(
                      'bg-primary/10 text-primary shrink-0 rounded-sm [&>svg]:size-5',
                      transaction.iconClassName
                    )}
                  >
                    {transaction.icon}
                  </AvatarFallback>
                </Avatar>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-base font-medium'>{transaction.paymentMethod}</span>
                  <span className='text-muted-foreground text-sm'>{transaction.platform}</span>
                </div>
              </div>
              <div className='flex items-center justify-between gap-2 text-sm'>
                <span className='text-sm'>
                  {transaction.paymentType === 'debit' ? '-' : '+'}
                  {transaction.amount}
                </span>
                <div className='bg-muted text-primary flex size-6 shrink-0 items-center justify-center rounded-full'>
                  {transaction.paymentType === 'debit' ? (
                    <ArrowDownIcon className='size-4' />
                  ) : (
                    <ArrowUpIcon className='size-4' />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default TransactionsCard
