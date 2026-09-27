import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Brain, ChevronDown, FileText, HelpCircle, MessageSquare, RotateCcw, Search, ShieldCheck, Ticket, Users } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { authService } from '@/features/auth/services/authService'
import { Button, Card, CardContent, Input } from '@/components/ui'

const topics = [
  { icon: Ticket, title: 'Understanding Cases', copy: 'Cases keep the issue, ownership, activity, evidence, and final resolution together.', details: 'Create a case with a clear title and description. Use Activity to collaborate, CaseMind Assistant to review suggestions, and Resolution to record the verified outcome.' },
  { icon: MessageSquare, title: 'Using AI Suggestions', copy: 'CaseMind recommends next steps and shows the information supporting them.', details: 'Treat suggestions as assistance, not automatic decisions. Review the explanation and sources, then accept, edit, or reject the recommendation.' },
  { icon: Brain, title: 'Organizational Memory', copy: 'Reusable lessons built from problems your team has already solved.', details: 'Memory can preserve an issue pattern, root cause, resolution, and sources. Human review keeps trusted lessons separate from drafts.' },
  { icon: BookOpen, title: 'Adding Knowledge', copy: 'Create trusted articles for guides, known issues, and proven solutions.', details: 'Draft an article, review it with the appropriate owner, and publish it when your team is ready to rely on it.' },
  { icon: FileText, title: 'Uploading Documents', copy: 'Add PDF, DOCX, Markdown, or text files for CaseMind to search.', details: 'After upload, CaseMind prepares the document. “Ready for AI search” means it can support answers and suggestions.' },
  { icon: Search, title: 'Searching CaseMind', copy: 'Search cases, solutions, knowledge, and documents in plain language.', details: 'Use customer terms, symptoms, error messages, or product names. Open results to verify the complete context.' },
  { icon: Users, title: 'Managing Your Team', copy: 'Invite teammates and apply roles that match their responsibilities.', details: 'Administrators can invite people, assign operational roles, and organize members into departments and teams.' },
  { icon: ShieldCheck, title: 'Administrator Guide', copy: 'Manage access, service levels, AI settings, and audit history.', details: 'Administrative tools are shown only to roles with the matching permissions. Provider credentials stay on the server.' },
]

export function HelpPage() {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [restarting, setRestarting] = useState(false)
  const filtered = topics.filter((topic) => `${topic.title} ${topic.copy} ${topic.details}`.toLowerCase().includes(query.toLowerCase()))

  const restart = async () => {
    setRestarting(true)
    try { const next = await authService.restartOnboarding(); updateUser(next); navigate('/onboarding') }
    finally { setRestarting(false) }
  }

  return <div className="mx-auto max-w-6xl space-y-8 p-5 sm:p-6 lg:p-8">
    <section className="rounded-2xl border bg-card p-6 sm:p-8"><div className="max-w-2xl"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><HelpCircle className="h-5 w-5" /></span><h1 className="mt-5 text-3xl font-semibold tracking-tight">Help & Learning</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Short, practical guidance for using CaseMind—no AI or database expertise required.</p><div className="relative mt-6"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" placeholder="Search help topics…" /></div></div></section>
    <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Getting started</h2><p className="mt-1 text-sm text-muted-foreground">Learn the main workflow again whenever you need it.</p></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Card><CardContent className="p-5"><Brain className="h-5 w-5 text-primary" /><h3 className="mt-4 font-medium">Workspace tour</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Highlight the main areas in your current workspace.</p><Button className="mt-4" size="sm" variant="outline" onClick={() => navigate('/dashboard?tour=main')}>Start tour</Button></CardContent></Card><Card><CardContent className="p-5"><RotateCcw className="h-5 w-5 text-primary" /><h3 className="mt-4 font-medium">Restart guided setup</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Return to the welcome experience and onboarding steps.</p><Button className="mt-4" size="sm" variant="outline" loading={restarting} onClick={restart}>Restart setup</Button></CardContent></Card><Card><CardContent className="p-5"><Ticket className="h-5 w-5 text-primary" /><h3 className="mt-4 font-medium">Create a case</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Start with a real customer issue and follow the guided form.</p><Button className="mt-4" size="sm" variant="outline" onClick={() => navigate('/tickets/new')}>Create case</Button></CardContent></Card></div></section>
    <section><h2 className="text-lg font-semibold">Browse topics</h2><div className="mt-4 divide-y overflow-hidden rounded-xl border bg-card">{filtered.map((topic) => { const Icon = topic.icon; const expanded = open === topic.title; return <article key={topic.title}><button className="flex w-full items-center gap-4 p-5 text-left hover:bg-muted/30" onClick={() => setOpen(expanded ? null : topic.title)} aria-expanded={expanded}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{topic.title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{topic.copy}</span></span><ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>{expanded && <p className="border-t bg-muted/20 px-5 py-4 pl-[5.25rem] text-sm leading-6 text-muted-foreground">{topic.details}</p>}</article> })}{filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No help topics match “{query}”. Try a broader phrase.</p>}</div></section>
  </div>
}
