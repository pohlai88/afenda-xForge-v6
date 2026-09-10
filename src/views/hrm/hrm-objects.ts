/**
 * HRM's side of the object-context contract: what a person, a department, a position and a work
 * location are called, what can be done with them, and what they exactly are.
 *
 * The shared layer in `src/components/shared/ObjectCommands.tsx` and `PropertiesSheet.tsx` renders
 * these; it does not know what an employee is. Every command here is one the domain can actually
 * perform — doctrine `context_menu` requires irrelevant commands to be omitted, so a command that
 * would be unavailable is simply absent rather than present and disabled.
 *
 * This release is read-only, which is why there is no Edit, Change compensation, Transfer, Add
 * recurring item or Move pay group. `.HITL/payroll-foundation.txt` §3 sketches those and they are
 * right — they belong to the mutation slice, and offering one now would promise an action the app
 * cannot take.
 */

// Third-party Imports
import { CopyIcon, ExternalLinkIcon, HistoryIcon, LandmarkIcon, UsersIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { Department, Position, WorkLocation } from '@/types/hrm/employee-types'
import type { ObjectCommand, ObjectContext } from '@/types/common/object-context-types'
import type { PeopleRow } from '@/types/hrm/people-types'
import type { PropertySection } from '@/components/shared/PropertiesSheet'

// Util Imports
import { formatDate } from '@/utils/format-datetime'
import {
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  RECORD_COMPLETENESS_LABELS,
  WORK_ARRANGEMENT_LABELS
} from '@/utils/hrm-people'

const copyReference = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied`, { description: value })
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}`, {
      description: 'The browser refused clipboard access.'
    })
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Employee                                                                                     */
/* -------------------------------------------------------------------------------------------- */

/**
 * The person, with an address of their own.
 *
 * This is the correction the HRM domain exists to make. Before H01 the only employee object in the
 * app resolved to `/payroll/runs/{runId}?employee={id}` — a person *on a run* — so somebody whose
 * company had never run payroll had no address at all. Doctrine `identity_rule` forbids the same
 * object becoming a different conceptual identity in another domain, and one canonical href is
 * what enforces it.
 */
export const employeeObject = (employee: Pick<PeopleRow, 'id' | 'name'>): ObjectContext => ({
  type: 'employee',
  id: employee.id,
  label: employee.name,
  href: `/hrm/people/${employee.id}`
})

/**
 * One command list for a person, wherever a person appears.
 *
 * `isCurrent` drops Open on the workspace that already is the person — a command that navigates
 * to where you already are is noise, not capability.
 *
 * Payroll history is conditional on the person actually having a payslip. Offering it to a new
 * joiner would navigate to an empty surface, and doctrine says to omit rather than disable.
 */
export const employeeCommands = (
  row: Pick<PeopleRow, 'id' | 'name' | 'employeeNumber' | 'departmentId' | 'hasPayrollHistory'>,
  { isCurrent = false }: { isCurrent?: boolean } = {}
): ObjectCommand[] => {
  const commands: ObjectCommand[] = []

  if (!isCurrent) {
    commands.push({
      id: 'open',
      label: 'Open',
      family: 'read',
      icon: ExternalLinkIcon,
      href: `/hrm/people/${row.id}`
    })
  }

  commands.push({
    id: 'search-related',
    label: 'Others in this department',
    family: 'search',
    icon: UsersIcon,
    href: `/hrm?department=${encodeURIComponent(row.departmentId)}`
  })

  if (row.hasPayrollHistory) {
    commands.push({
      id: 'payroll-history',
      label: 'View payroll history',
      family: 'read',
      icon: LandmarkIcon,
      href: `/hrm/people/${row.id}?tab=payroll`
    })
  }

  commands.push(
    {
      id: 'movement',
      label: 'View movement',
      family: 'audit',
      icon: HistoryIcon,
      href: `/hrm/people/${row.id}?tab=movement`
    },
    {
      id: 'copy-employee-number',
      label: 'Copy employee number',
      family: 'search',
      icon: CopyIcon,
      onSelect: () => {
        void copyReference(row.employeeNumber, 'Employee number')
      }
    }
  )

  return commands
}

/**
 * What a person exactly is.
 *
 * Identity and employment only. No compensation figure: Properties answers "what is this object?"
 * and a salary is neither identity nor state — it is the subject of its own tab, behind the
 * confidentiality boundary the architecture records as unresolved. The same reasoning keeps the
 * payroll employee's Properties down to identity and run state.
 */
export const employeeProperties = (row: PeopleRow): PropertySection[] => [
  {
    title: 'Identity',
    fields: [
      { label: 'Name', value: row.name },
      ...(row.preferredName ? [{ label: 'Known as', value: row.preferredName }] : []),
      { label: 'Employee no.', value: row.employeeNumber },
      { label: 'Work email', value: row.workEmail }
    ]
  },
  {
    title: 'Employment',
    fields: [
      { label: 'Status', value: EMPLOYMENT_STATUS_LABELS[row.status] },
      { label: 'Type', value: EMPLOYMENT_TYPE_LABELS[row.employmentType] },
      { label: 'FTE', value: row.fte.toFixed(1) },
      { label: 'Company', value: row.entityName },
      { label: 'Department', value: row.departmentName },
      { label: 'Position', value: row.positionTitle },
      { label: 'Location', value: row.locationName },
      ...(row.workArrangement ? [{ label: 'Arrangement', value: WORK_ARRANGEMENT_LABELS[row.workArrangement] }] : []),

      // Absent rather than 'None': a person genuinely at the top of the org has no manager, and
      // a row reading 'Manager — None' cannot be told apart from one whose manager is unresolved.
      ...(row.managerName ? [{ label: 'Manager', value: row.managerName }] : []),
      { label: 'Hired', value: formatDate(row.hireDate) },
      ...(row.terminationDate ? [{ label: 'Left', value: formatDate(row.terminationDate) }] : [])
    ]
  },
  {
    title: 'Record',
    fields: [
      { label: 'Payroll details', value: RECORD_COMPLETENESS_LABELS[row.completeness] },
      { label: 'Id', value: row.id }
    ]
  }
]

/* -------------------------------------------------------------------------------------------- */
/* Department                                                                                   */
/* -------------------------------------------------------------------------------------------- */

/**
 * No route of its own: a department is read on the organisation workspace, never at its own
 * address. `ObjectContext.href` is optional precisely for objects like this.
 */
export const departmentObject = (department: Pick<Department, 'id' | 'name'>): ObjectContext => ({
  type: 'department',
  id: department.id,
  label: department.name,
  href: `/hrm/organisation?department=${encodeURIComponent(department.id)}`
})

export const departmentCommands = (department: Pick<Department, 'id' | 'code'>): ObjectCommand[] => {
  const commands: ObjectCommand[] = [
    {
      id: 'people',
      label: 'People in this department',
      family: 'search',
      icon: UsersIcon,
      href: `/hrm?department=${encodeURIComponent(department.id)}`
    }
  ]

  if (department.code) {
    const code = department.code

    commands.push({
      id: 'copy-code',
      label: 'Copy department code',
      family: 'search',
      icon: CopyIcon,
      onSelect: () => {
        void copyReference(code, 'Department code')
      }
    })
  }

  return commands
}

export const departmentProperties = (
  department: Department,
  extras: { headcount: number; parentName?: string; headName?: string }
): PropertySection[] => [
  {
    title: 'Identity',
    fields: [
      { label: 'Name', value: department.name },
      ...(department.code ? [{ label: 'Code', value: department.code }] : []),
      { label: 'Id', value: department.id }
    ]
  },
  {
    title: 'Organisation',
    fields: [
      { label: 'Reports into', value: extras.parentName ?? 'Not recorded' },
      { label: 'Head', value: extras.headName ?? 'Not recorded' },
      { label: 'People', value: String(extras.headcount) },
      ...(department.costCenter ? [{ label: 'Cost centre', value: department.costCenter }] : [])
    ]
  }
]

/* -------------------------------------------------------------------------------------------- */
/* Position                                                                                     */
/* -------------------------------------------------------------------------------------------- */

export const positionObject = (position: Pick<Position, 'id' | 'title'>): ObjectContext => ({
  type: 'position',
  id: position.id,
  label: position.title,
  href: `/hrm/organisation?tab=positions`
})

export const positionCommands = (
  position: Pick<Position, 'id' | 'title' | 'code' | 'departmentId'>
): ObjectCommand[] => {
  const commands: ObjectCommand[] = [
    {
      id: 'people',
      label: 'People in this position',
      family: 'search',
      icon: UsersIcon,
      href: `/hrm?department=${encodeURIComponent(position.departmentId)}&q=${encodeURIComponent(position.title)}`
    }
  ]

  if (position.code) {
    const code = position.code

    commands.push({
      id: 'copy-code',
      label: 'Copy position code',
      family: 'search',
      icon: CopyIcon,
      onSelect: () => {
        void copyReference(code, 'Position code')
      }
    })
  }

  return commands
}

export const positionProperties = (
  position: Position,
  extras: { departmentName: string; headcount: number }
): PropertySection[] => [
  {
    title: 'Identity',
    fields: [
      { label: 'Title', value: position.title },
      ...(position.code ? [{ label: 'Code', value: position.code }] : []),
      { label: 'Id', value: position.id }
    ]
  },
  {
    title: 'Organisation',
    fields: [
      { label: 'Department', value: extras.departmentName },
      { label: 'People', value: String(extras.headcount) }
    ]
  }
]

/* -------------------------------------------------------------------------------------------- */
/* Work location                                                                                */
/* -------------------------------------------------------------------------------------------- */

export const workLocationObject = (location: Pick<WorkLocation, 'id' | 'name'>): ObjectContext => ({
  type: 'work_location',
  id: location.id,
  label: location.name,
  href: `/hrm/organisation?tab=locations`
})

export const workLocationCommands = (location: Pick<WorkLocation, 'id'>): ObjectCommand[] => [
  {
    id: 'people',
    label: 'People at this location',
    family: 'search',
    icon: UsersIcon,
    href: `/hrm?location=${encodeURIComponent(location.id)}`
  }
]

export const workLocationProperties = (location: WorkLocation, extras: { headcount: number }): PropertySection[] => [
  {
    title: 'Identity',
    fields: [
      { label: 'Name', value: location.name },
      { label: 'Country', value: `${location.country} (${location.countryCode})` },
      { label: 'Id', value: location.id }
    ]
  },
  {
    title: 'Organisation',
    fields: [
      { label: 'People', value: String(extras.headcount) },
      { label: 'Timezone', value: location.timezone ?? 'Not recorded' }
    ]
  }
]

