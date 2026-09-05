'use client'

// React Imports
import { useState, useMemo } from 'react'

// Third-party Imports
import { format } from 'date-fns'
import {
  UserIcon,
  LanguagesIcon,
  CalendarIcon,
  PhoneIcon,
  MailIcon,
  EyeOffIcon,
  EyeIcon,
  CheckIcon,
  XIcon
} from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Util Imports
import { cn } from '@/lib/utils'

const countries = [
  {
    value: '1',
    label: 'India',
    flag: '/images/flags/india.webp'
  },
  {
    value: '2',
    label: 'China',
    flag: '/images/flags/china.webp'
  },
  {
    value: '3',
    label: 'Monaco',
    flag: '/images/flags/monaco.webp'
  },
  {
    value: '4',
    label: 'Serbia',
    flag: '/images/flags/serbia.webp'
  },
  {
    value: '5',
    label: 'Romania',
    flag: '/images/flags/romania.webp'
  },
  {
    value: '6',
    label: 'Mayotte',
    flag: '/images/flags/mayotte.webp'
  },
  {
    value: '7',
    label: 'Iraq',
    flag: '/images/flags/iraq.webp'
  },
  {
    value: '8',
    label: 'Syria',
    flag: '/images/flags/syria.webp'
  },
  {
    value: '9',
    label: 'Korea',
    flag: '/images/flags/korea.webp'
  },
  {
    value: '10',
    label: 'Zimbabwe',
    flag: '/images/flags/zimbabwe.webp'
  }
]

const languages = [
  { value: null, label: 'Select Language' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'hi', label: 'Hindi' }
]

const requirements = [
  { regex: /.{12,}/, text: 'At least 12 characters' },
  { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
  { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
  { regex: /[0-9]/, text: 'At least 1 number' },
  {
    regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/,
    text: 'At least 1 special character'
  }
]

const FormWithTabs = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [birthDate, setBirthDate] = useState<Date>()
  const [birthDateOpen, setBirthDateOpen] = useState(false)
  const [password, setPassword] = useState('')

  const strength = requirements.map(req => ({
    met: req.regex.test(password),
    text: req.text
  }))

  const strengthScore = useMemo(() => {
    return strength.filter(req => req.met).length
  }, [strength])

  const getColor = (score: number) => {
    if (score === 0) return 'bg-border'
    if (score <= 1) return 'bg-destructive'
    if (score <= 2) return 'bg-orange-500 '
    if (score <= 3) return 'bg-amber-500'
    if (score === 4) return 'bg-yellow-400'

    return 'bg-green-500'
  }

  const getText = (score: number) => {
    if (score === 0) return 'Enter a password'
    if (score <= 2) return 'Weak password'
    if (score <= 3) return 'Medium password'
    if (score === 4) return 'Strong password'

    return 'Very strong password'
  }

  return (
    <Card className='w-full overflow-hidden py-0'>
      <CardContent className='p-0'>
        <Tabs defaultValue='personal' className='w-full'>
          <ScrollArea className='w-full'>
            <TabsList className='bg-background h-16! w-full justify-start rounded-none border-b p-0'>
              <TabsTrigger
                value='personal'
                className='bg-background data-active:border-primary dark:data-active:border-primary dark:data-active:bg-background h-full flex-col rounded-none border-0 border-b-2 border-transparent group-data-horizontal/tabs:after:h-0 data-active:shadow-none!'
              >
                <span>Personal Info</span>
                <span className='text-muted-foreground text-xs'>Basic details about you</span>
              </TabsTrigger>
              <TabsTrigger
                value='account'
                className='bg-background data-active:border-primary dark:data-active:border-primary dark:data-active:bg-background h-full flex-col rounded-none border-0 border-b-2 border-transparent group-data-horizontal/tabs:after:h-0 data-active:shadow-none!'
              >
                <span>Account Details</span>
                <span className='text-muted-foreground text-xs'>Manage your account settings</span>
              </TabsTrigger>
              <TabsTrigger
                value='social'
                className='bg-background data-active:border-primary dark:data-active:border-primary dark:data-active:bg-background h-full flex-col rounded-none border-0 border-b-2 border-transparent group-data-horizontal/tabs:after:h-0 data-active:shadow-none!'
              >
                <span>Social Links</span>
                <span className='text-muted-foreground text-xs'>Connect your social accounts</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>

          {/* Personal Info Tab */}
          <TabsContent value='personal' className='p-6'>
            <form>
              <FieldGroup className='grid gap-6 sm:grid-cols-2'>
                <Field className='gap-2'>
                  <FieldLabel htmlFor='firstName'>First Name*</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <UserIcon className='size-4' />
                      <span className='sr-only'>User</span>
                    </InputGroupAddon>
                    <InputGroupInput id='firstName' type='text' placeholder='John' required />
                  </InputGroup>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel htmlFor='lastName'>Last Name*</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <UserIcon className='size-4' />
                      <span className='sr-only'>User*</span>
                    </InputGroupAddon>
                    <InputGroupInput id='lastName' placeholder='Doe' required />
                  </InputGroup>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel htmlFor='country'>Country</FieldLabel>
                  <Select defaultValue='1' required items={countries}>
                    <SelectTrigger id='country' className='w-full'>
                      <SelectValue placeholder='Select Country'>
                        {(value: string) => {
                          const country = countries.find(c => c.value === value)

                          return country ? (
                            <span className='flex items-center gap-2'>
                              <img src={country.flag} alt={`${country.label} flag`} className='h-4 w-5 shrink-0' />
                              <span className='truncate'>{country.label}</span>
                            </span>
                          ) : (
                            <span>Select Country</span>
                          )
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className='max-h-100'>
                      <SelectGroup>
                        {countries.map(country => (
                          <SelectItem key={country.value} value={country.value}>
                            <img src={country.flag} alt={`${country.label} flag`} className='h-4 w-5' />{' '}
                            <span className='truncate'>{country.label}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel htmlFor='language'>Language</FieldLabel>
                  <Select defaultValue='en' required items={languages}>
                    <SelectTrigger id='language' className='relative w-full pl-9'>
                      <div className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 group-has-[select[disabled]]:opacity-50'>
                        <LanguagesIcon className='size-4' aria-hidden='true' />
                      </div>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {languages.map(language => (
                          <SelectItem key={language.value} value={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel>Birth Date</FieldLabel>
                  <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant='outline'
                          className={cn(
                            'hover:text-muted-foreground w-full justify-start text-left font-normal hover:bg-transparent',
                            !birthDate && 'text-muted-foreground'
                          )}
                        />
                      }
                    >
                      <CalendarIcon className='mr-2 size-4' />
                      {birthDate ? format(birthDate, 'PPP') : <span>Select Birth Date</span>}
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
                  <FieldLabel htmlFor='phone'>Phone No.*</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <PhoneIcon className='size-4' />
                      <span className='sr-only'>Phone</span>
                    </InputGroupAddon>
                    <InputGroupInput id='phone' type='tel' placeholder='+1 123 456 7890' required />
                  </InputGroup>
                </Field>

                <div className='flex gap-3'>
                  <Button type='submit'>Submit</Button>
                  <Button variant='outline'>Cancel</Button>
                </div>
              </FieldGroup>
            </form>
          </TabsContent>

          {/* Account Details Tab */}
          <TabsContent value='account' className='p-6'>
            <form>
              <FieldGroup className='grid gap-6 sm:grid-cols-2'>
                <Field className='gap-2'>
                  <FieldLabel htmlFor='username'>Username*</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <UserIcon className='size-4' />
                      <span className='sr-only'>Username</span>
                    </InputGroupAddon>
                    <InputGroupInput id='username' placeholder='Johndoe' required />
                  </InputGroup>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel htmlFor='email'>Email*</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <MailIcon className='size-4' />
                      <span className='sr-only'>Email</span>
                    </InputGroupAddon>
                    <InputGroupInput id='email' type='email' placeholder='johndoe@email.com' required />
                  </InputGroup>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel htmlFor='password'>Password*</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Password'
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <InputGroupAddon align='inline-end'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => setShowPassword(!showPassword)}
                        className='text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent'
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        <span className='sr-only'>{showPassword ? 'Hide password' : 'Show password'}</span>
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>

                  <div className='flex h-1 w-full gap-1'>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className={cn(
                          'h-full flex-1 rounded-full transition-all duration-500 ease-out',
                          index < strengthScore ? getColor(strengthScore) : 'bg-border'
                        )}
                      />
                    ))}
                  </div>

                  <p className='text-foreground text-sm font-medium'>{getText(strengthScore)}. Must contain:</p>

                  <ul className='mb-4 space-y-1.5'>
                    {strength.map((req, index) => (
                      <li key={index} className='flex items-center gap-2'>
                        {req.met ? (
                          <CheckIcon className='size-4 text-green-600 dark:text-green-400' />
                        ) : (
                          <XIcon className='text-muted-foreground size-4' />
                        )}
                        <span
                          className={cn(
                            'text-xs',
                            req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                          )}
                        >
                          {req.text}
                          <span className='sr-only'>{req.met ? ' - Requirement met' : ' - Requirement not met'}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel htmlFor='confirmPassword'>Confirm Password*</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder='••••••••••'
                      required
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
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <div className='flex gap-3'>
                  <Button type='submit'>Submit</Button>
                  <Button variant='outline'>Cancel</Button>
                </div>
              </FieldGroup>
            </form>
          </TabsContent>

          {/* Social Links Tab */}
          <TabsContent value='social' className='p-6'>
            <form>
              <FieldGroup className='grid gap-6 sm:grid-cols-2'>
                <Field className='gap-2'>
                  <FieldLabel htmlFor='twitter'>X*</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon className='text-foreground font-normal'>https://x.com/</InputGroupAddon>
                    <InputGroupInput id='twitter' type='text' placeholder='username' required />
                  </InputGroup>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel htmlFor='facebook'>Facebook*</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon className='text-foreground font-normal'>https://facebook.com/</InputGroupAddon>
                    <InputGroupInput id='facebook' type='text' placeholder='username' required />
                  </InputGroup>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel htmlFor='google'>Google+*</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon className='text-foreground font-normal'>https://plus.google.com/</InputGroupAddon>
                    <InputGroupInput id='google' type='text' placeholder='username' required />
                  </InputGroup>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel htmlFor='linkedin'>LinkedIn*</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon className='text-foreground font-normal'>https://linkedin.com/</InputGroupAddon>
                    <InputGroupInput id='linkedin' type='text' placeholder='username' required />
                  </InputGroup>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel htmlFor='instagram'>Instagram*</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon className='text-foreground font-normal'>https://instagram.com/</InputGroupAddon>
                    <InputGroupInput id='instagram' type='text' placeholder='username' required />
                  </InputGroup>
                </Field>

                <Field className='gap-2'>
                  <FieldLabel htmlFor='quora'>Quora*</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon className='text-foreground font-normal'>https://quora.com/</InputGroupAddon>
                    <InputGroupInput id='quora' placeholder='username' required />
                  </InputGroup>
                </Field>

                <div className='flex gap-3'>
                  <Button type='submit'>Submit</Button>
                  <Button variant='outline'>Cancel</Button>
                </div>
              </FieldGroup>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default FormWithTabs
