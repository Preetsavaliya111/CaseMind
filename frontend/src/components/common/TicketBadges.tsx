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
  new: { label: 'New', className: 'border border-info/30 bg-info/10 text-info' },
  assigned: { label: 'Assigned', className: 'border border-info/25 bg-info/10 text-info' },
  in_progress: { label: 'In Progress', className: 'border border-info/25 bg-info/10 text-info' },
  waiting_customer: { label: 'Waiting Customer', className: 'border border-warning/30 bg-warning/10 text-warning' },
  waiting_engineering: { label: 'Waiting Eng.', className: 'border border-warning/30 bg-warning/10 text-warning' },
  resolved: { label: 'Resolved', className: 'border border-success/30 bg-success/10 text-success' },
  closed: { label: 'Closed', className: 'border border-border bg-muted text-muted-foreground' },
  reopened: { label: 'Reopened', className: 'border border-destructive/30 bg-destructive/10 text-destructive' },
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

