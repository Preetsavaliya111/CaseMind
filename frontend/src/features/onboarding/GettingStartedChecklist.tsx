import { Check, ChevronRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { authService } from '@/features/auth/services/authService'
import type { AnalyticsOverview } from '@/features/dashboard/services/dashboardService'
import { Button, Card, CardContent } from '@/components/ui'

export function GettingStartedChecklist({ data }: { data: AnalyticsOverview }) {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  if (!user || user.setupChecklistDismissed) return null
  const items = [
    { label: 'Create your account', done: true, to: '/settings' },
    { label: 'Create your first case', done: data.total_cases > 0, to: '/tickets/new' },
    { label: 'Upload trusted knowledge', done: data.indexed_documents + data.published_knowledge > 0, to: '/documents' },
    { label: 'Ask CaseMind a question', done: data.ai_questions_asked > 0, to: '/chat' },
    { label: 'Invite a teammate', done: data.teammates_invited > 0, to: '/admin/users' },
  ]
  const completed = items.filter((item) => item.done).length
  if (completed === items.length) return null

  const dismiss = async () => updateUser(await authService.updateOnboarding({ checklistDismissed: true }))
  return <Card className="border-primary/20 bg-primary/[0.025]"><CardContent className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Getting started</p><h2 className="mt-1 text-lg font-semibold">Build a useful CaseMind workspace</h2><p className="mt-1 text-sm text-muted-foreground">{completed} of {items.length} completed</p></div><Button variant="ghost" size="icon" onClick={dismiss} aria-label="Dismiss getting started checklist"><X className="h-4 w-4" /></Button></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(completed / items.length) * 100}%` }} /></div><div className="mt-5 grid gap-2 md:grid-cols-5">{items.map((item) => <button key={item.label} onClick={() => navigate(item.to)} className="flex items-center gap-3 rounded-lg border bg-card p-3 text-left hover:border-primary/40"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.done ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{item.done ? <Check className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</span><span className={`text-xs font-medium ${item.done ? 'text-muted-foreground line-through' : ''}`}>{item.label}</span></button>)}</div></CardContent></Card>
}
