'use client'

// React Imports
import { useId, useState } from 'react'

// Third-party Imports
import { format } from 'date-fns'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor
} from '@/components/ui/combobox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { cn } from '@/lib/utils'

const countries = [
  { value: null, label: 'Select value' },
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'in', label: 'India' }
]

const languageOptions = ['English', 'French', 'Spanish', 'German', 'Chinese', 'Japanese', 'Hindi']

const MultiColumnWithSeparator = () => {
  const languageComboboxId = useId()
  const languageAnchor = useComboboxAnchor()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState(['English', 'French'])
  const [birthDate, setBirthDate] = useState<Date>()
  const [birthDateOpen, setBirthDateOpen] = useState(false)

  return (
    <form>
      <div className='mb-6'>
        <h3 className='text-base font-semibold'>1. Account Details</h3>
      </div>

      <FieldGroup className='grid gap-6 sm:grid-cols-2'>
        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-column-username'>Username</FieldLabel>
          <Input id='multi-column-username' placeholder='john.doe' />
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-column-email'>Email</FieldLabel>
          <InputGroup>
            <InputGroupInput id='multi-column-email' placeholder='john.doe' />
            <InputGroupAddon align='inline-end' className='text-foreground font-normal'>
              @example.com
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-column-password'>Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id='multi-column-password'
              type={showPassword ? 'text' : 'password'}
              placeholder='••••••••••'
            />
            <InputGroupAddon align='inline-end'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setShowPassword(!showPassword)}
                className='text-muted-foreground hover:text-foreground rounded-l-none hover:bg-transparent'
              >
                {showPassword ? <EyeOffIcon className='size-4' /> : <EyeIcon className='size-4' />}
                <span className='sr-only'>{showPassword ? 'Hide password' : 'Show password'}</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-column-confirm-password'>Confirm Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id='multi-column-confirm-password'
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder='••••••••••'
            />
            <InputGroupAddon align='inline-end'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='text-muted-foreground hover:text-foreground rounded-l-none hover:bg-transparent'
              >
                {showConfirmPassword ? <EyeOffIcon className='size-4' /> : <EyeIcon className='size-4' />}
                <span className='sr-only'>{showConfirmPassword ? 'Hide password' : 'Show password'}</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>

      <Separator className='my-6' />

      <div className='mb-6'>
        <h3 className='text-base font-semibold'>2. Personal Info</h3>
      </div>

      <FieldGroup className='grid gap-6 sm:grid-cols-2'>
        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-column-first-name'>First Name</FieldLabel>
          <Input id='multi-column-first-name' placeholder='John' />
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-column-last-name'>Last Name</FieldLabel>
          <Input id='multi-column-last-name' placeholder='Doe' />
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-column-country'>Country</FieldLabel>
          <Select items={countries}>
            <SelectTrigger id='multi-column-country' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {countries.map(country => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor={languageComboboxId}>Language</FieldLabel>
          <Combobox
            multiple
            autoHighlight
            id={languageComboboxId}
            items={languageOptions}
            value={selectedLanguages}
            onValueChange={setSelectedLanguages}
          >
            <ComboboxChips ref={languageAnchor}>
              <ComboboxValue>
                {(values: string[]) => (
                  <>
                    {values.map(value => (
                      <ComboboxChip className='dark:bg-input/40' key={value}>
                        {value}
                      </ComboboxChip>
                    ))}
                    {values.length === 0 && <span className='text-muted-foreground'>Select languages</span>}
                    <ComboboxChipsInput />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={languageAnchor}>
              <ComboboxEmpty>No languages found.</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-column-birth-date'>Birth Date</FieldLabel>
          <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
            <PopoverTrigger
              render={
                <Button
                  id='multi-column-birth-date'
                  variant='outline'
                  className={cn(
                    'hover:text-muted-foreground w-full justify-start text-left font-normal hover:bg-transparent',
                    !birthDate && 'text-muted-foreground'
                  )}
                />
              }
            >
              {birthDate ? format(birthDate, 'yyyy-MM-dd') : <span>YYYY-MM-DD</span>}
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={birthDate}
                onSelect={date => {
                  setBirthDate(date)
                  setBirthDateOpen(false)
                }}
                captionLayout='dropdown'
                defaultMonth={birthDate}
              />
            </PopoverContent>
          </Popover>
        </Field>

        <Field className='gap-2'>
          <FieldLabel htmlFor='multi-column-phone'>Phone No</FieldLabel>
          <Input id='multi-column-phone' type='tel' placeholder='658 799 8941' />
        </Field>
      </FieldGroup>

      <div className='mt-6 flex gap-3'>
        <Button type='submit'>Submit</Button>
        <Button type='button' variant='outline'>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default MultiColumnWithSeparator
