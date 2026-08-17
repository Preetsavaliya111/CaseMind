import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/utils'
import { Card, CardContent } from '@/components/ui'
import type { SparklinePoint } from '@/types'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: number; label: string; isPositiveGood?: boolean }
  sparkline?: SparklinePoint[]
  className?: string
  iconClassName?: string
}

function MiniSparkline({ data, isUp }: { data: SparklinePoint[]; isUp: boolean }) {
  if (!data || data.length < 2) return null
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 64
  const height = 24

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((d.value - min) / range) * (height - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const strokeColor = isUp ? 'var(--accent-secondary, #059669)' : 'var(--error-text, #991B1B)'

  return (
    <svg width={width} height={height} className="overflow-visible opacity-80 shrink-0" aria-hidden="true">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  sparkline,
  className,
  iconClassName,
}: StatCardProps) {
  const isUp = trend ? trend.value >= 0 : true
  const isGood = trend?.isPositiveGood !== undefined ? (isUp ? trend.isPositiveGood : !trend.isPositiveGood) : isUp

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null

  const trendColor = trend
    ? isGood
      ? 'text-success-text bg-success-bg border-success-border'
      : 'text-error-text bg-error-bg border-error-border'
    : 'text-text-muted bg-bg-secondary border-border-default'

  return (
    <Card className={cn('relative overflow-hidden group border border-border-subtle shadow-default hover:shadow-medium transition-all duration-300', className)}>
      {/* Subtle hover gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs font-medium text-text-muted truncate">{title}</p>
            <p className="text-2xl font-bold font-mono tracking-tight text-text-primary">{value}</p>
            {description && <p className="text-2xs text-text-muted truncate">{description}</p>}
          </div>
          <div className={cn('rounded-xl p-2.5 bg-amber-500/10 text-accent-primary shrink-0 border border-amber-500/20', iconClassName)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2 pt-2.5 border-t border-border-subtle">
          {trend && TrendIcon ? (
            <div className={cn('inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full border', trendColor)}>
              <TrendIcon className="h-3 w-3" aria-hidden="true" />
              <span>{Math.abs(trend.value)}%</span>
              <span className="font-normal opacity-80">{trend.label}</span>
            </div>
          ) : (
            <div />
          )}

          {sparkline && sparkline.length > 1 && (
            <MiniSparkline data={sparkline} isUp={isUp} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
