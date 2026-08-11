import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/utils'
import { Card, CardContent } from '@/components/ui'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  className?: string
  iconClassName?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, className, iconClassName }: StatCardProps) {
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null

  const trendColor = trend
    ? trend.value > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend.value < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground'
    : ''

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={cn('rounded-lg p-2.5 bg-primary/10', iconClassName)}>
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
        </div>
        {trend && TrendIcon && (
          <div className={cn('mt-3 flex items-center gap-1 text-xs font-medium', trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground font-normal">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
