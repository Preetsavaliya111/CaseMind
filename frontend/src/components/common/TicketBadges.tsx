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
  new: { label: 'New', className: 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]' },
  assigned: { label: 'Assigned', className: 'bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE]' },
  in_progress: { label: 'In Progress', className: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]' },
  waiting_customer: { label: 'Waiting Customer', className: 'bg-[#FFF7ED] text-[#9A3412] border border-[#FFEDD5]' },
  waiting_engineering: { label: 'Waiting Eng.', className: 'bg-[#FDF2F8] text-[#9D174D] border border-[#FCE7F3]' },
  resolved: { label: 'Resolved', className: 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]' },
  closed: { label: 'Closed', className: 'bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]' },
  reopened: { label: 'Reopened', className: 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]' },
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = priorityConfig[priority]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  )
}

export function SLABadge({ state, breached }: { state?: 'healthy' | 'at_risk' | 'breached'; breached?: boolean }) {
  const isBreached = breached || state === 'breached'
  const isAtRisk = state === 'at_risk'

  if (isBreached) {
    return (
      <Badge variant="critical" className="font-mono text-2xs uppercase tracking-wider">
        SLA Breached
      </Badge>
    )
  }

  if (isAtRisk) {
    return (
      <Badge variant="warning" className="font-mono text-2xs uppercase tracking-wider">
        SLA At Risk
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="font-mono text-2xs uppercase tracking-wider text-muted-foreground">
      SLA Healthy
    </Badge>
  )
}
