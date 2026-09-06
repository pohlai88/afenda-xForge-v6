// Component Imports
import PayrollSettingsTabs from '@/views/payroll/settings/payroll-settings-tabs'

// Action Imports
import { getFundingAccounts, getPayrollSettings } from '@/app/server/actions'

export const metadata = { title: 'Payroll settings' }

const PayrollSettingsPage = async () => {
  const [settings, fundingAccounts] = await Promise.all([getPayrollSettings(), getFundingAccounts()])

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Payroll settings</h1>
        <p className='text-muted-foreground text-sm'>
          How runs are scheduled, calculated, approved, paid and posted. Changes apply from the next calculation.
        </p>
      </header>

      <PayrollSettingsTabs settings={settings} fundingAccounts={fundingAccounts} />
    </div>
  )
}

export default PayrollSettingsPage
