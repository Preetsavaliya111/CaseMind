import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, BookOpen, Brain, Check, FileText, GitBranch, Layers, Menu, Search, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { Button } from '@/components/ui'
import { ThemeToggle } from '@/components/common'
import '@/styles/marketing.css'

const navigation = [['Product', 'product'], ['How it works', 'how-it-works'], ['Trust', 'trust'], ['FAQ', 'faq']]
const faqs = [
  ['Who is CaseMind for?', 'Support teams investigating recurring issues, leaders maintaining service quality, and technical experts who want their resolutions to help the next person.'],
  ['How is this different from a shared document folder?', 'CaseMind connects cases, curated Knowledge, uploaded documents and Organizational Memory in one workspace. You can search across them, inspect supporting sources and preserve reviewed resolutions with their context.'],
  ['Can I rely on every AI answer?', 'AI can make mistakes. CaseMind retrieves sources your account is allowed to access and links them to its answers. Review the evidence before acting. When no relevant evidence is found, it asks for more knowledge rather than generating an unsupported answer.'],
  ['What can I bring into the workspace?', 'Create cases and Knowledge articles, or upload text-based PDF, DOCX, Markdown and TXT documents. Documents show extraction and indexing status. Scanned PDFs that need OCR are not currently supported.'],
  ['Does it connect to our existing helpdesk?', 'External helpdesk, Slack, Jira and GitHub integrations are not available yet. The current workspace manages its own cases and supports document uploads. No external account connection is required to start.'],
  ['Where does our data go?', 'Case and knowledge records live in the configured database, and files in private server storage. When AI is configured, relevant source excerpts are sent to Groq for answers and document text to Gemini for embeddings. Your deployment owner chooses hosting and manages provider credentials and data policies.'],
  ['What is needed to use AI features?', 'Your administrator configures Groq, Gemini and the search service on the server. Case management and knowledge curation remain available without AI; unavailable AI features show a configuration message.'],
]

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const destination = isAuthenticated ? '/dashboard' : '/register'
  const action = isAuthenticated ? 'Open workspace' : 'Create your workspace'
  const cta = (className = '') => isLoading
    ? <Button className={className} disabled>Loading workspace…</Button>
    : <Button className={className} asChild><Link to={destination}>{action}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button>

  return <div className="marketing bg-background text-foreground">
    <a href="#main-content" className="sr-only fixed left-4 top-4 z-[60] rounded-lg bg-primary p-3 text-primary-foreground focus:not-sr-only">Skip to content</a>
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-lg" onKeyDown={(event) => {
      if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButton.current?.focus() }
    }}>
      <div className="marketing-container flex h-20 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 font-display font-bold tracking-tight" aria-label="CaseMind home"><Brand />CaseMind</Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
          {navigation.map(([label, id]) => <a key={id} href={`#${id}`} className="hover:text-foreground">{label}</a>)}
        </nav>
        <div className="flex items-center gap-2"><ThemeToggle /><div className="hidden items-center gap-2 md:flex">
          {!isAuthenticated && <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>}{cta()}
        </div><button ref={menuButton} className="rounded-lg border border-border p-2.5 lg:hidden" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="marketing-mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}</button></div>
      </div>
      {menuOpen && <nav id="marketing-mobile-nav" aria-label="Mobile navigation" className="marketing-container flex flex-col gap-5 border-t border-border py-6 lg:hidden" onClick={() => setMenuOpen(false)}>
        {navigation.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
        {!isAuthenticated && <Link to="/login">Sign in</Link>}{cta()}
      </nav>}
    </header>

    <main id="main-content">
      <section className="marketing-container relative pb-16 pt-16 sm:pb-24 lg:pt-24" aria-labelledby="hero-title">
        <div className="marketing-hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative grid gap-8 lg:grid-cols-[1.45fr_1fr] lg:items-end">
          <div><p className="marketing-eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Support intelligence. Shared memory.</p>
            <h1 id="hero-title" className="mt-6 max-w-3xl text-balance font-display text-5xl font-semibold leading-[1.06] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Your team solved this before.<br /><span className="text-primary">Start there.</span></h1>
          </div>
          <div className="max-w-md lg:pb-2"><p className="text-lg leading-8 text-muted-foreground">CaseMind helps support teams connect new issues to past cases and trusted knowledge—so good answers don’t leave with the person who found them.</p>
            <div className="mt-7 flex flex-wrap items-center gap-5">{cta('h-12 px-5')}<a href="#product-preview" className="inline-flex items-center gap-2 text-sm font-medium">Explore the workspace<ArrowDown size={16} aria-hidden="true" /></a></div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Bring your cases. Build your knowledge. Keep your team in control.</p>
          </div>
        </div>
        <ProductPreview />
        <div className="mt-8 flex flex-wrap justify-between gap-x-8 gap-y-3 border-b border-border pb-8 text-xs text-muted-foreground">
          {['For frontline support', 'For technical specialists', 'For support leaders', 'For knowledge owners'].map((label) => <span key={label} className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />{label}</span>)}
        </div>
      </section>

      <section id="product" className="marketing-container marketing-section">
        <div className="grid gap-10 lg:grid-cols-2"><div><p className="marketing-eyebrow">From repeated investigation to shared understanding</p><h2 className="marketing-heading">A closed case shouldn’t<br />be a dead end.</h2></div>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground lg:pt-10">The answer is often already somewhere: in a resolved case, a runbook, or a colleague’s last investigation. CaseMind gives that work a place to be found, checked and used again.</p></div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { icon: Search, title: 'Find the context', before: 'Another search through disconnected case history.', after: 'Search cases, documents and curated knowledge from one workspace.' },
            { icon: FileText, title: 'Check the evidence', before: 'A confident answer with no clear explanation.', after: 'Inspect source-linked suggestions alongside the case you’re investigating.' },
            { icon: GitBranch, title: 'Keep the lesson', before: 'A useful resolution buried when the case closes.', after: 'Capture root causes and resolution steps as reviewed Organizational Memory.' },
          ].map(({ icon: Icon, title, before, after }) => <article key={title} className="rounded-2xl border border-border bg-card p-7"><Icon className="h-6 w-6 text-primary" aria-hidden="true" /><h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{before}</p><div className="my-5 h-px bg-border" /><p className="text-sm leading-6">{after}</p></article>)}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-card">
        <div className="marketing-container marketing-section"><p className="marketing-eyebrow">A practical loop, with people at the center</p><h2 className="marketing-heading">Today’s work. Tomorrow’s starting point.</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">{[
            ['Bring the issue into focus', 'Create a case, capture the impact, and add your team’s documents and knowledge.'],
            ['Investigate with context', 'Find related work, ask a question and review the sources behind suggested next steps.'],
            ['Preserve what helped', 'Record the outcome. Review and verify useful lessons before reusing them as Organizational Memory.'],
          ].map(([title, copy], index) => <li key={title} className="border-t-2 border-primary/30 pt-5"><span className="font-mono text-sm text-primary">0{index + 1}</span><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{copy}</p></li>)}</ol>
        </div>
      </section>

      <section className="marketing-container marketing-section" aria-labelledby="memory-title">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center"><div><p className="marketing-eyebrow"><Layers size={15} aria-hidden="true" />Organizational Memory</p><h2 id="memory-title" className="marketing-heading">Keep the “why”,<br />not just the answer.</h2><p className="mt-6 max-w-lg leading-8 text-muted-foreground">A knowledge article explains a process. A memory connects the issue pattern, root cause, resolution and supporting evidence. Together, they help the next person understand when a solution applies.</p><ul className="mt-7 space-y-4 text-sm">{['Capture lessons from real investigations', 'Link the case and documents that support them', 'Review drafts and verify useful resolutions'].map((item) => <li key={item} className="flex gap-3"><Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{item}</li>)}</ul></div>
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-9"><div className="flex items-center justify-between gap-3 border-b border-border pb-5"><span className="inline-flex items-center gap-2 text-sm font-semibold"><BookOpen size={18} className="text-primary" aria-hidden="true" />A reusable lesson</span><span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">Illustrative draft</span></div>
            <dl className="mt-6 space-y-6">{[['Issue pattern', 'Sign-in fails after an identity configuration change.'], ['Root cause', 'Application and identity-provider audience values differ.'], ['Resolution', 'Compare the configured values, correct the mismatch, then test with an affected account.'], ['Evidence', 'Link the investigation and the relevant sign-in runbook before review.']].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wider text-primary">{label}</dt><dd className="mt-2 text-sm leading-6 text-muted-foreground">{value}</dd></div>)}</dl>
          </div></div>
      </section>

      <section className="marketing-container marketing-section border-t border-border" aria-labelledby="capabilities-title"><p className="marketing-eyebrow">One connected workspace</p><h2 id="capabilities-title" className="marketing-heading">The essentials, working together.</h2>
        <div className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">{[
          ['Case intelligence', 'Case history, assignment, internal notes and related evidence in the investigation flow.'],
          ['Evidence-backed answers', 'Ask in everyday language and inspect the sources. AI requires server-side provider configuration.'],
          ['Knowledge & documents', 'Curate articles and prepare supported documents for search, with visible processing states.'],
          ['Teams & service targets', 'Organize responsibility, track priority-based SLA deadlines and record escalations.'],
          ['Operational visibility', 'Review case-based analytics, in-app notifications and organization audit history.'],
          ['Controlled access', 'Organization and role permissions enforced by the API, including customer-safe internal notes.'],
        ].map(([title, copy]) => <article key={title} className="border-t border-border pt-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{copy}</p></article>)}</div>
        <p className="mt-10 rounded-xl border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">External helpdesk integrations, customer chat and voice are not available. CaseMind currently works with cases and knowledge in your workspace.</p>
      </section>

      <section id="trust" className="marketing-container marketing-section"><div className="rounded-3xl border border-border bg-secondary/50 p-7 sm:p-12"><div className="grid gap-10 lg:grid-cols-2"><div><ShieldCheck className="h-8 w-8 text-primary" aria-hidden="true" /><p className="marketing-eyebrow mt-6">Trust is a product responsibility</p><h2 className="marketing-heading">Visible evidence.<br />Deliberate access.</h2><p className="mt-5 leading-7 text-muted-foreground">Your team makes the final decision. Sources, permissions and review states help make that decision informed.</p></div><div className="space-y-6">{[
          ['Organization-scoped access', 'Backend checks restrict cases and knowledge by organization, role and supported team scopes.'],
          ['Review before reuse', 'Keep internal notes private and distinguish draft memory from verified knowledge.'],
          ['Server-side credentials', 'AI credentials stay on the server. Relevant content is sent to configured AI providers when those features are used.'],
          ['Clear deployment responsibility', 'Hosting, backups and retention depend on your deployment. No compliance certification or uptime guarantee is claimed.'],
        ].map(([title, copy]) => <div key={title}><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div>)}</div></div></div></section>

      <section id="faq" className="marketing-container marketing-section"><div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="marketing-eyebrow">Before you begin</p><h2 className="marketing-heading">Good questions.</h2></div><div className="divide-y divide-border border-y border-border">{faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer text-base font-medium leading-7">{question}</summary><p className="mt-3 text-sm leading-7 text-muted-foreground">{answer}</p></details>)}</div></div></section>

      <section className="marketing-container pb-20 pt-8"><div className="rounded-3xl border border-primary/25 bg-primary/5 px-6 py-14 text-center sm:p-20"><p className="marketing-eyebrow justify-center">Make the next investigation a little less familiar</p><h2 className="mx-auto mt-5 max-w-3xl text-balance font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Build on what your team<br />already knows.</h2><p className="mx-auto mb-8 mt-5 max-w-lg leading-7 text-muted-foreground">Start a workspace. Capture your first case. Give the next person a better starting point.</p>{cta('h-12 px-6')}</div></section>
    </main>
    <footer className="border-t border-border"><div className="marketing-container flex flex-col justify-between gap-8 py-10 sm:flex-row"><div><Link to="/" className="flex items-center gap-2 font-semibold"><Brand />CaseMind</Link><p className="mt-3 text-sm text-muted-foreground">Support intelligence that stays with your team.</p></div><nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground"><a href="#trust">Trust & data</a><a href="#faq">FAQ</a><Link to="/login">Sign in</Link><Link to={destination}>{action}</Link></nav></div><div className="marketing-container pb-8 text-xs text-muted-foreground">© {new Date().getFullYear()} CaseMind. Product previews use illustrative content, not customer data.</div></footer>
  </div>
}

function Brand() { return <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Brain size={18} aria-hidden="true" /></span> }

function ProductPreview() {
  const [view, setView] = useState('Case')
  return <figure id="product-preview" className="relative mt-14 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/5">
    <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/50 px-5 py-4 text-xs"><span className="inline-flex items-center gap-2 font-medium"><Brand />Inside CaseMind</span><span className="text-muted-foreground">Illustrative product preview · sample content</span></figcaption>
    <div className="grid md:grid-cols-[190px_1fr] lg:grid-cols-[210px_1fr_280px]">
      <div className="border-b border-border p-4 md:border-b-0 md:border-r"><p className="mb-4 hidden px-3 text-xs text-muted-foreground md:block">Connected investigation</p><div className="flex gap-1 md:flex-col" role="group" aria-label="Product preview views">{['Case', 'Answer', 'Memory'].map((item) => <button key={item} onClick={() => setView(item)} aria-pressed={view === item} className={`flex-1 rounded-lg px-4 py-3 text-left text-sm transition-colors ${view === item ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-secondary'}`}>{item}</button>)}</div><p className="mt-16 hidden px-3 text-xs leading-6 text-muted-foreground md:block">The case.<br />The evidence.<br />The lesson.</p></div>
      <div className="min-w-0 p-6 sm:p-9" aria-live="polite"><p className="marketing-eyebrow">{view === 'Case' ? 'Case investigation' : view === 'Answer' ? 'Ask CaseMind' : 'Organizational Memory'}</p><h2 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">Sign-in fails after a configuration change</h2>
        {view === 'Case' ? <><div className="mt-4 flex gap-2 text-xs"><span className="rounded-full border border-border px-3 py-1">In progress</span><span className="rounded-full bg-warning/10 px-3 py-1 text-warning">High priority</span></div><p className="mt-6 text-sm leading-7 text-muted-foreground">Users see an “invalid audience” message after an identity-provider update. The support team is reviewing the configuration and previous investigations.</p><div className="mt-7 rounded-xl border border-border p-4"><p className="text-xs font-semibold">Internal investigation note</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Check whether the application audience matches the identity-provider configuration. Compare with the sign-in runbook.</p></div></>
          : view === 'Answer' ? <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5"><p className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-primary" aria-hidden="true" />Suggested next step</p><p className="mt-3 text-sm leading-7">Compare the audience values in the application and identity provider. The example investigation and runbook both point to a mismatch as a possible cause.</p><p className="mt-4 text-xs leading-6 text-muted-foreground">Illustrative answer. Check the source and your environment before applying a change.</p></div>
            : <div className="mt-6 space-y-4 text-sm leading-7"><p className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs">Draft · awaiting human review</p><p>Capture the configuration mismatch, the steps used to correct it and the evidence showing sign-in was restored.</p><p className="text-muted-foreground">A reviewer decides whether this lesson is ready to help with future cases.</p></div>}
      </div>
      <aside className="border-t border-border bg-secondary/30 p-6 md:col-span-2 lg:col-span-1 lg:border-l lg:border-t" aria-label="Example supporting sources"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keep the evidence close</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{[['Previous case', 'Audience mismatch after configuration update', GitBranch], ['Knowledge article', 'Sign-in configuration checklist', FileText]].map(([label, title, Icon]) => { const SourceIcon = Icon as typeof FileText; return <div key={String(label)} className="rounded-xl border border-border bg-card p-4"><SourceIcon size={16} className="text-primary" aria-hidden="true" /><p className="mt-3 text-xs text-muted-foreground">{String(label)}</p><p className="mt-2 text-sm font-medium leading-6">{String(title)}</p></div> })}</div><p className="mt-5 text-xs leading-6 text-muted-foreground">Example sources shown for illustration. Your workspace uses your own permitted content.</p></aside>
    </div>
  </figure>
}
