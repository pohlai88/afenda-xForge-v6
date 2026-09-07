// React Imports
import { Fragment, cloneElement } from 'react'

// Type Imports
import type { ModuleSize, WorkspaceDefinition } from '@/types/common/workspace-types'

// Component Imports
import {
  WorkspaceCustomiseBar,
  WorkspaceModuleFrame,
  WorkspaceZoneHeading
} from '@/components/shared/WorkspaceCustomisation'

// Util Imports
import { cn } from '@/lib/utils'

/**
 * A width, as the six-column grid expresses it.
 *
 * Every module is full width below `lg` and its declared width above, which is what every payroll
 * workspace was already hand-writing on every card. Keeping the collapse here rather than in the
 * declaration is what makes "one stored order, rendered as a column when there is no room for
 * columns" true by construction: a domain never gets to say what happens on a phone, so it can
 * never say something different there.
 */
const SPAN: Record<ModuleSize, string> = {
  'one-third': 'col-span-full lg:col-span-2',
  half: 'col-span-full lg:col-span-3',
  'two-thirds': 'col-span-full lg:col-span-4',
  full: 'col-span-full'
}

/**
 * Lays out a workspace from what its domain declared.
 *
 * One grid rather than one per zone, because the zones share a column track and a gap: a band
 * boundary is a heading that spans the whole width, not a new coordinate system. Modules are given
 * their width directly rather than wrapped in a positioning element, so the card is still the grid
 * item and still stretches to its row — a wrapper would have made every module's height its own
 * business and quietly broken the pairs that currently match.
 *
 * There is nothing here that knows which workspace this is. Sizes arrive as names, zones arrive as
 * data, and the only decision this file makes is which class a name becomes.
 *
 * Customisation is composed rather than branched on: every module goes through the same frame and
 * every titled band through the same heading, and both render exactly what this file passed them
 * until somebody is actually customising. A workspace rendered outside a `WorkspaceCustomisation`
 * gets the inert defaults and this markup unchanged.
 *
 * Doctrine: `workspace_grid` (D08).
 */
const WorkspaceGrid = ({ definition, className }: { definition: WorkspaceDefinition; className?: string }) => (
  <>
    <WorkspaceCustomiseBar />

    <div className={cn('grid grid-cols-6 gap-6', className)}>
      {definition.zones.map(zone => (
        <Fragment key={zone.id}>
          {zone.title ? (
            <WorkspaceZoneHeading
              title={zone.title}
              description={zone.description}
              moduleIds={zone.modules.map(module => module.id)}
            />
          ) : null}

          {zone.modules.map(module => (
            <WorkspaceModuleFrame
              key={module.id}
              id={module.id}
              title={module.title}
              required={module.required === true}
              span={SPAN[module.defaultSize]}
            >
              {cloneElement(module.content, {
                className: cn(module.content.props.className, SPAN[module.defaultSize])
              })}
            </WorkspaceModuleFrame>
          ))}
        </Fragment>
      ))}
    </div>
  </>
)

export default WorkspaceGrid
