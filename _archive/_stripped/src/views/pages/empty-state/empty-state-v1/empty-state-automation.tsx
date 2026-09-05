'use client'

// React Imports
import { useState } from 'react'

// Third-party imports
import { ArrowUpRightIcon, CheckIcon, ChevronDownIcon, PaperclipIcon, PlusIcon, WorkflowIcon } from 'lucide-react'

// Component imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import InitializePipelineDialog from '@/views/pages/empty-state/empty-state-v1/dialog-pipeline-configuration'

const models = [
  {
    id: 1,
    src: '/images/brands/gemini.webp',
    name: 'Gemini 3'
  },
  {
    id: 2,
    src: '/images/brands/codex-icon.webp',
    name: 'Codex'
  },
  {
    id: 3,
    src: '/images/brands/claude.webp',
    name: 'Claude 4.5 Sonnet'
  }
]

function EmptyStateAutomation() {
  const [inputValue, setInputValue] = useState('')
  const [selectedModel, setSelectedModel] = useState(models[1])

  return (
    <Card className='w-full'>
      <CardHeader className='gap-0'>
        <CardTitle>Automation</CardTitle>
        <CardDescription>Initialize the automation process by CI/CD</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border border-dashed p-6 text-center'>
          <WorkflowIcon className='text-muted-foreground mx-auto size-12' />
          <p className='mt-2 text-sm font-medium'>No automation tasks available</p>
          <p className='text-muted-foreground mt-1 text-sm'>
            Please check back later or configure your automation settings.
          </p>
          <InitializePipelineDialog
            trigger={
              <Button size='sm' className='mt-4'>
                <PlusIcon />
                <span>Initialize Pipeline</span>
              </Button>
            }
          />
        </div>
      </CardContent>
      <CardContent>
        <div className='group/prompt bg-card relative w-full flex-col gap-8 overflow-hidden rounded-xl border shadow-md'>
          <Textarea
            id='features-text-prompt'
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder='Make a pipeline to deploy to deploy my app'
            className='bg-card! mb-13 field-sizing-content resize-none rounded-xl border-0 p-4 text-lg! shadow-none focus-visible:ring-0'
          />
          <div className='absolute inset-x-4 bottom-4 flex items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant='ghost' className='gap-1.5 max-sm:w-30' size='sm' />}>
                  <img src={selectedModel.src} alt={selectedModel.name} className='size-6.5' />
                  <span className='truncate'>{selectedModel.name}</span>
                  <ChevronDownIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='w-50'>
                  {models.map(model => (
                    <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model)}>
                      <div className='flex items-center gap-2'>
                        <img src={model.src} alt={model.name} className='size-6.5' />
                        <span>{model.name}</span>
                      </div>
                      {selectedModel.id === model.id && <CheckIcon className='ml-auto' />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <span className='bg-border h-5 w-px' />
              <Button
                size='icon'
                className='bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40 size-7!'
              >
                <PaperclipIcon />
                <span className='sr-only'>Attach a file</span>
              </Button>
            </div>
            <Button size='icon' className='size-7!' disabled={inputValue.trim() === ''}>
              <ArrowUpRightIcon />
              <span className='sr-only'>Open in new tab</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default EmptyStateAutomation
