// Component Imports
import PayrollSettingsTabs from '@/views/payroll/settings/payroll-settings-tabs'

// Action Imports
import { getActiveEmployees, getFundingAccounts, getPayRuns, getPayrollSettings } from '@/app/server/actions'

export const metadata = { title: 'Payroll settings' }

const PayrollSettingsPage = async () => {
  const [settings, fundingAccounts, employees, runs] = await Promise.all([
    getPayrollSettings(),
    getFundingAccounts(),
    getActiveEmployees(),
    getPayRuns()
  ])

  // Counted here rather than stored on the entity: a count that lives beside the thing it counts
  // is a count that goes stale the first time someone joins or leaves.
  const employeeCounts: Record<string, number> = {}
  const runCounts: Record<string, number> = {}

  for (const employee of employees) {
    employeeCounts[employee.entityId] = (employeeCounts[employee.entityId] ?? 0) + 1
  }

  for (const run of runs) {
    runCounts[run.entityId] = (runCounts[run.entityId] ?? 0) + 1
  }

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Payroll settings</h1>
        <p className='text-muted-foreground text-sm'>
          How runs are scheduled, calculated, approved, paid and posted. Changes apply from the next calculation.
        </p>
      </header>

      <PayrollSettingsTabs
        settings={settings}
        fundingAccounts={fundingAccounts}
        employeeCounts={employeeCounts}
        runCounts={runCounts}
      />
    </div>
  )
}

export default PayrollSettingsPage
