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

const FormLabelAlignment = () => {
  const languageComboboxId = useId()
  const languageAnchor = useComboboxAnchor()

  const [showPassword, setShowPassword] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState(['English', 'French'])
  const [birthDate, setBirthDate] = useState<Date>()
  const [birthDateOpen, setBirthDateOpen] = useState(false)

  return (
    <form>
      <div className='mb-6'>
        <h3 className='text-base font-semibold'>1. Account Details</h3>
      </div>

      <FieldGroup className='gap-6'>
        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-form-label-alignment-username' className='sm:justify-end'>
            Username
          </FieldLabel>
          <Input id='horizontal-form-label-alignment-username' className='sm:col-span-5' placeholder='john.doe' />
        </Field>

        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-form-label-alignment-email' className='sm:justify-end'>
            Email
          </FieldLabel>
          <InputGroup className='sm:col-span-5'>
            <InputGroupInput id='horizontal-form-label-alignment-email' placeholder='john.doe' />
            <InputGroupAddon align='inline-end' className='text-foreground font-normal'>
              @example.com
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-form-label-alignment-password' className='sm:justify-end'>
            Password
          </FieldLabel>
          <InputGroup className='sm:col-span-5'>
            <InputGroupInput
              id='horizontal-form-label-alignment-password'
              type={showPassword ? 'text' : 'password'}
              placeholder='••••••••••'
            />
            <InputGroupAddon align='inline-end'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setShowPassword(!showPassword)}
                className='text-muted-foreground rounded-l-none hover:bg-transparent'
              >
                {showPassword ? <EyeOffIcon className='size-4' /> : <EyeIcon className='size-4' />}
                <span className='sr-only'>{showPassword ? 'Hide password' : 'Show password'}</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>

      <Separator className='my-6' />

      <div className='mb-6'>
        <h3 className='text-base font-semibold'>2. Personal Info</h3>
      </div>

      <FieldGroup className='gap-6'>
        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-form-label-alignment-full-name' className='sm:justify-end'>
            Full Name
          </FieldLabel>
          <Input id='horizontal-form-label-alignment-full-name' className='sm:col-span-5' placeholder='John Doe' />
        </Field>

        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-form-label-alignment-country' className='sm:justify-end'>
            Country
          </FieldLabel>
          <div className='sm:col-span-5'>
            <Select items={countries}>
              <SelectTrigger id='horizontal-form-label-alignment-country' className='w-full'>
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
          </div>
        </Field>

        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor={languageComboboxId} className='sm:justify-end'>
            Language
          </FieldLabel>
          <div className='sm:col-span-5'>
            <Combobox
              multiple
              autoHighlight
              id={languageComboboxId}
              items={languageOptions}
              value={selectedLanguages}
              onValueChange={setSelectedLanguages}
            >
              <ComboboxChips ref={languageAnchor} className='w-full'>
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
          </div>
        </Field>

        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-form-label-alignment-birth-date' className='sm:justify-end'>
            Birth Date
          </FieldLabel>
          <div className='sm:col-span-5'>
            <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id='horizontal-form-label-alignment-birth-date'
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
          </div>
        </Field>

        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <FieldLabel htmlFor='horizontal-form-label-alignment-phone' className='sm:justify-end'>
            Phone No
          </FieldLabel>
          <Input
            id='horizontal-form-label-alignment-phone'
            className='sm:col-span-5'
            type='tel'
            placeholder='658 799 8941'
          />
        </Field>

        <Field className='grid grid-cols-1 gap-2 sm:grid-cols-6'>
          <div className='flex gap-3 sm:col-span-5 sm:col-start-2'>
            <Button type='submit'>Submit</Button>
            <Button type='button' variant='outline'>
              Cancel
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default FormLabelAlignment
