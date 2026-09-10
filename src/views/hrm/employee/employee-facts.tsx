// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'

export type Fact = {
  label: string

  /**
   * Already resolved to what should be read. A section decides that an absent manager reads
   * "Not recorded" rather than this component guessing — the difference between "we have no
   * value" and "the value is none" is the domain's to state, not a renderer's.
   */
  value: React.ReactNode
  hint?: string
}

type Props = {
  title: string
  description?: string
  facts: Fact[]
  children?: React.ReactNode
  className?: string
}

/**
 * A titled list of label-and-value pairs.
 *
 * The employee workspace is mostly this shape, so it is one component rather than five near-
 * identical ones. It composes the Card primitives rather than approximating them: `CardTitle`
 * emits the `data-slot` the header grid keys off, and a hand-rolled span would not.
 *
 * `role='heading'` puts each section in the document outline. `CardTitle` renders a div by
 * default, which is right for a card that is not a section of the page — but here every card is a
 * section, and without this a screen-reader user has no way to skip between them.
 */
const EmployeeFacts = ({ title, description, facts, children, className }: Props) => (
  <Card className={cn(className)}>
    <CardHeader>
      <CardTitle role='heading' aria-level={2}>
        {title}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>

    <CardContent className='flex flex-col gap-4'>
      <dl className='flex flex-col gap-3'>
        {facts.map(fact => (
          <div key={fact.label} className='flex items-baseline justify-between gap-6'>
            <dt className='text-muted-foreground shrink-0 text-sm'>{fact.label}</dt>
            <dd className='flex min-w-0 flex-col items-end text-right text-sm'>
              <span className='truncate'>{fact.value}</span>
              {fact.hint && <span className='text-muted-foreground text-xs'>{fact.hint}</span>}
            </dd>
          </div>
        ))}
      </dl>

      {children}
    </CardContent>
  </Card>
)

export default EmployeeFacts
