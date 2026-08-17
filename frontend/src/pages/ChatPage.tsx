import { useState, useRef, useEffect } from 'react'
import {
  Send, Brain, User, Database, BookOpen, BarChart3, Ticket,
  Plus, History, MessageSquare, ChevronLeft,
  ExternalLink, RotateCcw, AlertCircle
} from 'lucide-react'
import { Button, Textarea } from '@/components/ui'
import { MarkdownRenderer } from '@/features/chat/components/MarkdownRenderer'
import { cn, formatDateTime } from '@/utils'
import {
  mockTickets, mockDashboardMetrics,
  mockChatSessions, mockChatMessages, mockMemoryRecords
} from '@/mocks'

import type { SourceType, ChatSession, ChatMessage, CitationSource } from '@/types'

const SOURCE_CONFIG: Record<SourceType, { label: string; className: string; icon: React.ElementType } | null> = {
  memory:    { label: 'Organizational Memory', className: 'border-purple-500/40 text-purple-400 bg-purple-950/20', icon: Database },
  knowledge: { label: 'Knowledge Base',        className: 'border-primary/40 text-primary bg-primary/10',          icon: BookOpen },
  live:      { label: 'Live Data',             className: 'border-success/40 text-success bg-success/10',          icon: BarChart3 },
  none:      null,
}

function SourceBadge({ source }: { source: SourceType }) {
  const config = SOURCE_CONFIG[source]
  if (!config) return null
  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full border font-medium font-mono', config.className)}>
      <Icon className="h-2.5 w-2.5" aria-hidden="true" />
      {config.label}
    </span>
  )
}

// ── Smart AI response engine without emojis ─────────────────────────────────
function generateCleanAIResponse(input: string): {
  content: string
  suggestions?: string[]
  source: SourceType
  sources?: CitationSource[]
} {
  const q = input.toLowerCase()

  const ticketIdMatch = q.match(/tkt-?\d+/i)
  if (ticketIdMatch) {
    const id = ticketIdMatch[0].toUpperCase().replace('TKT', 'TKT-').replace('TKT--', 'TKT-')
    const ticket = mockTickets.find((t) => t.id.toLowerCase() === id.toLowerCase())
    if (ticket) {
      return {
        source: 'live',
        sources: [
          { id: ticket.id, type: 'ticket', title: ticket.title, relevanceScore: 0.98 }
        ],
        content: `### Ticket ${ticket.id}: ${ticket.title}\n\n• Status: **${ticket.status.replace('_', ' ')}**\n• Priority: **${ticket.priority.toUpperCase()}**\n• Assignee: **${ticket.assigneeName ?? 'Unassigned'}**\n• Reporter: **${ticket.reporterName}**` +
          (ticket.aiAnalysis
            ? `\n\n### AI Classification & Analysis\n• Category Confidence: **${(ticket.aiAnalysis.categoryConfidence * 100).toFixed(0)}%**\n• Sentiment: **${ticket.aiAnalysis.sentiment} (${ticket.aiAnalysis.sentimentScore.toFixed(2)})**\n• Primary Suggestion: ${ticket.aiAnalysis.suggestedResolutions[0] ?? 'N/A'}`
            : ''),
        suggestions: ['Show similar tickets', 'View memory resolution', 'Check SLA status'],
      }
    }
    return { source: 'none', content: `Unable to locate ticket ${id}. Please verify the ticket ID and try again.` }
  }

  if (q.match(/dashboard|metric|stat|overview|summary|today|performance/)) {
    const m = mockDashboardMetrics
    return {
      source: 'live',
      content: `### Platform Overview Today\n\n• Open Tickets: **${m.openTickets}**\n• Resolved Today: **${m.resolvedToday}**\n• Avg Resolution Time: **${m.avgResolutionTime} hours**\n• SLA Breach Rate: **${m.slaBreachRate}%**\n• Customer CSAT: **${m.customerSatisfaction}%**\n• AI Acceptance Rate: **${m.aiAcceptanceRate}%**\n• First Contact Resolution: **${m.firstContactResolution}%**`,
      suggestions: ['Show critical tickets', 'Which agent is performing best?', 'SLA breach details'],
    }
  }

  if (q.match(/critical|urgent|sla|breach|high priority/)) {
    const critical = mockTickets.filter((t) => t.priority === 'critical' || t.slaBreached)
    if (critical.length === 0) return { source: 'live', content: 'No critical or SLA-breached tickets currently active in the queue.' }
    return {
      source: 'live',
      content: `### ${critical.length} Critical / SLA-Breached Ticket(s)\n\n` +
        critical.map((t) =>
          `• **${t.id}**: ${t.title}\n  Status: ${t.status} | Assignee: ${t.assigneeName ?? 'Unassigned'}${t.slaBreached ? ' [SLA BREACHED]' : ''}`
        ).join('\n\n'),
      suggestions: ['How to resolve payment gateway issue?', 'Assign ticket to agent', 'Show all open tickets'],
    }
  }

  if (q.match(/payment|gateway|checkout|transaction|stripe|billing/)) {
    const mem = mockMemoryRecords[0]
    return {
      source: 'memory',
      sources: [
        { id: mem.id, type: 'memory_record', title: mem.patternTitle, relevanceScore: 0.96 },
        { id: 'TKT-1001', type: 'ticket', title: 'Payment gateway timeout during checkout', relevanceScore: 0.94 }
      ],
      content: `### Payment Gateway Root Cause & Precedent (Memory Engine)\n\nBased on ${mem.historicalTickets.length} resolved tickets in organizational memory:\n\n• **Primary Root Cause**: ${mem.rootCause}\n• **Recommended Resolution**:\n  1. Increase \`DB_POOL_SIZE\` from 10 to 25.\n  2. Configure connection timeouts to 120s.\n  3. Deploy circuit breaker pattern on payment client.\n• **Historical Success Rate**: **${mem.successRate}%** (${mem.avgResolutionHours}h avg time to resolve)`,
      suggestions: ['Show TKT-1001 details', 'Open Payment Runbook', 'Check active open tickets'],
    }
  }

  if (q.match(/sso|saml|auth|login|oauth|certificate|ldap/)) {
    const mem = mockMemoryRecords[1]
    return {
      source: 'memory',
      sources: [
        { id: mem.id, type: 'memory_record', title: mem.patternTitle, relevanceScore: 0.97 },
      ],
      content: `### SAML SSO Troubleshooting (Memory Engine)\n\nCommon verified causes from historical precedents:\n\n1. **Certificate Expiry**: Inspect dates with \`openssl x509 -in cert.pem -noout -dates\`\n2. **Metadata Drift**: Re-download and sync IdP metadata XML\n3. **Clock Skew**: Verify SAML assertion validity window (within ±5 minutes)\n4. **ACS URL Mismatch**: Validate Assertion Consumer Service endpoint\n\nActive SSO ticket: **TKT-1002** (assigned to Marcus Johnson)`,
      suggestions: ['Show TKT-1002', 'SAML troubleshooting runbook', 'Check certificate status'],
    }
  }

  if (q.match(/agent|team|staff|who|best|top/)) {
    return {
      source: 'live',
      content: `### Support Team Performance Summary\n\n• **Priya Sharma**: 142 resolved | 3.8h avg | 96.1% CSAT\n• **Marcus Johnson**: 128 resolved | 4.1h avg | 94.7% CSAT\n• **Alex Kim**: 119 resolved | 4.6h avg | 93.2% CSAT\n• **Fatima Al-Hassan**: 107 resolved | 5.2h avg | 91.8% CSAT\n\nOverall Team SLA Compliance: **96.1%**`,
      suggestions: ['Dashboard overview', 'Show open tickets', 'Analytics deep-dive'],
    }
  }

  return {
    source: 'none',
    content: `I analyzed your query across support tickets, organizational memory, and indexed knowledge articles.\n\n### Available Query Options\n• Lookup specific tickets by ID: **"Show TKT-1001"**\n• Review critical incidents: **"Show critical tickets"**\n• Retrieve institutional fixes: **"Payment gateway timeout solution"**\n• Access team metrics: **"Platform overview today"**`,
    suggestions: ['Show dashboard overview', 'Any critical tickets?', 'Payment gateway issue fix'],
  }
}

const PROMPT_CARDS = [
  { icon: Ticket,    label: 'Find a ticket',      prompt: 'Show TKT-1001',             description: 'Lookup incident details & AI analysis' },
  { icon: Database,  label: 'Memory Runbook',     prompt: 'Payment gateway timeout',   description: 'Retrieve verified resolution steps' },
  { icon: BarChart3, label: 'Platform health',    prompt: 'Give me today\'s overview', description: 'Real-time throughput & CSAT metrics' },
  { icon: Brain,     label: 'Team performance',   prompt: 'Who is the top agent?',     description: 'Resolution velocity & SLA compliance' },
]

export function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(mockChatSessions)
  const [activeSessionId, setActiveSessionId] = useState<string>(mockChatSessions[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages['session_001'] ?? [])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const selectSession = (id: string) => {
    setActiveSessionId(id)
    setMessages(mockChatMessages[id] ?? [
      {
        id: `msg_${Date.now()}`,
        sessionId: id,
        role: 'assistant',
        content: 'Hello! I am **CaseMind AI**, connected to Organizational Memory and Knowledge Base. How can I assist with your support workflow today?',
        timestamp: new Date().toISOString(),
        suggestions: ['Show dashboard overview', 'Any critical tickets?', 'Payment gateway issue fix'],
        sourceType: 'none',
      }
    ])
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 1,
      lastMessage: 'Conversation started',
    }
    setSessions([newSession, ...sessions])
    setActiveSessionId(newSession.id)
    setMessages([
      {
        id: `msg_${Date.now()}`,
        sessionId: newSession.id,
        role: 'assistant',
        content: 'New session started. Ask any question about tickets, resolution procedures, or platform analytics.',
        timestamp: new Date().toISOString(),
        suggestions: ['Show dashboard overview', 'Any critical tickets?', 'Payment gateway issue fix'],
        sourceType: 'none',
      }
    ])
  }

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return

    setErrorMessage(null)
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId: activeSessionId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      await new Promise((r) => setTimeout(r, 700 + Math.random() * 500))
      const { content: aiContent, suggestions, source, sources } = generateCleanAIResponse(content)
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sessionId: activeSessionId,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString(),
        suggestions,
        sourceType: source,
        sources,
      }
      setIsTyping(false)
      setMessages((prev) => [...prev, aiMsg])

      // Update session title if first message
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, title: s.title === 'New Conversation' ? content.slice(0, 32) : s.title, lastMessage: content }
            : s
        )
      )
    } catch {
      setIsTyping(false)
      setErrorMessage('Failed to generate AI response. Please retry.')
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden animate-fade-in bg-background">
      {/* Session History Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r bg-card/60 transition-all duration-200 shrink-0',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}
      >
        <div className="p-3 border-b flex items-center justify-between">
          <Button size="sm" className="w-full text-xs gap-1.5 h-8" onClick={createNewSession}>
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Conversations
          </p>
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => selectSession(s.id)}
              className={cn(
                'w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start gap-2 group',
                s.id === activeSessionId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-foreground'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-70" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{s.title}</p>
                <p className="text-2xs text-muted-foreground truncate">{s.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Pane */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? 'Collapse chat history' : 'Expand chat history'}
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <History className="h-4 w-4" />}
            </Button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Brain className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold font-display tracking-tight">CaseMind AI Copilot</p>
                <p className="text-2xs text-muted-foreground flex items-center gap-1.5 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" aria-hidden="true" />
                  RAG Knowledge · Memory Engine · Real-Time Incident Data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-3.5 max-w-3xl', msg.role === 'user' ? 'ml-auto flex-row-reverse' : '')}>
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5',
                  msg.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground',
                )}
              >
                {msg.role === 'assistant' ? <Brain className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div className={cn('flex flex-col gap-2 max-w-[85%]', msg.role === 'user' && 'items-end')}>
                <div
                  className={cn(
                    'rounded-2xl p-4 text-xs md:text-sm shadow-sm',
                    msg.role === 'assistant'
                      ? 'bg-card border text-foreground rounded-tl-sm'
                      : 'bg-primary text-primary-foreground rounded-tr-sm',
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </div>

                {/* Sources & Citations Box */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src) => (
                      <span
                        key={src.id}
                        className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-md border bg-muted/50 font-mono text-muted-foreground"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        {src.id}: {src.title}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta row */}
                <div className={cn('flex items-center gap-2 px-1', msg.role === 'user' && 'flex-row-reverse')}>
                  {msg.sourceType && msg.sourceType !== 'none' && <SourceBadge source={msg.sourceType} />}
                  <span className="text-2xs text-muted-foreground font-mono">{formatDateTime(msg.timestamp)}</span>
                </div>

                {/* Followup suggestion chips */}
                {msg.suggestions && msg.role === 'assistant' && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {msg.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        disabled={isTyping}
                        className="text-2xs px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-3xl animate-fade-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Brain className="h-4 w-4" />
              </div>
              <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error Message with Retry */}
          {errorMessage && (
            <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs flex items-center justify-between max-w-3xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-2xs" onClick={() => sendMessage(messages[messages.length - 1]?.content)}>
                <RotateCcw className="h-3 w-3 mr-1" /> Retry
              </Button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Empty State Prompt Cards (when 1 message in thread) */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-4xl mx-auto w-full">
            {PROMPT_CARDS.map(({ icon: Icon, label, prompt, description }) => (
              <button
                key={label}
                onClick={() => sendMessage(prompt)}
                className="flex items-start gap-3 rounded-xl border bg-card p-3 text-left hover:border-primary/40 hover:bg-muted/30 transition-all group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 text-primary transition-colors">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Input Bar with Shift+Enter Support */}
        <div className="border-t bg-card/60 p-4 shrink-0">
          <form
            className="flex gap-2 items-end max-w-4xl mx-auto"
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          >
            <Textarea
              placeholder="Ask about tickets, runbooks, metrics, or error root-causes… (Shift+Enter for newline)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              rows={2}
              disabled={isTyping}
              aria-label="AI assistant input"
              className="flex-1 resize-none text-xs rounded-xl shadow-inner"
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-2xs text-muted-foreground text-center mt-2 font-mono">
            CaseMind AI Copilot · Powered by Enterprise RAG & Organizational Memory Engine
          </p>
        </div>
      </div>
    </div>
  )
}
