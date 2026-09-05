'use client'

// React Imports
import { useState } from 'react'

// Component Imports
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const goals = [
  'Close more deals',
  'Grow my network',
  'Track my pipeline',
  'Automate outreach',
  'Collaborate with team',
  'Find new prospects',
  'Retain customers',
  'Analyze performance',
  'Streamline workflow',
  'Something else',
  'Increase revenue',
  'Save time',
  'Improve customer relationships',
  'Get insights',
  'Manage client relationships',
  'Track customer interactions'
]

const GoalsStep = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (goal: string) => {
    setSelected(prev => {
      const next = new Set(prev)

      if (next.has(goal)) {
        next.delete(goal)
      } else {
        next.add(goal)
      }

      return next
    })
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      {goals.map(goal => {
        const isChecked = selected.has(goal)

        return (
          <Label
            key={goal}
            onClick={() => toggle(goal)}
            className='hover:bg-accent/50 has-aria-checked:border-primary flex cursor-pointer items-center gap-2 rounded-lg border p-3'
          >
            <Checkbox checked={isChecked} onCheckedChange={() => toggle(goal)} />
            <span className='text-left text-sm max-sm:text-xs'>{goal}</span>
          </Label>
        )
      })}
    </div>
  )
}

export default GoalsStep
