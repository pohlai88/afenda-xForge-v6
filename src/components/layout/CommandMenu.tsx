'use client'

// React Imports
import { Fragment, useCallback, useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { ContactIcon, MailIcon, SearchIcon, TrendingUpIcon, UserCogIcon, UsersIcon } from 'lucide-react'

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
  CommandSeparator,
  CommandShortcut
} from '@/components/ui/command'
import { Kbd } from '@/components/ui/kbd'

// Data Imports
import { searchData } from '@/assets/data/search'

const CommandMenu = () => {
  // States
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Hooks
  const router = useRouter()

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        setOpen(open => !open)
      }
    }

    document.addEventListener('keydown', down)

    return () => document.removeEventListener('keydown', down)
  }, [])

  // Search groups rendered in the command palette.
  const searchGroups = searchData

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
      <CommandDialog open={open} onOpenChange={setOpen}>
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
          <CommandInput placeholder='Type a command or search...' value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {search ? (
              searchGroups.map((searchGroup, index) => (
                <Fragment key={index}>
                  <CommandGroup heading={searchGroup.title}>
                    {searchGroup.data.map((item, i) => (
                      <CommandItem
                        key={i}
                        keywords={item.tags}
                        onSelect={() =>
                          runCommand(() => {
                            if (item.openInNewTab) {
                              window.open(item.href, '_blank', 'noopener,noreferrer')
                            } else {
                              router.push(item.href)
                            }
                          })
                        }
                      >
                        <item.icon />
                        <span>{item.name}</span>
                        {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {index !== searchGroups.length - 1 && <CommandSeparator />}
                </Fragment>
              ))
            ) : (
              <CommandGroup heading='Suggestions'>
                <CommandItem onSelect={() => runCommand(() => router.push('/apps/mail'))}>
                  <MailIcon />
                  <span>Mail - App</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/apps/contact'))}>
                  <ContactIcon />
                  <span>Contact - App</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/sales'))}>
                  <TrendingUpIcon />
                  <span>Sales - Dashboard</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/apps/users/list'))}>
                  <UsersIcon />
                  <span>Users - App</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/pages/user-settings?setting=general'))}>
                  <UserCogIcon />
                  <span>Settings - Page</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

export default CommandMenu
