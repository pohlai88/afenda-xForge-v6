// React Imports
import type { ReactNode } from 'react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const FormatButton = ({
  label,
  onClick,
  children
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) => {
  // Props

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            className='text-muted-foreground hover:text-foreground size-8'
            onClick={onClick}
          />
        }
      >
        {children}
        <span className='sr-only'>{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
