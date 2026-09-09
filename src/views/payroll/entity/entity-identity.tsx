'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronLeftIcon } from 'lucide-react'

// Type Imports
import type { LegalEntity } from '@/types/hrm/entity-types'

// Component Imports
import { Button } from '@/components/ui/button'
import PublishObjectContext from '@/components/layout/PublishObjectContext'
import { ObjectCommandsButton, ObjectContextMenu } from '@/components/shared/ObjectCommands'
import PropertiesSheet from '@/components/shared/PropertiesSheet'

// Object Imports
import { legalEntityCommands, legalEntityObject, legalEntityProperties } from '@/views/payroll/payroll-objects'

// Util Imports
import { COUNTRY_LABELS } from '@/utils/payroll-group'

type Props = {
  entity: LegalEntity

  /** Where the return control goes, already validated as a same-origin payroll path. */
  backHref: string

  /** What it goes back to, named. 'Back' tells the reader nothing about where they land. */
  backLabel: string

  /** The open period, derived from this company's own runs. Absent when it has none. */
  openPeriodLabel?: string

  /** Reference of the run whose figures are on screen. */
  displayedRunReference?: string

  /** Lifecycle of that run, in the vocabulary P01 uses. */
  displayedRunStatusLabel?: string
  className?: string
}

/**
 * Who this page is about, and what that fixes.
 *
 * The identity line is a sentence of facts rather than a row of stat cards: currency, country and
 * registration are not measures, and giving them tiles would put four boxes of chrome above the
 * one figure that matters. Every fact wraps at narrow widths and keeps its text — a run reference
 * shortened to hold one line is an identifier the reader can no longer match against anything.
 *
 * The company is an object here, not a heading. `legal_entity` and not `entity_payroll`: that one
 * is a company *on a period*, which is what the group matrix lists, and this page outlives any
 * single period.
 */
const EntityIdentity = ({
  entity,
  backHref,
  backLabel,
  openPeriodLabel,
  displayedRunReference,
  displayedRunStatusLabel,
  className
}: Props) => {
  const [propertiesOpen, setPropertiesOpen] = useState(false)

  const object = legalEntityObject(entity)
  const commands = legalEntityCommands(entity, { isCurrent: true })

  const facts = [
    COUNTRY_LABELS[entity.countryCode],
    `pays in ${entity.currency}`,
    entity.registrationNumber,
    openPeriodLabel && `open period ${openPeriodLabel}`,
    displayedRunReference && `showing ${displayedRunReference}`,
    displayedRunStatusLabel
  ].filter(Boolean) as string[]

  return (
    <>
      <ObjectContextMenu object={object} commands={commands} onOpenProperties={() => setPropertiesOpen(true)}>
        <header className={className}>
          <Button
            variant='link'
            size='xs'
            className='text-muted-foreground w-fit px-0 font-normal'
            render={<Link href={backHref} />}
            nativeButton={false}
          >
            <ChevronLeftIcon /> {backLabel}
          </Button>

          <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
            <h1 className='text-2xl font-semibold tracking-tight'>{entity.name}</h1>
            <ObjectCommandsButton
              object={object}
              commands={commands}
              onOpenProperties={() => setPropertiesOpen(true)}
            />
          </div>

          {/* A wrapping list, not one line. Each fact keeps its own text at every width. */}
          <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm'>
            {facts.map((fact, index) => (
              <span key={fact} className='flex items-center gap-2'>
                {index > 0 && (
                  <span aria-hidden='true' className='text-muted-foreground/60'>
                    ·
                  </span>
                )}
                {fact}
              </span>
            ))}
          </p>
        </header>
      </ObjectContextMenu>

      <PropertiesSheet
        object={object}
        typeLabel='Company'
        sections={legalEntityProperties(entity, openPeriodLabel)}
        open={propertiesOpen}
        onOpenChange={setPropertiesOpen}
      />

      {/*
       * The same object the menu, the commands button and Properties above are built from, told to
       * the app shell. Publication is what the breadcrumb reads for its leaf, what Recents records
       * on the way out, and what Alt+Enter resolves to before it looks for an inspector — none of
       * which this component renders, and all of which name the current object.
       *
       * It publishes `legalEntityObject` and nothing else. One visible object, one identity: the
       * `entity_payroll` this page published before P02 is a company *on a period*, which is what
       * the group matrix lists, and publishing both would put two names on one company.
       */}
      <PublishObjectContext {...object} />
    </>
  )
}

export default EntityIdentity
