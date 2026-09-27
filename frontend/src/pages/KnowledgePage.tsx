import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, CheckCircle2, FilePlus2, Search, ShieldCheck } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, SkeletonCard, Textarea } from '@/components/ui'
import { EmptyState } from '@/components/common'
import { knowledgeKeys, useKnowledgeArticles, useKnowledgeSearch } from '@/features/knowledge/hooks/useKnowledge'
import { knowledgeService } from '@/features/knowledge/services/knowledgeService'
import { usePermission } from '@/permissions'
import type { ApiError, KnowledgeArticle } from '@/types'
import { formatDate } from '@/utils'

const initialForm = { title: '', summary: '', content: '', category: 'Runbook', tags: '' }

export function KnowledgePage() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<KnowledgeArticle | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{ title?: string; summary?: string; content?: string; category?: string }>({})
  const canEdit = usePermission('knowledge.edit')
  const canPublish = usePermission('knowledge.delete')
  const queryClient = useQueryClient()
  const searching = query.trim().length >= 2
  const articlesQuery = useKnowledgeArticles()
  const searchQuery = useKnowledgeSearch(query.trim())
  const articles = searching ? searchQuery.data?.map((item) => item.article) ?? [] : articlesQuery.data ?? []
  const loading = searching ? searchQuery.isLoading : articlesQuery.isLoading
  const loadFailed = searching ? searchQuery.isError : articlesQuery.isError

  const createArticle = async () => {
    const nextErrors = {
      title: form.title.trim().length < 5 ? 'Title must be at least 5 characters.' : undefined,
      summary: form.summary.trim().length < 20 ? 'Summary must be at least 20 characters.' : undefined,
      content: form.content.trim().length < 30 ? 'Content must be at least 30 characters.' : undefined,
      category: form.category.trim().length < 2 ? 'Category is required.' : undefined,
    }
    if (Object.values(nextErrors).some(Boolean)) { setFormErrors(nextErrors); return }
    setSaving(true)
    setError(null)
    setFormErrors({})
    try {
      await knowledgeService.create({
        title: form.title.trim(), summary: form.summary.trim(), content: form.content.trim(), category: form.category.trim(),
        tags: form.tags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean),
      })
      await queryClient.invalidateQueries({ queryKey: knowledgeKeys.all })
      setForm(initialForm)
      setCreateOpen(false)
    } catch (caught) {
      setError((caught as ApiError).message || 'The article could not be created.')
    } finally { setSaving(false) }
  }

  const publish = async (article: KnowledgeArticle) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await knowledgeService.publish(article.id)
      setSelected(updated)
      await queryClient.invalidateQueries({ queryKey: knowledgeKeys.all })
    } catch (caught) { setError((caught as ApiError).message || 'The article could not be published.') }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div data-tour="knowledge-intro"><p className="text-2xs font-semibold uppercase tracking-[0.2em] text-primary">Trusted team guidance</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Knowledge</h1><p className="mt-1 text-sm text-muted-foreground">Keep reviewed guides, known issues, and internal procedures where both people and CaseMind can use them.</p></div>
        {canEdit && <Button onClick={() => setCreateOpen(true)}><FilePlus2 className="h-4 w-4" />New article</Button>}
      </div>

      <div data-tour="knowledge-search" className="relative max-w-2xl"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guides, known issues, or solutions…" aria-label="Search knowledge" /></div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>}
      {loadFailed && <div className="rounded-xl border p-8 text-center"><p className="text-sm font-medium">Knowledge could not be loaded.</p><Button className="mt-3" size="sm" variant="outline" onClick={() => searching ? searchQuery.refetch() : articlesQuery.refetch()}>Try again</Button></div>}
      {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}</div> : !loadFailed && articles.length === 0 ? (
        <EmptyState icon={BookOpen} title={searching ? 'No matching knowledge' : 'No knowledge articles yet'} description={searching ? 'Try broader search terms.' : 'Create a reviewed article or upload source documents to start building reusable knowledge.'} action={canEdit && !searching ? { label: 'Create article', onClick: () => setCreateOpen(true) } : undefined} />
      ) : !loadFailed && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{articles.map((article) => (
          <Card key={article.id} className="cursor-pointer transition-colors hover:border-primary/40" onClick={() => setSelected(article)}>
            <CardHeader className="pb-2"><div className="flex items-center justify-between gap-3"><Badge variant={article.isPublished ? 'success' : 'secondary'}>{article.state}</Badge><span className="text-2xs text-muted-foreground">v{article.version}</span></div><CardTitle className="pt-2 text-base leading-snug">{article.title}</CardTitle></CardHeader>
            <CardContent><p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{article.summary}</p><div className="mt-4 flex items-center justify-between border-t pt-3 text-2xs text-muted-foreground"><span>{article.category}</span><span>{formatDate(article.updatedAt)}</span></div></CardContent>
          </Card>
        ))}</div>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setForm(initialForm); setFormErrors({}); setError(null) } }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Create knowledge article</DialogTitle><DialogDescription>New articles start as drafts and require a manager to publish.</DialogDescription></DialogHeader><div className="space-y-4">
        <label className="block space-y-1.5 text-sm">Title <span className="text-destructive">*</span><Input placeholder="e.g. Restore access after SSO certificate rotation" value={form.title} aria-invalid={Boolean(formErrors.title)} onChange={(event) => { setForm({ ...form, title: event.target.value }); setFormErrors((current) => ({ ...current, title: undefined })) }} />{formErrors.title && <span className="block text-xs text-destructive" role="alert">{formErrors.title}</span>}</label>
        <label className="block space-y-1.5 text-sm">Summary <span className="text-destructive">*</span><Textarea placeholder="Concise guidance and when it applies" value={form.summary} aria-invalid={Boolean(formErrors.summary)} onChange={(event) => { setForm({ ...form, summary: event.target.value }); setFormErrors((current) => ({ ...current, summary: undefined })) }} rows={3} />{formErrors.summary && <span className="block text-xs text-destructive" role="alert">{formErrors.summary}</span>}</label>
        <label className="block space-y-1.5 text-sm">Article content <span className="text-destructive">*</span><Textarea placeholder="Reviewed procedure, explanation, or runbook content" value={form.content} aria-invalid={Boolean(formErrors.content)} onChange={(event) => { setForm({ ...form, content: event.target.value }); setFormErrors((current) => ({ ...current, content: undefined })) }} rows={8} className="resize-y" />{formErrors.content && <span className="block text-xs text-destructive" role="alert">{formErrors.content}</span>}</label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block space-y-1.5 text-sm">Category <span className="text-destructive">*</span><Input placeholder="Runbook" value={form.category} aria-invalid={Boolean(formErrors.category)} onChange={(event) => { setForm({ ...form, category: event.target.value }); setFormErrors((current) => ({ ...current, category: undefined })) }} />{formErrors.category && <span className="block text-xs text-destructive" role="alert">{formErrors.category}</span>}</label><label className="block space-y-1.5 text-sm">Tags <span className="text-muted-foreground">(optional)</span><Input placeholder="sso, access, identity" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></label></div>
        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button><Button loading={saving} onClick={createArticle}>Save draft</Button></div>
      </div></DialogContent></Dialog>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">{selected && <><DialogHeader><div className="flex items-center gap-2"><Badge variant={selected.isPublished ? 'success' : 'secondary'}>{selected.state}</Badge><span className="text-2xs text-muted-foreground">Version {selected.version}</span></div><DialogTitle className="text-xl">{selected.title}</DialogTitle><DialogDescription>By {selected.authorName} · Updated {formatDate(selected.updatedAt)}</DialogDescription></DialogHeader><div className="mt-4 space-y-4"><div className="rounded-xl border bg-muted/30 p-4 text-sm">{selected.summary}</div><article className="whitespace-pre-wrap rounded-xl border p-5 text-sm leading-7">{selected.content}</article><div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><div className="flex gap-1">{selected.tags.map((tag) => <Badge key={tag} variant="secondary">#{tag}</Badge>)}</div>{canPublish && !selected.isPublished && <Button loading={saving} onClick={() => publish(selected)}><CheckCircle2 className="h-4 w-4" />Publish reviewed article</Button>}</div>{selected.isPublished && <p className="flex items-center gap-2 text-xs text-success"><ShieldCheck className="h-4 w-4" />Available to the evidence workspace.</p>}</div></>}</DialogContent></Dialog>
    </div>
  )
}
