import { AlertTriangle, BookOpen, Brain, CheckCircle2, Database, FileText, Ticket } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, SkeletonCard } from '@/components/ui'
import { EmptyState, StatCard } from '@/components/common'
import { TicketTrendChart } from '@/components/charts'
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboard'

export function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useDashboardOverview()
  if (isLoading) return <div className="mx-auto grid max-w-7xl gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}</div>
  if (isError || !data) return <div className="p-6"><EmptyState icon={AlertTriangle} title="Analytics unavailable" description="Measured organization data could not be loaded." action={{ label: 'Try again', onClick: () => refetch() }} /></div>

  const exportCsv = () => {
    const rows = ['Date,Created,Resolved,Open', ...data.trends.map((point) => `${point.date},${point.created},${point.resolved},${point.open}`)]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'casemind-measured-case-flow.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return <div className="mx-auto max-w-7xl space-y-6 p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-2xs font-semibold uppercase tracking-[0.2em] text-primary">Measured signals only</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Operations & Knowledge Analytics</h1><p className="mt-1 text-sm text-muted-foreground">Current support volume and knowledge readiness. AI quality metrics appear after feedback events are collected.</p></div><Button variant="outline" onClick={exportCsv}>Export case flow</Button></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard title="Total cases" value={data.total_cases} icon={Ticket} /><StatCard title="Resolved today" value={data.resolved_today} icon={CheckCircle2} /><StatCard title="Verified memory" value={data.verified_memory} icon={Database} /><StatCard title="Published knowledge" value={data.published_knowledge} icon={BookOpen} /></div>
    <div className="grid gap-6 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle>Seven-day case flow</CardTitle></CardHeader><CardContent><TicketTrendChart data={data.trends} /></CardContent></Card><Card><CardHeader><CardTitle>Retrieval readiness</CardTitle></CardHeader><CardContent className="space-y-3"><Signal icon={FileText} label="Indexed documents" value={data.indexed_documents} /><Signal icon={Database} label="Verified memory" value={data.verified_memory} /><Signal icon={BookOpen} label="Published articles" value={data.published_knowledge} /><Signal icon={Brain} label="AI feedback" value="Recorded per answer" /><p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">CaseMind records answer feedback for review and does not manufacture accuracy, groundedness, or CSAT figures.</p></CardContent></Card></div>
  </div>
}

function Signal({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number | string }) {
  return <div className="flex items-center justify-between rounded-lg border p-3"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</span><strong className="text-xs">{value}</strong></div>
}
