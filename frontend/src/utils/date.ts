import { format, formatDistanceToNow, parseISO } from 'date-fns'

function toDate(date: string | Date) {
  if (date instanceof Date) return date

  // The API stores UTC timestamps. SQLite serializes them without a timezone
  // suffix, so make that contract explicit before formatting in the browser.
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(date)
  return parseISO(hasTimezone ? date : `${date}Z`)
}

export const formatDate = (date: string | Date, pattern = 'MMM d, yyyy') =>
  format(toDate(date), pattern)

export const formatRelative = (date: string | Date) =>
  formatDistanceToNow(toDate(date), { addSuffix: true })

export const formatDateTime = (date: string | Date) =>
  format(toDate(date), 'MMM d, yyyy · h:mm a')
