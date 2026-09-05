'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { format } from 'date-fns'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field'

// Util Imports
import { cn } from '@/lib/utils'

const formSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required.')
    .min(3, 'Full name must be at least 3 characters.')
    .max(50, 'Full name must be at most 50 characters.'),
  email: z.string().min(1, 'Email is required.').email('Please enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .min(8, 'Password must be at least 8 characters.')
    .max(100, 'Password must be at most 100 characters.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
    ),
  dateOfBirth: z.date({
    required_error: 'Date of birth is required.'
  }),
  country: z.string().min(1, 'Please select your country.'),
  language: z.string().optional(),
  bio: z
    .string()
    .min(1, 'Bio is required.')
    .min(20, 'Bio must be at least 20 characters.')
    .max(500, 'Bio must be at most 500 characters.'),
  newsletterTopics: z.array(z.string()).min(1, 'Please select at least one newsletter topic.'),
  accountType: z.enum(['personal', 'business', 'enterprise'], {
    required_error: 'Please select an account type.'
  }),
  ageRange: z
    .number({
      required_error: 'Age is required.',
      invalid_type_error: 'Please enter a valid number.'
    })
    .int('Age must be a whole number.')
    .min(18, 'You must be at least 18 years old.')
    .max(120, 'Please enter a valid age.'),
  emailNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  twoFactorAuth: z.boolean()
})

type FormValues = z.infer<typeof formSchema>

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'in', label: 'India' },
  { value: 'jp', label: 'Japan' }
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' }
]

const newsletterTopics = [
  { id: 'updates', label: 'Product Updates' },
  { id: 'news', label: 'Industry News' },
  { id: 'tips', label: 'Tips & Tricks' }
]

const accountTypes = [
  {
    id: 'personal',
    title: 'Personal',
    description: 'For individual use with basic features'
  },
  {
    id: 'business',
    title: 'Business',
    description: 'For small to medium-sized teams'
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    description: 'For large organizations'
  }
] as const

const communicationSettings = [
  {
    name: 'emailNotifications' as const,
    label: 'Email Notifications',
    description: 'Receive notifications about your account activity'
  },
  {
    name: 'marketingEmails' as const,
    label: 'Marketing Emails',
    description: 'Receive emails about new products and features'
  },
  {
    name: 'twoFactorAuth' as const,
    label: 'Two-Factor Authentication',
    description: 'Add an extra layer of security to your account'
  }
]

const RegistrationForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [birthDateOpen, setBirthDateOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      bio: '',
      language: '',
      newsletterTopics: [],
      accountType: '' as unknown as FormValues['accountType'],
      ageRange: undefined,
      emailNotifications: true,
      marketingEmails: false,
      twoFactorAuth: false
    }
  })

  function onSubmit(data: FormValues) {
    console.log('Form submitted with data:', data)
    alert('Form submitted successfully! Check the console for details.')
    form.reset()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6'>
      <div>
        <h3 className='text-lg font-semibold'>Personal Information</h3>
        <p className='text-muted-foreground'>Please provide your basic information</p>
      </div>

      <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <Controller
          name='fullName'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name} className='leading-none'>
                Full Name
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder='John Doe'
                autoComplete='name'
              />
              <FieldDescription>Your full name as it appears on official documents</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='email'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name} className='leading-none'>
                Email Address
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                type='email'
                aria-invalid={fieldState.invalid}
                placeholder='john.doe@example.com'
                autoComplete='email'
              />
              <FieldDescription>We&apos;ll never share your email with anyone else</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='password'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2 sm:col-span-2'>
              <FieldLabel htmlFor={field.name} className='leading-none'>
                Password
              </FieldLabel>
              <InputGroup className='w-full'>
                <InputGroupInput
                  {...field}
                  id={field.name}
                  type={isPasswordVisible ? 'text' : 'password'}
                  aria-invalid={fieldState.invalid}
                  placeholder='••••••••'
                  autoComplete='new-password'
                />
                <InputGroupAddon align='inline-end'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => setIsPasswordVisible(prevState => !prevState)}
                    className='text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent'
                  >
                    {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                    <span className='sr-only'>{isPasswordVisible ? 'Hide password' : 'Show password'}</span>
                  </Button>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>Must be at least 8 characters with uppercase, lowercase, and numbers</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Separator />

      <div>
        <h3 className='text-lg font-semibold'>Profile Details</h3>
        <p className='text-muted-foreground'>Tell us more about yourself</p>
      </div>

      <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <Controller
          name='dateOfBirth'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name} className='leading-none'>
                Date of Birth
              </FieldLabel>
              <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id='dateOfBirth'
                      type='button'
                      variant='outline'
                      aria-invalid={fieldState.invalid}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    />
                  }
                >
                  {field.value ? format(field.value, 'yyyy-MM-dd') : <span>YYYY-MM-DD</span>}
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={field.value}
                    defaultMonth={field.value}
                    captionLayout='dropdown'
                    onSelect={date => {
                      field.onChange(date)
                      setBirthDateOpen(false)
                    }}
                    disabled={date => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <FieldDescription>Select your date of birth</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='ageRange'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name} className='leading-none'>
                Age
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                type='number'
                min={18}
                max={120}
                aria-invalid={fieldState.invalid}
                placeholder='25'
                onChange={e => {
                  const value = e.target.value

                  field.onChange(value === '' ? undefined : parseInt(value, 10))
                }}
                value={field.value ?? ''}
              />
              <FieldDescription>You must be at least 18 years old to register</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='country'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name} className='leading-none'>
                Country
              </FieldLabel>
              <Select onValueChange={field.onChange} value={field.value} items={countries}>
                <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className='w-full'>
                  <SelectValue placeholder='Select your country' />
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
              <FieldDescription>Your country of residence</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='language'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2'>
              <FieldLabel htmlFor={field.name} className='leading-none'>
                Preferred Language <span className='text-muted-foreground font-normal'>(Optional)</span>
              </FieldLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined} items={languages}>
                <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className='w-full'>
                  <SelectValue placeholder='Select a language' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {languages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>Choose your preferred communication language</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='bio'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='gap-2 sm:col-span-2'>
              <FieldLabel htmlFor={field.name} className='leading-none'>
                Bio
              </FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder='Tell us about yourself...'
                className='min-h-15 resize-none'
              />
              <FieldDescription>
                Brief description about yourself ({field.value.length}/500 characters)
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Separator />

      <div className='space-y-6'>
        <div>
          <h3 className='text-lg font-semibold'>Preferences</h3>
          <p className='text-muted-foreground text-sm'>Customize your experience</p>
        </div>

        {/* Account type + newsletter topics */}
        <div className='grid gap-6 lg:grid-cols-2'>
          <Controller
            name='newsletterTopics'
            control={form.control}
            render={({ field, fieldState }) => (
              <FieldSet className='h-full'>
                <FieldLegend variant='label'>Newsletter Topics</FieldLegend>
                <FieldDescription>Choose the topics you want to receive updates about</FieldDescription>
                <FieldGroup data-slot='checkbox-group' className='gap-3'>
                  {newsletterTopics.map((topic, index) => (
                    <div
                      key={index}
                      className='border-input hover:bg-accent/50 has-data-checked:border-primary relative rounded-lg border transition-colors'
                    >
                      <Label
                        htmlFor={`newsletter-${topic.id}`}
                        className='flex cursor-pointer items-center gap-3 p-4 font-normal'
                      >
                        <Checkbox
                          id={`newsletter-${topic.id}`}
                          aria-invalid={fieldState.invalid}
                          checked={field.value.includes(topic.id)}
                          onCheckedChange={checked => {
                            const newValue = checked
                              ? [...field.value, topic.id]
                              : field.value.filter(value => value !== topic.id)

                            field.onChange(newValue)
                          }}
                        />
                        {topic.label}
                      </Label>
                    </div>
                  ))}
                </FieldGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </FieldSet>
            )}
          />

          {/* Communication settings */}
          <FieldSet>
            <FieldLegend variant='label'>Communication Settings</FieldLegend>
            <FieldDescription>Manage your notification preferences</FieldDescription>
            <FieldGroup className='gap-4'>
              {communicationSettings.map(({ name, label, description }) => (
                <Controller
                  key={name}
                  name={name}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field orientation='horizontal' data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor={name}>{label}</FieldLabel>
                        <FieldDescription>{description}</FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </FieldContent>
                      <Switch
                        id={name}
                        checked={field.value}
                        onCheckedChange={checked => field.onChange(!!checked)}
                        aria-invalid={fieldState.invalid}
                      />
                    </Field>
                  )}
                />
              ))}
            </FieldGroup>
          </FieldSet>
        </div>

        <Controller
          name='accountType'
          control={form.control}
          render={({ field, fieldState }) => (
            <FieldSet className='h-full'>
              <FieldLegend variant='label'>Account Type</FieldLegend>
              <FieldDescription>Choose the plan that best fits your needs</FieldDescription>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3'
              >
                {accountTypes.map((type, index) => (
                  <div
                    key={index}
                    className='border-input hover:bg-accent/50 has-data-checked:border-primary relative rounded-lg border transition-colors'
                  >
                    <div className='flex items-start gap-3 p-4'>
                      <RadioGroupItem
                        value={type.id}
                        id={`account-${type.id}`}
                        className='mt-0.5'
                        aria-invalid={fieldState.invalid}
                        aria-describedby={`account-${type.id}-description`}
                      />
                      <div className='space-y-1'>
                        <Label
                          htmlFor={`account-${type.id}`}
                          className='cursor-pointer font-medium after:absolute after:inset-0'
                        >
                          {type.title}
                        </Label>
                        <p id={`account-${type.id}-description`} className='text-muted-foreground text-sm'>
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />
      </div>

      <div className='flex gap-3 pt-2'>
        <Button type='submit'>Register</Button>
        <Button type='button' variant='outline' onClick={() => form.reset()}>
          Reset
        </Button>
      </div>
    </form>
  )
}

export default RegistrationForm
