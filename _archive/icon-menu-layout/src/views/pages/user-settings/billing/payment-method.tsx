import { EllipsisVerticalIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import AddPaymentMethodDialog from '@/views/pages/user-settings/billing/dialog-add-payment-method'

const PaymentMethod = () => {
  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>Payment Method</h3>
        <p className='text-muted-foreground text-sm'>Manage your payment method and billing information.</p>
      </div>

      {/* Content */}
      <div className='space-y-6 lg:col-span-2'>
        <div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <img src='/images/brands/visa-icon-bg.webp' alt='Visa' className='h-6' />
              <p className='text-sm font-medium'>Visa Debit **** 1234</p>
            </div>
            <div className='flex items-center gap-2'>
              <p className='text-sm font-medium'>Valid until 11/2028</p>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant='ghost' size='icon' className='rounded-full' />}>
                  {' '}
                  <EllipsisVerticalIcon />
                  <span className='sr-only'>Edit menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-20' align='end'>
                  <DropdownMenuGroup>
                    <DropdownMenuItem>Make Default</DropdownMenuItem>
                    <DropdownMenuItem className='text-destructive!'>Remove</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Separator className='my-3' />
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <img src='/images/brands/mastercard-icon-bg.webp' alt='Mastercard' className='h-6' />
              <p className='text-sm font-medium'>Mastercard **** 5678</p>
            </div>
            <div className='flex items-center gap-2'>
              <p className='text-sm font-medium'>Valid until 10/2028</p>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant='ghost' size='icon' className='rounded-full' />}>
                  <EllipsisVerticalIcon />
                  <span className='sr-only'>Edit menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-20' align='end'>
                  <DropdownMenuGroup>
                    <DropdownMenuItem>Make Default</DropdownMenuItem>
                    <DropdownMenuItem className='text-destructive'>Remove</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className='flex justify-end'>
          <AddPaymentMethodDialog
            trigger={
              <Button className='max-sm:w-full'>
                <span>Add</span>
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}

export default PaymentMethod
