'use client'

// React Imports
import * as Stepperize from '@stepperize/react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronLeftIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PersonalInfoStep from '@/views/pages/onboarding/onboarding-feed-v1/step-01-personal-info'
import GoalsStep from '@/views/pages/onboarding/onboarding-feed-v1/step-02-goals'
import WorkspaceStep from '@/views/pages/onboarding/onboarding-feed-v1/step-03-workspace'
import NotificationsStep from '@/views/pages/onboarding/onboarding-feed-v1/step-04-notifications'
import CompleteStep from '@/views/pages/onboarding/onboarding-feed-v1/step-05-complete'

// Util Imports
import { cn } from '@/lib/utils'

const { useStepper } = Stepperize.defineStepper(
  {
    id: 'onboarding-personal-info',
    title: 'Tell us about yourself',
    description: 'A few quick questions to personalize your experience.'
  },
  {
    id: 'onboarding-goals',
    title: 'What would you like to achieve?',
    description: 'Select all that apply. This helps us tailor your dashboard and recommendations.'
  },
  {
    id: 'onboarding-workspace',
    title: 'Set up your workspace',
    description: 'Create a shared space for your team to collaborate and stay aligned.'
  },
  {
    id: 'onboarding-notifications',
    title: 'Stay in the loop',
    description: "Choose how and when you'd like to receive updates from us."
  },
  {
    id: 'onboarding-complete',
    title: "You're all set! 🎉",
    description: 'Your workspace is ready. Start exploring and get things done.'
  }
)

export type StepperType = ReturnType<typeof useStepper>

const OnboardingSplit = () => {
  const stepper = useStepper()
  const allSteps = stepper.state.all
  const currentId = stepper.state.current.data.id
  const currentIndex = stepper.lookup.getIndex(currentId)
  const currentStep = stepper.state.current.data

  return (
    <Card className='bg-muted flex w-full flex-col-reverse overflow-hidden py-0 lg:min-h-145 lg:flex-row'>
      {/* Left Panel */}
      <CardContent className='flex w-full flex-col justify-start p-6 lg:w-[42%] lg:p-10'>
        {/* Back button */}
        <div className='min-h-5'>
          {!stepper.state.isFirst && (
            <Button variant='ghost' className='gap-1 px-0!' onClick={() => stepper.navigation.prev()}>
              <ChevronLeftIcon className='size-4' />
              Back
            </Button>
          )}
        </div>

        {/* Title & Description */}
        <div className='flex flex-1 flex-col items-start justify-between gap-10 md:flex'>
          <div className='flex flex-col gap-3'>
            <h1 className='text-xl leading-tight font-medium tracking-tight md:text-4xl'>{currentStep.title}</h1>
            <p className='text-muted-foreground max-w-xs text-base leading-relaxed'>{currentStep.description}</p>
          </div>
          {/* Next / Finish button + step dots */}
          <div className='flex w-full flex-col gap-5'>
            {stepper.state.isLast ? (
              <Button className='w-full' render={<Link href='/' />} nativeButton={false}>
                Go to Dashboard
              </Button>
            ) : (
              <Button className='w-full' onClick={() => stepper.navigation.next()}>
                Next
              </Button>
            )}
            {/* Step dots */}
            <div className='flex items-center justify-center gap-1.5'>
              {allSteps.map((step, i) => (
                <button
                  key={step.id}
                  onClick={() => stepper.navigation.goTo(step.id)}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    i === currentIndex ? 'bg-primary w-5' : 'bg-muted-foreground/30 w-2'
                  )}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Right Panel */}
      <div
        className={cn(
          'bg-background flex flex-1 items-start justify-center p-4 transition-colors duration-500 sm:p-6 lg:p-10'
        )}
      >
        <div className='w-full'>
          {stepper.flow.switch({
            'onboarding-personal-info': () => <PersonalInfoStep />,
            'onboarding-goals': () => <GoalsStep />,
            'onboarding-workspace': () => <WorkspaceStep />,
            'onboarding-notifications': () => <NotificationsStep />,
            'onboarding-complete': () => <CompleteStep />
          })}
        </div>
      </div>
    </Card>
  )
}

export default OnboardingSplit
