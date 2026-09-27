import { useState } from 'react'
import { Brain, ExternalLink, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { MarkdownRenderer } from '@/features/chat/components/MarkdownRenderer'
import { aiService, type AIAnswer } from '@/features/chat/services/aiService'
import type { Ticket } from '@/types'
import { cn } from '@/utils'

interface AIAnalysisPanelProps {
  ticket: Ticket
}

export function AIAnalysisPanel({ ticket }: AIAnalysisPanelProps) {
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<AIAnswer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null)
  const prompt = `Analyze case ${ticket.caseNumber}: ${ticket.title}. Has this happened before, what evidence is relevant, what is the likely root cause, and what should we do next?`

  const analyze = async () => {
    setLoading(true)
    setError(null)
    try {
      setAnalysis(await aiService.query(prompt))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Case analysis could not be generated.')
    } finally {
      setLoading(false)
    }
  }

  const rate = async (rating: 'helpful' | 'not_helpful') => {
    if (!analysis) return
    await aiService.feedback(analysis.interaction_id, rating)
    setFeedback(rating)
  }

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm text-primary"><Brain className="h-4 w-4" />Evidence-backed case intelligence</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? <>
          <p className="text-sm leading-relaxed text-muted-foreground">Compare this case with reviewed solutions, published knowledge, search-ready documents, and similar cases. Every suggestion includes sources you can inspect.</p>
          <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground"><p className="flex items-center gap-2 font-medium text-foreground"><ShieldCheck className="h-4 w-4 text-success" />Transparent by design</p><p className="mt-1">Generated answers include source links and clearly disclose when evidence is insufficient.</p></div>
          {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={analyze} loading={loading}>Analyze this case</Button><Button variant="outline" size="sm" onClick={() => navigate('/chat', { state: { prompt } })}>Open Evidence Workspace<ExternalLink className="h-3.5 w-3.5" /></Button></div>
        </> : <>
          <div className="rounded-xl border bg-card p-4"><MarkdownRenderer content={analysis.answer} /></div>
          {analysis.citations.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{analysis.citations.map((citation) => <button key={`${citation.key}-${citation.source_id}`} onClick={() => navigate(citation.locator)} className="rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">[{citation.key}] {citation.title}</span><ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" /></div><p className="mt-1 line-clamp-2 text-2xs text-muted-foreground">{citation.excerpt}</p><p className="mt-2 text-2xs font-mono text-primary">{citation.source_type} · {Math.round(citation.relevance_score * 100)}% match</p></button>)}</div>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-2xs text-muted-foreground"><span>Generated with {analysis.model}. Review evidence before acting.</span><div className="flex items-center gap-1"><span className="mr-1">Useful?</span><button aria-label="Helpful analysis" className={cn('rounded-md p-1.5 hover:bg-muted hover:text-foreground', feedback === 'helpful' && 'bg-success/10 text-success')} onClick={() => rate('helpful')}><ThumbsUp className="h-3.5 w-3.5" /></button><button aria-label="Not helpful analysis" className={cn('rounded-md p-1.5 hover:bg-muted hover:text-foreground', feedback === 'not_helpful' && 'bg-destructive/10 text-destructive')} onClick={() => rate('not_helpful')}><ThumbsDown className="h-3.5 w-3.5" /></button><Button variant="ghost" size="sm" className="ml-2 h-7 text-xs" onClick={analyze} loading={loading}>Refresh</Button></div></div>
        </>}
      </CardContent>
    </Card>
  )
}
