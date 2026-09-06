// Component Imports
import FundingSummary from '@/views/payroll/payments/funding-summary'
import PaymentReadiness from '@/views/payroll/payments/payment-readiness'
import PaymentRelease from '@/views/payroll/payments/payment-release'
import PaymentsWorkspace from '@/views/payroll/payments/payments-workspace'
import SettlementBatches from '@/views/payroll/payments/settlement-batches'
import EntityPicker from '@/views/payroll/entity-picker'

// Action Imports
import {
  getCurrentUser,
  getDepartments,
  getEmployees,
  getFundingAccounts,
  getLegalEntities,
  getPayRuns,
  getPayrollSettings,
  getSettlementBatches,
  getSettlements
} from '@/app/server/actions'

// Util Imports
import { buildSettlementRows, evaluateBatch, fundingSummary, paymentReadiness } from '@/utils/payroll-payments'
import { can } from '@/utils/payroll-permissions'
import { latestRunFor } from '@/utils/payroll-group'

export const metadata = { title: 'Payroll payments' }

/**
 * The payment centre. Answers "can this company's run be paid, was everyone paid, and which
 * payments failed" — the Payments dashboard's shape, with payroll's questions. The file's
 * lifecycle is the working surface: prepare, release, and the bank's answers recorded as events.
 *
 * Scoped to one company. A payment file is drawn on one bank account in one currency, so there
 * is no such thing as a group payment run; `?entity=` chooses whose, defaulting to the group's
 * home company. Group-wide payment exposure belongs on Group payroll, not here.
 */
type Props = {
  searchParams: Promise<{ entity?: string }>
}

const PayrollPaymentsPage = async ({ searchParams }: Props) => {
  const [params, runs, employees, departments, settlements, batches, accounts, actor, entities, settings] =
    await Promise.all([
      searchParams,
      getPayRuns(),
      getEmployees(),
      getDepartments(),
      getSettlements(),
      getSettlementBatches(),
      getFundingAccounts(),
      getCurrentUser(),
      getLegalEntities(),
      getPayrollSettings()
    ])

  // An unknown company falls back to the home one rather than 404ing, the same way an unknown
  // run reference does elsewhere.
  const entity =
    entities.find(candidate => candidate.id === params.entity) ??
    entities.find(candidate => candidate.id === settings.general.homeEntityId) ??
    entities[0]

  const entityRuns = runs.filter(run => run.entityId === entity.id)
  const currentRun = latestRunFor(entityRuns)

  if (!currentRun) {
    return (
      <div className='flex flex-col gap-6'>
        <header className='flex flex-col gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Payments</h1>
          <p className='text-muted-foreground text-sm'>
            {entity.name} has no pay run yet, so there is nothing to fund or release.
          </p>
        </header>
      </div>
    )
  }

  const entityAccounts = accounts.filter(candidate => candidate.entityId === entity.id)
  const entityBatches = batches.filter(batch => entityRuns.some(run => run.id === batch.payRunId))
  const entitySettlements = settlements.filter(item => entityRuns.some(run => run.id === item.payRunId))

  const currentBatch = entityBatches.find(batch => batch.payRunId === currentRun.id)

  const account =
    entityAccounts.find(a => a.id === currentBatch?.fundingAccountId) ?? entityAccounts.find(a => a.isDefault)

  const currentSettlements = entitySettlements.filter(item => item.payRunId === currentRun.id)
  const funding = fundingSummary(currentSettlements, account, currentRun.currency)
  const readiness = paymentReadiness(currentRun, currentSettlements, funding, currentBatch)
  const rows = buildSettlementRows(entitySettlements, employees, departments, entityRuns)
  const employeeNames = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]))

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Payments</h1>
          <p className='text-muted-foreground text-sm'>
            Funding, release and settlement for {entity.name}. A payment file is drawn on one
            account in {entity.currency}, so each company&apos;s payments are worked separately.
          </p>
        </div>
        <EntityPicker entities={entities} value={entity.id} basePath='/payroll/payments' />
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
        <SettlementBatches batches={entityBatches} runs={entityRuns} className='col-span-full' />
      </div>

      <PaymentsWorkspace
        rows={rows}
        batches={entityBatches}
        runs={[...entityRuns].reverse().map(run => ({ id: run.id, reference: run.reference }))}
        mayReissue={can(actor, 'payroll.payment.reissue')}
      />
    </div>
  )
}

export default PayrollPaymentsPage
