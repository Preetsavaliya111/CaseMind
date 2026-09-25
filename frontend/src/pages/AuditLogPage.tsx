import { useEffect, useMemo, useState } from 'react'
import { Activity, Filter, ScrollText, ShieldCheck } from 'lucide-react'

import { Badge, Card, CardContent, CardHeader, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SkeletonCard } from '@/components/ui'
import { StatCard } from '@/components/common'
import { auditService, type AuditEvent } from '@/features/settings/services/auditService'
import type { ApiError } from '@/types'
import { formatDateTime } from '@/utils'

const entityOptions = ['all', 'user', 'invitation', 'team', 'department', 'case', 'document', 'knowledge_article', 'memory_item']

export function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [total, setTotal] = useState(0)
  const [entityType, setEntityType] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    auditService.events({ entity_type: entityType === 'all' ? undefined : entityType })
      .then((result) => { setEvents(result.items); setTotal(result.total) })
      .catch((caught: ApiError) => setError(caught.message))
      .finally(() => setLoading(false))
  }, [entityType])

  const actors = useMemo(() => new Set(events.map((event) => event.actor_name)).size, [events])
  if (loading) return <div className="mx-auto grid max-w-7xl gap-4 p-6 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}</div>
  return <div className="mx-auto max-w-7xl space-y-6 p-6">
    <div><p className="text-2xs font-semibold uppercase tracking-[0.2em] text-primary">Security & accountability</p><h1 className="mt-1 text-2xl font-bold">Organization Audit Log</h1><p className="mt-1 text-sm text-muted-foreground">A chronological record of sensitive administrative and operational changes.</p></div>
    <div className="grid gap-4 sm:grid-cols-3"><StatCard title="Recorded events" value={total} icon={ScrollText} /><StatCard title="Recent actors" value={actors} icon={Activity} /><StatCard title="Retention status" value="Active" icon={ShieldCheck} /></div>
    {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>}
    <Card><CardHeader><div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Recent activity</h2><p className="mt-1 text-xs text-muted-foreground">Newest events appear first.</p></div><Select value={entityType} onValueChange={setEntityType}><SelectTrigger className="w-52"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger><SelectContent>{entityOptions.map((option) => <SelectItem key={option} value={option}>{option === 'all' ? 'All entity types' : option.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select></div></CardHeader><CardContent><div className="overflow-hidden rounded-lg border"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-3">Time</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Details</th></tr></thead><tbody className="divide-y">{events.map((event) => <tr key={event.id}><td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{formatDateTime(event.created_at)}</td><td className="px-4 py-3 font-medium">{event.actor_name}</td><td className="px-4 py-3"><Badge variant="secondary">{event.action.replace(/[._]/g, ' ')}</Badge></td><td className="px-4 py-3 text-xs capitalize">{event.entity_type.replace(/_/g, ' ')}</td><td className="max-w-xs truncate px-4 py-3 text-xs text-muted-foreground">{Object.entries(event.details).map(([key, value]) => `${key}: ${String(value)}`).join(' · ') || '—'}</td></tr>)}</tbody></table>{events.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No audit events match this filter.</p>}</div></CardContent></Card>
  </div>
}
