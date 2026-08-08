import { type TicketPriority, type TicketStatus } from '@/types'
import { Badge } from '@/components/ui'
import type { BadgeProps } from '@/components/ui/Badge'
import { cn } from '@/utils'

const priorityConfig: Record<TicketPriority, { label: string; variant: BadgeProps['variant'] }> = {
  critical: { label: 'Critical', variant: 'critical' },
  high: { label: 'High', variant: 'destructive' },
  medium: { label: 'Medium', variant: 'warning' },
  low: { label: 'Low', variant: 'secondary' },
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  assigned: { label: 'Assigned', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  in_progress: { label: 'In Progress', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  waiting_customer: { label: 'Waiting Customer', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  waiting_engineering: { label: 'Waiting Eng.', className: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
  resolved: { label: 'Resolved', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  reopened: { label: 'Reopened', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = priorityConfig[priority]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center rounded-full border-transparent px-2.5 py-0.5 text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  )
}
