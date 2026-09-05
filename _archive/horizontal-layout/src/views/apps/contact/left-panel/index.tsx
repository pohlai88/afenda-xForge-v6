'use client'

// React imports
import { useMemo } from 'react'

// Third-party imports
import type { LucideIcon } from 'lucide-react'
import { BanIcon, CircleUserIcon, ContactIcon, PlusIcon, ShieldAlertIcon, StarIcon } from 'lucide-react'

// Type imports
import type { ContactNavItem, Label } from '@/types/apps/contact-types'
import { CONTACT_LABELS, CONTACT_LABEL_STYLES } from '@/types/apps/contact-types'

// Component imports
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// Store imports
import { useContactStore } from '@/store/use-contact-store'

// Utils imports
import { cn } from '@/lib/utils'

const navItems: { id: ContactNavItem; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All Contacts', icon: CircleUserIcon },
  { id: 'favourites', label: 'Favourites', icon: StarIcon },
  { id: 'spam', label: 'Spam', icon: ShieldAlertIcon },
  { id: 'blocked', label: 'Blocked', icon: BanIcon }
]

function isVisibleContact(contact: { isBlocked: boolean; isSpam: boolean }) {
  return !contact.isBlocked && !contact.isSpam
}

type LeftPanelProps = {
  onNavigate?: () => void
}

const LeftPanel = ({ onNavigate }: LeftPanelProps) => {
  const contacts = useContactStore(state => state.contacts)
  const activeNav = useContactStore(state => state.activeNav)
  const activeLabel = useContactStore(state => state.activeLabel)
  const setActiveNav = useContactStore(state => state.setActiveNav)
  const setActiveLabel = useContactStore(state => state.setActiveLabel)
  const openCreateContact = useContactStore(state => state.openCreateContact)

  const counts = useMemo(
    () => ({
      all: contacts.filter(contact => !contact.isBlocked && !contact.isSpam).length,
      favourites: contacts.filter(contact => contact.isFavourite && !contact.isBlocked && !contact.isSpam).length,
      spam: contacts.filter(contact => contact.isSpam).length,
      blocked: contacts.filter(contact => contact.isBlocked).length
    }),
    [contacts]
  )

  const labelCounts = useMemo(() => {
    const counts = Object.fromEntries(CONTACT_LABELS.map(label => [label, 0])) as Record<Label, number>

    for (const contact of contacts) {
      if (!isVisibleContact(contact)) continue

      for (const label of contact.labels) {
        counts[label] += 1
      }
    }

    return counts
  }, [contacts])

  return (
    <div className='flex h-full min-h-0 flex-col gap-4 py-4'>
      <div className='flex shrink-0 flex-col gap-4 px-4'>
        <div className='flex items-center gap-2'>
          <ContactIcon className='size-6' />
          <h1 className='text-xl font-semibold'>Contacts</h1>
        </div>
        <Button
          onClick={() => {
            openCreateContact()
            onNavigate?.()
          }}
        >
          <PlusIcon />
          New Contact
        </Button>
      </div>

      <ScrollArea className='min-h-0 flex-1 px-4'>
        <div className='flex flex-col gap-4'>
          <nav className='grid gap-1'>
            {navItems.map(navItem => {
              const NavIcon = navItem.icon
              const isActive = activeNav === navItem.id && !activeLabel
              const count = counts[navItem.id]

              return (
                <Button
                  key={navItem.id}
                  variant='ghost'
                  className={cn(
                    'justify-start gap-2.5 px-3',
                    isActive
                      ? 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground font-semibold'
                      : 'text-foreground/80 hover:bg-muted/60'
                  )}
                  onClick={() => {
                    setActiveNav(navItem.id)
                    onNavigate?.()
                  }}
                >
                  <NavIcon className='size-4 shrink-0 opacity-70' />
                  {navItem.label}
                  <span className='text-muted-foreground ml-auto text-xs tabular-nums'>{count}</span>
                </Button>
              )
            })}
          </nav>

          <Separator />

          <div className='flex flex-col gap-2'>
            <p className='text-muted-foreground text-[11px] font-medium uppercase'>Labels</p>
            <nav className='grid gap-1'>
              {CONTACT_LABELS.map(label => {
                const isActive = activeLabel === label
                const count = labelCounts[label]

                return (
                  <Button
                    key={label}
                    variant='ghost'
                    className={cn(
                      'justify-start gap-2.5 px-3 capitalize',
                      isActive
                        ? 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground font-semibold'
                        : 'text-foreground/80 hover:bg-muted/60'
                    )}
                    onClick={() => {
                      setActiveLabel(label)
                      onNavigate?.()
                    }}
                  >
                    <span className={cn('size-2 shrink-0 rounded-full', CONTACT_LABEL_STYLES[label])} />
                    {label}
                    {count > 0 && <span className='text-muted-foreground ml-auto text-xs tabular-nums'>{count}</span>}
                  </Button>
                )
              })}
            </nav>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default LeftPanel
