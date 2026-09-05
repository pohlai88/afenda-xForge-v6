'use client'

// React Imports
import { useState, type ReactElement } from 'react'

// Third-party imports
import { WorkflowIcon } from 'lucide-react'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { cn } from '@/lib/utils'

type Props = {
  trigger: ReactElement
  defaultOpen?: boolean
  className?: string
}

const steps = [
  {
    number: 1,
    title: 'Select Repository',
    description: 'Choose the source code provider.',
    options: ['GitHub', 'GitLab', 'Bitbucket', 'Azure Repos'],
    defaultValue: 'GitHub'
  },
  {
    number: 2,
    title: 'Choose Build Environment',
    description: 'Select the runtime and build configuration.',
    options: ['Node.js', 'Python', 'Java', 'Docker-based Build', 'Custom Build Script'],
    defaultValue: 'Node.js'
  },
  {
    number: 3,
    title: 'Configure Test Runner',
    description: 'Select the testing framework to execute during CI.',
    options: ['Jest', 'Vitest', 'Mocha', 'Cypress (E2E)', 'Skip Tests'],
    defaultValue: 'Jest'
  },
  {
    number: 4,
    title: 'Set Deployment Target',
    description: 'Choose where the application will be deployed.',
    options: ['AWS', 'Azure', 'Google Cloud', 'Heroku', 'Netlify', 'Vercel'],
    defaultValue: 'Vercel'
  }
]

const InitializePipelineDialog = ({ defaultOpen = false, trigger, className }: Props) => {
  const [open, setOpen] = useState(defaultOpen)

  const [values, setValues] = useState<Record<number, string>>(
    Object.fromEntries(steps.map(s => [s.number, s.defaultValue]))
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} onClick={() => setOpen(true)} />
      <DialogContent
        className={cn(
          'flex max-h-[min(920px,95vh)] flex-col gap-0 overflow-y-auto p-0 max-sm:max-h-[min(650px,80vh)] sm:max-w-2xl [&>[data-slot=dialog-close]>svg]:size-4',
          className
        )}
        aria-describedby={undefined}
      >
        <div className='bg-background sticky top-0 z-10 flex shrink-0 items-center border-b px-6 py-4 pr-12'>
          <DialogTitle className='text-lg font-semibold'>Initialize CI/CD Pipeline</DialogTitle>
        </div>

        <ScrollArea className='flex-1'>
          <div className='grid grid-cols-1 md:grid-cols-[1fr_auto_1.6fr]'>
            {/* Left Panel */}
            <div className='flex flex-col p-6'>
              <div className='mb-6'>
                <div className='bg-muted mb-3 flex size-10 items-center justify-center rounded-md'>
                  <WorkflowIcon className='text-muted-foreground size-5' />
                </div>
                <p className='text-base font-semibold'>Pipeline Configuration</p>
                <p className='text-muted-foreground text-sm'>Automate build and deployment</p>
              </div>

              <Separator className='mb-6' />

              <div className='mb-5'>
                <p className='mb-1 text-sm font-medium'>Description</p>
                <p className='text-muted-foreground text-sm'>
                  Set up continuous integration workflows for your project.
                </p>
              </div>

              <div>
                <p className='mb-1 text-sm font-medium'>Info</p>
                <p className='text-muted-foreground text-sm'>Improve reliability and release speed.</p>
              </div>
            </div>

            {/* Vertical Divider */}
            <Separator orientation='vertical' className='hidden h-full md:block' />

            {/* Right Panel */}
            <div className='flex flex-col p-6'>
              <div className='space-y-6'>
                {steps.map(step => (
                  <div key={step.number}>
                    <div className='mb-2 flex items-center gap-2'>
                      <Badge className='h-auto' variant='secondary'>
                        {step.number}
                      </Badge>
                      <p className='text-sm font-medium'>{step.title}</p>
                    </div>
                    {step.description && <p className='text-muted-foreground mb-2 text-xs'>{step.description}</p>}
                    <Select
                      value={values[step.number]}
                      onValueChange={val => val && setValues(prev => ({ ...prev, [step.number]: val }))}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {step.options.map(opt => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className='bg-background sticky bottom-0 z-10 flex shrink-0 flex-col-reverse items-center gap-4 border-t px-6 py-4 sm:flex-row sm:justify-end'>
          <DialogClose render={<Button variant='outline' className='max-sm:w-full' />}>Cancel</DialogClose>
          <DialogClose render={<Button className='max-sm:w-full' />}>Initialize</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default InitializePipelineDialog
