import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Flame, Save, Timer } from 'lucide-react'

import { useAuth } from '@/app/providers'
import { Badge, Button, Card, CardContent, CardHeader, Input, SkeletonCard } from '@/components/ui'
import { StatCard } from '@/components/common'
import { slaService, type SLAPolicy, type SLASummary } from '@/features/settings/services/slaService'
import { hasApiPermission } from '@/permissions'
import type { ApiError } from '@/types'

function duration(minutes: number) { return minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${minutes / 60}h` : `${minutes / 1440}d` }

export function SLAPage() {
  const { user } = useAuth()
  const [policies, setPolicies] = useState<SLAPolicy[]>([])
  const [summary, setSummary] = useState<SLASummary>({ healthy: 0, at_risk: 0, breached: 0, escalated: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const canManage = hasApiPermission(user, 'sla.manage')

  useEffect(() => { Promise.all([slaService.policies(), slaService.summary()]).then(([policyData, summaryData]) => { setPolicies(policyData); setSummary(summaryData) }).catch((caught: ApiError) => setError(caught.message)).finally(() => setLoading(false)) }, [])
  const change = (id: string, field: keyof SLAPolicy, value: number) => setPolicies((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item))
  const save = async (policy: SLAPolicy) => {
    setSaving(policy.id); setError('')
    try { const updated = await slaService.updatePolicy(policy.id, { first_response_minutes: policy.first_response_minutes, resolution_minutes: policy.resolution_minutes, warning_percent: policy.warning_percent, is_active: policy.is_active }); setPolicies((items) => items.map((item) => item.id === updated.id ? updated : item)) }
    catch (caught) { setError((caught as ApiError).message) }
    finally { setSaving(null) }
  }

  if (loading) return <div className="mx-auto grid max-w-7xl gap-4 p-6 sm:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}</div>
  return <div className="mx-auto max-w-7xl space-y-6 p-6">
    <div><p className="text-2xs font-semibold uppercase tracking-[0.2em] text-primary">Service operations</p><h1 className="mt-1 text-2xl font-bold">SLA & Escalations</h1><p className="mt-1 text-sm text-muted-foreground">Monitor deadlines and define targets applied when new Cases are created.</p></div>
    <div className="grid gap-4 sm:grid-cols-4"><StatCard title="Healthy" value={summary.healthy} icon={CheckCircle2} /><StatCard title="At risk" value={summary.at_risk} icon={Timer} /><StatCard title="Breached" value={summary.breached} icon={AlertTriangle} /><StatCard title="Escalated" value={summary.escalated} icon={Flame} /></div>
    {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>}
    <div className="grid gap-5 lg:grid-cols-2">{policies.map((policy) => <Card key={policy.id}><CardHeader><div className="flex items-center justify-between"><div><h2 className="capitalize font-semibold">{policy.priority} priority</h2><p className="mt-1 text-xs text-muted-foreground">Respond within {duration(policy.first_response_minutes)} · Resolve within {duration(policy.resolution_minutes)}</p></div><Badge variant={policy.is_active ? 'success' : 'secondary'}>{policy.is_active ? 'Active' : 'Disabled'}</Badge></div></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><label className="space-y-1.5 text-xs">First response (minutes)<Input type="number" min={5} disabled={!canManage} value={policy.first_response_minutes} onChange={(event) => change(policy.id, 'first_response_minutes', Number(event.target.value))} /></label><label className="space-y-1.5 text-xs">Resolution (minutes)<Input type="number" min={15} disabled={!canManage} value={policy.resolution_minutes} onChange={(event) => change(policy.id, 'resolution_minutes', Number(event.target.value))} /></label><label className="space-y-1.5 text-xs">Warning at (%)<Input type="number" min={25} max={95} disabled={!canManage} value={policy.warning_percent} onChange={(event) => change(policy.id, 'warning_percent', Number(event.target.value))} /></label>{canManage && <div className="sm:col-span-3 flex justify-end"><Button size="sm" onClick={() => save(policy)} loading={saving === policy.id}><Save className="h-4 w-4" />Save policy</Button></div>}</CardContent></Card>)}</div>
  </div>
}
