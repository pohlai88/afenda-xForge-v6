'use client'

// React Imports
import { useState } from 'react'
import type { ReactNode } from 'react'

// Type Imports
import type { EntityPayrollState } from '@/types/payroll/group-types'
import type { LegalEntity } from '@/types/hrm/entity-types'

// Component Imports
import PublishObjectContext from '@/components/layout/PublishObjectContext'
import { ObjectContextMenu } from '@/components/shared/ObjectCommands'
import PropertiesSheet from '@/components/shared/PropertiesSheet'

// Object Imports
import { entityPayrollCommands, entityPayrollObject, entityPayrollProperties } from '@/views/payroll/payroll-objects'

type Props = {
  entity: LegalEntity

  /** Where this workspace lives, including the run and filter the reader is on. */
  href: string

  /** The run the workspace is showing, absent when the company has no payroll yet. */
  displayedRun?: {
    id: string
    reference: string
    periodStart: string
    periodEnd: string
    employeeCount: number
  }

  runCount: number
  openPeriod: string
  state: EntityPayrollState
  children: ReactNode
}

/**
 * Gives the company payroll workspace the identity it already has everywhere else.
 *
 * The page is a server component and the object grammar is not: commands carry icon components and
 * closures, and neither crosses the boundary. So this takes plain facts the page has already proved
 * and builds the object, its commands and its properties on the client — which is also why the
 * page passes a run rather than a `PayRun`, since only these five fields are rendered.
 *
 * It renders no chrome. The menu is the header's own right-click and Shift+F10, matching the run
 * workspace, and `PublishObjectContext` is what makes the breadcrumb leaf read the company's name
 * instead of the id in the URL and what puts the company into Recents on the way out.
 */
const EntityIdentity = ({ entity, href, displayedRun, runCount, openPeriod, state, children }: Props) => {
  const [propertiesOpen, setPropertiesOpen] = useState(false)

  const object = entityPayrollObject(entity, href)

  return (
    <>
      <ObjectContextMenu
        object={object}
        commands={entityPayrollCommands(entity, displayedRun)}
        onOpenProperties={() => setPropertiesOpen(true)}
      >
        {children}
      </ObjectContextMenu>

      <PropertiesSheet
        object={object}
        typeLabel='Company payroll'
        sections={entityPayrollProperties(entity, { displayedRun, runCount, openPeriod, state })}
        open={propertiesOpen}
        onOpenChange={setPropertiesOpen}
      />

      <PublishObjectContext {...object} />
    </>
  )
}

export default EntityIdentity
