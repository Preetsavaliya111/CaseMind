import { cn } from '@/utils'
import { CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui'

interface SuccessRateProps {
  rate: number // 0 to 100
  showBar?: boolean
  showIcon?: boolean
  className?: string
}

export function SuccessRate({ rate, showBar = false, showIcon = true, className }: SuccessRateProps) {
  const isHigh = rate >= 90
  const isMed = rate >= 75 && rate < 90

  const textColor = isHigh
    ? 'text-success'
    : isMed
      ? 'text-warning'
      : 'text-danger'

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold">
        {showIcon && <CheckCircle2 className={cn('h-3.5 w-3.5', textColor)} aria-hidden="true" />}
        <span className={textColor}>{rate}%</span>
        <span className="text-2xs text-muted-foreground font-normal">success</span>
      </div>
      {showBar && (
        <Progress
          value={rate}
          className="h-1 w-20"
        />
      )}
    </div>
  )
}
