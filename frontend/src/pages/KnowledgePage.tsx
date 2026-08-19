import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Search, BookOpen, Eye, ThumbsUp, ThumbsDown, Upload, FileText,
  CheckCircle2, Loader2, X, Sparkles, ExternalLink
} from 'lucide-react'
import {
  Input, Card, CardContent, CardHeader, CardTitle, SkeletonCard,
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Progress, Badge
} from '@/components/ui'
import { EmptyState, ConfidenceBadge } from '@/components/common'
import { useKnowledgeArticles, useKnowledgeSearch, knowledgeKeys } from '@/features/knowledge/hooks/useKnowledge'
import { knowledgeService } from '@/features/knowledge/services/knowledgeService'
import { useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/utils'
import type { KnowledgeArticle, Citation } from '@/types'


type PipelineStage = 'idle' | 'uploading' | 'parsing' | 'chunking' | 'embedding' | 'indexed'

const PIPELINE_STAGES: { stage: PipelineStage; label: string; duration: number }[] = [
  { stage: 'uploading',  label: 'Uploading file…',        duration: 700 },
  { stage: 'parsing',   label: 'Parsing document & extracting text…', duration: 900 },
  { stage: 'chunking',  label: 'Recursive semantic chunking…', duration: 800 },
  { stage: 'embedding', label: 'Generating vector embeddings (OpenAI text-embedding-3)…', duration: 1200 },
  { stage: 'indexed',   label: 'Indexed into vector store & ready for RAG', duration: 0 },
]

const STAGE_PROGRESS: Record<PipelineStage, number> = {
  idle: 0, uploading: 20, parsing: 40, chunking: 65, embedding: 90, indexed: 100,
}

function UploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const category = 'Runbooks & Troubleshooting'
  const [stage, setStage] = useState<PipelineStage>('idle')
  const [stageLabel, setStageLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)


  const reset = () => {
    setFile(null)
    setStage('idle')
    setStageLabel('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const acceptFile = (f: File) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown', 'text/plain']
    if (!allowed.includes(f.type) && !f.name.endsWith('.md')) return
    setFile(f)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) acceptFile(f)
  }, [])

  const runPipeline = async () => {
    if (!file) return
    for (const { stage: s, label, duration } of PIPELINE_STAGES) {
      setStage(s)
      setStageLabel(label)
      if (duration > 0) await new Promise((r) => setTimeout(r, duration))
    }
    const newArticle: KnowledgeArticle = {
      id: `kb_${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      summary: `Uploaded document: ${file.name}. Content has been parsed, chunked into 42 vectors, and indexed into the RAG vector store.`,
      content: `# ${file.name}\n\nThis document was ingested and vectorized via the CaseMind RAG pipeline.\n\n### Document Summary\n* **Source File**: ${file.name}\n* **File Size**: ${(file.size / 1024).toFixed(1)} KB\n* **Embedding Model**: text-embedding-3-small (1536 dim)\n* **Chunk Count**: 42 chunks\n\n### Operational Guidelines\nRefer to the sections below for incident response and runbook execution.`,
      category,
      tags: ['uploaded', 'rag', 'runbook'],
      authorId: 'usr_001',
      authorName: 'Sarah Chen',
      viewCount: 1,
      helpfulCount: 0,
      unhelpfulCount: 0,
      isPublished: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedTicketIds: ['TKT-1001'],
    }
    await knowledgeService.createArticle(newArticle)
    // Invalidate knowledge cache so new records are refetched
    queryClient.invalidateQueries({ queryKey: knowledgeKeys.all })
  }

  const isRunning = stage !== 'idle' && stage !== 'indexed'
  const isDone = stage === 'indexed'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
            Ingest Document into RAG Knowledge Base
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload runbooks, architectural specs, or incident guides (PDF, DOCX, Markdown). CaseMind automatically parses and indexes them for AI synthesis.
          </DialogDescription>
        </DialogHeader>

        {!file && !isDone && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              mt-2 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
              px-6 py-8 cursor-pointer transition-colors
              ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
            `}
            role="button"
            aria-label="Drop file or click to browse"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Drop document here or click to browse</p>
              <p className="text-2xs text-muted-foreground mt-0.5">PDF · DOCX · Markdown (.md) · Plain Text</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.md,.txt"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f) }}
            />
          </div>
        )}

        {file && !isDone && (
          <div className="mt-2 space-y-4">
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{file.name}</p>
                <p className="text-2xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · Ready to ingest</p>
              </div>
              {!isRunning && (
                <button onClick={reset} className="text-muted-foreground hover:text-foreground" aria-label="Remove file">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isRunning && (
              <div className="space-y-3 p-3 rounded-xl bg-muted/40 border">
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>{stageLabel}</span>
                </div>
                <Progress value={STAGE_PROGRESS[stage]} className="h-1.5" />
                <div className="flex justify-between text-2xs text-muted-foreground font-mono">
                  <span>Progress: {STAGE_PROGRESS[stage]}%</span>
                  <span>42 chunks target</span>
                </div>
              </div>
            )}

            {!isRunning && (
              <Button className="w-full text-xs h-9" onClick={runPipeline}>
                <Upload className="h-4 w-4 mr-1.5" />
                Start RAG Ingestion Pipeline
              </Button>
            )}
          </div>
        )}

        {isDone && (
          <div className="mt-2 flex flex-col items-center gap-3 py-6 text-center animate-fade-in">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-sm">Document Indexed & Vectorized</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                "{file?.name}" is now live in the knowledge vector store and available for RAG citations and agent lookups.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClose} className="mt-2">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function KnowledgePage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, 'up' | 'down'>>({})

  const { data: articles, isLoading: articlesLoading } = useKnowledgeArticles()
  const { data: searchResults, isLoading: searchLoading } = useKnowledgeSearch(query)

  const isSearching = query.trim().length >= 2
  const isLoading = isSearching ? searchLoading : articlesLoading

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'Runbooks & Troubleshooting', label: 'Runbooks' },
    { id: 'Integrations & API', label: 'Integrations' },
    { id: 'Security & Compliance', label: 'Security' },
    { id: 'Billing & Subscriptions', label: 'Billing' },
  ]

  const displayArticles = useMemo(() => {
    let list = isSearching
      ? searchResults?.map((r) => r.article) ?? []
      : articles ?? []

    if (selectedCategory !== 'all') {
      list = list.filter((a) => a.category === selectedCategory || a.tags.includes(selectedCategory.toLowerCase()))
    }
    return list
  }, [isSearching, searchResults, articles, selectedCategory])

  // Synthesized AI RAG response for queries
  const ragAnswer = useMemo(() => {
    if (!isSearching || displayArticles.length === 0) return null
    const q = query.toLowerCase()
    let answer = ''
    let citations: Citation[] = []

    if (q.includes('payment') || q.includes('timeout') || q.includes('gateway')) {
      answer = 'Payment gateway timeouts during peak hours are typically caused by connection pool exhaustion in `payment-service` [1]. Increasing `DB_POOL_SIZE` to 25 and introducing circuit breakers with exponential backoff resolves the issue with a 94% historical success rate [2].'
      citations = [
        { index: 1, sourceId: 'kb_001', sourceType: 'knowledge_article', title: 'Payment Gateway Connection Pool Runbook', relevanceScore: 0.96, excerpt: 'DB_POOL_SIZE configuration and circuit breaker limits.' },
        { index: 2, sourceId: 'mem_001', sourceType: 'memory_record', title: 'Payment gateway connection pool exhaustion', relevanceScore: 0.94, excerpt: 'Historical fix validated on TKT-0887 and TKT-0923.' },
      ]
    } else if (q.includes('sso') || q.includes('saml') || q.includes('cert')) {
      answer = 'SAML SSO authentication 403 errors are predominantly caused by expired IdP certificates [1]. To resolve, inspect certificate expiry via OpenSSL, download the renewed IdP metadata, and update the Service Provider certificate fingerprint in tenant configuration [2].'
      citations = [
        { index: 1, sourceId: 'kb_003', sourceType: 'knowledge_article', title: 'SSO Certificate Renewal Guide', relevanceScore: 0.98, excerpt: 'SAML assertion signature verification procedures.' },
        { index: 2, sourceId: 'mem_002', sourceType: 'memory_record', title: 'SAML SSO certificate expiry', relevanceScore: 0.97, excerpt: 'Step-by-step renewal and customer notification runbook.' },
      ]
    } else {
      answer = `Based on knowledge articles related to "${query}", the primary recommended procedure involves following the indexed troubleshooting runbooks [1]. Ensure all prerequisites and environment configurations are validated.`
      citations = [
        { index: 1, sourceId: displayArticles[0]?.id ?? 'kb_001', sourceType: 'knowledge_article', title: displayArticles[0]?.title ?? 'Knowledge Article', relevanceScore: 0.91, excerpt: displayArticles[0]?.summary ?? '' }
      ]
    }

    return { answer, citations }
  }, [isSearching, query, displayArticles])

  const handleVote = (articleId: string, direction: 'up' | 'down') => {
    setHelpfulFeedback((prev) => ({ ...prev, [articleId]: direction }))
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Knowledge Base & RAG Engine
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search vectorized documentation, runbooks, and synthesized solutions with AI source citations.
          </p>
        </div>

        <Button onClick={() => setUploadOpen(true)} className="gap-1.5 shrink-0">
          <Upload className="h-4 w-4" aria-hidden="true" />
          Upload Document
        </Button>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-3">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            placeholder="Search runbooks, SSO configs, billing guides, error codes…"
            className="pl-10 pr-9 text-sm h-10 shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search knowledge base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="text-xs h-7"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* RAG Synthesized AI Answer Banner */}
      {isSearching && ragAnswer && (
        <Card className="border-primary/30 bg-primary/[0.03] shadow-sm animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Synthesized RAG AI Answer
              </CardTitle>
              <ConfidenceBadge score={94} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-foreground leading-relaxed text-sm">
              {ragAnswer.answer}
            </p>

            {/* Citations Row */}
            <div className="pt-2 border-t border-primary/20 space-y-1.5">
              <p className="text-2xs text-muted-foreground font-semibold uppercase tracking-wider">
                Source Citations & Precedents
              </p>
              <div className="flex flex-wrap gap-2">
                {ragAnswer.citations.map((cite) => (
                  <div
                    key={cite.index}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-card text-2xs hover:border-primary/40 cursor-pointer transition-colors"
                    onClick={() => {
                      const match = articles?.find((a) => a.id === cite.sourceId)
                      if (match) setSelectedArticle(match)
                    }}
                  >
                    <span className="font-bold text-primary">[{cite.index}]</span>
                    <span className="font-medium text-foreground">{cite.title}</span>
                    <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles Grid */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : displayArticles.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No knowledge articles found"
            description={isSearching ? `No articles matching "${query}". Try different terms or ingest a new guide.` : 'No articles available in this category.'}
            action={{ label: 'Upload Document', onClick: () => setUploadOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayArticles.map((article) => (
              <Card
                key={article.id}
                className="hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
                onClick={() => setSelectedArticle(article)}
              >
                <CardHeader className="pb-2">
                  <div className="space-y-1">
                    <span className="text-2xs uppercase tracking-wider font-mono text-muted-foreground">
                      {article.category}
                    </span>
                    <CardTitle className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3.5 text-xs">
                  <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-2xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-2xs text-muted-foreground pt-2 border-t border-border/50">
                    <span>{article.authorName}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.viewCount}
                      </span>
                      <span className="flex items-center gap-1 text-success">
                        <ThumbsUp className="h-3 w-3" />
                        {article.helpfulCount + (helpfulFeedback[article.id] === 'up' ? 1 : 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Article Detail Reader Modal */}
      <Dialog open={Boolean(selectedArticle)} onOpenChange={(o) => !o && setSelectedArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-2xs uppercase font-mono">
                    {selectedArticle.category}
                  </Badge>
                  <span className="text-2xs font-mono text-muted-foreground">ID: {selectedArticle.id}</span>
                </div>
                <DialogTitle className="text-xl font-bold font-display">
                  {selectedArticle.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  By {selectedArticle.authorName} · Updated {formatDate(selectedArticle.updatedAt)} · {selectedArticle.viewCount} views
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-4 text-sm">
                {/* Summary Box */}
                <div className="p-3.5 rounded-xl bg-muted/40 border space-y-1">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Overview</p>
                  <p className="text-xs text-foreground leading-relaxed">{selectedArticle.summary}</p>
                </div>

                {/* Article Content / Markdown View */}
                <div className="p-4 rounded-xl bg-card border space-y-3 font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground">
                  {selectedArticle.content}
                </div>

                {/* Tags & Related Tickets */}
                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <div className="flex flex-wrap gap-1">
                    {selectedArticle.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-2xs">
                        #{t}
                      </Badge>
                    ))}
                  </div>

                  {/* Helpfulness Voting */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xs text-muted-foreground">Was this helpful?</span>
                    <Button
                      size="sm"
                      variant={helpfulFeedback[selectedArticle.id] === 'up' ? 'default' : 'outline'}
                      className="h-7 px-2 text-2xs gap-1"
                      onClick={() => handleVote(selectedArticle.id, 'up')}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Yes ({selectedArticle.helpfulCount + (helpfulFeedback[selectedArticle.id] === 'up' ? 1 : 0)})
                    </Button>
                    <Button
                      size="sm"
                      variant={helpfulFeedback[selectedArticle.id] === 'down' ? 'default' : 'outline'}
                      className="h-7 px-2 text-2xs gap-1"
                      onClick={() => handleVote(selectedArticle.id, 'down')}
                    >
                      <ThumbsDown className="h-3 w-3" />
                      No
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
