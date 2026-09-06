'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { AlertOctagonIcon, RefreshCwIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * One boundary for every payroll route. It says the consequence rather than the exception: payroll
 * figures are the kind someone acts on, so the important sentence is that nothing was changed.
 *
 * `digest` is the only identifier that survives to production — the message itself is scrubbed by
 * Next — so it is shown when present and stays out of the way when it is not.
 */
const PayrollError = ({ error, reset }: Props) => {
  useEffect(() => {
    console.error('[payroll]', error)
  }, [error])

  return (
    <Empty className='border'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <AlertOctagonIcon />
        </EmptyMedia>
        <EmptyTitle>This payroll screen could not be loaded</EmptyTitle>
        <EmptyDescription>
          Nothing was calculated, approved or paid. Retrying is safe — no change was recorded.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className='flex flex-wrap items-center justify-center gap-2'>
          <Button size='sm' onClick={reset}>
            <RefreshCwIcon />
            Try again
          </Button>
          <Button variant='outline' size='sm' render={<Link href='/payroll' />} nativeButton={false}>
            Payroll overview
          </Button>
        </div>
        {error.digest && (
          <p className='text-muted-foreground font-mono text-xs'>
            Reference {error.digest} — quote this if you report it.
          </p>
        )}
      </EmptyContent>
    </Empty>
  )
}

export default PayrollError
