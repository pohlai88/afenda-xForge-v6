// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon, CheckCircle2Icon, ChevronDownIcon } from 'lucide-react'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

/**
 * One payroll context this employer could be worked in right now.
 *
 * "Actionable" is membership, not rank: a run that has not reached a terminal status. Nothing
 * here says one context matters more than another, because the domain holds no record that would
 * make such a claim true.
 */
export type ActionableContext = {
  runId: string
  reference: string

  /** e.g. 'Sep 2026'. */
  periodLabel: string
  statusLabel: string

  /** e.g. '2 blockers'. Omitted when the run has none. */
  blockerLabel?: string
  href: string
}

type Props = {
  contexts: ActionableContext[]
  className?: string
}

/**
 * The one consequential thing to do next for this company.
 *
 * It navigates; it never mutates. No create, start, review, approve, settle or file operation
 * exists at entity scope — every payroll mutation in this domain acts on a run, a settlement
 * batch, a filing or a configuration record, and each of those has an owning surface. A button
 * here labelled "Run payroll" would promise a capability the product does not have.
 *
 * Three branches, and the third is why this component exists. One legal employer may have several
 * open runs, and the domain holds no rule ranking two runs of one company against each other —
 * not recency, which is a date and not a judgement, and not the state order, which was authored
 * to sort a column in the group matrix. So with more than one, the page refuses to choose: it
 * offers the set and lets the operator decide, which is the honest shape of the question.
 *
 * A disclosure rather than a menu, deliberately. The contexts belong on this page next to the
 * state they describe, and an inline panel keeps them reachable, readable and testable instead of
 * hiding them behind an overlay.
 */
const EntityNextAction = ({ contexts, className }: Props) => {
  if (contexts.length === 0) {
    return (
      <p className={`text-muted-foreground flex items-start gap-2 text-sm ${className ?? ''}`}>
        <CheckCircle2Icon className='text-success-strong mt-0.5 size-4 shrink-0' aria-hidden='true' />
        No payroll work currently requires action for this company.
      </p>
    )
  }

  if (contexts.length === 1) {
    const only = contexts[0]

    return (
      <div className={className}>
        <Button render={<Link href={only.href} />} nativeButton={false}>
          Open {only.reference}
          <ArrowRightIcon />
        </Button>
      </div>
    )
  }

  return (
    <Collapsible className={className}>
      <CollapsibleTrigger
        render={
          <Button>
            Choose payroll work
            <ChevronDownIcon className='transition-transform duration-200 in-data-[panel-open]:rotate-180' />
          </Button>
        }
      />

      <CollapsibleContent className='mt-3'>
        <p className='text-muted-foreground mb-2 text-xs'>
          {contexts.length} payroll runs are open for this company. They are listed by period, newest first — that is a
          display order, not a recommendation.
        </p>
        <ul className='flex max-w-xl flex-col divide-y rounded-md border'>
          {contexts.map(context => (
            <li key={context.runId}>
              <Button
                variant='ghost'
                render={<Link href={context.href} />}
                nativeButton={false}
                className='h-auto w-full justify-start gap-3 px-3 py-2.5 text-left font-normal'
              >
                <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <span className='truncate text-sm font-medium'>{context.reference}</span>
                  <span className='text-muted-foreground truncate text-xs'>
                    {context.periodLabel} · {context.statusLabel}
                  </span>
                </span>
                {context.blockerLabel && (
                  <Badge className='bg-destructive/10 text-destructive-strong shrink-0 text-xs whitespace-nowrap'>
                    {context.blockerLabel}
                  </Badge>
                )}
                <ArrowRightIcon className='text-muted-foreground size-4 shrink-0' aria-hidden='true' />
              </Button>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default EntityNextAction
