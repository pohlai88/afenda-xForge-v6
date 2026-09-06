'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { ObjectContext } from '@/types/common/object-context-types'

// Store Imports
import { clearObjectContext, publishObjectContext } from '@/lib/object-context-store'

/**
 * Declares what object the current page is about, so the shell breadcrumb can name its leaf
 * something a person recognises ('PR-SG-2026-09') instead of the id in the URL.
 *
 * Renders nothing. A server page mounts it as a thin client child:
 *
 *   <PublishObjectContext type='payroll_run' id={run.id} label={run.reference} href={href} />
 */
const PublishObjectContext = ({ type, id, label, href }: ObjectContext) => {
  useEffect(() => {
    publishObjectContext({ type, id, label, href })

    return () => {
      clearObjectContext({ type, id, label, href })
    }
  }, [type, id, label, href])

  return null
}

export default PublishObjectContext
