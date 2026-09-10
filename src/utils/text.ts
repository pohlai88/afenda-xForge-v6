/**
 * Text helpers with no domain in them.
 *
 * They lived in `payroll-workspace` until HRM needed them too. Nothing here knows what a pay run
 * is, so the move is the correction rather than the concession — `payroll-workspace` re-exports
 * them, so every existing caller is unchanged. Same reasoning, and same shape, as the calendar
 * helpers in `format-datetime.ts`.
 */

/**
 * 'Yuki Tanaka' -> 'YT'.
 *
 * Two letters: one is ambiguous in a list of colleagues and three reads as a monogram. `filter`
 * drops the empty strings a double space would otherwise turn into a leading blank.
 */
export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0] ?? '')
    .join('')
    .toUpperCase()
