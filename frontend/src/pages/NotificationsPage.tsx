import { useEffect, useState } from 'react'
import { AlertTriangle, Bell, CheckCheck, Circle, Flame, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge, Button, Card, CardContent, CardHeader, SkeletonCard } from '@/components/ui'
import { notificationService, type NotificationItem } from '@/features/settings/services/notificationService'
import type { ApiError } from '@/types'
import { formatRelative } from '@/utils'

function iconFor(item: NotificationItem) {
  if (item.notification_type.includes('sla')) return item.severity === 'critical' ? AlertTriangle : Flame
  if (item.notification_type === 'case_assigned') return UserPlus
  return Bell
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => { setLoading(true); notificationService.list({ unread_only: unreadOnly }).then((result) => { setItems(result.items); setUnread(result.unread) }).catch((caught: ApiError) => setError(caught.message)).finally(() => setLoading(false)) }
  useEffect(load, [unreadOnly])
  const open = async (item: NotificationItem) => { if (!item.read_at) await notificationService.markRead(item.id); if (item.locator) navigate(item.locator); else load() }
  const readAll = async () => { await notificationService.markAllRead(); load() }

  if (loading) return <div className="mx-auto grid max-w-4xl gap-4 p-6">{Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}</div>
  return <div className="mx-auto max-w-4xl space-y-6 p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-2xs font-semibold uppercase tracking-[0.2em] text-primary">Your activity</p><h1 className="mt-1 text-2xl font-bold">Notifications</h1><p className="mt-1 text-sm text-muted-foreground">Assignments, replies, escalations, and SLA warnings that require your attention.</p></div><div className="flex gap-2"><Button variant={unreadOnly ? 'default' : 'outline'} size="sm" onClick={() => setUnreadOnly((value) => !value)}><Circle className="h-3.5 w-3.5" />Unread only</Button><Button variant="outline" size="sm" onClick={readAll} disabled={unread === 0}><CheckCheck className="h-4 w-4" />Mark all read</Button></div></div>
    {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>}
    <Card><CardHeader><div className="flex items-center justify-between"><h2 className="font-semibold">Inbox</h2><Badge variant="secondary">{unread} unread</Badge></div></CardHeader><CardContent className="p-0"><div className="divide-y">{items.map((item) => { const Icon = iconFor(item); return <button key={item.id} onClick={() => open(item)} className={`flex w-full gap-4 p-4 text-left transition-colors hover:bg-muted/30 ${item.read_at ? 'opacity-60' : 'bg-accent/30'}`}><span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.severity === 'critical' ? 'bg-destructive/15 text-destructive' : item.severity === 'warning' ? 'bg-warning/15 text-warning' : 'bg-info/15 text-info'}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="truncate text-sm">{item.title}</strong>{!item.read_at && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-info" />}</span><span className="mt-1 block text-xs text-muted-foreground">{item.message}</span><span className="mt-2 block text-2xs text-muted-foreground">{item.actor_name ? `${item.actor_name} · ` : ''}{formatRelative(item.created_at)}</span></span></button> })}{items.length === 0 && <div className="py-16 text-center"><Bell className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No notifications</p><p className="mt-1 text-xs text-muted-foreground">You are caught up.</p></div>}</div></CardContent></Card>
  </div>
}
