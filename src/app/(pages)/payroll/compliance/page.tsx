// Component Imports
import ComplianceWorkspace from '@/views/payroll/compliance/compliance-workspace'

// Action Imports
import { getEmployees, getFilings, getPayrollSettings } from '@/app/server/actions'

export const metadata = { title: 'Payroll compliance' }

/**
 * Statutory filings for every pay run: what is due, what was filed, and what came back. Every
 * amount here is a sum of payslip components, so the page reconciles to the register by
 * construction.
 */
const PayrollCompliancePage = async () => {
  const [filings, employees, settings] = await Promise.all([getFilings(), getEmployees(), getPayrollSettings()])

  // The clock is read once, here, and passed down as a date — components that read it
  // themselves render differently on the server and the client.
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Compliance</h1>
        <p className='text-muted-foreground text-sm'>
          Statutory filings for every pay run: what is due, what was filed, and what came back.
        </p>
      </header>

      <ComplianceWorkspace filings={filings} employees={employees} rules={settings.statutory} today={today} />
    </div>
  )
}

export default PayrollCompliancePage
