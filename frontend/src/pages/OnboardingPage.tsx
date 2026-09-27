import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Brain, Check, FileText, Lightbulb, MessageSquare, Sparkles, Ticket, Upload, Users } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { Button, Card, CardContent, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
import { authService } from '@/features/auth/services/authService'
import { useCreateTicket } from '@/features/tickets/hooks/useTickets'
import { ThemeToggle } from '@/components/common'

const totalSteps = 7
const roles = ['Support Agent', 'Support Manager', 'Operations Manager', 'Administrator', 'Engineer', 'Knowledge Manager', 'Other']
const goals = ['Reduce resolution time', 'Reuse previous solutions', 'Build a knowledge base', 'Improve support consistency', 'Understand recurring issues', 'Other']

interface FirstCaseDraft {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'bug' | 'feature_request' | 'billing' | 'account' | 'authentication' | 'performance' | 'security' | 'integration' | 'other'
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const createCase = useCreateTicket()
  const initial = Math.min(Number(user?.onboardingStep ?? 0), totalSteps)
  const [step, setStep] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState({
    teamSize: String(user?.onboardingData.teamSize ?? '2–10'),
    primaryRole: String(user?.onboardingData.primaryRole ?? roles[0]),
    primaryGoal: String(user?.onboardingData.primaryGoal ?? goals[0]),
  })
  const [firstCase, setFirstCase] = useState<FirstCaseDraft>({ title: '', description: '', priority: 'medium', category: 'other' })
  const firstName = user?.name.split(' ')[0] ?? 'there'

  const persist = async (nextStep: number, data?: Record<string, unknown>) => {
    setBusy(true); setError('')
    try {
      const next = await authService.updateOnboarding({ step: nextStep, data })
      updateUser(next); setStep(nextStep)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not save your progress. Please try again.')
    } finally { setBusy(false) }
  }

  const finish = async (data?: Record<string, unknown>) => {
    setBusy(true); setError('')
    try {
      const next = await authService.updateOnboarding({ completed: true, step: totalSteps, data })
      updateUser(next); navigate('/dashboard')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not finish setup. Please try again.')
    } finally { setBusy(false) }
  }

  const submitFirstCase = async () => {
    if (firstCase.title.trim().length < 10 || firstCase.description.trim().length < 30) {
      setError('Add a clear title and at least 30 characters describing the problem, or skip this step for now.')
      return
    }
    setBusy(true); setError('')
    try {
      const ticket = await createCase.mutateAsync({ ...firstCase, tags: [] })
      await persist(5, { firstCaseId: ticket.id })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your case could not be created. Nothing was lost—please try again.')
      setBusy(false)
    }
  }

  let content: React.ReactNode
  if (step === 0) content = <Welcome firstName={firstName} onStart={() => persist(1)} onExplore={() => finish({ onboardingSkipped: true })} busy={busy} />
  else if (step === 1) content = <TeamSetup profile={profile} setProfile={setProfile} />
  else if (step === 2) content = <HowItWorks />
  else if (step === 3) content = <MainAreas />
  else if (step === 4) content = <FirstCase value={firstCase} setValue={setFirstCase} onSubmit={submitFirstCase} busy={busy} />
  else if (step === 5) content = <CaseGuidance hasCase={Boolean(user?.onboardingData.firstCaseId)} />
  else if (step === 6) content = <AddKnowledge onChoice={(choice) => persist(7, { knowledgeNextStep: choice })} />
  else content = <MemoryAndReady firstName={firstName} onFinish={() => finish()} busy={busy} />

  return (
    <main className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b bg-card px-5 sm:px-8">
        <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Brain className="h-5 w-5" /></span><div><p className="font-semibold">CaseMind</p><p className="text-xs text-muted-foreground">Workspace setup</p></div></div>
        <div className="flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:block">Your progress is saved automatically</span><ThemeToggle /></div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {step > 0 && <div className="mb-8"><div className="flex items-center justify-between text-xs"><span className="font-medium">Setup progress</span><span className="text-muted-foreground">Step {step} of {totalSteps}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} /></div></div>}
        <Card className="overflow-hidden shadow-sm"><CardContent className="p-0"><div className="min-h-[560px] p-6 sm:p-10">{content}</div>
          {step > 0 && step !== 4 && step !== 6 && step !== 7 && <footer className="flex flex-col-reverse gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10"><Button variant="ghost" onClick={() => setStep((value) => Math.max(0, value - 1))}><ArrowLeft className="h-4 w-4" />Back</Button><Button onClick={() => persist(step + 1, step === 1 ? profile : undefined)} loading={busy}>Continue<ArrowRight className="h-4 w-4" /></Button></footer>}
        </CardContent></Card>
        {error && <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
        {step > 0 && <button className="mx-auto mt-5 block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={() => finish({ onboardingSkipped: true, resumeStep: step })}>Skip for now and explore CaseMind</button>}
      </div>
    </main>
  )
}

function Welcome({ firstName, onStart, onExplore, busy }: { firstName: string; onStart: () => void; onExplore: () => void; busy: boolean }) {
  return <div className="mx-auto flex max-w-2xl flex-col items-center py-10 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-8 w-8" /></span><p className="mt-7 text-sm font-medium text-primary">Welcome, {firstName}</p><h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Let’s turn your support knowledge into something your whole team can reuse.</h1><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">CaseMind helps your team solve support problems faster by learning from previous cases, trusted documents, and successful resolutions.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" onClick={onStart} loading={busy}>Start setup<ArrowRight className="h-4 w-4" /></Button><Button size="lg" variant="outline" onClick={onExplore} disabled={busy}>Explore on my own</Button></div><p className="mt-6 text-xs text-muted-foreground">Setup takes about five minutes. You can pause or restart it later.</p></div>
}

function TeamSetup({ profile, setProfile }: { profile: { teamSize: string; primaryRole: string; primaryGoal: string }; setProfile: (value: typeof profile) => void }) {
  return <div className="mx-auto max-w-2xl"><StepHeading icon={Users} eyebrow="A better starting point" title="Tell us about your team" description="We’ll use this to emphasize the areas most useful to you. It will not change your account permissions." /><div className="mt-8 grid gap-5 sm:grid-cols-2"><Field label="Team size"><Select value={profile.teamSize} onValueChange={(teamSize) => setProfile({ ...profile, teamSize })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Just me', '2–10', '11–50', '51–200', '201+'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Your primary role"><Select value={profile.primaryRole} onValueChange={(primaryRole) => setProfile({ ...profile, primaryRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><div className="sm:col-span-2"><Field label="What would you most like to improve?"><Select value={profile.primaryGoal} onValueChange={(primaryGoal) => setProfile({ ...profile, primaryGoal })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{goals.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field></div></div></div>
}

function HowItWorks() { const items = [[Ticket, 'A customer reports a problem'], [Brain, 'CaseMind checks previous cases and trusted knowledge'], [Lightbulb, 'Your team gets a suggested solution with evidence'], [BookOpen, 'The final resolution becomes reusable knowledge']] as const; return <div><StepHeading icon={Brain} eyebrow="How it works" title="Useful answers, without the technical complexity" description="CaseMind connects the work your team already does and makes successful resolutions easier to reuse." /><div className="mt-10 grid gap-4 md:grid-cols-4">{items.map(([Icon, title], index) => <div key={title} className="relative rounded-xl border bg-card p-5"><span className="text-xs font-semibold text-primary">0{index + 1}</span><Icon className="mt-8 h-6 w-6" /><p className="mt-4 text-sm font-medium leading-6">{title}</p>{index < items.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 rounded-full bg-background text-muted-foreground md:block" />}</div>)}</div></div> }

function MainAreas() { const areas = [[Ticket, 'Cases', 'Investigate and resolve customer issues.'], [MessageSquare, 'Ask CaseMind', 'Ask questions and review evidence-backed suggestions.'], [Brain, 'Organizational Memory', 'Reuse lessons from previously solved problems.'], [BookOpen, 'Knowledge', 'Maintain trusted guides and known solutions.'], [FileText, 'Documents', 'Add source material that CaseMind can search.'], [Users, 'Analytics & Team', 'Understand workload, recurring issues, and knowledge gaps.']] as const; return <div><StepHeading icon={Lightbulb} eyebrow="Meet the workspace" title="Everything has a clear purpose" description="These are the main areas you’ll use. A short interactive tour will highlight them in the real workspace after setup." /><div className="mt-8 grid gap-3 sm:grid-cols-2">{areas.map(([Icon, title, copy]) => <div key={title} className="flex gap-4 rounded-xl border p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><p className="font-medium">{title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{copy}</p></div></div>)}</div></div> }

function FirstCase({ value, setValue, onSubmit, busy }: { value: FirstCaseDraft; setValue: (value: FirstCaseDraft) => void; onSubmit: () => void; busy: boolean }) { return <div className="mx-auto max-w-2xl"><StepHeading icon={Ticket} eyebrow="Try the core workflow" title="Create your first case" description="Use a real issue if you have one. Required information stays short; more details can be added later." /><div className="mt-8 space-y-5"><Field label="Subject"><Input value={value.title} onChange={(event) => setValue({ ...value, title: event.target.value })} placeholder="e.g. Customers cannot reset their passwords" /></Field><Field label="Describe the problem"><Textarea rows={6} value={value.description} onChange={(event) => setValue({ ...value, description: event.target.value })} placeholder="What happened, who is affected, and what has already been tried?" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Priority"><Select value={value.priority} onValueChange={(priority) => setValue({ ...value, priority: priority as FirstCaseDraft['priority'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['low', 'medium', 'high', 'critical'].map((item) => <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Category"><Select value={value.category} onValueChange={(category) => setValue({ ...value, category: category as FirstCaseDraft['category'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[['other','Other'],['bug','Bug'],['authentication','Authentication'],['billing','Billing'],['performance','Performance'],['integration','Integration']].map(([id,label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select></Field></div><div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><Button onClick={onSubmit} loading={busy} disabled={value.title.trim().length < 10 || value.description.trim().length < 30}>Create case and continue</Button></div></div></div> }

function CaseGuidance({ hasCase }: { hasCase: boolean }) { const items = ['Case information keeps the problem and ownership clear.', 'Activity records collaboration and decisions.', 'CaseMind Assistant compares the issue with previous cases and trusted knowledge.', 'Similar cases and evidence explain why a suggestion may help.', 'The final resolution can become reusable Organizational Memory.']; return <div><StepHeading icon={Sparkles} eyebrow="Inside a case" title={hasCase ? 'Your first case is ready' : 'A clear workspace for every issue'} description="CaseMind assists your team, but people remain in control of every decision." /><div className="mt-8 grid gap-3">{items.map((item, index) => <div key={item} className="flex items-start gap-4 rounded-xl border p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><p className="text-sm leading-6">{item}</p></div>)}</div><div className="mt-6 rounded-xl border border-info/25 bg-info/5 p-4"><p className="text-sm font-medium">When there is not enough knowledge</p><p className="mt-1 text-sm leading-6 text-muted-foreground">CaseMind will say so clearly and suggest adding previous cases or trusted documentation. It will not invent results.</p></div></div> }

function AddKnowledge({ onChoice }: { onChoice: (choice: string) => void }) { return <div className="mx-auto max-w-2xl text-center"><StepHeading icon={Upload} eyebrow="Improve future suggestions" title="Add knowledge when you’re ready" description="Documents and knowledge articles help CaseMind provide better answers grounded in information your team trusts." centered /><div className="mt-10 grid gap-3 sm:grid-cols-3"><Choice icon={Upload} title="Upload a document" copy="PDF, DOCX, Markdown, or text" onClick={() => onChoice('document')} /><Choice icon={BookOpen} title="Create an article" copy="Write a guide or known solution" onClick={() => onChoice('article')} /><Choice icon={ArrowRight} title="Do this later" copy="Continue to finish setup" onClick={() => onChoice('skip')} /></div></div> }

function MemoryAndReady({ firstName, onFinish, busy }: { firstName: string; onFinish: () => void; busy: boolean }) { const flow = ['Previous case', 'What happened?', 'What caused it?', 'How was it solved?', 'Reusable memory', 'Helps future cases']; return <div className="mx-auto max-w-3xl text-center"><StepHeading icon={Brain} eyebrow="Organizational Memory" title="Your team’s experience becomes easier to reuse" description="Organizational Memory is the knowledge your company builds from solved problems. CaseMind can preserve the problem, root cause, solution, and supporting sources for similar cases later." centered /><div className="mt-8 flex flex-wrap items-center justify-center gap-2">{flow.map((item, index) => <div key={item} className="flex items-center gap-2"><span className="rounded-lg border bg-card px-3 py-2 text-xs font-medium">{item}</span>{index < flow.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}</div>)}</div><div className="mt-10 rounded-2xl border bg-muted/20 p-6"><h2 className="text-2xl font-semibold">You’re ready to use CaseMind, {firstName}</h2><div className="mx-auto mt-5 grid max-w-xl gap-2 text-left sm:grid-cols-2">{['Workspace created', 'Core workflow explained', 'AI assistance explained', 'Organizational Memory explained'].map((item) => <p key={item} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success" />{item}</p>)}</div><Button className="mt-7" size="lg" onClick={onFinish} loading={busy}>Go to Command Center<ArrowRight className="h-4 w-4" /></Button></div></div> }

function StepHeading({ icon: Icon, eyebrow, title, description, centered = false }: { icon: typeof Brain; eyebrow: string; title: string; description: string; centered?: boolean }) { return <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}><span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ${centered ? 'mx-auto' : ''}`}><Icon className="h-5 w-5" /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2 text-sm font-medium">{label}{children}</label> }
function Choice({ icon: Icon, title, copy, onClick }: { icon: typeof Upload; title: string; copy: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p></button> }
