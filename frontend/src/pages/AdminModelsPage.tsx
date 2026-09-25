import { useEffect, useState } from 'react'
import { Brain, Database, KeyRound, ShieldCheck } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, SkeletonCard } from '@/components/ui'
import { adminService, type AIConfiguration } from '@/features/settings/services/adminService'
import type { ApiError } from '@/types'

export function AdminModelsPage() {
  const [config, setConfig] = useState<AIConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = () => { setLoading(true); setError(null); adminService.aiConfiguration().then(setConfig).catch((caught: ApiError) => setError(caught.message)).finally(() => setLoading(false)) }
  useEffect(load, [])
  if (loading) return <div className="mx-auto grid max-w-6xl gap-4 p-6 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)}</div>
  if (!config) return <div className="p-6 text-center"><p className="text-sm text-destructive">{error || 'Configuration could not be loaded.'}</p><Button className="mt-3" variant="outline" onClick={load}>Try again</Button></div>

  return <div className="mx-auto max-w-6xl space-y-6 p-6">
    <div><p className="text-2xs font-semibold uppercase tracking-[0.2em] text-primary">AI governance</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Provider & Retrieval Configuration</h1><p className="mt-1 text-sm text-muted-foreground">A safe, read-only view of server configuration. Credentials are never returned to the browser.</p></div>
    {!config.chat_configured && <div className="rounded-xl border border-warning/30 bg-warning/5 p-4"><p className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4 text-warning" />Provider credential pending</p><p className="mt-1 text-xs text-muted-foreground">Add the API key to the backend environment when ready, then reprocess documents that are waiting for indexing.</p></div>}
    <div className="grid gap-4 md:grid-cols-3"><ConfigCard icon={Brain} title="Answer generation" rows={[['Provider', config.chat_provider], ['Model', config.chat_model], ['Status', config.chat_configured ? 'Configured' : 'Not configured']]} ready={config.chat_configured} /><ConfigCard icon={ShieldCheck} title="Embeddings" rows={[['Provider', config.embedding_provider], ['Model', config.embedding_model], ['Status', config.embedding_configured ? 'Configured' : 'Not configured']]} ready={config.embedding_configured} /><ConfigCard icon={Database} title="Vector retrieval" rows={[['Store', config.vector_store], ['Collection', config.vector_collection], ['Tenant filter', 'Required']]} ready /></div>
    <Card><CardHeader><CardTitle className="text-sm">Security boundary</CardTitle></CardHeader><CardContent className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3"><p><strong className="block text-foreground">Secrets</strong>{config.secrets_location}</p><p><strong className="block text-foreground">Provider storage</strong>Responses are requested with storage disabled.</p><p><strong className="block text-foreground">Retrieval isolation</strong>SQL and vector queries require organization filters.</p></CardContent></Card>
  </div>
}

function ConfigCard({ icon: Icon, title, rows, ready }: { icon: typeof Brain; title: string; rows: [string, string][]; ready: boolean }) {
  return <Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle><Badge variant={ready ? 'success' : 'warning'}>{ready ? 'Ready' : 'Pending'}</Badge></div></CardHeader><CardContent className="space-y-3">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 border-b pb-2 text-xs last:border-0"><span className="text-muted-foreground">{label}</span><span className="truncate font-mono">{value}</span></div>)}</CardContent></Card>
}
