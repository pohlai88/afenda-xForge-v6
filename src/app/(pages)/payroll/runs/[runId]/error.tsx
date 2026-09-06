'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

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
 * The run workspace gets its own boundary because its recovery is different: when one run will not
 * open, the useful next move is another run, not the payroll overview. It also names the run, so
 * someone who arrived from a link knows which one failed.
 *
 * A missing run is `notFound()` in the page, not an error — this is for a run that exists and
 * could not be assembled.
 */
const PayrollRunError = ({ error, reset }: Props) => {
  const params = useParams<{ runId: string }>()

  useEffect(() => {
    console.error('[payroll:run]', error)
  }, [error])

  return (
    <Empty className='border'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <AlertOctagonIcon />
        </EmptyMedia>
        <EmptyTitle>This run could not be opened</EmptyTitle>
        <EmptyDescription>
          {params?.runId ? (
            <>
              <span className='font-medium'>{params.runId}</span> was not assembled. Nothing was calculated, approved or
              paid, and no change was recorded.
            </>
          ) : (
            'The run was not assembled. Nothing was calculated, approved or paid.'
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className='flex flex-wrap items-center justify-center gap-2'>
          <Button size='sm' onClick={reset}>
            <RefreshCwIcon />
            Try again
          </Button>
          <Button variant='outline' size='sm' render={<Link href='/payroll/runs' />} nativeButton={false}>
            All runs
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

export default PayrollRunError
