import { cn } from '@/utils'
import type { AnalyticsTimeRange } from '../types'

interface TimeRangeSelectorProps {
  value: AnalyticsTimeRange
  onChange: (range: AnalyticsTimeRange) => void
}

const ranges: { value: AnalyticsTimeRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
]

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="inline-flex rounded-md border bg-muted p-0.5 gap-0.5" role="group" aria-label="Time range">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded transition-colors',
            value === r.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={value === r.value}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
