import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const formatDate = (date: string | Date, pattern = 'MMM d, yyyy') =>
  format(typeof date === 'string' ? parseISO(date) : date, pattern)

export const formatRelative = (date: string | Date) =>
  formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true })

export const formatDateTime = (date: string | Date) =>
  format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy · h:mm a')
