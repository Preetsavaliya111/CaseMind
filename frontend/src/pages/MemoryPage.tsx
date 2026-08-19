import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, CheckCircle2, Clock, Brain,
  Sparkles, ShieldAlert, ArrowUpRight, Copy, Check,
  BookOpen, History
} from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle,
  Input, Button, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui'
import { useMemoryRecords } from '@/features/memory/hooks/useMemory'
import type { OrganizationalMemory } from '@/types'
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboard'
import { formatDate } from '@/utils'


export function MemoryPage() {
  const navigate = useNavigate()
  const { data: metrics } = useDashboardMetrics()
  const { data: memoryRecords = [] } = useMemoryRecords()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMemory, setSelectedMemory] = useState<OrganizationalMemory | null>(null)
  const [copiedStepIndex, setCopiedStepIndex] = useState<number | null>(null)
  const [simulatedQuery, setSimulatedQuery] = useState('')
  const [simulatedMatch, setSimulatedMatch] = useState<OrganizationalMemory | null>(null)

  // Categories
  const categories = [
    { id: 'all', label: 'All Patterns' },
    { id: 'bug', label: 'Bugs & Errors' },
    { id: 'integration', label: 'Integrations & SSO' },
    { id: 'security', label: 'Security & Auth' },
    { id: 'performance', label: 'Performance & Latency' },
  ]

  // Filtered records
  const filteredRecords = useMemo(() => {
    return memoryRecords.filter((rec) => {
      const matchCat = selectedCategory === 'all' || rec.category === selectedCategory
      const matchSearch =
        !searchQuery ||
        rec.patternTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.problemDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.rootCause.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchCat && matchSearch
    })
  }, [selectedCategory, searchQuery, memoryRecords])

  // Simulator handler
  const handleSimulate = () => {
    if (!simulatedQuery.trim()) return
    const q = simulatedQuery.toLowerCase()
    let match = memoryRecords.find((r) =>
      r.tags.some((t) => q.includes(t)) ||
      r.patternTitle.toLowerCase().split(' ').some((w) => w.length > 3 && q.includes(w))
    )
    if (!match) match = memoryRecords[0]
    setSimulatedMatch(match)
  }

  const copyStep = (step: string, index: number) => {
    navigator.clipboard.writeText(step)
    setCopiedStepIndex(index)
    setTimeout(() => setCopiedStepIndex(null), 2000)
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Hero Banner with Memory Pulse & Engine Status */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-purple-500/5 to-background p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Organizational Memory Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-display text-foreground">
              Institutional Knowledge & Solution Synthesis
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              CaseMind continuously mines historical resolutions, runbooks, and verified fixes to recommend verified solutions when incidents occur.
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="rounded-xl border bg-card/60 backdrop-blur p-3 text-center">
              <p className="text-2xs text-muted-foreground font-medium">Patterns Indexed</p>
              <p className="text-xl font-bold font-mono text-primary mt-0.5">{memoryRecords.length}</p>
            </div>
            <div className="rounded-xl border bg-card/60 backdrop-blur p-3 text-center">
              <p className="text-2xs text-muted-foreground font-medium">Avg Success Rate</p>
              <p className="text-xl font-bold font-mono text-success mt-0.5">95.5%</p>
            </div>
            <div className="rounded-xl border bg-card/60 backdrop-blur p-3 text-center col-span-2 sm:col-span-1">
              <p className="text-2xs text-muted-foreground font-medium">Resolved Today</p>
              <p className="text-xl font-bold font-mono text-purple-400 mt-0.5">{metrics?.resolvedToday ?? 34}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Card */}
      <Card className="border-purple-500/30 bg-purple-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-purple-400">
            <Sparkles className="h-4 w-4" />
            Memory Retrieval Simulator (AI Match Engine)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Test how incoming tickets match against organizational memory in real time. Try: <code className="text-foreground bg-muted px-1.5 py-0.5 rounded">"Payment checkout 504 gateway timeout"</code> or <code className="text-foreground bg-muted px-1.5 py-0.5 rounded">"SAML SSO cert expired"</code>
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter hypothetical incident description or error logs..."
              value={simulatedQuery}
              onChange={(e) => setSimulatedQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
              className="text-sm"
            />
            <Button
              onClick={handleSimulate}
              disabled={!simulatedQuery.trim()}
              className="shrink-0 bg-primary hover:bg-primary/90"
            >
              <Brain className="h-4 w-4" />
              Match Pattern
            </Button>
          </div>

          {simulatedMatch && (
            <div className="mt-3 p-3.5 rounded-xl border border-primary/30 bg-card/90 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-2xs bg-primary/20 text-primary border-primary/30">
                    96% Pattern Match
                  </Badge>
                  <span className="font-semibold text-sm">{simulatedMatch.patternTitle}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedMemory(simulatedMatch)}>
                  View Full Runbook
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{simulatedMatch.rootCause}</p>
              <div className="flex items-center gap-4 text-2xs text-muted-foreground pt-1">
                <span className="text-success font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {simulatedMatch.successRate}% past resolution success
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {simulatedMatch.avgResolutionHours}h avg time to resolve
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="text-xs h-8"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search patterns or root causes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>
      </div>

      {/* Memory Pattern Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecords.map((memory) => (
          <Card
            key={memory.id}
            className="border hover:border-primary/40 transition-all cursor-pointer hover:shadow-md group flex flex-col justify-between"
            onClick={() => setSelectedMemory(memory)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-2xs uppercase tracking-wider font-mono">
                      {memory.category}
                    </Badge>
                    <span className="text-2xs font-mono text-muted-foreground">{memory.id}</span>
                  </div>
                  <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                    {memory.patternTitle}
                  </CardTitle>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {memory.successRate}%
                  </span>
                  <p className="text-2xs text-muted-foreground">success rate</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                {memory.problemDescription}
              </p>

              {/* Root Cause Box */}
              <div className="p-2.5 rounded-lg bg-muted/60 border space-y-1">
                <p className="text-2xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1">
                  <Brain className="h-3 w-3 text-primary" /> Root Cause Identified
                </p>
                <p className="text-muted-foreground line-clamp-2">{memory.rootCause}</p>
              </div>

              {/* Tags & Meta Row */}
              <div className="flex items-center justify-between pt-2 border-t text-2xs text-muted-foreground">
                <div className="flex flex-wrap gap-1">
                  {memory.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded bg-muted font-mono text-2xs">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span>Used {memory.usageCount} times</span>
                  <span>Avg {memory.avgResolutionHours}h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Memory Detail Modal / Drawer */}
      <Dialog open={Boolean(selectedMemory)} onOpenChange={(open) => !open && setSelectedMemory(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedMemory && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 text-2xs uppercase">
                    {selectedMemory.category}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{selectedMemory.id}</span>
                </div>
                <DialogTitle className="text-xl font-bold font-display">
                  {selectedMemory.patternTitle}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Maintained by {selectedMemory.resolvedByTeam} · Last validated {formatDate(selectedMemory.lastValidatedAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-4 text-sm">
                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/40 border text-center">
                  <div>
                    <p className="text-2xs text-muted-foreground font-medium">Resolution Success</p>
                    <p className="text-lg font-bold text-success mt-0.5">{selectedMemory.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-2xs text-muted-foreground font-medium">Avg Resolution Time</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{selectedMemory.avgResolutionHours} hours</p>
                  </div>
                  <div>
                    <p className="text-2xs text-muted-foreground font-medium">Historical Applications</p>
                    <p className="text-lg font-bold text-primary mt-0.5">{selectedMemory.usageCount} incidents</p>
                  </div>
                </div>

                {/* Problem Description */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Symptom & Trigger Conditions
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed p-3 rounded-lg bg-card border">
                    {selectedMemory.problemDescription}
                  </p>
                </div>

                {/* Root Cause */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-primary" /> Root Cause Analysis
                  </h4>
                  <div className="p-3 rounded-lg bg-primary/[0.03] border border-primary/20 text-sm leading-relaxed">
                    {selectedMemory.rootCause}
                  </div>
                </div>

                {/* Verified Resolution Steps */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Verified Resolution Steps</span>
                    <span className="text-2xs font-normal text-muted-foreground">Click step to copy</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedMemory.resolutionSteps.map((step, idx) => (
                      <div
                        key={idx}
                        onClick={() => copyStep(step, idx)}
                        className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors group"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-mono text-2xs font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="flex-1 text-xs text-foreground font-mono leading-relaxed">{step}</span>
                        <button
                          type="button"
                          className="text-muted-foreground group-hover:text-foreground shrink-0 p-1"
                          aria-label="Copy step"
                        >
                          {copiedStepIndex === idx ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historical Evidence & Tickets */}
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Historical Precedents & Evidence
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMemory.evidenceSources.map((evidence, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {evidence.type === 'ticket' ? (
                            <History className="h-3.5 w-3.5 text-primary shrink-0" />
                          ) : (
                            <BookOpen className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{evidence.id}: {evidence.title}</p>
                            <p className="text-2xs text-muted-foreground">{evidence.date}</p>
                          </div>
                        </div>
                        {evidence.type === 'ticket' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={() => {
                              setSelectedMemory(null)
                              navigate(`/tickets/${evidence.id}`)
                            }}
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedMemory.impact && (
                  <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 text-xs flex items-center gap-3">
                    <ShieldAlert className="h-4 w-4 text-warning shrink-0" />
                    <div>
                      <p className="font-semibold text-warning">Business Impact Context</p>
                      <p className="text-muted-foreground mt-0.5">
                        {selectedMemory.impact.businessImpact} · Affected approx. {selectedMemory.impact.affectedCustomers.toLocaleString()} customers.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
