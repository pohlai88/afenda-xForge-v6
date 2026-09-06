// Third-party Imports
import { DownloadIcon } from 'lucide-react'

// Type Imports
import type { ReportExport } from '@/types/payroll/report-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { cn } from '@/lib/utils'
import { REPORT_FORMAT_LABELS, reportByKey } from '@/utils/payroll-reports'
import { formatInstant, initials } from '@/utils/payroll-workspace'

export type RecentExportRow = ReportExport & {
  creator?: { name: string; avatar?: string }
}

type Props = {

  /** Newest first. */
  exports: RecentExportRow[]
  onRepeat: (row: RecentExportRow) => void
  className?: string
}

/**
 * Who exported what, and when. Every row can be exported again with the same parameters, so
 * "send me the file you sent last month" is one click rather than a search for the settings.
 */
const RecentExports = ({ exports, onRepeat, className }: Props) => (
  <Card className={cn('gap-0 py-0', className)}>
    <CardHeader className='py-6'>
      <CardTitle className='text-lg font-semibold'>Recent exports</CardTitle>
      <CardDescription>
        {exports.length === 0 ? 'Nothing exported yet' : `${exports.length} ${exports.length === 1 ? 'file' : 'files'}`}
      </CardDescription>
      <CardAction className='text-muted-foreground text-sm'>Newest first</CardAction>
    </CardHeader>

    <CardContent className='border-t px-0 pb-0'>
      {exports.length === 0 ? (
        <p className='text-muted-foreground px-6 py-10 text-center text-sm'>
          Generate a report above and it will be listed here, ready to export again.
        </p>
      ) : (
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-6'>Report</TableHead>
                <TableHead>Run</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className='text-right'>Rows</TableHead>
                <TableHead>Exported by</TableHead>
                <TableHead>When</TableHead>
                <TableHead className='pr-6'>
                  <span className='sr-only'>Export again</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exports.map(row => {
                const report = reportByKey(row.reportKey)

                return (
                  <TableRow key={row.id}>
                    <TableCell className='pl-6'>
                      <span className='flex flex-col'>
                        <span className='font-medium'>{report.name}</span>
                        <span className='text-muted-foreground text-xs'>{row.fileName}</span>
                      </span>
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>{row.runReference ?? 'All runs'}</TableCell>
                    <TableCell>
                      <Badge variant='outline' className='text-[11px]'>
                        {REPORT_FORMAT_LABELS[row.format]}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>{row.rowCount}</TableCell>
                    <TableCell>
                      {row.creator ? (
                        <span className='flex items-center gap-2 whitespace-nowrap'>
                          <Avatar className='size-7'>
                            {row.creator.avatar && <AvatarImage src={row.creator.avatar} alt='' />}
                            <AvatarFallback className='text-[10px]'>{initials(row.creator.name)}</AvatarFallback>
                          </Avatar>
                          {row.creator.name}
                        </span>
                      ) : (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                    <TableCell className='text-muted-foreground whitespace-nowrap tabular-nums'>
                      {formatInstant(row.createdAt)}
                    </TableCell>
                    <TableCell className='pr-6 text-right'>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        className='text-muted-foreground'
                        onClick={() => onRepeat(row)}
                        aria-label={`Export ${report.name}${row.runReference ? ` for ${row.runReference}` : ''} again`}
                      >
                        <DownloadIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
)

export default RecentExports
