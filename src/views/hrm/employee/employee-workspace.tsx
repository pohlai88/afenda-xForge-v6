'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { ExternalLinkIcon } from 'lucide-react'

// Type Imports
import type { EmployeeMovement } from '@/types/hrm/movement-types'
import type { PeopleRow } from '@/types/hrm/people-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EmployeeFacts, { type Fact } from '@/views/hrm/employee/employee-facts'
import EmployeeMovementLedger from '@/views/hrm/employee/employee-movement'

// Util Imports
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/format-datetime'
import { formatMoney } from '@/utils/money'
import { MOVEMENT_KIND_LABELS } from '@/utils/hrm-movement'
import {
  EMPLOYMENT_TYPE_LABELS,
  PAY_FREQUENCY_LABELS,
  PAYMENT_METHOD_LABELS,
  RECORD_COMPLETENESS_LABELS,
  RECORD_COMPLETENESS_STYLES,
  WORK_ARRANGEMENT_LABELS
} from '@/utils/hrm-people'

const TABS = ['overview', 'employment', 'compensation', 'payroll', 'movement'] as const

const NOT_RECORDED = <span className='text-muted-foreground'>Not recorded</span>

/**
 * Distinct from "Not recorded" on purpose. A missing bank detail is a gap somebody has to close;
 * a missing probation date usually means there was no probation. Collapsing the two would make
 * the second look like outstanding work.
 */
const NOT_ON_FILE = <span className='text-warning-strong'>Not on file</span>

type Props = {
  person: PeopleRow
  movements: EmployeeMovement[]
  salaryHistory: EmployeeMovement[]
  recorderNames: Record<string, string>

  /** The run to open for pay history, when this person has one. */
  payrollHref: string | null
}

/**
 * One workspace, five tabs, the tab in the URL.
 *
 * Not five routes. Doctrine `drill_down` and `domain_page_budget` both require hierarchical detail
 * to drill down rather than navigate away, and `anti_patterns` forbids a route for every nested
 * object — the reference product this was compared against ships separate routes for a person's
 * contracts, dependants and onboarding, several of which are dead links.
 */
const EmployeeWorkspace = ({ person, movements, salaryHistory, recorderNames, payrollHref }: Props) => {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TABS).withDefault('overview').withOptions({ history: 'push', clearOnDefault: false })
  )

  const completenessBadge = (
    <Badge className={cn('whitespace-nowrap', RECORD_COMPLETENESS_STYLES[person.completeness])}>
      {RECORD_COMPLETENESS_LABELS[person.completeness]}
    </Badge>
  )

  const employmentFacts: Fact[] = [
    { label: 'Legal employer', value: person.entityName, hint: person.countryCode },
    { label: 'Department', value: person.departmentName },
    { label: 'Position', value: person.positionTitle },

    // Absent rather than 'None'. A person genuinely at the top of the org has no manager, and a
    // row reading 'Manager — None' cannot be told apart from one whose manager is unresolved.
    { label: 'Manager', value: person.managerName ?? NOT_RECORDED },
    { label: 'Work location', value: person.locationName },
    {
      label: 'Arrangement',
      value: person.workArrangement ? WORK_ARRANGEMENT_LABELS[person.workArrangement] : NOT_RECORDED
    },
    { label: 'Employment type', value: EMPLOYMENT_TYPE_LABELS[person.employmentType] },
    { label: 'FTE', value: <span className='tabular-nums'>{person.fte.toFixed(1)}</span> },
    { label: 'Hired', value: formatDate(person.hireDate) },
    { label: 'Probation ends', value: person.probationEndDate ? formatDate(person.probationEndDate) : NOT_RECORDED },
    ...(person.terminationDate ? [{ label: 'Left', value: formatDate(person.terminationDate) }] : [])
  ]

  const compensationFacts: Fact[] = [
    {
      label: 'Amount',
      value: <span className='tabular-nums'>{formatMoney(person.compensation)}</span>,
      hint: person.compensationBasis
    },
    { label: 'Currency', value: person.compensation.currency },

    // The effective date always travels with the amount. Compensation is a timeline, not a value,
    // and a salary shown without the date it took effect implies it has always been that.
    { label: 'Effective from', value: formatDate(person.compensationEffectiveFrom) }
  ]

  const payrollFacts: Fact[] = [
    { label: 'Pay frequency', value: PAY_FREQUENCY_LABELS[person.payFrequency] },
    { label: 'Payment method', value: PAYMENT_METHOD_LABELS[person.paymentMethod] },

    // Last four digits only. The record deliberately holds nothing more, so there is nothing more
    // to leak here — and a masked value still lets somebody recognise the account on a statement.
    {
      label: 'Bank account',
      value: person.bankAccountLast4 ? (
        <span className='font-mono text-xs'>···· {person.bankAccountLast4}</span>
      ) : (
        NOT_ON_FILE
      )
    },
    {
      label: 'Tax identifier',
      value: person.taxIdentifierLast4 ? (
        <span className='font-mono text-xs'>···· {person.taxIdentifierLast4}</span>
      ) : (
        NOT_ON_FILE
      )
    },
    { label: 'Record', value: completenessBadge }
  ]

  const overviewFacts: Fact[] = [
    { label: 'Employee number', value: <span className='font-mono text-xs'>{person.employeeNumber}</span> },
    { label: 'Work email', value: person.workEmail },
    { label: 'Legal employer', value: person.entityName },
    { label: 'Department', value: person.departmentName },
    { label: 'Position', value: person.positionTitle },
    { label: 'Record', value: completenessBadge }
  ]

  const recent = movements.slice(0, 3)

  return (
    <Tabs value={tab} onValueChange={value => setTab(value as (typeof TABS)[number])} className='gap-6'>
      <TabsList>
        <TabsTrigger value='overview'>Overview</TabsTrigger>
        <TabsTrigger value='employment'>Employment</TabsTrigger>
        <TabsTrigger value='compensation'>Compensation</TabsTrigger>
        <TabsTrigger value='payroll'>Payroll</TabsTrigger>
        <TabsTrigger value='movement'>Movement</TabsTrigger>
      </TabsList>

      <TabsContent value='overview'>
        <div className='grid grid-cols-6 items-start gap-6'>
          <EmployeeFacts
            title='This person'
            description='Identity and where they sit'
            facts={overviewFacts}
            className='col-span-full lg:col-span-3'
          />

          <EmployeeFacts
            title='Recent movement'
            description={recent.length > 0 ? 'The latest recorded changes' : undefined}
            facts={recent.map(movement => ({
              label: MOVEMENT_KIND_LABELS[movement.kind],
              value: formatDate(movement.effectiveFrom),
              hint: movement.nextValue ?? undefined
            }))}
            className='col-span-full lg:col-span-3'
          >
            {movements.length > recent.length && (
              <Button variant='outline' size='sm' className='self-start' onClick={() => void setTab('movement')}>
                See all {movements.length} changes
              </Button>
            )}
          </EmployeeFacts>
        </div>
      </TabsContent>

      <TabsContent value='employment'>
        <EmployeeFacts
          title='Employment'
          description='The legal employer and the work location are separate facts'
          facts={employmentFacts}
          className='max-w-2xl'
        />
      </TabsContent>

      <TabsContent value='compensation'>
        <div className='grid grid-cols-6 items-start gap-6'>
          <EmployeeFacts
            title='Current compensation'
            description='The currently-effective record'
            facts={compensationFacts}
            className='col-span-full lg:col-span-3'
          />

          <EmployeeFacts
            title='Earlier rates'
            description={salaryHistory.length > 0 ? 'From the movement ledger' : undefined}
            facts={salaryHistory.map(movement => ({
              label: formatDate(movement.effectiveFrom),
              value: (
                <span className='tabular-nums'>{movement.nextAmount ? formatMoney(movement.nextAmount) : '—'}</span>
              ),
              hint: movement.previousAmount ? `was ${formatMoney(movement.previousAmount)}` : undefined
            }))}
            className='col-span-full lg:col-span-3'
          >
            {/*
              The honest empty state. `Compensation.effectiveFrom` is the start of the *current*
              record and says nothing about what came before it, so where the ledger holds no
              salary change the earlier rate genuinely is not held — which is different from the
              rate never having changed, and the page must not imply the second.
            */}
            {salaryHistory.length === 0 && (
              <p className='text-muted-foreground text-sm'>
                No earlier rate is on record. That is a gap in the ledger, not a statement that the rate has never
                changed.
              </p>
            )}
          </EmployeeFacts>
        </div>
      </TabsContent>

      <TabsContent value='payroll'>
        <EmployeeFacts
          title='Payroll details'
          description='What payroll needs from this record'
          facts={payrollFacts}
          className='max-w-2xl'
        >
          <p className='text-muted-foreground text-xs'>
            Only the last four digits are held on this record; the full values sit behind a server boundary with its
            own access control. Whether this person can actually be paid is a question about a pay run, not about
            their record.
          </p>

          {payrollHref ? (
            <Button
              variant='outline'
              size='sm'
              className='self-start'
              render={<Link href={payrollHref} />}
              nativeButton={false}
            >
              <ExternalLinkIcon />
              Open pay history
            </Button>
          ) : (
            <p className='text-muted-foreground text-sm'>This person has no payslip yet.</p>
          )}
        </EmployeeFacts>
      </TabsContent>

      <TabsContent value='movement'>
        <EmployeeMovementLedger movements={movements} recorderNames={recorderNames} className='max-w-3xl' />
      </TabsContent>
    </Tabs>
  )
}

export default EmployeeWorkspace
