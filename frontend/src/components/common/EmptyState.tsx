import { type LucideIcon, Inbox } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { cn } from '@/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('p-12 text-center border-border-subtle bg-bg-primary shadow-subtle', className)}>
      <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
        <div className="p-4 rounded-2xl bg-bg-secondary text-text-muted border border-border-subtle shadow-xs">
          <Icon className="h-8 w-8 text-text-muted" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="text-xs text-text-muted leading-relaxed">{description}</p>
        </div>
        {action && (
          <Button variant="default" size="sm" onClick={action.onClick} className="mt-2">
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  )
}
