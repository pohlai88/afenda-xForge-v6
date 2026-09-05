// React Imports
import type { ReactNode } from 'react'

// Component Imports
import { Input } from '@/components/ui/input'

export const ComposeFieldRow = ({
  label,
  id,
  value,
  placeholder,
  onChange,
  trailing
}: {
  label: string
  id: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
  trailing?: ReactNode
}) => {
  // Props

  return (
    <div className='border-border flex min-h-11 items-center border-b px-5'>
      <label htmlFor={id} className='text-muted-foreground w-16 shrink-0 text-sm'>
        {label}
      </label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className='h-10 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent'
      />
      {trailing}
    </div>
  )
}
