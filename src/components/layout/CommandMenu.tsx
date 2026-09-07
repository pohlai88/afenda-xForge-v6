'use client'

// React Imports
import { Fragment, useCallback, useEffect, useState, useSyncExternalStore } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { SearchIcon, StarIcon } from 'lucide-react'

// Type Imports
import type { FindResult, FindSource } from '@/types/common/find-types'

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
import { FIND_SOURCES, hrefForTarget, resolveTargets } from '@/lib/find/find-sources'
import { favouriteStore, forgetUnresolvedRecent, recentStore } from '@/lib/find/recent-and-favourites'
import { sameTarget } from '@/types/common/find-types'
import { cn } from '@/lib/utils'

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

const CommandMenu = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<ResultGroup[]>([])

  /** What the palette opens with: things pinned, then things just worked on. */
  const [pinned, setPinned] = useState<FindResult[]>([])
  const [recent, setRecent] = useState<FindResult[]>([])

  const favourites = useSyncExternalStore(
    favouriteStore.subscribe,
    favouriteStore.list,
    favouriteStore.getServerSnapshot
  )

  const isFavourite = (result: FindResult) => favourites.some(target => sameTarget(target, result.target))

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

  /*
   * Rebuild the opening lists every time the palette opens on an empty query.
   *
   * Deliberately not cached. A pinned run's status, an employee's title and a permission can all
   * have changed since the target was stored, and the only honest way to show a saved thing is to
   * ask again. Recent entries that no longer resolve are dropped; favourites are not, because a
   * pin is a decision and an access change tomorrow should find it still there.
   */
  useEffect(() => {
    if (!open || query.trim()) return

    let cancelled = false

    void (async () => {
      const [favouriteList, recentList] = await Promise.all([
        resolveTargets(favouriteStore.list()),
        resolveTargets(recentStore.list())
      ])

      if (cancelled) return

      setPinned(favouriteList.results)

      // Something pinned is already at the top of the palette, so Recent does not say it again.
      // The two lists answer different questions and a row that appears in both answers neither
      // any better.
      setRecent(
        recentList.results.filter(
          result => !favouriteList.results.some(favourite => sameTarget(favourite.target, result.target))
        )
      )

      forgetUnresolvedRecent(recentList.unresolved)
    })()

    return () => {
      cancelled = true
    }
  }, [open, query, favourites])

  /**
   * Opening is resolved here, from the target — never from a stored callback.
   *
   * An object already carries the address its source resolved, which is what lets the same target
   * be reopened later from a favourite or a recent entry without the palette remembering anything.
   */
  const openResult = (result: FindResult) => {
    const href = hrefForTarget(result)

    if (!href) return

    runCommand(() => {
      if (isExternal(href)) window.open(href, '_blank', 'noopener,noreferrer')
      else router.push(href)
    })
  }


  /**
   * One result row, wherever it appears.
   *
   * Pinned, recent and searched results are the same thing shown in different company, so they
   * render through one component — which is also what stops a favourite becoming a second, subtly
   * different copy of a result.
   *
   * The star is a real button rather than a decoration on the row: it has its own name, its own
   * focus, and toggling a pin must not open the thing being pinned.
   */
  const ResultRow = ({ result, source }: { result: FindResult; source: string }) => {
    const pinnedHere = isFavourite(result)

    return (
      <CommandItem
        key={`${source}:${result.label}:${result.sublabel ?? ''}`}
        value={result.label}
        keywords={[...(result.keywords ?? []), result.sublabel ?? '']}
        onSelect={() => openResult(result)}
      >
        <result.icon />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate'>{result.label}</span>
          {result.sublabel && <span className='text-muted-foreground truncate text-xs'>{result.sublabel}</span>}
        </span>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={pinnedHere ? `Remove ${result.label} from favourites` : `Add ${result.label} to favourites`}
          aria-pressed={pinnedHere}
          onClick={event => {
            event.stopPropagation()
            favouriteStore.toggle(result.target)
          }}
        >
          <StarIcon className={cn('size-4', pinnedHere ? 'fill-current' : 'text-muted-foreground')} />
        </Button>
      </CommandItem>
    )
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
                        <ResultRow
                          key={`${group.source.id}:${result.label}:${result.sublabel ?? ''}`}
                          result={result}
                          source={group.source.id}
                        />
                      ))}
                    </CommandGroup>
                  </Fragment>
                ))}
              </>
            ) : pinned.length > 0 || recent.length > 0 ? (
              <>
                {pinned.length > 0 && (
                  <CommandGroup heading='Favourites'>
                    {pinned.map(result => (
                      <ResultRow
                        key={`fav:${result.label}:${result.sublabel ?? ''}`}
                        result={result}
                        source='fav'
                      />
                    ))}
                  </CommandGroup>
                )}
                {pinned.length > 0 && recent.length > 0 && <CommandSeparator />}
                {recent.length > 0 && (
                  <CommandGroup heading='Recent'>
                    {recent.map(result => (
                      <ResultRow
                        key={`recent:${result.label}:${result.sublabel ?? ''}`}
                        result={result}
                        source='recent'
                      />
                    ))}
                  </CommandGroup>
                )}
              </>
            ) : (
              <p className='text-muted-foreground px-4 py-6 text-center text-sm'>
                Search for people, payroll runs, reports, or pages.
              </p>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

export default CommandMenu
