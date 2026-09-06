'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Type Imports
import type { LegalEntity } from '@/types/hrm/entity-types'

// Component Imports
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  entities: LegalEntity[]
  value: string

  /** The route the choice is applied to, e.g. '/payroll/payments'. */
  basePath: string
  label?: string
}

/**
 * Which company a single-entity screen is showing.
 *
 * Payments, compliance and reports are each about one company at a time: a payment file is drawn
 * on one account, a statutory filing goes to one authority, and a register is a list of one
 * company's people. This picks whose without pretending the screens could span them.
 *
 * The choice goes in the URL rather than into state, so it survives a reload and can be shared.
 */
const EntityPicker = ({ entities, value, basePath, label = 'Company' }: Props) => {
  const router = useRouter()

  if (entities.length < 2) return null

  return (
    <div className='flex flex-col gap-1.5'>
      <Label htmlFor='entity-picker' className='text-muted-foreground text-xs'>
        {label}
      </Label>
      <Select
        value={value}
        onValueChange={next => next && router.push(`${basePath}?entity=${encodeURIComponent(next)}`)}
        items={entities.map(entity => ({ value: entity.id, label: entity.name }))}
      >
        <SelectTrigger id='entity-picker' className='w-full sm:w-64'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {entities.map(entity => (
            <SelectItem key={entity.id} value={entity.id}>
              {entity.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default EntityPicker
