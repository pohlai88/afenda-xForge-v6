'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowLeftIcon } from 'lucide-react'

// Type Imports
import type { PeopleRow } from '@/types/hrm/people-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PublishObjectContext from '@/components/layout/PublishObjectContext'
import { ObjectCommandsButton } from '@/components/shared/ObjectCommands'
import PropertiesSheet from '@/components/shared/PropertiesSheet'
import { employeeCommands, employeeObject, employeeProperties } from '@/views/hrm/hrm-objects'

// Util Imports
import { cn } from '@/lib/utils'
import { EMPLOYMENT_STATUS_LABELS, EMPLOYMENT_STATUS_STYLES } from '@/utils/hrm-people'
import { initials } from '@/utils/text'

type Props = {
  person: PeopleRow

  /** Where Back returns to, carrying the filters that reached this person. */
  backHref: string
  className?: string
}

/**
 * Who this is, and what can be done with them.
 *
 * There is deliberately no primary action. The release is read-only, and a dominant control added
 * so the header looks finished would promise something the domain cannot do — the contract records
 * this as a decision rather than an omission.
 *
 * `isCurrent` drops Open from the command list, because a command that navigates to where you
 * already are is noise rather than capability.
 */
const EmployeeIdentity = ({ person, backHref, className }: Props) => {
  const [propertiesOpen, setPropertiesOpen] = useState(false)

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Button
        variant='ghost'
        size='sm'
        className='text-muted-foreground -ml-2 self-start'
        render={<Link href={backHref} />}
        nativeButton={false}
      >
        <ArrowLeftIcon />
        Back to People
      </Button>

      <div className='flex flex-wrap items-start gap-4'>
        <Avatar className='size-14 shrink-0'>
          {person.avatar && <AvatarImage src={person.avatar} alt='' />}
          <AvatarFallback>{initials(person.name)}</AvatarFallback>
        </Avatar>

        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-2xl font-semibold tracking-tight'>{person.name}</h1>
            <Badge className={cn('whitespace-nowrap', EMPLOYMENT_STATUS_STYLES[person.status])}>
              {EMPLOYMENT_STATUS_LABELS[person.status]}
            </Badge>
          </div>

          {/*
            The identifier sits under the name and quieter than it. A person reads first; reverse
            that and the header reads like a database row.
          */}
          <p className='text-muted-foreground text-sm'>
            <span className='font-mono text-xs'>{person.employeeNumber}</span>
            {' · '}
            {person.entityName}
            {' · '}
            {person.departmentName}
            {' · '}
            {person.positionTitle}
          </p>

          {person.preferredName && person.preferredName !== person.name && (
            <p className='text-muted-foreground text-xs'>Known as {person.preferredName}</p>
          )}
        </div>

        <ObjectCommandsButton
          object={employeeObject(person)}
          commands={employeeCommands(person, { isCurrent: true })}
          onOpenProperties={() => setPropertiesOpen(true)}
        />
      </div>

      {/*
        Declares what this page is about, so the breadcrumb leaf reads 'Marcus Tan' rather than the
        id from the URL title-cased into 'Emp 002'. It is also what makes the page recordable as a
        recent and pinnable as a favourite — an unpublished page is invisible to Find twice over.
      */}
      <PublishObjectContext {...employeeObject(person)} />

      <PropertiesSheet
        object={employeeObject(person)}
        typeLabel='Employee'
        sections={employeeProperties(person)}
        open={propertiesOpen}
        onOpenChange={setPropertiesOpen}
      />
    </div>
  )
}

export default EmployeeIdentity
