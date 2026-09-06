// Component Imports
import ComplianceWorkspace from '@/views/payroll/compliance/compliance-workspace'
import EntityPicker from '@/views/payroll/entity-picker'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Action Imports
import { getEmployees, getFilings, getLegalEntities, getPayrollSettings } from '@/app/server/actions'

// Util Imports
import { COUNTRY_LABELS } from '@/utils/payroll-group'

export const metadata = { title: 'Payroll compliance' }

/**
 * Statutory filings for one company: what is due, what was filed, and what came back. Every
 * amount here is a sum of payslip components, so the page reconciles to the register by
 * construction.
 *
 * Scoped to one company because statutory liability is. A filing goes to one authority under one
 * country's law, and a list mixing CPF with EPF would be two obligations pretending to be one
 * queue. `?entity=` chooses whose; unknown falls back to the home company.
 */
type Props = {
  searchParams: Promise<{ entity?: string }>
}

const PayrollCompliancePage = async ({ searchParams }: Props) => {
  const [params, allFilings, employees, settings, entities] = await Promise.all([
    searchParams,
    getFilings(),
    getEmployees(),
    getPayrollSettings(),
    getLegalEntities()
  ])

  const entity =
    entities.find(candidate => candidate.id === params.entity) ??
    entities.find(candidate => candidate.id === settings.general.homeEntityId) ??
    entities[0]

  const filings = allFilings.filter(filing => filing.entityId === entity.id)

  // Only rules from this company's country. Showing a Malaysian EPF rate beside a CPF filing
  // would suggest the two were related, and they are not.
  const rules = settings.statutory.filter(rule => rule.countryCode === entity.countryCode)

  // The clock is read once, here, and passed down as a date — components that read it
  // themselves render differently on the server and the client.
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Compliance</h1>
          <p className='text-muted-foreground text-sm'>
            Statutory filings for {entity.name}: what is due, what was filed, and what came back.
          </p>
        </div>
        <EntityPicker entities={entities} value={entity.id} basePath='/payroll/compliance' />
      </header>

      {filings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>
              No filings are prepared for {COUNTRY_LABELS[entity.countryCode]} yet
            </CardTitle>
            <CardDescription>
              Filings are built for Singapore companies only. CPF and IRAS are Singapore
              institutions, and generating an equivalent for {entity.name} would be an obligation
              this product invented rather than one the law imposes. {COUNTRY_LABELS[entity.countryCode]}{' '}
              filings arrive with the Statutory Pack Center, which will own what each authority
              actually requires.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ComplianceWorkspace filings={filings} employees={employees} rules={rules} today={today} />
      )}
    </div>
  )
}

export default PayrollCompliancePage
