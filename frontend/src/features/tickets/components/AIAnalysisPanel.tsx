import { useNavigate } from 'react-router-dom'
import {
  Brain, ExternalLink, Database, CheckCircle2,
  AlertTriangle, ShieldAlert, ArrowRight, Lightbulb
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, Badge, Progress, Button } from '@/components/ui'
import { ConfidenceBadge } from '@/components/common'
import type { Ticket } from '@/types'
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboard'
import { mockMemoryRecords } from '@/mocks'
import { useEffect, useRef } from 'react'

interface AIAnalysisPanelProps {
  ticket: Ticket
  onApplyResolution?: (resolution: string) => void
}

export function AIAnalysisPanel({ ticket, onApplyResolution }: AIAnalysisPanelProps) {
  const navigate = useNavigate()
  const { data: metrics } = useDashboardMetrics()
  const pulseRef = useRef<HTMLSpanElement>(null)
  const ai = ticket.aiAnalysis

  // Matched organizational memory record
  const matchedMemory = mockMemoryRecords.find((m) =>
    m.category === ticket.category ||
    m.historicalTickets.includes(ticket.id) ||
    m.tags.some((t) => ticket.tags.includes(t))
  ) ?? mockMemoryRecords[0]

  const resolvedToday = metrics?.resolvedToday ?? 34
  const pulseDuration = resolvedToday > 0
    ? Math.round((4 - ((Math.min(resolvedToday, 50) - 1) / 49) * 2.8) * 100) / 100
    : null

  useEffect(() => {
    if (!pulseRef.current || pulseDuration === null) return
    pulseRef.current.style.setProperty('--pulse-duration', `${pulseDuration}s`)
  }, [pulseDuration])

  if (!ai) {
    return (
      <Card className="border-muted bg-muted/20">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
          <Brain className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
          <p className="text-sm font-medium text-foreground">AI Intelligence Analyzing Ticket</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Categorization, priority prediction, and root-cause matching are currently processing in the background.
          </p>
        </CardContent>
      </Card>
    )
  }

  const isLowConfidence = ai.categoryConfidence < 0.6 || ai.priorityConfidence < 0.6
  const sentimentColor =
    ai.sentiment === 'positive'
      ? 'text-success'
      : ai.sentiment === 'negative'
        ? 'text-danger'
        : 'text-muted-foreground'

  return (
    <div className="space-y-4">
      {/* Low Confidence Human Review Warning */}
      {isLowConfidence && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3.5 flex items-start gap-3 text-xs text-warning animate-fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Human Review Recommended (&lt;60% AI Confidence)</p>
            <p className="opacity-90 leading-relaxed">
              The AI classifier has low confidence in either category or priority prediction. Please verify before routing or escalating.
            </p>
          </div>
        </div>
      )}

      {/* Primary AI Analysis Card */}
      <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm text-primary font-display">
              <Brain className="h-4 w-4" aria-hidden="true" />
              AI Intelligence & Classification
            </CardTitle>
            <span className="text-2xs font-mono text-muted-foreground">BERT-Classifier-v2.4</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {/* Confidence Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-card border space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Category Prediction</span>
                <ConfidenceBadge score={ai.categoryConfidence} />
              </div>
              <p className="text-xs font-semibold capitalize">{ai.category.replace('_', ' ')}</p>
              <Progress value={ai.categoryConfidence * 100} className="h-1" />
            </div>

            <div className="p-2.5 rounded-lg bg-card border space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Priority Prediction</span>
                <ConfidenceBadge score={ai.priorityConfidence} />
              </div>
              <p className="text-xs font-semibold capitalize">{ai.predictedPriority}</p>
              <Progress value={ai.priorityConfidence * 100} className="h-1" />
            </div>
          </div>

          {/* Sentiment & Escalation Risk */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-card border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Customer Sentiment:</span>
              <span className={`font-mono text-xs font-semibold capitalize ${sentimentColor}`}>
                {ai.sentiment} ({ai.sentimentScore > 0 ? '+' : ''}{ai.sentimentScore.toFixed(2)})
              </span>
            </div>
            {ai.sentimentScore < -0.7 && (
              <Badge variant="critical" className="text-2xs">High Escalation Risk</Badge>
            )}
          </div>

          {/* Duplicate Warning */}
          {ai.duplicateOf && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-warning/10 border border-warning/30 text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warning shrink-0" />
                <span className="text-warning font-medium">Potential duplicate of ticket</span>
                <button
                  onClick={() => navigate(`/tickets/${ai.duplicateOf}`)}
                  className="font-mono font-semibold text-warning underline hover:opacity-80"
                >
                  {ai.duplicateOf}
                </button>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-2xs"
                onClick={() => navigate(`/tickets/${ai.duplicateOf}`)}
              >
                Compare
              </Button>
            </div>
          )}

          {/* Root Cause Analysis & Precedents */}
          <div className="space-y-2 pt-1 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" /> Root Cause Hypothesis
            </p>
            <div className="p-3 rounded-lg bg-card border text-xs leading-relaxed text-foreground">
              {matchedMemory.rootCause}
            </div>
          </div>

          {/* Suggested Resolutions */}
          {ai.suggestedResolutions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recommended Actions
              </p>
              <div className="space-y-1.5">
                {ai.suggestedResolutions.map((res, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 p-2 rounded-lg bg-card border hover:bg-muted/40 transition-colors text-xs"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5 shrink-0">→</span>
                      <span>{res}</span>
                    </div>
                    {onApplyResolution && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-2xs shrink-0 text-primary hover:text-primary"
                        onClick={() => onApplyResolution(res)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Tickets */}
          {ai.similarTickets.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <span className="text-muted-foreground">Similar Historical Tickets:</span>
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
        </CardContent>
      </Card>

      {/* Flagship Organizational Memory Card (Purple Accent) */}
      <Card className="border-purple-500/30 bg-purple-950/[0.08] shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm text-purple-400 font-display">
              <div className="relative flex h-5 w-5 items-center justify-center shrink-0">
                {pulseDuration !== null && (
                  <span
                    ref={pulseRef}
                    className="memory-pulse absolute inset-0 rounded-full bg-purple-500"
                    aria-hidden="true"
                  />
                )}
                <Database className="relative h-3.5 w-3.5 text-purple-400 z-10" aria-hidden="true" />
              </div>
              Organizational Memory Synthesis
            </CardTitle>
            <Badge variant="default" className="text-2xs bg-purple-500/20 text-purple-300 border-purple-500/30">
              Validated Precedent
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 text-xs">
          <div className="p-3 rounded-lg border border-purple-500/20 bg-card space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground text-sm">{matchedMemory.patternTitle}</p>
                <p className="text-2xs text-muted-foreground mt-0.5">
                  Pattern {matchedMemory.id} · Resolved by {matchedMemory.resolvedByTeam}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                  <CheckCircle2 className="h-3 w-3" /> {matchedMemory.successRate}% success
                </span>
                <p className="text-2xs text-muted-foreground">{matchedMemory.avgResolutionHours}h avg time</p>
              </div>
            </div>

            <div className="p-2.5 rounded bg-purple-500/10 border border-purple-500/20 space-y-1">
              <p className="text-2xs font-semibold text-purple-400 uppercase tracking-wide">
                Synthesized Runbook Step
              </p>
              <p className="text-xs text-foreground font-mono">
                {matchedMemory.resolutionSteps[0]}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-2xs text-muted-foreground">
              Source: Organizational Memory Engine ({resolvedToday} resolutions logged today)
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
              onClick={() => navigate('/memory')}
            >
              Open Memory Library
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
