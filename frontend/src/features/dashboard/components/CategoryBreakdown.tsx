import { Card, CardContent, CardHeader, CardTitle, Progress } from '@/components/ui'
import type { CategoryDistribution } from '@/types'

interface CategoryBreakdownProps {
  data: CategoryDistribution[]
}

const categoryColors: Record<string, string> = {
  Bug: 'bg-primary',
  'Feature Request': 'bg-muted-foreground',
  Performance: 'bg-info',
  Integration: 'bg-success',
  Billing: 'bg-warning',
  Security: 'bg-destructive',
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item) => (
          <div key={item.category}>
            <div className="flex items-center justify-between mb-1 text-sm">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${categoryColors[item.category] ?? 'bg-muted-foreground'}`} aria-hidden="true" />
                <span className="font-medium">{item.category}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{item.count}</span>
                <span className="text-xs">({item.percentage}%)</span>
              </div>
            </div>
            <Progress value={item.percentage} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
