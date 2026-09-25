import { useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, File, FileArchive, FileText, RefreshCw, Search, Trash2, Upload, XCircle } from 'lucide-react'

import { EmptyState } from '@/components/common'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Progress, Skeleton } from '@/components/ui'
import { useAuth } from '@/app/providers'
import { hasPermission } from '@/permissions'
import { useDeleteDocument, useDocuments, useReprocessDocument, useUploadDocument } from '@/features/documents/hooks/useDocuments'
import type { DocumentStatus, SourceDocument } from '@/types'
import { formatRelative } from '@/utils'


const statusPresentation: Record<DocumentStatus, { label: string; variant: 'secondary' | 'warning' | 'success' | 'destructive' | 'info'; icon: typeof Clock3 }> = {
  uploaded: { label: 'Uploaded', variant: 'secondary', icon: Clock3 },
  processing: { label: 'Processing', variant: 'info', icon: RefreshCw },
  ready_for_indexing: { label: 'Ready for indexing', variant: 'warning', icon: AlertCircle },
  indexed: { label: 'Indexed', variant: 'success', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const presentation = statusPresentation[status]
  const Icon = presentation.icon
  return <Badge variant={presentation.variant} className="gap-1.5 whitespace-nowrap"><Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />{presentation.label}</Badge>
}

export function DocumentsPage() {
  const { user } = useAuth()
  const canManage = Boolean(user && hasPermission(user, 'documents.manage'))
  const { data, isLoading, isError, refetch } = useDocuments()
  const upload = useUploadDocument()
  const reprocess = useReprocessDocument()
  const remove = useDeleteDocument()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [search, setSearch] = useState('')
  const [actionError, setActionError] = useState('')

  const documents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (data?.data ?? []).filter((document) => !query || document.originalFilename.toLowerCase().includes(query))
  }, [data?.data, search])
  const counts = useMemo(() => ({
    indexed: (data?.data ?? []).filter((item) => item.status === 'indexed').length,
    pending: (data?.data ?? []).filter((item) => ['uploaded', 'processing', 'ready_for_indexing'].includes(item.status)).length,
    failed: (data?.data ?? []).filter((item) => item.status === 'failed').length,
  }), [data?.data])

  const submitUpload = async () => {
    if (!selectedFile) return
    setActionError('')
    setProgress(0)
    try {
      await upload.mutateAsync({ file: selectedFile, onProgress: setProgress })
      setUploadOpen(false)
      setSelectedFile(null)
      setProgress(0)
    } catch (error) {
      setActionError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Upload failed.')
    }
  }

  const handleReprocess = async (document: SourceDocument) => {
    setActionError('')
    try { await reprocess.mutateAsync(document.id) } catch (error) {
      setActionError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Unable to reprocess the document.')
    }
  }

  const handleDelete = async (document: SourceDocument) => {
    if (!window.confirm(`Remove ${document.originalFilename}? Its stored source and vector entries will be deleted.`)) return
    setActionError('')
    try { await remove.mutateAsync(document.id) } catch (error) {
      setActionError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Unable to remove the document.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Knowledge sources</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Documents</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Upload trusted source material, inspect its processing state, and know exactly what is available to retrieval.</p></div>
        {canManage && <Button onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" />Upload document</Button>}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs text-muted-foreground">Indexed sources</p><p className="mt-1 text-2xl font-semibold">{counts.indexed}</p></div><CheckCircle2 className="h-5 w-5 text-success" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs text-muted-foreground">In pipeline</p><p className="mt-1 text-2xl font-semibold">{counts.pending}</p></div><Clock3 className="h-5 w-5 text-warning" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs text-muted-foreground">Needs attention</p><p className="mt-1 text-2xl font-semibold">{counts.failed}</p></div><AlertCircle className="h-5 w-5 text-destructive" /></CardContent></Card>
      </div>

      {(data?.data ?? []).some((document) => document.status === 'ready_for_indexing') && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/25 bg-warning/5 p-4 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /><div><p className="font-medium">Some documents are extracted but not indexed</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Their text and chunks are ready. They will become searchable after an embedding provider is configured and reprocessing succeeds.</p></div></div>
      )}
      {actionError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{actionError}</div>}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b p-4"><CardTitle className="text-sm">Source library</CardTitle><div className="relative w-full max-w-xs"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents" className="pl-9" /></div></CardHeader>
        <CardContent className="p-0">
          {isLoading && <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16" />)}</div>}
          {isError && <div className="p-10 text-center"><AlertCircle className="mx-auto h-7 w-7 text-destructive" /><p className="mt-3 text-sm font-medium">Documents could not be loaded</p><Button className="mt-4" size="sm" variant="outline" onClick={() => refetch()}>Try again</Button></div>}
          {!isLoading && !isError && documents.length === 0 && <EmptyState icon={FileArchive} title={search ? 'No matching documents' : 'No documents yet'} description={search ? 'Try a different filename.' : 'Upload runbooks, guides, incident reports, or other trusted material to begin building retrievable knowledge.'} action={canManage && !search ? { label: 'Upload first document', onClick: () => setUploadOpen(true) } : undefined} />}
          {documents.length > 0 && <div className="divide-y">{documents.map((document) => (
            <div key={document.id} className="grid gap-3 p-4 hover:bg-muted/20 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="flex min-w-0 items-start gap-3"><div className="mt-0.5 rounded-md border bg-muted/40 p-2"><FileText className="h-4 w-4 text-primary" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium">{document.originalFilename}</p><DocumentStatusBadge status={document.status} /></div><p className="mt-1 text-xs text-muted-foreground">{formatBytes(document.sizeBytes)} · {document.chunkCount} chunks · Uploaded by {document.uploadedByName} {formatRelative(document.createdAt)}</p>{document.errorMessage && <p className="mt-1 text-xs text-destructive">{document.errorMessage}</p>}</div></div>
              {canManage && <div className="flex items-center gap-1 sm:justify-end"><Button size="sm" variant="ghost" disabled={reprocess.isPending || document.status === 'processing'} onClick={() => handleReprocess(document)}><RefreshCw className="h-3.5 w-3.5" />Reprocess</Button><Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(document)} aria-label={`Remove ${document.originalFilename}`}><Trash2 className="h-4 w-4" /></Button></div>}
            </div>
          ))}</div>}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) { setSelectedFile(null); setActionError(''); setProgress(0) } }}>
        <DialogContent><DialogHeader><DialogTitle>Upload a trusted source</DialogTitle><DialogDescription>PDF, TXT, Markdown, or DOCX up to 15 MB. Uploaded content is treated as untrusted evidence, never as system instructions.</DialogDescription></DialogHeader>
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg border border-dashed p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"><input ref={inputRef} className="hidden" type="file" accept=".pdf,.txt,.md,.docx" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /><File className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">{selectedFile?.name ?? 'Choose a document'}</p><p className="mt-1 text-xs text-muted-foreground">{selectedFile ? formatBytes(selectedFile.size) : 'The file is validated before it enters the processing pipeline.'}</p></button>
          {upload.isPending && <div className="space-y-2"><div className="flex justify-between text-xs text-muted-foreground"><span>Uploading</span><span>{progress}%</span></div><Progress value={progress} /></div>}
          {actionError && <p className="text-xs text-destructive" role="alert">{actionError}</p>}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setUploadOpen(false)} disabled={upload.isPending}>Cancel</Button><Button onClick={submitUpload} disabled={!selectedFile} loading={upload.isPending}>Upload and process</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
