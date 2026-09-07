// Next Imports
import Link from 'next/link'

// Type Imports
import type { ChangeRow } from '@/utils/payroll-group-attention'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { periodLabel } from '@/utils/payroll-group'

type Props = {
  rows: ChangeRow[]
  period: string
  className?: string
}

/**
 * Who joined and who left, by company.
 *
 * Two categories where the source specification drew seven. Joiners and leavers are provable — an
 * employment record carries a hire date and a termination date. Inter-company transfers, salary
 * changes, pay-group changes, unpaid leave and bank changes have no history in this domain, and
 * the movement architecture forbids reconstructing them from current values: an employee who is
 * now at the Singapore company looks identical to one who has always been there.
 *
 * So the missing five are stated as missing rather than approximated, and the note stays until
 * the records exist. Inter-company transfer in particular belongs at group level precisely because
 * it touches two legal employers, which is why its absence is worth naming here rather than
 * quietly leaving the section at two columns.
 */
const GroupChanges = ({ rows, period, className }: Props) => {
  const joiners = rows.reduce((total, row) => total + row.joiners, 0)
  const leavers = rows.reduce((total, row) => total + row.leavers, 0)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle role='heading' aria-level={2} className='text-lg font-semibold'>
          Changes affecting payroll
        </CardTitle>
        <CardDescription>
          {joiners} joined and {leavers} left in {periodLabel(period)}
        </CardDescription>
      </CardHeader>

      {/* Table and caveat side by side rather than stacked. The table is three narrow columns and
          would look stranded across the full width; the note is the half of this card that says
          what the domain cannot prove, so it earns the space beside it rather than beneath. */}
      <CardContent className='flex flex-1 flex-col gap-4 md:flex-row md:items-start md:gap-8'>
        {rows.length === 0 ? (
          <p className='text-muted-foreground text-sm md:flex-1'>
            Nobody joined or left any company in {periodLabel(period)}.
          </p>
        ) : (
          <Table className='md:flex-1'>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead className='text-right'>Joined</TableHead>
                <TableHead className='text-right'>Left</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.entityId}>
                  <TableCell>
                    {/* `inline-block` plus vertical padding takes the target past the 24px
                        pointer minimum without moving the row: text alone measures 18px. */}
                    <Link
                      href={row.href}
                      className='inline-block py-1 font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
                    >
                      {row.entityName}
                    </Link>
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>{row.joiners || '—'}</TableCell>
                  <TableCell className='text-right tabular-nums'>{row.leavers || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <p className='text-muted-foreground mt-auto text-xs md:mt-0 md:max-w-sm'>
          Inter-company transfers, salary changes, pay-group changes, unpaid leave and bank changes are not recorded as
          history in this domain, so they cannot be listed. A transfer in particular must never be inferred from where
          someone is employed today.
        </p>
      </CardContent>
    </Card>
  )
}

export default GroupChanges
