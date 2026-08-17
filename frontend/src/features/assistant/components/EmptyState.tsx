import {
  TrendingUp,
  History,
  Users,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { AssistantAvatar } from './AssistantAvatar'

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void
}

const SUGGESTED_PROMPTS = [
  {
    icon: TrendingUp,
    title: 'Support volume surge',
    prompt: 'Why did support volume increase this month, and what are the main drivers?',
    tag: 'Trend Analysis',
  },
  {
    icon: History,
    title: 'Similar resolved incidents',
    prompt: 'Find similar resolved incidents for payment gateway and checkout timeouts.',
    tag: 'Org Memory',
  },
  {
    icon: Users,
    title: 'Common customer issues',
    prompt: 'Summarize our most common enterprise customer escalation themes and feedback.',
    tag: 'Customer CSAT',
  },
  {
    icon: Clock,
    title: 'Longest resolution times',
    prompt: 'Which issues are causing the longest MTTR, and where are the operational bottlenecks?',
    tag: 'SLA & MTTR',
  },
  {
    icon: ShieldAlert,
    title: 'Authentication root cause',
    prompt: 'Find the root cause of recent enterprise authentication and SAML SSO tickets.',
    tag: 'Root Cause',
  },
]

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[62vh] max-w-2xl mx-auto px-4 py-8 text-center animate-in fade-in-50 duration-300">
      {/* Fancy Visual Avatar Banner */}
      <div className="mb-6 relative">
        <AssistantAvatar size="lg" />
        <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black text-[9px] font-bold shadow-[0_0_10px_#ffffff]">
          AI
        </span>
      </div>

      {/* Hero Headings */}
      <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
        How can CaseMind help?
      </h2>
      <p className="text-xs sm:text-sm text-[#999999] mt-2 max-w-lg leading-relaxed">
        Turn organizational knowledge into better decisions. Ask questions about tickets, incidents, customer escalations, runbooks, and memory patterns.
      </p>

      {/* Fancy Monochrome Knowledge Pill */}
      <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111] border border-white/[0.12] text-2xs font-mono text-[#cccccc] shadow-xs backdrop-blur-md">
        <Sparkles className="h-3 w-3 text-white" />
        <span>Grounded in Knowledge Base, Org Memory & Historical Tickets</span>
      </div>

      {/* Suggested Prompts Grid with Fancy Glass Cards */}
      <div className="w-full mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {SUGGESTED_PROMPTS.map((item, idx) => {
          const Icon = item.icon
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="group relative flex flex-col justify-between p-4 rounded-2xl border bg-[#0d0d0d] hover:bg-[#141414] border-white/[0.08] hover:border-white/30 transition-all duration-200 shadow-xs hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] active:scale-[0.99]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.10] text-white group-hover:bg-white group-hover:text-black transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-white group-hover:text-white">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#888888] bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.06]">
                    {item.tag}
                  </span>
                </div>
                <p className="text-2xs text-[#999999] group-hover:text-[#d4d4d4] line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>

              <div className="mt-3.5 flex items-center justify-end text-2xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-flex items-center gap-1 font-medium bg-white/[0.08] px-2 py-0.5 rounded-md border border-white/15">
                  Ask CaseMind <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
