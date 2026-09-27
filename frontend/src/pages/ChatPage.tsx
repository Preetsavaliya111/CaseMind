import { useEffect, useRef, useState } from 'react'
import { AlertCircle, BookOpen, Brain, ChevronDown, Database, ExternalLink, FileText, Plus, Send, ShieldCheck, ThumbsDown, ThumbsUp, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Button, Card, CardContent, Textarea } from '@/components/ui'
import { MarkdownRenderer } from '@/features/chat/components/MarkdownRenderer'
import { aiService, type AIAnswer, type AICitation, type AIStatus } from '@/features/chat/services/aiService'
import type { ApiError } from '@/types'
import { cn } from '@/utils'

interface WorkspaceMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: AICitation[]
  model?: string
  interactionId?: string
  feedback?: 'helpful' | 'not_helpful'
}

const prompts = [
  'Have we seen this login problem before?',
  'How did we solve similar payment failures?',
  'What should I check first for this error?',
]

function matchStrength(score: number) {
  if (score >= 0.8) return 'Very strong match'
  if (score >= 0.6) return 'Strong match'
  return 'Related source'
}

export function ChatPage() {
  const location = useLocation()
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [statusError, setStatusError] = useState(false)
  const [messages, setMessages] = useState<WorkspaceMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTechnical, setShowTechnical] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    aiService.status().then(setStatus).catch(() => setStatusError(true))
  }, [])

  useEffect(() => {
    const suggested = (location.state as { prompt?: string } | null)?.prompt
    if (suggested) setInput(suggested)
  }, [location.state])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const resetConversation = () => {
    setMessages([])
    setInput('')
    setError(null)
  }

  const send = async (suggested?: string) => {
    const question = (suggested ?? input).trim()
    if (!question || isSending || !status?.configured) return
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: question }])
    setInput('')
    setError(null)
    setIsSending(true)
    try {
      const response: AIAnswer = await aiService.query(question)
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', content: response.answer, citations: response.citations, model: response.model, interactionId: response.interaction_id },
      ])
    } catch (caught) {
      const apiError = caught as ApiError
      setError(apiError.message || 'The evidence-backed answer could not be generated.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      <aside className="hidden w-72 shrink-0 border-r bg-card/50 p-4 lg:flex lg:flex-col">
        <Button size="sm" onClick={resetConversation}><Plus className="h-4 w-4" />New conversation</Button>
        <div className="mt-6 space-y-3">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Available knowledge</p>
          {statusError ? (
            <p className="text-xs text-destructive">Status is unavailable.</p>
          ) : status ? (
            <>
              <Metric icon={FileText} label="Search-ready documents" value={status.indexed_documents} />
              <Metric icon={ShieldCheck} label="Reviewed solutions" value={status.verified_memory_items} />
              <Metric icon={Database} label="Sources available" value={status.available_evidence} />
            </>
          ) : <p className="text-xs text-muted-foreground">Checking workspace…</p>}
        </div>
        <div className="mt-auto rounded-xl border bg-background p-3 text-xs text-muted-foreground">
          Answers use evidence belonging to your organization. Every returned source is linked below the answer.
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header data-tour="assistant-intro" className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Brain className="h-5 w-5" /></div>
            <div><h1 className="text-sm font-semibold">Ask CaseMind</h1><p className="text-2xs text-muted-foreground">Ask questions using your organization’s cases and knowledge</p></div>
          </div>
          <span className={cn('rounded-full px-2.5 py-1 text-2xs font-medium', status?.configured ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
            {status?.configured ? 'Ready to help' : 'AI setup pending'}
          </span>
        </header>

        <section className="flex-1 overflow-y-auto px-5 py-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {!status?.configured && status && (
              <Card className="border-warning/30 bg-warning/5"><CardContent className="flex gap-3 p-5">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div><p className="text-sm font-semibold">CaseMind Assistant is not ready yet</p><p className="mt-1 text-xs text-muted-foreground">Your cases, documents, and Organizational Memory are safe. Ask an administrator to finish the AI connection before using answers and suggestions.</p></div>
              </CardContent></Card>
            )}

            {messages.length === 0 && (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="h-7 w-7" /></div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight">Ask about previous solutions and trusted knowledge</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">CaseMind looks through information your organization can access and provides an answer with sources. If there is not enough information, it tells you clearly.</p>
                <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-3">
                  {prompts.map((prompt) => <button key={prompt} disabled={!status?.configured} onClick={() => send(prompt)} className="rounded-xl border bg-card p-3 text-left text-xs leading-relaxed transition-colors hover:border-primary/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50">{prompt}</button>)}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={cn('flex max-w-3xl gap-3', message.role === 'user' && 'ml-auto flex-row-reverse')}>
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', message.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-secondary')}>
                  {message.role === 'assistant' ? <Brain className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={cn('max-w-[88%] space-y-3', message.role === 'user' && 'text-right')}>
                  <div className={cn('rounded-2xl p-4 text-left text-sm', message.role === 'assistant' ? 'rounded-tl-sm border bg-card' : 'rounded-tr-sm bg-primary text-primary-foreground')}>
                    {message.role === 'assistant' ? <MarkdownRenderer content={message.content} /> : <p className="whitespace-pre-wrap">{message.content}</p>}
                  </div>
                  {message.citations && message.citations.length > 0 && (
                    <div data-tour="assistant-sources" className="grid gap-2 text-left sm:grid-cols-2">
                      {message.citations.map((citation) => (
                        <Link key={`${citation.key}-${citation.source_id}`} to={citation.locator} className="rounded-lg border bg-card p-3 transition-colors hover:border-primary/40">
                          <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">[{citation.key}] {citation.title}</span><ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" /></div>
                          <p className="mt-1 line-clamp-2 text-2xs text-muted-foreground">{citation.excerpt}</p>
                          <p className="mt-2 text-2xs font-medium text-primary">{matchStrength(citation.relevance_score)}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                  {message.model && (
                    <div className="flex items-center justify-between gap-3 text-2xs text-muted-foreground">
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => setShowTechnical((value) => !value)}>View technical details<ChevronDown className={`h-3 w-3 transition-transform ${showTechnical ? 'rotate-180' : ''}`} /></button>
                      {message.interactionId && <div className="flex items-center gap-1" aria-label="Rate this answer">
                        <button aria-label="Helpful answer" className={cn('rounded-md p-1.5 hover:bg-muted hover:text-foreground', message.feedback === 'helpful' && 'bg-success/10 text-success')} onClick={async () => { await aiService.feedback(message.interactionId!, 'helpful'); setMessages((current) => current.map((item) => item.id === message.id ? { ...item, feedback: 'helpful' } : item)) }}><ThumbsUp className="h-3.5 w-3.5" /></button>
                        <button aria-label="Not helpful answer" className={cn('rounded-md p-1.5 hover:bg-muted hover:text-foreground', message.feedback === 'not_helpful' && 'bg-destructive/10 text-destructive')} onClick={async () => { await aiService.feedback(message.interactionId!, 'not_helpful'); setMessages((current) => current.map((item) => item.id === message.id ? { ...item, feedback: 'not_helpful' } : item)) }}><ThumbsDown className="h-3.5 w-3.5" /></button>
                      </div>}
                    </div>
                  )}
                  {message.model && showTechnical && <p className="rounded-md border bg-muted/30 p-2 text-left font-mono text-2xs text-muted-foreground">AI model: {message.model}</p>}
                </div>
              </div>
            ))}

            {isSending && <div className="flex items-center gap-3 text-xs text-muted-foreground"><Brain className="h-4 w-4 animate-pulse text-primary" />Searching your organization’s knowledge and preparing an answer…</div>}
            {error && <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"><AlertCircle className="h-4 w-4" />{error}</div>}
            <div ref={bottomRef} />
          </div>
        </section>

        <footer className="border-t bg-card/60 p-4">
          <form className="mx-auto flex max-w-4xl items-end gap-2" onSubmit={(event) => { event.preventDefault(); send() }}>
            <Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send() } }} placeholder={status?.configured ? 'Ask about cases, solutions, or trusted knowledge…' : 'Ask an administrator to finish AI setup'} rows={2} disabled={!status?.configured || isSending} className="resize-none" />
            <Button type="submit" size="icon" disabled={!input.trim() || !status?.configured || isSending} aria-label="Send question"><Send className="h-4 w-4" /></Button>
          </form>
          <p className="mt-2 text-center text-2xs text-muted-foreground">Review cited evidence before acting on an AI-generated answer.</p>
        </footer>
      </main>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-lg border bg-background p-2.5"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</span><strong className="text-xs">{value}</strong></div>
}
