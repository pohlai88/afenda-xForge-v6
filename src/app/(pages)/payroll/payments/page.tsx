// Component Imports
import FundingSummary from '@/views/payroll/payments/funding-summary'
import PaymentReadiness from '@/views/payroll/payments/payment-readiness'
import PaymentRelease from '@/views/payroll/payments/payment-release'
import PaymentsWorkspace from '@/views/payroll/payments/payments-workspace'
import SettlementBatches from '@/views/payroll/payments/settlement-batches'

// Action Imports
import {
  getCurrentPayRun,
  getCurrentUser,
  getDepartments,
  getEmployees,
  getFundingAccounts,
  getPayRuns,
  getSettlementBatches,
  getSettlements
} from '@/app/server/actions'

// Util Imports
import { buildSettlementRows, evaluateBatch, fundingSummary, paymentReadiness } from '@/utils/payroll-payments'
import { can } from '@/utils/payroll-permissions'

export const metadata = { title: 'Payroll payments' }

/**
 * The payment centre. Answers "can the current run be paid, was everyone paid, and which
 * payments failed" — the Payments dashboard's shape, with payroll's questions. The file's
 * lifecycle is the working surface: prepare, release, and the bank's answers recorded as events.
 */
const PayrollPaymentsPage = async () => {
  const [currentRun, runs, employees, departments, settlements, batches, accounts, actor] = await Promise.all([
    getCurrentPayRun(),
    getPayRuns(),
    getEmployees(),
    getDepartments(),
    getSettlements(),
    getSettlementBatches(),
    getFundingAccounts(),
    getCurrentUser()
  ])

  const currentBatch = batches.find(batch => batch.payRunId === currentRun.id)
  const account = accounts.find(a => a.id === currentBatch?.fundingAccountId) ?? accounts.find(a => a.isDefault)
  const currentSettlements = settlements.filter(s => s.payRunId === currentRun.id)
  const funding = fundingSummary(currentSettlements, account, currentRun.currency)
  const readiness = paymentReadiness(currentRun, currentSettlements, funding, currentBatch)
  const rows = buildSettlementRows(settlements, employees, departments, runs)
  const employeeNames = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]))

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Payments</h1>
        <p className='text-muted-foreground text-sm'>Funding, release and settlement of every payroll run.</p>
      </header>

      <div className='grid grid-cols-6 gap-6'>
        <FundingSummary
          run={currentRun}
          batch={currentBatch}
          account={account}
          summary={funding}
          className='col-span-full lg:col-span-3'
        />
        <PaymentReadiness
          percent={readiness.percent}
          checks={readiness.checks}
          className='col-span-full lg:col-span-3'
        />
        {currentBatch && (
          <PaymentRelease
            batch={currentBatch}
            run={currentRun}
            evaluation={evaluateBatch(currentBatch, currentRun, currentSettlements, funding)}
            employeeNames={employeeNames}
            mayPrepare={can(actor, 'payroll.process')}
            mayRelease={can(actor, 'payroll.payment.release')}
            className='col-span-full'
          />
        )}
        <SettlementBatches batches={batches} runs={runs} className='col-span-full' />
      </div>

      <PaymentsWorkspace
        rows={rows}
        batches={batches}
        runs={[...runs].reverse().map(run => ({ id: run.id, reference: run.reference }))}
        mayReissue={can(actor, 'payroll.payment.reissue')}
      />
    </div>
  )
}

export default PayrollPaymentsPage
