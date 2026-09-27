import { useMemo, useState } from 'react'
import { BookOpen, Brain, Check, CheckCircle2, Copy, Database, FileText, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers'
import { EmptyState } from '@/components/common'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Textarea } from '@/components/ui'
import { useDocuments } from '@/features/documents/hooks/useDocuments'
import { useCreateMemoryItem, useDeleteMemoryItem, useMemoryItems, useVerifyMemoryItem } from '@/features/memory/hooks/useMemoryItems'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { hasPermission } from '@/permissions'
import type { MemoryItem, MemoryItemType } from '@/types'
import { formatDate, formatRelative } from '@/utils'
import type { LucideIcon } from 'lucide-react'


const memoryTypeLabels: Record<MemoryItemType, string> = {
  issue_pattern: 'Issue pattern', root_cause: 'Root cause', resolution: 'Resolution', workaround: 'Workaround', known_limitation: 'Known limitation', troubleshooting: 'Troubleshooting', incident_insight: 'Incident insight',
}

interface MemoryDraft {
  title: string
  summary: string
  memoryType: MemoryItemType
  issuePattern: string
  rootCause: string
  resolutionSteps: string
  tags: string
  category: string
  source: string
}

const emptyDraft: MemoryDraft = { title: '', summary: '', memoryType: 'issue_pattern', issuePattern: '', rootCause: '', resolutionSteps: '', tags: '', category: '', source: '' }

export function MemoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreate = Boolean(user && hasPermission(user, 'memory.create'))
  const canManage = Boolean(user && hasPermission(user, 'memory.manage'))
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MemoryItem | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState<MemoryDraft>(emptyDraft)
  const [formError, setFormError] = useState('')
  const [copiedStep, setCopiedStep] = useState<number | null>(null)
  const { data, isLoading, isError, refetch } = useMemoryItems(search)
  const cases = useTickets({ pageSize: 100 })
  const documents = useDocuments()
  const createMemory = useCreateMemoryItem()
  const verifyMemory = useVerifyMemoryItem()
  const deleteMemory = useDeleteMemoryItem()

  const stats = useMemo(() => ({
    total: data?.total ?? 0,
    verified: data?.data.filter((item) => item.verificationState === 'verified').length ?? 0,
    drafts: data?.data.filter((item) => item.verificationState === 'draft').length ?? 0,
    evidence: data?.data.reduce((sum, item) => sum + item.sources.length, 0) ?? 0,
  }), [data])
  const statCards: Array<{ label: string; value: number; icon: LucideIcon }> = [
    { label: 'Memory items', value: stats.total, icon: Database },
    { label: 'Verified', value: stats.verified, icon: ShieldCheck },
    { label: 'Awaiting review', value: stats.drafts, icon: Brain },
    { label: 'Evidence links', value: stats.evidence, icon: BookOpen },
  ]

  const updateDraft = (field: keyof MemoryDraft, value: string) => { setDraft((current) => ({ ...current, [field]: value })); setFormError('') }

  const submitMemory = async () => {
    setFormError('')
    const [sourceType, sourceId] = draft.source.split(':')
    if (draft.title.trim().length < 5 || draft.summary.trim().length < 20 || draft.issuePattern.trim().length < 20 || !sourceId) {
      setFormError('Add a title, a meaningful summary and issue pattern, and at least one evidence source.')
      return
    }
    try {
      await createMemory.mutateAsync({
        title: draft.title,
        summary: draft.summary,
        memoryType: draft.memoryType,
        issuePattern: draft.issuePattern,
        rootCause: draft.rootCause || undefined,
        resolutionSteps: draft.resolutionSteps.split('\n').map((step) => step.trim()).filter(Boolean),
        tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        category: draft.category || undefined,
        sourceType: sourceType as 'case' | 'document',
        sourceId,
      })
      setCreateOpen(false)
      setDraft(emptyDraft)
    } catch (error) {
      setFormError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Unable to create memory.')
    }
  }

  const verify = async (item: MemoryItem) => {
    const updated = await verifyMemory.mutateAsync(item.id)
    setSelected(updated)
  }

  const remove = async (item: MemoryItem) => {
    if (!window.confirm(`Archive “${item.title}”?`)) return
    await deleteMemory.mutateAsync(item.id)
    setSelected(null)
  }

  const openSource = (item: MemoryItem, sourceIndex: number) => {
    const source = item.sources[sourceIndex]
    if (source.sourceType === 'case') navigate(`/tickets/${source.sourceId}`)
    else navigate('/documents')
    setSelected(null)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.04] p-6">
        <div data-tour="memory-intro" className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Database className="h-3.5 w-3.5" />Organizational Memory</div><h1 className="mt-4 text-2xl font-bold tracking-tight">Lessons your team can reuse</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">CaseMind saves useful lessons from previous work so your team does not have to solve the same problem from scratch. Drafts stay separate until someone reviews them.</p></div>{canCreate && <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Add a lesson</Button>}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div><Icon className="h-5 w-5 text-primary" /></CardContent></Card>)}
      </div>

      <div data-tour="memory-filters" className="relative max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search known solutions, causes, or workarounds" /></div>

      {isLoading && <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-60 rounded-lg" />)}</div>}
      {isError && <Card><CardContent className="py-12 text-center"><p className="text-sm font-medium">Organizational Memory could not be loaded.</p><Button className="mt-4" size="sm" variant="outline" onClick={() => refetch()}>Try again</Button></CardContent></Card>}
      {!isLoading && !isError && !data?.data.length && <Card><EmptyState icon={Database} title={search ? 'No matching memory' : 'No organizational memory yet'} description={search ? 'Try broader terms.' : 'Create the first evidence-linked memory from a resolved Case or trusted Document.'} action={canCreate && !search ? { label: 'Create first memory', onClick: () => setCreateOpen(true) } : undefined} /></Card>}

      <div className="grid gap-4 md:grid-cols-2">{data?.data.map((item) => (
        <Card key={item.id} className="cursor-pointer transition-colors hover:border-primary/35" onClick={() => setSelected(item)}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><Badge variant="secondary">{memoryTypeLabels[item.memoryType]}</Badge><Badge variant={item.verificationState === 'verified' ? 'success' : item.verificationState === 'deprecated' ? 'destructive' : 'warning'}>{item.verificationState}</Badge></div><CardTitle className="mt-3 text-base leading-6">{item.title}</CardTitle></div>{item.verificationState === 'verified' && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />}</div></CardHeader><CardContent><p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{item.summary}</p>{item.rootCause && <div className="mt-4 rounded-md border bg-muted/30 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Root cause</p><p className="mt-1 line-clamp-2 text-xs leading-5">{item.rootCause}</p></div>}<div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span>{item.sources.length} source{item.sources.length === 1 ? '' : 's'}</span><span>Updated {formatRelative(item.updatedAt)}</span></div></CardContent></Card>
      ))}</div>

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setFormError(''); setDraft(emptyDraft) } }}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Create organizational memory</DialogTitle><DialogDescription>Capture a reusable insight from evidence. New entries remain drafts until a manager verifies them.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm sm:col-span-2">Title <span className="text-destructive">*</span><Input value={draft.title} aria-invalid={Boolean(formError && draft.title.trim().length < 5)} onChange={(event) => updateDraft('title', event.target.value)} placeholder="Certificate rotation invalidates cached SSO metadata" /></label>
        <label className="space-y-1.5 text-sm">Memory type<Select value={draft.memoryType} onValueChange={(value) => updateDraft('memoryType', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(memoryTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
        <label className="space-y-1.5 text-sm">Category<Input value={draft.category} onChange={(event) => updateDraft('category', event.target.value)} placeholder="authentication" /></label>
        <label className="space-y-1.5 text-sm sm:col-span-2">Summary <span className="text-destructive">*</span><Textarea value={draft.summary} aria-invalid={Boolean(formError && draft.summary.trim().length < 20)} onChange={(event) => updateDraft('summary', event.target.value)} placeholder="Explain the reusable insight and when it matters." /></label>
        <label className="space-y-1.5 text-sm sm:col-span-2">Issue pattern <span className="text-destructive">*</span><Textarea value={draft.issuePattern} aria-invalid={Boolean(formError && draft.issuePattern.trim().length < 20)} onChange={(event) => updateDraft('issuePattern', event.target.value)} placeholder="Describe symptoms, triggers, and affected behavior." /></label>
        <label className="space-y-1.5 text-sm sm:col-span-2">Root cause <span className="text-muted-foreground">(optional)</span><Textarea value={draft.rootCause} onChange={(event) => updateDraft('rootCause', event.target.value)} placeholder="Record a validated cause, not a guess." /></label>
        <label className="space-y-1.5 text-sm sm:col-span-2">Resolution steps <span className="text-muted-foreground">(one per line)</span><Textarea value={draft.resolutionSteps} onChange={(event) => updateDraft('resolutionSteps', event.target.value)} placeholder={'Refresh service-provider metadata\nVerify the audience URI\nTest with a non-production account'} /></label>
        <label className="space-y-1.5 text-sm">Tags<Input value={draft.tags} onChange={(event) => updateDraft('tags', event.target.value)} placeholder="sso, certificate, saml" /></label>
        <label className="space-y-1.5 text-sm">Evidence source <span className="text-destructive">*</span><Select value={draft.source} onValueChange={(value) => updateDraft('source', value)}><SelectTrigger aria-invalid={Boolean(formError && !draft.source)}><SelectValue placeholder="Select a Case or Document" /></SelectTrigger><SelectContent>{cases.data?.data.map((item) => <SelectItem key={`case:${item.id}`} value={`case:${item.id}`}>Case · {item.title}</SelectItem>)}{documents.data?.data.map((item) => <SelectItem key={`document:${item.id}`} value={`document:${item.id}`}>Document · {item.originalFilename}</SelectItem>)}</SelectContent></Select></label>
        {formError && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive sm:col-span-2" role="alert">{formError}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2"><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={submitMemory} loading={createMemory.isPending}>Save draft</Button></div>
      </div></DialogContent></Dialog>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">{selected && <><DialogHeader><div className="mb-2 flex gap-2"><Badge variant="secondary">{memoryTypeLabels[selected.memoryType]}</Badge><Badge variant={selected.verificationState === 'verified' ? 'success' : 'warning'}>{selected.verificationState}</Badge></div><DialogTitle>{selected.title}</DialogTitle><DialogDescription>Created by {selected.createdByName} · Updated {formatRelative(selected.updatedAt)}</DialogDescription></DialogHeader><div className="space-y-5 text-sm"><section><h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</h3><p className="mt-2 leading-6">{selected.summary}</p></section><section><h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue pattern</h3><p className="mt-2 rounded-lg border bg-muted/20 p-3 leading-6">{selected.issuePattern}</p></section>{selected.rootCause && <section><h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Root cause</h3><p className="mt-2 rounded-lg border border-primary/20 bg-primary/[0.03] p-3 leading-6">{selected.rootCause}</p></section>}{selected.resolutionSteps.length > 0 && <section><h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resolution steps</h3><div className="mt-2 space-y-2">{selected.resolutionSteps.map((step, index) => <button key={`${step}-${index}`} onClick={() => { navigator.clipboard.writeText(step); setCopiedStep(index); setTimeout(() => setCopiedStep(null), 1500) }} className="flex w-full items-start gap-3 rounded-lg border p-3 text-left hover:bg-muted/30"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">{index + 1}</span><span className="flex-1 text-xs leading-5">{step}</span>{copiedStep === index ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}</button>)}</div></section>}<section><h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence</h3><div className="mt-2 space-y-2">{selected.sources.map((source, index) => <button key={source.id} onClick={() => openSource(selected, index)} className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:border-primary/30"><FileText className="h-4 w-4 text-primary" /><span className="flex-1 text-xs font-medium">{source.sourceTitle}</span><Badge variant="outline">{source.sourceType}</Badge></button>)}</div></section>{selected.verificationState === 'verified' && <div className="rounded-lg border border-success/25 bg-success/5 p-3 text-xs"><p className="font-semibold text-success">Human verified</p><p className="mt-1 text-muted-foreground">Validated by {selected.verifiedByName} on {selected.lastValidatedAt ? formatDate(selected.lastValidatedAt) : 'an unknown date'}.</p></div>}<div className="flex justify-end gap-2 border-t pt-4">{canManage && <Button variant="destructive" size="sm" onClick={() => remove(selected)} loading={deleteMemory.isPending}><Trash2 className="h-4 w-4" />Archive</Button>}{canManage && selected.verificationState !== 'verified' && <Button size="sm" onClick={() => verify(selected)} loading={verifyMemory.isPending}><ShieldCheck className="h-4 w-4" />Verify memory</Button>}</div></div></>}</DialogContent></Dialog>
    </div>
  )
}
