'use client'

// React Imports
import { useEffect, useRef } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { CheckCircle2Icon } from 'lucide-react'

// Type Imports
import type { AttentionItem } from '@/utils/payroll-group-attention'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ObjectContextMenu } from '@/components/shared/ObjectCommands'
import { ExceptionBadge } from '@/views/payroll/run/exception-badge'

// Object Imports
import { payrollExceptionCommands, payrollExceptionObject } from '@/views/payroll/payroll-objects'

/**
 * One exception, in the shape P01's `AttentionItem` already defines, plus the two domain fields
 * this surface has that the group one does not: the rule that raised it, and what it is worth.
 *
 * The extra fields are domain facts, not a second interaction vocabulary — the badge, the scope,
 * the reason, the consequence and the single destination are P01's grammar unchanged.
 */
export type EntityAttentionItem = AttentionItem & {
  /** Short noun phrase from the domain, e.g. 'Missing bank account'. */
  title: string

  /** The rule the engine checked, so the person clearing it can read what was tested. */
  rule?: string

  /** Money at stake, already formatted. Absent when the exception has no financial size. */
  impactLabel?: string
}

type Props = {
  items: EntityAttentionItem[]

  /** Set when a department chip has scoped this list to one department. */
  departmentFilter?: { id: string; name: string }

  /** Drops `dept` and keeps `run`. */
  clearFilterHref: string

  /** What was checked, for the empty state. Zero is an answer, not an absence. */
  checkedLabel: string
  className?: string
}

/**
 * What is stopping this company's payroll, worst first.
 *
 * The same discipline P01's Needs attention keeps: every item states its own consequence and
 * carries exactly one destination, so a payroll problem is resolvable work rather than a report
 * row. What this surface adds is money — where the domain records an impact, it orders equally
 * severe items by it, because two blockers are not equally urgent when one is worth a hundred
 * times the other.
 *
 * Ordering is done by the caller. Sorting here would put a second opinion about severity in a
 * component that only draws.
 */
const EntityAttention = ({ items, departmentFilter, clearFilterHref, checkedLabel, className }: Props) => {
  const heading = useRef<HTMLDivElement>(null)

  /*
   * Whether this render is the one that followed a clear, rather than any other route to an
   * unfiltered list — arriving unfiltered, or a department chip toggling itself off. Only the
   * control that destroys itself needs focus handed on.
   */
  const clearing = useRef(false)

  /*
   * Clear filter is rendered by the state it removes, so activating it unmounts the element that
   * had focus and the browser drops focus to `<body>` — a keyboard reader is thrown to the top of
   * the document in the middle of a task. Nothing else in this card survives the transition to
   * receive it: the chips belong to the department surface, and the items themselves are the
   * content that just changed. So the section's own heading takes focus. It says where the reader
   * still is, it is where the now-unfiltered list begins, and `tabIndex={-1}` keeps it
   * programmatically focusable without adding a tab stop that nobody asked for.
   */
  useEffect(() => {
    if (departmentFilter || !clearing.current) return

    clearing.current = false
    heading.current?.focus({ preventScroll: true })
  }, [departmentFilter])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle
          ref={heading}
          tabIndex={-1}
          role='heading'
          aria-level={2}
          className='focus-visible:ring-ring/50 rounded-sm text-lg font-semibold outline-none focus-visible:ring-3'
        >
          Needs attention
        </CardTitle>
        <CardDescription>
          {departmentFilter
            ? `Filtered to ${departmentFilter.name}`
            : items.length === 0
              ? 'Nothing is holding up this run'
              : `${items.length} ${items.length === 1 ? 'item' : 'items'}, most serious first`}
        </CardDescription>
        {departmentFilter && (
          <CardAction>
            <Button
              variant='ghost'
              size='sm'
              render={<Link href={clearFilterHref} scroll={false} />}
              nativeButton={false}
              onClick={() => {
                clearing.current = true
              }}
            >
              Clear filter
            </Button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className='flex flex-1 flex-col'>
        {items.length === 0 ? (
          <p className='text-success-strong flex items-start gap-2 text-sm'>
            <CheckCircle2Icon className='mt-0.5 size-4 shrink-0' aria-hidden='true' />
            {checkedLabel}
          </p>
        ) : (
          <ul className='flex flex-col divide-y'>
            {items.map((item, index) => (
              <ObjectContextMenu
                key={item.id}
                object={payrollExceptionObject({ id: item.id, title: item.title }, item.scope)}
                commands={payrollExceptionCommands({ id: item.id, rule: item.rule }, { href: item.href })}
              >
                <li className={index === 0 ? 'flex flex-col gap-2 pb-4' : 'flex flex-col gap-2 py-4 last:pb-0'}>
                  <div className='flex flex-wrap items-center gap-2'>
                    <ExceptionBadge severity={item.severity} />
                    <span className='text-sm font-medium'>{item.scope}</span>
                    {item.dueLabel && <span className='text-muted-foreground text-xs'>· {item.dueLabel}</span>}
                  </div>

                  <p className='text-sm'>{item.reason}</p>
                  <p className='text-muted-foreground text-sm'>{item.consequence}</p>

                  {item.impactLabel && (
                    <p className='text-muted-foreground text-xs tabular-nums'>Worth {item.impactLabel}</p>
                  )}

                  {/* One control, one tab stop. The Button *is* the link — a Link wrapping a Button
                      is an anchor inside a button, which costs a second tab stop for one target. */}
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-fit'
                    render={<Link href={item.href} />}
                    nativeButton={false}
                  >
                    {item.actionLabel}
                  </Button>
                </li>
              </ObjectContextMenu>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default EntityAttention
