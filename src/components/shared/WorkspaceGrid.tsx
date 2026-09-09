// React Imports
import { cloneElement } from 'react'

// Type Imports
import type { WorkspaceDefinition } from '@/types/common/workspace-types'

// Component Imports
import { WorkspaceCustomiseBar, WorkspaceModuleFrame, WorkspaceZone } from '@/components/shared/WorkspaceCustomisation'

// Util Imports
import { MODULE_SPAN } from '@/types/common/workspace-types'
import { cn } from '@/lib/utils'

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
 * data, and the only decision this file makes is which class the declared name becomes. A width a
 * reader has since chosen for themselves is a runtime answer and this renders on the server, so
 * that one is applied by the frame the module goes through.
 *
 * Customisation is composed rather than branched on. Each band is handed to one client component
 * that puts its own modules in whatever order the reader has them and renders nothing else; each
 * module goes through the same frame. Both render exactly what this file passed them, unchanged and
 * in declaration order, until somebody is actually customising — and a workspace rendered outside a
 * `WorkspaceCustomisation` gets the inert defaults and this markup as written.
 *
 * Doctrine: `workspace_grid` (D08).
 */
const WorkspaceGrid = ({ definition, className }: { definition: WorkspaceDefinition; className?: string }) => (
  <>
    <WorkspaceCustomiseBar />

    <div className={cn('grid grid-cols-6 gap-6', className)}>
      {definition.zones.map(zone => (
        <WorkspaceZone
          key={zone.id}
          title={zone.title}
          description={zone.description}
          modules={zone.modules.map(module => ({
            id: module.id,
            frame: (
              <WorkspaceModuleFrame
                key={module.id}
                id={module.id}
                title={module.title}
                required={module.required === true}
                defaultSize={module.defaultSize}
              >
                {cloneElement(module.content, {
                  className: cn(module.content.props.className, MODULE_SPAN[module.defaultSize])
                })}
              </WorkspaceModuleFrame>
            )
          }))}
        />
      ))}
    </div>
  </>
)

export default WorkspaceGrid
