'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { CircularProgress } from '@/components/ui/circular-progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const SpendManagement = () => {
  const [enabled, setEnabled] = useState(true)
  const [animatedProgress, setAnimatedProgress] = useState(79)

  const usedAmount = 317
  const limitAmount = 400
  const targetProgress = enabled ? 79 : 0

  // Smooth animation only for the progress bar visual
  useEffect(() => {
    const duration = 600 // Animation duration in ms
    const steps = 30 // Number of animation steps
    const stepDuration = duration / steps

    const startValue = animatedProgress
    let currentStep = 0

    const interval = setInterval(() => {
      currentStep++

      if (currentStep >= steps) {
        setAnimatedProgress(targetProgress)
        clearInterval(interval)
      } else {
        // Easing function for smooth animation
        const progress = currentStep / steps
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const newValue = startValue + (targetProgress - startValue) * easeOut

        setAnimatedProgress(newValue)
      }
    }, stepDuration)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetProgress])

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>Spend Management</h3>
        <p className='text-muted-foreground text-sm'>Manage your spend and subscription options.</p>
      </div>

      {/* Content */}
      <div className='space-y-6 lg:col-span-2'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex gap-4'>
            <div className='relative'>
              <CircularProgress value={animatedProgress} size={52} strokeWidth={5} className='stroke-border' />
              {/* Custom instant label */}
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-xs font-medium'>{Math.round(targetProgress)}%</span>
              </div>
            </div>
            <div>
              <p className='text-sm font-medium'>
                ${enabled ? usedAmount : 0} / {enabled ? limitAmount : 0} ({Math.round(animatedProgress)}%)
              </p>
              <p className='text-base'>{enabled ? 'Spend management enabled' : 'Spend management disabled'}</p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={v => setEnabled(!!v)} />
        </div>
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            enabled ? 'mt-4 max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
          aria-hidden={!enabled}
        >
          <form>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
              <div className='flex flex-col items-start gap-1'>
                <Label htmlFor='set-amount'>Set amount ($)</Label>
                <Input id='set-amount' type='tel' placeholder='350' />
              </div>
              <div className='flex flex-col items-start gap-1 sm:col-span-2'>
                <Label htmlFor='email'>Provide email for notifications</Label>
                <Input id='email' type='email' placeholder='organization@example.com' />
              </div>
            </div>
          </form>
          <div className='mt-6 flex justify-end'>
            <Button type='submit' className='max-sm:w-full'>
              Update
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpendManagement
