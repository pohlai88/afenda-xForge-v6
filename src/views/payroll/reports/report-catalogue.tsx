// Third-party Imports
import { ArrowRightIcon } from 'lucide-react'

// Type Imports
import type { ReportDefinition, ReportExport, ReportGroup, ReportKey } from '@/types/payroll/report-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'
import { REPORT_FORMAT_LABELS, REPORT_GROUP_LABELS } from '@/utils/payroll-reports'
import { formatDate } from '@/utils/payroll-workspace'

const GROUPS: ReportGroup[] = ['operations', 'finance', 'statutory', 'banking']

type Props = {
  reports: ReportDefinition[]

  /** Most recent export per report, for the "last exported" note beside each one. */
  lastExports: Partial<Record<ReportKey, ReportExport>>
  onOpen: (key: ReportKey) => void
  className?: string
}

/**
 * The reports, grouped by who asks for them. A list rather than a grid of cards: eight rows with
 * a purpose line each read faster than eight tiles, and the whole catalogue stays above the fold.
 */
const ReportCatalogue = ({ reports, lastExports, onOpen, className }: Props) => (
  <Card className={cn('gap-0 py-0', className)}>
    <CardHeader className='py-6'>
      <CardTitle className='text-lg font-semibold'>Reports</CardTitle>
      <CardDescription>
        The figures finance and auditors ask for, from the same numbers the screens show.
      </CardDescription>
      <CardAction className='text-muted-foreground text-sm'>{reports.length} reports</CardAction>
    </CardHeader>

    <CardContent className='flex flex-col gap-5 border-t px-0 pt-5 pb-2'>
      {GROUPS.map(group => {
        const inGroup = reports.filter(report => report.group === group)

        if (inGroup.length === 0) return null

        return (
          <section key={group} className='flex flex-col'>
            <h3 className='text-muted-foreground px-6 pb-1 text-xs font-medium tracking-wide uppercase'>
              {REPORT_GROUP_LABELS[group]}
            </h3>
            <ul className='divide-y'>
              {inGroup.map(report => {
                const last = lastExports[report.key]

                return (
                  <li key={report.key} className='flex items-center gap-4 px-6 py-3'>
                    <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Button
                          variant='link'
                          className='h-auto p-0 text-sm font-medium'
                          onClick={() => onOpen(report.key)}
                        >
                          {report.name}
                        </Button>
                        {report.formats.map(format => (
                          <Badge key={format} variant='outline' className='text-[11px]'>
                            {REPORT_FORMAT_LABELS[format]}
                          </Badge>
                        ))}
                      </div>
                      <p className='text-muted-foreground text-sm'>{report.purpose}</p>
                      {last && (
                        <p className='text-muted-foreground text-xs'>
                          Last exported {formatDate(last.createdAt.slice(0, 10))}
                          {last.runReference ? ` · ${last.runReference}` : ''}
                        </p>
                      )}
                    </div>
                    <Button variant='outline' size='sm' onClick={() => onOpen(report.key)}>
                      Generate
                      <ArrowRightIcon />
                    </Button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </CardContent>
  </Card>
)

export default ReportCatalogue
