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

  const strokeColor = isUp ? 'hsl(var(--color-success))' : 'hsl(var(--color-danger))'

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
  iconClassName
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
      ? 'text-success'
      : 'text-danger'
    : 'text-muted-foreground'

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md hover:border-primary/30', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold font-mono tracking-tight text-foreground">{value}</p>
            {description && <p className="text-2xs text-muted-foreground truncate">{description}</p>}
          </div>
          <div className={cn('rounded-xl p-2.5 bg-primary/10 shrink-0', iconClassName)}>
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 pt-1 border-t border-border/50">
          {trend && TrendIcon ? (
            <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal text-2xs truncate">{trend.label}</span>
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
