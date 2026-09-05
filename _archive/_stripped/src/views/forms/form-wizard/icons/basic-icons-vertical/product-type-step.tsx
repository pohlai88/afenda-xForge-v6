// Third-party Imports
import { LaptopIcon, ShirtIcon, BookOpenIcon, BuildingIcon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

// Component Imports
import { Label } from '@/components/ui/label'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Type Imports
import type { StepperType } from './index'

const conditionItems = [
  { label: 'Select Condition', value: null },
  { label: 'Brand New', value: 'new' },
  { label: 'Like New', value: 'like-new' },
  { label: 'Refurbished', value: 'refurbished' },
  { label: 'Used - Good', value: 'used-good' },
  { label: 'Used - Fair', value: 'used-fair' }
]

const ProductTypeStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-5 flex flex-col gap-6 p-6 md:col-span-3'>
      <RadioGroup
        className='justify-items-center gap-6 sm:grid-cols-3 md:max-lg:grid-cols-1'
        defaultValue='electronics'
      >
        <div className='border-input has-data-checked:border-primary/50 relative flex w-full flex-col items-center gap-3 rounded-lg border p-4 outline-none'>
          <RadioGroupItem
            value='electronics'
            id='product-type-electronics'
            className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5'
            aria-describedby='electronics-description'
            aria-label='plan-radio-electronics'
          />
          <div className='grid grow justify-items-center gap-3'>
            <LaptopIcon className='size-8.5 stroke-1' />
            <div className='flex flex-col items-center gap-1 text-center'>
              <Label htmlFor='product-type-electronics' className='text-base font-medium after:absolute after:inset-0'>
                Electronics
              </Label>
              <p id='electronics-description' className='text-muted-foreground text-sm'>
                Smartphones, laptops, tablets, and other tech devices
              </p>
            </div>
          </div>
        </div>
        <div className='border-input has-data-checked:border-primary/50 relative flex w-full flex-col items-center gap-3 rounded-lg border p-4 outline-none'>
          <RadioGroupItem
            value='fashion'
            id='product-type-fashion'
            className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5'
            aria-describedby='fashion-description'
            aria-label='plan-radio-fashion'
          />
          <div className='grid grow justify-items-center gap-3'>
            <ShirtIcon className='size-8.5 stroke-1' />
            <div className='flex flex-col items-center gap-1 text-center'>
              <Label htmlFor='product-type-fashion' className='text-base font-medium after:absolute after:inset-0'>
                Fashion & Apparel
              </Label>
              <p id='fashion-description' className='text-muted-foreground text-sm'>
                Clothing, shoes, accessories, and fashion items
              </p>
            </div>
          </div>
        </div>
        <div className='border-input has-data-checked:border-primary/50 relative flex w-full flex-col items-center gap-3 rounded-lg border p-4 outline-none'>
          <RadioGroupItem
            value='books'
            id='product-type-books'
            className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5'
            aria-describedby='books-description'
            aria-label='plan-radio-books'
          />
          <div className='grid grow justify-items-center gap-3'>
            <BookOpenIcon className='size-8.5 stroke-1' />
            <div className='flex flex-col items-center gap-1 text-center'>
              <Label htmlFor='product-type-books' className='text-base font-medium after:absolute after:inset-0'>
                Books & Media
              </Label>
              <p id='books-description' className='text-muted-foreground text-sm'>
                Books, eBooks, audiobooks, and digital courses
              </p>
            </div>
          </div>
        </div>
      </RadioGroup>
      <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <Field className='gap-2 md:max-lg:col-span-2'>
          <FieldLabel htmlFor='multi-step-product-type-brand'>Brand Name</FieldLabel>
          <InputGroup className='w-full'>
            <InputGroupAddon>
              <BuildingIcon className='size-4' />
              <span className='sr-only'>Brand</span>
            </InputGroupAddon>
            <InputGroupInput id='multi-step-product-type-brand' placeholder='Apple, Samsung, Nike...' />
          </InputGroup>
          <FieldDescription className='text-xs'>Enter the manufacturer or brand name</FieldDescription>
        </Field>

        <Field className='gap-2 md:max-lg:col-span-2'>
          <FieldLabel htmlFor='multi-step-product-type-condition'>Product Condition</FieldLabel>
          <Select items={conditionItems}>
            <SelectTrigger id='multi-step-product-type-condition' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {conditionItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription className='text-xs'>Select the condition of the product</FieldDescription>
        </Field>
      </FieldGroup>
      <div className='flex justify-between gap-4'>
        <Button variant='secondary' onClick={() => stepper.navigation.prev()} disabled={stepper.state.isFirst}>
          <ArrowLeftIcon />
          Previous
        </Button>
        <Button onClick={() => stepper.navigation.next()}>
          Next
          <ArrowRightIcon />
        </Button>
      </div>
    </CardContent>
  )
}

export default ProductTypeStep
