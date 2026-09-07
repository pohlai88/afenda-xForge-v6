/**
 * Calendar formatting, hand-rolled for the same reason money is.
 *
 * No `Intl` and no clock: these run on the server first and the client has to agree with them
 * character for character, and `Intl` does not guarantee that across runtimes.
 *
 * They lived beside the payroll workspace builders until an audit timeline had to render outside
 * payroll. Nothing here knows what a pay run is, so the move is the correction rather than the
 * concession — `payroll-workspace` re-exports all three, so every existing caller is unchanged.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

/** '2026-09-18T01:00:00.000Z' -> '18 Sep 2026, 01:00 UTC'. */
export const formatInstant = (iso: string): string => {
  const [date, time] = iso.split('T')
  const [year, month, day] = date.split('-')

  return `${Number(day)} ${MONTHS_SHORT[Number(month) - 1]} ${year}, ${time.slice(0, 5)} UTC`
}

/** '2026-09-30' -> '30 Sep 2026'. */
export const formatDate = (iso: string): string => {
  const [year, month, day] = iso.split('-')

  return `${Number(day)} ${MONTHS_SHORT[Number(month) - 1]} ${year}`
}

/** '2026-09-01' + '2026-09-30' -> 'September 2026' when the period is a calendar month. */
export const formatPeriod = (start: string, end: string): string => {
  const [year, month] = start.split('-')
  const endMonth = end.split('-')[1]

  return month === endMonth ? `${MONTHS_LONG[Number(month) - 1]} ${year}` : `${formatDate(start)} – ${formatDate(end)}`
}
