'use client'

// React Imports
import type { ReactNode } from 'react'

// Type Imports
import type { ObjectContext } from '@/types/common/object-context-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export type PropertyField = {
  label: string
  value: ReactNode
}

export type PropertySection = {
  title: string
  fields: PropertyField[]
}

type Props = {
  object: ObjectContext | null

  /** What kind of thing this is, in the user's words: 'Pay run', 'Employee'. */
  typeLabel: string
  sections: PropertySection[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const Field = ({ label, value }: PropertyField) => (
  <div className='grid grid-cols-[8rem_1fr] gap-x-3 py-1.5 text-sm'>
    <dt className='text-muted-foreground'>{label}</dt>
    <dd className='min-w-0 break-words'>{value}</dd>
  </div>
)

/**
 * The canonical read-oriented object inspector: "what exactly is this object?".
 *
 * Properties is not Edit. It states what the object is and never offers to change it, which
 * is why this component takes no actions — a surface that needs to act on the object exposes
 * that through its commands, not through here.
 *
 * This owns presentation only: the header, the object's identity, section layout, scrolling,
 * close and focus behaviour. Every field comes from the domain, because the shared layer has
 * no business knowing what a payslip or a legal entity is made of.
 */
const PropertiesSheet = ({ object, typeLabel, sections, open, onOpenChange }: Props) => {
  if (!object) return null

  const populated = sections.filter(section => section.fields.length > 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='gap-0 sm:max-w-md'>
        <SheetHeader className='pr-12'>
          <Badge variant='secondary' className='w-fit'>
            {typeLabel}
          </Badge>
          <SheetTitle className='text-base'>{object.label}</SheetTitle>
          <SheetDescription>Properties — what this object is, not what to do with it.</SheetDescription>
        </SheetHeader>

        <ScrollArea className='min-h-0 flex-1'>
          <div className='flex flex-col gap-4 px-4 pb-4'>
            {populated.map((section, index) => (
              <div key={section.title} className='flex flex-col gap-1'>
                {index > 0 ? <Separator className='mb-3' /> : null}
                <h3 className='text-sm font-semibold'>{section.title}</h3>
                <dl>
                  {section.fields.map(field => (
                    <Field key={field.label} label={field.label} value={field.value} />
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default PropertiesSheet
