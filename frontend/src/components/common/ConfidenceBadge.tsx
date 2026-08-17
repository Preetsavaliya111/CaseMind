import { cn } from '@/utils'
import { Badge } from '@/components/ui'
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'

interface ConfidenceBadgeProps {
  score: number // 0 to 1 or 0 to 100
  showIcon?: boolean
  className?: string
}

export function ConfidenceBadge({ score, showIcon = true, className }: ConfidenceBadgeProps) {
  const normalized = score > 1 ? score : score * 100
  const isHigh = normalized >= 85
  const isMedium = normalized >= 60 && normalized < 85

  const variant = isHigh ? 'success' : isMedium ? 'warning' : 'critical'
  const Icon = isHigh ? CheckCircle2 : isMedium ? HelpCircle : AlertCircle


  return (
    <Badge
      variant={variant}
      className={cn('inline-flex items-center gap-1 font-mono text-2xs font-medium', className)}
    >
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      <span>{normalized.toFixed(0)}%</span>
      <span className="sr-only">confidence</span>
    </Badge>
  )
}
