import { useNavigate } from 'react-router-dom'
import { Brain, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@/components/ui'
import type { Ticket } from '@/types'

interface AIAnalysisPanelProps {
  ticket: Ticket
}

export function AIAnalysisPanel({ ticket }: AIAnalysisPanelProps) {
  const navigate = useNavigate()
  const ai = ticket.aiAnalysis
  if (!ai) return null

  const sentimentColor =
    ai.sentiment === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : ai.sentiment === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground'

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-primary">
          <Brain className="h-4 w-4" aria-hidden="true" />
          AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Confidence bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">Category confidence</span>
              <span className="text-xs font-medium">{(ai.categoryConfidence * 100).toFixed(0)}%</span>
            </div>
            <Progress value={ai.categoryConfidence * 100} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">Priority confidence</span>
              <span className="text-xs font-medium">{(ai.priorityConfidence * 100).toFixed(0)}%</span>
            </div>
            <Progress value={ai.priorityConfidence * 100} className="h-1.5" />
          </div>
        </div>

        {/* Sentiment */}
        <div className="flex items-center justify-between py-2 border-t">
          <span className="text-xs text-muted-foreground">Customer Sentiment</span>
          <span className={`text-xs font-semibold capitalize ${sentimentColor}`}>
            {ai.sentiment} ({ai.sentimentScore > 0 ? '+' : ''}{ai.sentimentScore.toFixed(2)})
          </span>
        </div>

        {/* Suggested resolutions */}
        {ai.suggestedResolutions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggested Resolutions</p>
            <ul className="space-y-1.5">
              {ai.suggestedResolutions.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-primary mt-0.5 shrink-0">→</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Similar tickets */}
        {ai.similarTickets.length > 0 && (
          <div className="space-y-2 pt-1 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Similar Tickets</p>
            <div className="flex flex-wrap gap-2">
              {ai.similarTickets.map((id) => (
                <button
                  key={id}
                  onClick={() => navigate(`/tickets/${id}`)}
                  className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                >
                  {id}
                  <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Duplicate warning */}
        {ai.duplicateOf && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Badge variant="warning" className="text-2xs">Possible Duplicate</Badge>
            <button
              onClick={() => navigate(`/tickets/${ai.duplicateOf}`)}
              className="font-mono text-xs text-amber-700 dark:text-amber-400 hover:underline"
            >
              {ai.duplicateOf}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
