// Type Imports
import type { Money } from '@/types/common/primitive-types'
import type { PayRun, Payslip } from '@/types/payroll/pay-run-types'
import type { FilingLine, FilingStatus, StatutoryFiling } from '@/types/payroll/compliance-types'

// Data Imports
import { payRuns, payslips } from '@/fake-db/payroll/pay-runs'

/**
 * Statutory filings, computed from the payslips the same way the runs are computed from the
 * employees. Nothing here is typed in: every amount is a sum of payslip components, so the
 * compliance page reconciles to the register by construction.
 *
 * Singapore rules for the seed's SG pay group: CPF contributions are due on the 14th of the month
 * after the period; the income tax withholding file goes in by the end of the following month;
 * the annual return covers the calendar year and is due 1 March.
 */

const CURRENCY = 'SGD' as const

const money = (amount: number): Money => ({ amount, currency: CURRENCY })

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

/** 'YYYY-MM-DD' of the given day in the month after `periodEnd`'s month. */
const dayOfFollowingMonth = (periodEnd: string, day: number) => {
  const [year, month] = periodEnd.split('-').map(Number)

  return isoDate(new Date(Date.UTC(year, month, day)))
}

/** Last day of the month after `periodEnd`'s month. */
const endOfFollowingMonth = (periodEnd: string) => {
  const [year, month] = periodEnd.split('-').map(Number)

  return isoDate(new Date(Date.UTC(year, month + 1, 0)))
}

const daysAfter = (date: string, days: number, time: string) => {
  const [year, month, day] = date.split('-').map(Number)

  return `${isoDate(new Date(Date.UTC(year, month - 1, day + days)))}T${time}`
}

/** Sum one component code across payslips, with how many payslips carried it. */
const lineFor = (slips: Payslip[], code: string, label: string): FilingLine => {
  const carrying = slips.filter(slip => slip.components.some(component => component.code === code))

  return {
    code,
    label,
    amount: money(
      carrying.reduce(
        (total, slip) => total + (slip.components.find(component => component.code === code)?.amount.amount ?? 0),
        0
      )
    ),
    employeeCount: carrying.length
  }
}

const sumLines = (lines: FilingLine[]) => money(lines.reduce((total, line) => total + line.amount.amount, 0))

/** The people on the compliance side of the seed: the payroll officer prepares, the Finance head files. */
const PREPARER = 'emp-022'
const SUBMITTER = 'emp-020'

/**
 * Timestamps and reference for a filing at a given status, all relative to the run's payday so
 * the audit trail reads in order: paid, then prepared, then submitted, then answered.
 */
const progress = (run: PayRun, status: FilingStatus, prefix: string) => {
  const preparedAt = daysAfter(run.payDate, 1, '03:00:00.000Z')
  const submittedAt = daysAfter(run.payDate, 2, '06:00:00.000Z')
  const respondedAt = daysAfter(run.payDate, 4, '02:00:00.000Z')
  const reference = `${prefix}-${run.reference.replace('PR-', '')}`

  switch (status) {
    case 'not_started':
      return {}
    case 'prepared':
      return { preparedAt, preparedBy: PREPARER }
    case 'submitted':
      return { preparedAt, preparedBy: PREPARER, submittedAt, submittedBy: SUBMITTER, reference }
    case 'accepted':
    case 'rejected':
      return { preparedAt, preparedBy: PREPARER, submittedAt, submittedBy: SUBMITTER, reference, respondedAt }
  }
}

const runFilings = payRuns.flatMap((run, index): StatutoryFiling[] => {
  const slips = payslips.filter(slip => slip.payRunId === run.id)
  const isOpen = index === payRuns.length - 1
  const isLatestClosed = index === payRuns.length - 2

  // Closed runs are filed and accepted, except June's tax file, which IRAS bounced. The most
  // recently closed run has its CPF prepared but not yet sent — that is the filing due next.
  const cpfStatus: FilingStatus = isOpen ? 'not_started' : isLatestClosed ? 'prepared' : 'accepted'
  const taxStatus: FilingStatus = isOpen || isLatestClosed ? 'not_started' : index === 2 ? 'rejected' : 'accepted'

  const cpfLines = [
    lineFor(slips, 'CPF_EE', 'Employee contribution'),
    lineFor(slips, 'CPF_ER', 'Employer contribution')
  ]

  const taxLines = [lineFor(slips, 'TAX', 'Tax withheld')]

  return [
    {
      id: `filing-${run.id}-cpf`,
      kind: 'cpf_contribution',
      payRunId: run.id,
      runReference: run.reference,
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      dueDate: dayOfFollowingMonth(run.periodEnd, 14),
      status: cpfStatus,
      amount: sumLines(cpfLines),
      employeeCount: slips.length,
      lines: cpfLines,
      calculationVersion: run.calculationVersion,
      ...progress(run, cpfStatus, 'CPF')
    },
    {
      id: `filing-${run.id}-tax`,
      kind: 'tax_withholding',
      payRunId: run.id,
      runReference: run.reference,
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      dueDate: endOfFollowingMonth(run.periodEnd),
      status: taxStatus,
      amount: sumLines(taxLines),
      employeeCount: taxLines[0].employeeCount,
      lines: taxLines,
      calculationVersion: run.calculationVersion,
      ...progress(run, taxStatus, 'IRAS'),
      ...(taxStatus === 'rejected' && {
        rejectionReason: '2 employees have tax reference numbers that do not match IRAS records.'
      })
    }
  ]
})

const year = payRuns[0].periodStart.slice(0, 4)
const yearSlips = payslips.filter(slip => slip.payRunId.includes(`-${year}-`))

const annualLines = [lineFor(yearSlips, 'BASE', 'Base salary'), lineFor(yearSlips, 'OT15', 'Overtime')]

const annualReturn: StatutoryFiling = {
  id: `filing-${year}-annual`,
  kind: 'annual_return',
  periodStart: `${year}-01-01`,
  periodEnd: `${year}-12-31`,
  dueDate: `${Number(year) + 1}-03-01`,
  status: 'not_started',
  amount: sumLines(annualLines),
  employeeCount: new Set(yearSlips.map(slip => slip.employeeId)).size,
  lines: annualLines
}

export const filings: StatutoryFiling[] = [...runFilings, annualReturn]
