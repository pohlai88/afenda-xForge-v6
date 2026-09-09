'use client'

// React Imports
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Third-party Imports
import { Dialog } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'

// Type Imports
import type { FindResult } from '@/types/common/find-types'
import type { QueryAnswer, QueryMode, QuerySuggestion } from '@/types/common/query-types'

// Component Imports
import AuditTimeline from '@/components/shared/AuditTimeline'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// Find Imports
import { hrefForTarget } from '@/lib/find/find-sources'

// Query Imports
import { queryProviderFor } from '@/lib/query/query-providers'
import { closeQuery, getQuerySnapshot, subscribeQuery, type QueryInvocation } from '@/lib/query/query-store'

type AnswerStatus = 'idle' | 'loading' | 'done' | 'error'

/**
 * How the question list is doing.
 *
 * Four states because there are four things that can be true, and two of them used to be told to
 * the reader as one. A provider that could not be reached and a provider that has nothing to offer
 * are not the same answer: the first means the panel does not know, the second means it does.
 * Collapsing them said "nothing can be asked about this" on the strength of a dropped request.
 *
 * Local to the panel on purpose. `QueryProvider` still returns a promise of questions, which is the
 * whole contract — wrapping the result to carry a failure would push this component's lifecycle
 * into every domain that implements one.
 */
type SuggestionState = { status: 'loading' } | { status: 'ready'; questions: QuerySuggestion[] } | { status: 'error' }

/**
 * The doctrine's own words for the three kinds of question, and the only place they are named.
 *
 * All three are listed because the vocabulary is fixed; only the modes a provider advertises are
 * ever rendered, so predict has no control anywhere until something can answer one.
 */
const MODE_LABELS: Record<QueryMode, string> = {
  search: 'Search',
  audit: 'Audit',
  predict: 'Predict'
}

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]'

/**
 * The nearest thing that can actually take focus, starting from the control the panel was opened
 * from.
 *
 * A right-click lands on whatever was under the pointer, and that is often a heading or a cell
 * which cannot hold focus at all — calling `focus()` on one silently does nothing and leaves the
 * next Tab starting from the top of the document. So the element is used when it is focusable, its
 * nearest focusable ancestor when it is not, and nothing at all when there is neither, in which
 * case Base UI's own restoration is left to decide.
 */
const focusTarget = (element: HTMLElement | null) =>
  element?.isConnected ? element.closest<HTMLElement>(FOCUSABLE) : null

/**
 * Puts focus in the panel's filter when the panel opens.
 *
 * `initialFocus` below says the same thing to the primitive and is left in place, because it is the
 * declaration of what this panel wants and removing it would hide that the primitive is expected to
 * do this. Measured, it does not: opening the panel from a context menu — by pointer or by keyboard,
 * on any provider — produces no focus event at all, and the reader is left on a menu item inside a
 * popup that has already closed. This is the guarantee.
 *
 * It renders *inside* the popup, which is the whole point, and it is the same shape as
 * `KeyboardFocusHandoff` in `ObjectCommands` for the same reason. The popup is absent from the
 * document between invocations, so mounting is the moment the panel exists — there is nothing to
 * poll for, no frame to chase, and nothing to cancel, because closing unmounts this with it.
 *
 * The filter is the target rather than the popup: it is the first thing a reader would use, it is
 * the same control on every provider, and focusing a container instead would satisfy a focus check
 * while leaving typing to go nowhere.
 */
const FocusHandoff = ({ filter }: { filter: RefObject<HTMLInputElement | null> }) => {
  useEffect(() => {
    filter.current?.focus({ preventScroll: true })
  }, [filter])

  return null
}

/** Stable list identity. Objects are type + id; the other kinds are their key. */
const keyOf = (result: FindResult) =>
  result.target.kind === 'object'
    ? `${result.target.type}:${result.target.id}`
    : `${result.target.kind}:${result.target.key}`

const ResultRow = ({ result }: { result: FindResult }) => {
  const href = hrefForTarget(result)

  const body = (
    <>
      <result.icon className='text-muted-foreground mt-0.5 size-4 shrink-0' aria-hidden='true' />
      <span className='flex min-w-0 flex-col'>
        <span className='truncate'>{result.label}</span>
        {result.sublabel ? <span className='text-muted-foreground truncate text-xs'>{result.sublabel}</span> : null}
      </span>
    </>
  )

  // An answer never lists something it cannot open, but an object whose address the build cannot
  // resolve is shown as what it is rather than as a link that does nothing.
  return href ? (
    <Link
      href={href}
      className='hover:bg-accent focus-visible:ring-ring flex items-start gap-2 rounded-md px-2 py-2 outline-none focus-visible:ring-2'
    >
      {body}
    </Link>
  ) : (
    <div className='flex items-start gap-2 rounded-md px-2 py-2'>{body}</div>
  )
}

/**
 * Afenda 360 Query: a contextual panel that explores what is connected to one object.
 *
 * Mounted once in the app shell and opened with a value, never with a publication — the subject is
 * whatever the invoking surface already holds, so an employee inside a run can be asked about
 * without becoming the page's subject. `ObjectContextStore` keeps answering the shell's question
 * and this one keeps answering its own.
 *
 * Non-modal by construction, which is the entire reason it is a `Dialog` composed here rather than
 * a `Sheet`. Sheet hardcodes a backdrop and traps focus, and a panel you are meant to keep working
 * beside cannot do either: the table stays interactive, the page stays scrollable, and clicking the
 * workspace does not dismiss the question you just asked. Escape closes it, because Escape means
 * cancel; a click on the thing you are exploring does not.
 *
 * Doctrine: `floating_query` (D12), `preserve_context` (D05).
 */
const QueryPanel = () => {
  /*
   * The current invocation, and the last one, which is kept while the panel animates out.
   *
   * Closing empties the store, so rendering straight from it would blank the panel mid-transition
   * and leave `finalFocus` with nothing to hand focus back to.
   */
  const [invocation, setInvocation] = useState<QueryInvocation | null>(null)
  const [shown, setShown] = useState<QueryInvocation | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const [mode, setMode] = useState<QueryMode>('search')

  /** What this subject can be asked, and whether the panel has managed to find out. */
  const [suggestions, setSuggestions] = useState<SuggestionState>({ status: 'loading' })
  const [question, setQuestion] = useState<QuerySuggestion | null>(null)
  const [answer, setAnswer] = useState<QueryAnswer | null>(null)
  const [status, setStatus] = useState<AnswerStatus>('idle')
  const [filter, setFilter] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  /** Bumped on every ask, so a slow answer to an abandoned question is dropped rather than shown. */
  const asked = useRef(0)

  const [ask, setAsk] = useQueryState('ask', parseAsString.withOptions({ clearOnDefault: true, history: 'replace' }))

  /*
   * One subscription to the store, and the only place a new subject arrives.
   *
   * Being asked about something is the start of a conversation, so everything from the last one is
   * cleared here rather than left to be noticed later — reopening a panel that still showed the
   * previous answer would be showing figures nobody had asked for, and they may have changed since.
   * Nothing is cleared when the store empties, because that is a closing and the panel is still
   * animating out with its content.
   */
  useEffect(
    () =>
      subscribeQuery(() => {
        const next = getQuerySnapshot()

        setInvocation(next)

        const target = next && queryProviderFor(next.object.type)

        if (!next || !target) return

        asked.current += 1
        setShown(next)
        returnFocus.current = next.returnFocus
        setSuggestions({ status: 'loading' })
        setQuestion(null)
        setAnswer(null)
        setStatus('idle')
        setFilter('')

        /*
         * What this particular object can be asked, which the provider has to go and find out.
         *
         * A question is gated on the record rather than on the type — a payment that has not failed
         * cannot be asked what else failed for the same reason — so the list arrives after the panel
         * does. Where the conversation starts follows from what came back: the first mode the
         * provider actually published a question in, not the first it declares support for, so a
         * reader never lands on a mode with nothing behind it.
         *
         * A provider that cannot answer is a failure, not an empty list. Nothing about why is shown
         * or kept: the reason is the server's business, and it may be the shape of a permission.
         * Recovery is closing and asking again, which runs this from the top.
         */
        const token = asked.current

        void target
          .suggestions(next.object)
          .then(published => {
            if (asked.current !== token) return

            setSuggestions({ status: 'ready', questions: published })
            setMode(target.modes.find(candidate => published.some(one => one.mode === candidate)) ?? target.modes[0])
          })
          .catch(() => {
            if (asked.current !== token) return

            setSuggestions({ status: 'error' })
          })
      }),
    []
  )

  /*
   * A subject belongs to the page it was asked from.
   *
   * There is no cross-route persistence yet, so a panel does not follow the reader onto a page that
   * has nothing to do with what they asked about. This is a comparison rather than a watch for
   * navigation, which is what makes opening a result — a change of query string, not of path — keep
   * the question instead of throwing it away.
   */
  const pathname = usePathname()
  const stale = invocation !== null && invocation.route !== null && invocation.route !== pathname

  const provider = invocation ? queryProviderFor(invocation.object.type) : undefined
  const open = Boolean(invocation && provider) && !stale

  // Telling the store what the panel now knows: the subject it is holding is no longer reachable.
  useEffect(() => {
    if (stale) closeQuery()
  }, [stale])

  const close = useCallback(() => {
    asked.current += 1
    closeQuery()
    void setAsk(null)

    /*
     * Focus goes back to the control the panel was opened from.
     *
     * `finalFocus` below aims at the same element and is left in place, but it is Base UI's to run
     * and it runs as part of the closing transition. This is the guarantee: a person who pressed
     * Escape is put back where they were, in the same turn, whether or not anything animates.
     */
    focusTarget(returnFocus.current)?.focus({ preventScroll: true })
  }, [setAsk])

  /*
   * The address never claims a question is open when none is.
   *
   * `ask` names a question, and a question needs both a subject the panel is holding and a
   * selection — neither of which the address carries, deliberately. A cold load, a shared link or a
   * back button can arrive with an `ask` and no panel; asking about a second object leaves the
   * previous object's question named in a URL nobody is looking at. Rather than restoring a subject
   * from the address, which would be a persistence model nobody has asked for yet, the orphan is
   * cleared. Only this one parameter is touched.
   */
  useEffect(() => {
    if (!ask || (open && question)) return

    void setAsk(null)
  }, [ask, open, question, setAsk])

  /*
   * The question, mirrored into the address.
   *
   * Only the published id — never what was typed, which is a filter over questions rather than a
   * query and would put a person's search terms in a shareable URL. It is re-asserted rather than
   * written once because opening a result navigates with the address the object adapter resolved,
   * and that address carries no `ask`.
   */
  useEffect(() => {
    if (!open || !question || ask === question.id) return

    void setAsk(question.id)
  }, [open, question, ask, setAsk])

  const runQuestion = useCallback(
    async (suggestion: QuerySuggestion) => {
      if (!shown) return

      const target = queryProviderFor(shown.object.type)

      if (!target) return

      asked.current += 1

      const run = asked.current

      setQuestion(suggestion)
      setAnswer(null)
      setStatus('loading')

      try {
        const result = await target.run(shown.object, suggestion.id)

        if (asked.current !== run) return

        setAnswer(result)
        setStatus('done')
      } catch {
        if (asked.current !== run) return

        // Deliberately no detail. What went wrong is a server concern, and repeating it here would
        // publish internals to whoever asked.
        setStatus('error')
      }
    },
    [shown]
  )

  /**
   * Start a new line of questioning.
   *
   * An answer belongs to the question that produced it and a question belongs to a mode, so
   * changing mode clears both rather than leaving search results sitting under an audit heading.
   */
  const changeMode = useCallback(
    (next: QueryMode) => {
      asked.current += 1
      setMode(next)
      setQuestion(null)
      setAnswer(null)
      setStatus('idle')
      setFilter('')
      void setAsk(null)
    },
    [setAsk]
  )

  const subject = shown?.object
  const shownProvider = shown ? queryProviderFor(shown.object.type) : undefined

  /*
   * A mode is shown when the provider published a question in it, never merely because it declares
   * support for it. Support is not show, and a switch with nothing behind one of its options is a
   * control that misstates what the object can be asked.
   */
  const published = suggestions.status === 'ready' ? suggestions.questions : []
  const modes = (shownProvider?.modes ?? []).filter(candidate => published.some(one => one.mode === candidate))
  const asking = published.filter(suggestion => suggestion.mode === mode)

  return (
    <Dialog.Root
      open={open}
      modal={false}

      /*
       * The panel outlives a click on the workspace.
       *
       * This is a question you asked about what is on screen, so interacting with what is on screen
       * is the expected thing to do next. For a non-modal dialog this also stops focus moving out
       * of the panel from closing it, which is what makes the table reachable by keyboard while the
       * panel stays open.
       */
      disablePointerDismissal
      onOpenChange={next => {
        if (!next) close()
      }}
    >
      <Dialog.Portal>
        <Dialog.Popup
          data-slot='query-panel'
          initialFocus={inputRef}
          finalFocus={() => focusTarget(returnFocus.current) ?? true}

          /*
           * A closed panel is out of play, whether or not it has finished leaving.
           *
           * The popup is still in the document while it animates out, and it covers a real part of
           * the workspace — so for that moment it must not take a click meant for the table beneath
           * it, and it must not hold anything a Tab can reach. This says that in one attribute
           * rather than relying on the transition to have completed.
           */
          inert={!open}
          className='bg-popover text-popover-foreground fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-ending-style:translate-x-[2.5rem] data-ending-style:opacity-0 data-starting-style:translate-x-[2.5rem] data-starting-style:opacity-0 sm:max-w-md'
        >
          <div className='flex items-start justify-between gap-2 border-b p-4'>
            <div className='min-w-0'>
              <Dialog.Title className='font-heading text-foreground truncate font-medium'>
                Ask about {subject?.label ?? 'this'}
              </Dialog.Title>
            </div>
            <Dialog.Close render={<Button variant='ghost' size='icon-sm' aria-label='Close' />}>
              <XIcon />
            </Dialog.Close>
          </div>

          {/*
            Only the modes this provider advertises. One mode needs no switch — a control with a
            single option is chrome that states the obvious — and a mode nothing can answer is never
            offered at all, which is why predict has no control anywhere.
          */}
          {modes.length > 1 ? (
            <div className='border-b px-4 pt-3 pb-3'>
              <ToggleGroup
                variant='outline'
                size='sm'
                spacing={0}
                value={[mode]}
                onValueChange={value => changeMode((value[0] as QueryMode) ?? mode)}
                aria-label='What to ask'
                className='w-fit'
              >
                {modes.map(available => (
                  <ToggleGroupItem key={available} value={available}>
                    {MODE_LABELS[available]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ) : null}

          {/*
            Typing narrows the questions the domain published; it never becomes one. There is no
            parser behind this app, so an input that accepted a sentence would be claiming an
            understanding it does not have.
          */}
          <Command

            // `h-auto` because the primitive is built to fill a palette dialog; here it is one band
            // in a column and the answer beneath it is what gets the remaining height.
            className='h-auto w-full shrink-0 border-b bg-transparent'
            label={subject ? `Questions about ${subject.label}` : 'Questions'}
          >
            <CommandInput ref={inputRef} placeholder='Filter questions...' value={filter} onValueChange={setFilter} />
            <CommandList className='max-h-48'>
              {suggestions.status === 'loading' ? (
                <div className='flex flex-col gap-2 p-2' aria-busy='true'>
                  <Skeleton className='h-5 w-3/4' />
                  <Skeleton className='h-5 w-1/2' />
                </div>
              ) : null}

              {/*
                Two sentences that must never be swapped. Nothing to ask is knowledge: a provider
                exists for this type so the command was offered, and this particular record has no
                question it can answer — which is also what a reader with no audit rights is told,
                because a permission is not something to announce. Not being able to find out is the
                opposite, and says so without saying why: the reason may itself be the shape of a
                permission, and a reader who could not load a list has no use for it either way.
              */}
              {suggestions.status === 'ready' && published.length === 0 ? (
                <p className='text-muted-foreground px-2 py-3 text-sm'>Nothing can be asked about this yet.</p>
              ) : null}

              {suggestions.status === 'error' ? (
                <p className='text-muted-foreground px-2 py-3 text-sm'>Questions couldn&rsquo;t be loaded.</p>
              ) : null}

              {asking.length > 0 ? <CommandEmpty>No matching question.</CommandEmpty> : null}
              {asking.map(suggestion => (
                <CommandItem
                  key={suggestion.id}
                  value={suggestion.label}
                  keywords={[...(suggestion.keywords ?? [])]}
                  onSelect={() => void runQuestion(suggestion)}
                >
                  {suggestion.label}
                </CommandItem>
              ))}
            </CommandList>
          </Command>

          <div className='min-h-0 flex-1 overflow-y-auto p-4'>
            {status === 'idle' ? (
              <p className='text-muted-foreground text-sm'>Choose a question to explore what is connected to this.</p>
            ) : null}

            {status === 'loading' ? (
              <div className='flex flex-col gap-2' aria-busy='true'>
                <Skeleton className='h-9 w-full' />
                <Skeleton className='h-9 w-4/5' />
                <Skeleton className='h-9 w-3/5' />
              </div>
            ) : null}

            {status === 'error' ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>That question could not be answered</EmptyTitle>
                  <EmptyDescription>Try again in a moment.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {status === 'done' && answer ? (
              answer.items.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>Nothing to show</EmptyTitle>

                    {/*
                      What is absent is the evidence, not the change. "No results" would read as
                      "nothing happened", and an empty answer never proves that — the record may
                      simply hold nothing that bears on the question.
                    */}
                    <EmptyDescription>The record holds nothing that answers this.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <section className='flex flex-col gap-2'>
                  <h3 className='text-muted-foreground text-xs font-medium'>{question?.label}</h3>

                  {/*
                    Two answer shapes, each rendered the way the app already renders it: related
                    objects as Find rows, evidence on the audit timeline the run, the filing and the
                    payment all use. Nothing here asks what type of object was asked about.
                  */}
                  {answer.kind === 'objects' ? (
                    <ul className='flex flex-col'>
                      {answer.items.map(result => (
                        <li key={keyOf(result)}>
                          <ResultRow result={result} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <AuditTimeline events={answer.items} />
                  )}
                </section>
              )
            ) : null}
          </div>

          <FocusHandoff filter={inputRef} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default QueryPanel
