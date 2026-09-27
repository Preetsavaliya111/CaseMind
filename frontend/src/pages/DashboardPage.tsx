import { AlertTriangle, ArrowRight, BookOpen, Brain, CheckCircle2, Clock, Database, FileText, Ticket, Users, Flame, Activity, ShieldCheck, MessageSquare, Search, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, SkeletonCard, Button, Badge } from '@/components/ui'
import { EmptyState, PriorityBadge } from '@/components/common'
import { StatCard } from '@/components/common/StatCard'
import { TicketTrendChart } from '@/components/charts'
import { useDashboardOverview, useWorkspaceDashboard } from '@/features/dashboard/hooks/useDashboard'
import { formatDateTime } from '@/utils'
import { useAuth } from '@/app/providers'
import { hasPermission } from '@/permissions'
import { GettingStartedChecklist } from '@/features/onboarding/GettingStartedChecklist'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useDashboardOverview()
  const { data: workspace, isLoading: workspaceLoading } = useWorkspaceDashboard()
  const isCustomer = Boolean(user?.roles.includes('customer'))
  const canViewMemory = hasPermission(user, 'memory.view')
  const canViewDocuments = hasPermission(user, 'documents.view')
  const canCreateCases = hasPermission(user, 'tickets.create')

  if (isLoading || workspaceLoading) return <div className="mx-auto grid max-w-7xl gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}</div>
  if (isError || !data) return <div className="p-6"><EmptyState icon={AlertTriangle} title="Command Center unavailable" description="Operational data could not be loaded." action={{ label: 'Try again', onClick: () => refetch() }} /></div>

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div><p className="text-2xs font-semibold uppercase tracking-[0.2em] text-primary">{workspace?.role.replace(/_/g, ' ') ?? (isCustomer ? 'Your support workspace' : 'Live organization data')}</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name.split(' ')[0]}</h1><p className="mt-1 text-sm text-muted-foreground">Here’s what needs your attention today.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {canCreateCases && <QuickAction icon={Ticket} label="Create case" description="Record a customer issue" onClick={() => navigate('/tickets/new')} primary />}
        {hasPermission(user, 'chat.use') && <QuickAction icon={MessageSquare} label="Ask CaseMind" description="Get an answer with sources" onClick={() => navigate('/chat')} />}
        <QuickAction icon={Search} label="Search knowledge" description="Find proven guidance" onClick={() => navigate('/knowledge')} />
        {canViewDocuments && <QuickAction icon={Upload} label="Upload document" description="Add a trusted source" onClick={() => navigate('/documents')} />}
      </div>
      <GettingStartedChecklist data={data} />
      {workspace && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{workspace.metrics.map((metric, index) => { const icons = [Activity, Users, Flame, ShieldCheck]; const Icon = icons[index % icons.length]; return <button key={metric.key} className="text-left" onClick={() => metric.locator && navigate(metric.locator)} disabled={!metric.locator}><StatCard title={metric.label} value={metric.value} icon={Icon} iconClassName={metric.tone === 'critical' ? 'bg-destructive/15' : metric.tone === 'warning' ? 'bg-warning/15' : metric.tone === 'success' ? 'bg-success/15' : undefined} description={metric.locator ? 'Open workspace' : undefined} /></button> })}</div><Card><CardHeader><CardTitle className="text-sm">Role priorities</CardTitle></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3">{workspace.priorities.map((priority, index) => <div key={priority} className="flex gap-3 rounded-lg border bg-muted/20 p-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-2xs font-bold text-primary-foreground">{index + 1}</span><p className="text-xs leading-relaxed text-muted-foreground">{priority}</p></div>)}</div></CardContent></Card></>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Open cases" value={data.open_cases} icon={Ticket} description={`${data.total_cases} total cases`} />
        <StatCard title="Resolved today" value={data.resolved_today} icon={CheckCircle2} iconClassName="bg-success/10" description="Based on recorded status changes" />
        <StatCard title="Average resolution" value={data.average_resolution_hours === null ? '—' : `${data.average_resolution_hours}h`} icon={Clock} iconClassName="bg-warning/10" description="Across resolved cases" />
        <StatCard title="Critical open cases" value={data.critical_cases} icon={AlertTriangle} iconClassName="bg-destructive/10" description="Requires immediate review" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><div className="flex items-center justify-between"><CardTitle>Case flow</CardTitle><Badge variant="secondary">Last 7 days</Badge></div></CardHeader><CardContent>{data.trends.some((point) => point.created || point.resolved) ? <TicketTrendChart data={data.trends} /> : <EmptyState title="No recent case activity" description="Created and resolved case trends will appear here." />}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" />{isCustomer ? 'Self-service knowledge' : 'Knowledge readiness'}</CardTitle></CardHeader><CardContent className="space-y-3">
          {canViewMemory && <ReadinessRow icon={Database} label="Verified memory" value={data.verified_memory} action={() => navigate('/memory')} />}
          <ReadinessRow icon={BookOpen} label="Published articles" value={data.published_knowledge} action={() => navigate('/knowledge')} />
          {canViewDocuments && <ReadinessRow icon={FileText} label="Documents ready for AI search" value={data.indexed_documents} action={() => navigate('/documents')} />}
          {!isCustomer && (data.draft_memory > 0 || data.documents_pending > 0 || data.documents_failed > 0) && <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground"><p>{data.draft_memory} memory item(s) awaiting review</p><p>{data.documents_pending} document(s) being prepared</p>{data.documents_failed > 0 && <p className="text-destructive">{data.documents_failed} document(s) need attention</p>}</div>}
          <Button className="w-full" size="sm" onClick={() => navigate('/chat')}>Ask CaseMind<ArrowRight className="h-3.5 w-3.5" /></Button>
        </CardContent></Card>
      </div>

      <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Cases needing attention</CardTitle><Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>View all<ArrowRight className="h-3.5 w-3.5" /></Button></div></CardHeader><CardContent>
        {data.attention_cases.length === 0 ? <EmptyState title="No high-priority cases need attention" description="Critical and high-priority open cases will appear here." /> : <div className="divide-y rounded-xl border">{data.attention_cases.map((item) => <button key={item.id} onClick={() => navigate(`/tickets/${item.id}`)} className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/30"><div className="min-w-0"><p className="text-2xs font-mono text-primary">{item.case_number}</p><p className="truncate text-sm font-medium">{item.subject}</p><p className="mt-1 text-2xs text-muted-foreground">{item.status} · Updated {formatDateTime(item.updated_at)}</p></div><PriorityBadge priority={item.priority as 'low' | 'medium' | 'high' | 'critical'} /></button>)}</div>}
      </CardContent></Card>
    </div>
  )
}

function QuickAction({ icon: Icon, label, description, onClick, primary = false }: { icon: typeof Ticket; label: string; description: string; onClick: () => void; primary?: boolean }) {
  return <button onClick={onClick} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${primary ? 'border-primary bg-primary text-primary-foreground hover:opacity-90' : 'bg-card hover:border-primary/40'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${primary ? 'bg-primary-foreground/10' : 'bg-primary/10 text-primary'}`}><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-medium">{label}</span><span className={`mt-0.5 block text-xs ${primary ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{description}</span></span></button>
}

function ReadinessRow({ icon: Icon, label, value, action }: { icon: typeof Database; label: string; value: number; action: () => void }) {
  return <button onClick={action} className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:border-primary/40"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</span><strong className="font-mono text-sm">{value}</strong></button>
}
