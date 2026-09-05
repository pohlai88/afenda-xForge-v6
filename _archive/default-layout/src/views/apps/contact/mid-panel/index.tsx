'use client'

// React imports
import { useMemo, useState } from 'react'

// Third-party imports
import {
  ArrowDownAZIcon,
  ArrowDownZAIcon,
  FunnelIcon,
  LayoutGridIcon,
  ListIcon,
  MenuIcon,
  SearchIcon,
  SquareCheckBigIcon
} from 'lucide-react'

// Component imports
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import LeftPanel from '@/views/apps/contact/left-panel'
import ContactSelectionBar from './contact-selection-bar'
import GridView from './grid-view'
import ListView from './list-view'

// Store imports
import { useContactStore } from '@/store/use-contact-store'

// Utils imports
import { cn } from '@/lib/utils'
import { getVisibleContacts, groupContactsByLetter, sortContacts, type ContactFilter } from '@/utils/contact-utils'

const MidPanel = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isNavSheetOpen, setIsNavSheetOpen] = useState(false)
  const contacts = useContactStore(state => state.contacts)
  const activeNav = useContactStore(state => state.activeNav)
  const activeLabel = useContactStore(state => state.activeLabel)
  const statusFilter = useContactStore(state => state.statusFilter)
  const view = useContactStore(state => state.view)
  const isSelectionMode = useContactStore(state => state.isSelectionMode)
  const setStatusFilter = useContactStore(state => state.setStatusFilter)
  const setView = useContactStore(state => state.setView)
  const enterSelectionMode = useContactStore(state => state.enterSelectionMode)
  const exitSelectionMode = useContactStore(state => state.exitSelectionMode)
  const clearCheckedContacts = useContactStore(state => state.clearCheckedContacts)

  const visibleContacts = useMemo(
    () => getVisibleContacts(contacts, activeNav, activeLabel, statusFilter, searchQuery),
    [contacts, activeNav, activeLabel, statusFilter, searchQuery]
  )

  const sortedContacts = useMemo(() => sortContacts(visibleContacts, sortOrder), [visibleContacts, sortOrder])

  const groupedContacts = useMemo(() => groupContactsByLetter(visibleContacts, sortOrder), [visibleContacts, sortOrder])

  const visiblePhones = useMemo(() => visibleContacts.map(contact => contact.phone), [visibleContacts])

  // Search lives in local state, so the checked list has to be cleared alongside it rather than inside the store
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    clearCheckedContacts()
  }

  return (
    <div className='flex h-full min-h-0 flex-col gap-4 py-4'>
      <div className='flex items-center gap-2 px-4'>
        <Sheet open={isNavSheetOpen} onOpenChange={setIsNavSheetOpen}>
          <SheetTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                className='shrink-0 rounded-full md:hidden'
                aria-label='Open navigation'
              />
            }
          >
            <MenuIcon className='size-4' />
          </SheetTrigger>
          <SheetContent side='left' className='max-w-80! gap-0 p-0'>
            <LeftPanel onNavigate={() => setIsNavSheetOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className='flex-1 shrink-0 space-y-2'>
          <Label htmlFor='searchContact' className='sr-only'>
            Input with start icon
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon className='size-4' />
            </InputGroupAddon>
            <InputGroupInput
              id='searchContact'
              placeholder='Search Contact'
              value={searchQuery}
              onChange={event => handleSearchChange(event.target.value)}
            />
          </InputGroup>
        </div>

        <Button
          variant='outline'
          size='icon'
          className='shrink-0 rounded-full'
          title={sortOrder === 'asc' ? 'Sorted A-Z' : 'Sorted Z-A'}
          onClick={() => setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))}
        >
          {sortOrder === 'asc' ? <ArrowDownAZIcon className='size-4' /> : <ArrowDownZAIcon className='size-4' />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                className='shrink-0 rounded-full'
                title={`Filter: ${statusFilter === 'all' ? 'All statuses' : statusFilter}`}
              />
            }
          >
            <FunnelIcon className='size-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={value => setStatusFilter(value as ContactFilter)}
            >
              <DropdownMenuRadioItem value='all'>All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='active'>Active</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='inactive'>Inactive</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='prospect'>Prospect</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant='outline'
          size='icon'
          className='hidden shrink-0 rounded-full sm:inline-flex'
          onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
        >
          {view === 'grid' ? <LayoutGridIcon /> : <ListIcon />}
        </Button>

        <Button
          variant={isSelectionMode ? 'secondary' : 'outline'}
          size='icon'
          className='shrink-0 rounded-full'
          title={isSelectionMode ? 'Exit selection' : 'Select contacts'}
          aria-label={isSelectionMode ? 'Exit selection' : 'Select contacts'}
          onClick={() => (isSelectionMode ? exitSelectionMode() : enterSelectionMode())}
        >
          <SquareCheckBigIcon />
        </Button>
      </div>

      {isSelectionMode && visibleContacts.length > 0 && <ContactSelectionBar visiblePhones={visiblePhones} />}

      <ScrollArea className='min-h-0 flex-1 px-4'>
        {visibleContacts.length === 0 ? (
          <p className='text-muted-foreground text-center text-sm'>No contacts found.</p>
        ) : (
          <>
            {view === 'grid' && <GridView contacts={sortedContacts} />}
            <ListView groupedContacts={groupedContacts} className={cn(view === 'grid' && 'sm:hidden')} />
          </>
        )}
      </ScrollArea>
    </div>
  )
}

export default MidPanel
