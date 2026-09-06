// React Imports
import type { ReactNode } from 'react'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'

type Props = {
  title: string
  description: string
  children: ReactNode

  /** Save row, usually. Rendered under the content, aligned right. */
  footer?: ReactNode

  /** Let the content span the whole card — for tables that need the width. */
  wide?: boolean
  className?: string
}

/**
 * The same two-column card the account settings page uses: what this section is on the left,
 * the controls on the right. Composed from Card rather than copied, so a change to Card
 * reaches every settings section at once.
 */
const SettingsSection = ({ title, description, children, footer, wide = false, className }: Props) => (
  <Card className={cn('grid grid-cols-1 gap-6', !wide && 'lg:grid-cols-3', className)}>
    <CardContent className='flex flex-col gap-1'>
      <h2 className='text-base font-semibold'>{title}</h2>
      <p className='text-muted-foreground text-sm'>{description}</p>
    </CardContent>
    <CardContent className={cn('flex flex-col gap-6', !wide && 'lg:col-span-2', wide && 'px-0')}>
      {children}
      {footer && <div className='flex justify-end gap-2 px-6 lg:px-0'>{footer}</div>}
    </CardContent>
  </Card>
)

export default SettingsSection
