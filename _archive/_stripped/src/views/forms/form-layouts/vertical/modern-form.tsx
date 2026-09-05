'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { CheckIcon, ExternalLinkIcon } from 'lucide-react'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

// Plan Types Data
const planTypes = [
  {
    value: 'starter',
    id: 'plan-starter',
    title: 'Starter',
    description: 'Perfect for small teams and side projects',
    features: ['5,000 API requests per day', '5 team members', '10 GB storage', 'Email support'],
    price: '$29',
    period: '/month',
    recommended: false
  },
  {
    value: 'professional',
    id: 'plan-professional',
    title: 'Professional',
    description: 'Best for growing businesses and teams',
    features: [
      '100,000 API requests per day',
      '25 team members',
      '100 GB storage',
      'Priority email & chat support',
      'Advanced analytics',
      'Custom integrations'
    ],
    price: '$99',
    period: '/month',
    recommended: true
  },
  {
    value: 'enterprise',
    id: 'plan-enterprise',
    title: 'Enterprise',
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited API requests',
      'Unlimited team members',
      '1 TB storage',
      '24/7 phone support',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise deployment',
      'Custom contracts'
    ],
    price: '$299',
    period: '/month',
    recommended: false
  }
]

// Industry Options Data
const industryOptions = [
  {
    value: 'technology',
    label: 'Technology & Software'
  },
  {
    value: 'healthcare',
    label: 'Healthcare & Life Sciences'
  },
  {
    value: 'finance',
    label: 'Finance & Banking'
  },
  {
    value: 'ecommerce',
    label: 'E-commerce & Retail'
  },
  {
    value: 'education',
    label: 'Education & Training'
  }
]

const teamSizeItems = [
  { label: 'Select team size', value: null },
  { label: '1-5 People', value: '1-5' },
  { label: '5-10 People', value: '5-10' },
  { label: '10-25 People', value: '10-25' },
  { label: '25-50 People', value: '25-50' },
  { label: '50+ People', value: '50+' }
]

const regionItems = [
  { label: 'Select region', value: null },
  { label: 'United States (East)', value: 'us-east' },
  { label: 'United States (West)', value: 'us-west' },
  { label: 'Europe (Frankfurt)', value: 'eu-central' },
  { label: 'Asia Pacific (Singapore)', value: 'ap-southeast' },
  { label: 'Asia Pacific (Tokyo)', value: 'ap-northeast' }
]

const ModernForm = () => {
  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['technology'])

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedIndustries([...selectedIndustries, value])
    } else {
      setSelectedIndustries(selectedIndustries.filter(item => item !== value))
    }
  }

  return (
    <form>
      <div className='grid grid-cols-1 gap-10 lg:grid-cols-7'>
        <div className='space-y-10 lg:col-span-4'>
          {/* Section 1: Basic Information */}
          <div className='space-y-6'>
            <div className='space-y-1'>
              <h2 className='font-semibold'>Workspace Details</h2>
              <p className='text-muted-foreground text-sm'>Set up your workspace with basic information</p>
            </div>

            <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-5'>
              <Field className='gap-2 sm:col-span-3'>
                <FieldLabel htmlFor='workspace-name'>Workspace Name</FieldLabel>
                <Input id='workspace-name' placeholder='e.g., Acme Inc.' />
                <FieldDescription className='text-xs'>This name will be visible to all team members</FieldDescription>
              </Field>

              <Field className='gap-2 sm:col-span-2'>
                <FieldLabel htmlFor='team-size'>Team Size</FieldLabel>
                <Select defaultValue='5-10' items={teamSizeItems}>
                  <SelectTrigger id='team-size' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {teamSizeItems.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription className='text-xs'>Number of people who will use this workspace</FieldDescription>
              </Field>

              <Field className='gap-2 sm:col-span-full'>
                <FieldLabel htmlFor='region'>Deployment Region</FieldLabel>
                <Select defaultValue='us-east' items={regionItems}>
                  <SelectTrigger id='region' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {regionItems.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription className='text-xs'>
                  Choose the region closest to your users for best performance
                </FieldDescription>
              </Field>
            </FieldGroup>
          </div>

          <Separator />

          {/* Section 2: Plan Selection */}
          <div className='space-y-6'>
            <div className='space-y-1'>
              <h2 className='font-semibold'>Choose Your Plan</h2>
              <p className='text-muted-foreground text-sm'>Select the plan that best fits your needs</p>
            </div>

            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className='grid-cols-1 gap-4'>
              {planTypes.map(plan => (
                <div
                  key={plan.value}
                  className='border-input has-data-checked:border-primary/50 relative flex w-full flex-col gap-3 rounded-lg border p-4 outline-none'
                >
                  <div className='flex items-start gap-4'>
                    <RadioGroupItem
                      value={plan.value}
                      id={plan.id}
                      className='mt-1'
                      aria-describedby={`${plan.value}-description`}
                      aria-label={`plan-radio-${plan.value}`}
                    />
                    <div className='flex-1 space-y-4'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='space-y-1'>
                          <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                            <Label
                              htmlFor={plan.id}
                              className='cursor-pointer text-base font-semibold after:absolute after:inset-0'
                            >
                              {plan.title}
                            </Label>
                            {plan.recommended && (
                              <Badge className='bg-muted' variant='outline'>
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className='text-muted-foreground text-sm'>{plan.description}</p>
                        </div>
                        <div className='text-right'>
                          <div className='flex items-baseline gap-0.5'>
                            <span className='text-2xl font-bold'>{plan.price}</span>
                            <span className='text-muted-foreground text-sm'>{plan.period}</span>
                          </div>
                        </div>
                      </div>

                      <ul className='grid gap-2 sm:grid-cols-2'>
                        {plan.features.map((feature, index) => (
                          <li key={index} className='flex items-start gap-2'>
                            <CheckIcon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                            <span className='text-muted-foreground text-sm'>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Section 3: Industry Selection */}
          <div className='space-y-6'>
            <div className='space-y-1'>
              <h2 className='font-semibold'>Your Industry</h2>
              <p className='text-muted-foreground text-sm'>
                Select the industries you work in to help us customize your experience
              </p>
            </div>

            <div className='space-y-3'>
              {industryOptions.map(option => (
                <div
                  key={option.value}
                  className='border-input hover:bg-accent/50 has-data-checked:border-primary rounded-lg border transition-all'
                >
                  <div className='flex items-center gap-3'>
                    <Label htmlFor={option.value} className='flex-1 cursor-pointer p-4 font-normal'>
                      <Checkbox
                        id={option.value}
                        checked={selectedIndustries.includes(option.value)}
                        onCheckedChange={checked => handleCheckboxChange(option.value, checked as boolean)}
                      />
                      {option.label}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className='bg-muted h-fit shadow-none lg:col-span-3'>
          <CardHeader>
            <CardTitle className='leading-none font-semibold'>Need help choosing?</CardTitle>
            <CardDescription>
              Compare plans based on your team size and usage requirements. You can upgrade or downgrade at any time.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-sm'>
            <ul className='flex list-none flex-col gap-3'>
              <li className='flex items-center gap-1'>
                <span className='bg-primary text-primary-foreground flex size-4 shrink-0 items-center justify-center rounded-full'>
                  <CheckIcon className='size-3' />
                </span>{' '}
                Starter for teams up to 5 members
              </li>
              <li className='flex items-center gap-1'>
                <span className='bg-primary text-primary-foreground flex size-4 shrink-0 items-center justify-center rounded-full'>
                  <CheckIcon className='size-3' />
                </span>{' '}
                Professional with advanced analytics
              </li>
              <li className='flex items-center gap-1'>
                <span className='bg-primary text-primary-foreground flex size-4 shrink-0 items-center justify-center rounded-full'>
                  <CheckIcon className='size-3' />
                </span>{' '}
                Enterprise with dedicated support
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <a href='#' className='inline-flex items-center gap-1 text-sm hover:underline'>
              Compare all plan features <ExternalLinkIcon className='size-3' />
            </a>
          </CardFooter>
        </Card>
      </div>

      <Separator className='my-10' />

      <div className='flex justify-end gap-3'>
        <Button type='button' variant='outline'>
          Cancel
        </Button>
        <Button type='submit'>Update</Button>
      </div>
    </form>
  )
}

export default ModernForm
