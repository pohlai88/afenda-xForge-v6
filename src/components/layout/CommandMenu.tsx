'use client'

// React Imports
import { Fragment, useCallback, useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { SearchIcon } from 'lucide-react'

// Type Imports
import type { FindResult, FindSource, FindTarget } from '@/types/common/find-types'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { Kbd } from '@/components/ui/kbd'

// Find Imports
import { FIND_SOURCES } from '@/lib/find/find-sources'

type ResultGroup = { source: FindSource; results: FindResult[] }

/**
 * How long to wait before asking the server-backed sources.
 *
 * Short enough to feel immediate at typing speed, long enough that holding a key down does not
 * become one request per character. Every run is cancelled by its own cleanup, and a late reply
 * from an abandoned query is dropped rather than rendered.
 */
const ASK_AFTER_MS = 120

const isExternal = (path: string) => path.startsWith('http://') || path.startsWith('https://')

/** Only routes carry an address of their own; reports and commands are resolved when they exist. */
const hrefForRoute = (target: Exclude<FindTarget, { kind: 'object' }>) =>
  target.kind === 'route' ? target.path : null

const CommandMenu = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<ResultGroup[]>([])

  const router = useRouter()

  // Closing clears the search, so reopening never shows the previous query's answers.
  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setGroups([])
  }, [])

  const runCommand = useCallback(
    (command: () => unknown) => {
      close()
      command()
    },
    [close]
  )

  /*
   * ⌘K and Ctrl+K, and nothing else.
   *
   * A bare `/` used to open this too, guarded by a list of element types it should not fire in.
   * That list was already wrong — it knew about inputs and textareas but not about an open command
   * menu, a table's sort headers, or a row's context menu, all of which this app now has. A
   * shortcut that needs a growing blacklist of places it must not work is the wrong shortcut.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'k' || !(event.metaKey || event.ctrlKey)) return

      event.preventDefault()
      setOpen(current => !current)
    }

    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  /*
   * Ask every source, and let the slow ones be slow.
   *
   * Sources answer one async contract whether they filter an array in memory or go to a server, so
   * nothing below this line knows which is which — which is the point: moving people search behind
   * a database later changes a source, not the palette.
   *
   * A source that fails contributes nothing rather than taking the palette down with it, and a
   * source is not asked at all until the query is long enough to be worth a round trip.
   */
  useEffect(() => {
    if (!open) return

    const asked = query.trim()

    if (!asked) return

    let cancelled = false

    const timer = setTimeout(async () => {
      const settled = await Promise.all(
        FIND_SOURCES.map(async source => {
          if (asked.length < (source.minQueryLength ?? 0)) return { source, results: [] }

          try {
            return { source, results: await source.search(asked) }
          } catch {
            return { source, results: [] }
          }
        })
      )

      if (!cancelled) setGroups(settled.filter(group => group.results.length > 0))
    }, ASK_AFTER_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, query])

  /**
   * Opening is resolved here, from the target — never from a stored callback.
   *
   * An object already carries the address its source resolved, which is what lets the same target
   * be reopened later from a favourite or a recent entry without the palette remembering anything.
   */
  const openResult = (result: FindResult) => {
    const href = result.object ? result.object.href : hrefForRoute(result.target as Exclude<FindTarget, { kind: 'object' }>)

    if (!href) return

    runCommand(() => {
      if (isExternal(href)) window.open(href, '_blank', 'noopener,noreferrer')
      else router.push(href)
    })
  }

  return (
    <>
      <Button
        variant='ghost'
        className='hidden px-2.5 font-normal hover:bg-transparent sm:block dark:hover:bg-transparent'
        onClick={() => setOpen(true)}
      >
        <div className='text-muted-foreground hidden items-center gap-1.5 text-sm sm:flex'>
          <SearchIcon />
          <span>Type to search...</span>
          <Kbd>⌘K</Kbd>
        </div>
      </Button>
      <Button variant='ghost' size='icon' className='sm:hidden' onClick={() => setOpen(true)}>
        <SearchIcon />
        <span className='sr-only'>Search</span>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={next => {
          if (next) setOpen(true)
          else close()
        }}
      >
        <Command
          className='**[[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-10 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group]]:px-2 **:[[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 **:[[cmdk-input-wrapper]_svg]:h-5 **:[[cmdk-input-wrapper]_svg]:w-5 **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-3'
          filter={(value, search, keywords) => {
            search = search.toLowerCase()
            value = value.toLowerCase()

            // Exact match with item name (highest priority)
            if (value === search) return 2

            // Partial match with item name (medium priority)
            if (value.includes(search)) return 1.5

            // Match in tags/keywords (lowest priority)
            if (keywords && keywords.length > 0) {
              // Check for exact tag match first
              if (keywords.some(keyword => keyword.toLowerCase() === search)) return 1.25

              // Then check for partial matches in tags
              const extendedValue = value + ' ' + keywords.join(' ').toLowerCase()

              if (extendedValue.includes(search)) return 1
            }

            return 0
          }}
        >
          <CommandInput
            placeholder='Search runs, people and pages...'
            value={query}
            onValueChange={next => {
              setQuery(next)
              if (!next.trim()) setGroups([])
            }}
          />
          <CommandList>
            {query.trim() ? (
              <>
                <CommandEmpty>Nothing matches.</CommandEmpty>
                {groups.map((group, index) => (
                  <Fragment key={group.source.id}>
                    {index > 0 && <CommandSeparator />}
                    <CommandGroup heading={group.source.heading}>
                      {group.results.map(result => (
                        <CommandItem
                          key={`${group.source.id}:${result.label}:${result.sublabel ?? ''}`}
                          value={result.label}
                          keywords={[...(result.keywords ?? []), result.sublabel ?? '']}
                          onSelect={() => openResult(result)}
                        >
                          <result.icon />
                          <span className='flex min-w-0 flex-col'>
                            <span className='truncate'>{result.label}</span>
                            {result.sublabel && (
                              <span className='text-muted-foreground truncate text-xs'>{result.sublabel}</span>
                            )}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Fragment>
                ))}
              </>
            ) : (

              // Recent and favourites belong here, and until they exist this says what to type
              // rather than showing a set of destinations nobody chose.
              <p className='text-muted-foreground px-4 py-6 text-center text-sm'>
                Search for a run, a person or a page.
              </p>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

export default CommandMenu
