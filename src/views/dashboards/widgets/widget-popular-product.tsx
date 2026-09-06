// Third-party Imports
import { EllipsisVerticalIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const listItems = ['Share', 'Update', 'Refresh']

type Props = {
  title: string
  subTitle: string
  productsData: {
    img: string
    productName: string
    price: string
    visits: string
  }[]
  className?: string
}

const PopularProductCard = ({ title, subTitle, productsData, className }: Props) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
        <CardDescription>{subTitle}</CardDescription>
        <CardAction>
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
        </CardAction>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col justify-between gap-3'>
        {productsData.map((product, index) => (
          <div key={index} className='flex items-center justify-between gap-2'>
            <div className='flex items-center justify-between gap-2'>
              <div className='p-2'>
                <img src={product.img} alt={product.productName} className='size-10.5' />
              </div>
              <div className='flex flex-col gap-0.5'>
                <span className='text-base font-medium'>{product.productName}</span>
                <span className='text-muted-foreground text-xs'>{product.price}</span>
              </div>
            </div>
            <span className='text-muted-foreground text-sm'>{product.visits}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default PopularProductCard
