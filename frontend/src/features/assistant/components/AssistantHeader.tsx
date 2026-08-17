import {
  PanelLeft,
  PanelRight,
  Plus,
  ArrowLeft,
  Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AssistantAvatar } from './AssistantAvatar'
import { cn } from '@/utils'

interface AssistantHeaderProps {
  historyOpen: boolean
  contextOpen: boolean
  onToggleHistory: () => void
  onToggleContext: () => void
  onNewConversation: () => void
  isThinking?: boolean
  className?: string
}

export function AssistantHeader({
  historyOpen,
  contextOpen,
  onToggleHistory,
  onToggleContext,
  onNewConversation,
  isThinking = false,
  className,
}: AssistantHeaderProps) {
  const navigate = useNavigate()

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between px-3 sm:px-6 border-b border-white/[0.08] bg-[#000000]/95 backdrop-blur-xl shrink-0 select-none z-20',
        className
      )}
    >
      {/* Left side: Back to Dashboard, History Toggle, Title & Status */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Fancy Back to Dashboard Button */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.10] text-[#e0e0e0] hover:text-white border border-white/[0.12] hover:border-white/30 text-xs font-medium transition-all duration-200 group shadow-xs backdrop-blur-md"
          title="Return to CaseMind Dashboard"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="hidden sm:inline font-medium">Dashboard</span>
        </button>

        <span className="h-4 w-[1px] bg-white/[0.10]" />

        {/* Fancy History Toggle Button */}
        <button
          type="button"
          onClick={onToggleHistory}
          className={cn(
            'p-2 rounded-xl border transition-all duration-200 flex items-center justify-center backdrop-blur-md',
            historyOpen
              ? 'bg-white/[0.12] border-white/30 text-white shadow-[0_0_12px_rgba(255,255,255,0.12)]'
              : 'bg-white/[0.03] border-white/[0.08] text-[#888888] hover:text-white hover:bg-white/[0.08] hover:border-white/20'
          )}
          title={historyOpen ? 'Collapse conversations' : 'Expand conversations'}
          aria-label="Toggle conversation history"
        >
          <PanelLeft className="h-3.5 w-3.5" />
        </button>

        {/* Brand & Status */}
        <div className="flex items-center gap-2.5">
          <AssistantAvatar size="sm" isThinking={isThinking} />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                CaseMind AI
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-[#888888] bg-white/[0.04] px-1.5 py-0.2 rounded-md border border-white/[0.08]">
                <Sparkles className="h-2.5 w-2.5 text-white/70" />
                Workspace
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#999999]">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse shadow-[0_0_6px_#ffffff]" />
              <span>Knowledge Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Fancy New Inquiry & Context Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Fancy Primary New Inquiry Button (Solid Luminous White) */}
        <button
          type="button"
          onClick={onNewConversation}
          className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#ededed] active:scale-[0.98] text-black font-semibold text-xs transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)] group"
        >
          <Plus className="h-3.5 w-3.5 text-black group-hover:rotate-90 transition-transform duration-200" />
          <span className="hidden sm:inline">New Inquiry</span>
        </button>

        {/* Fancy Context Toggle Button */}
        <button
          type="button"
          onClick={onToggleContext}
          className={cn(
            'p-2 rounded-xl border transition-all duration-200 flex items-center justify-center backdrop-blur-md',
            contextOpen
              ? 'bg-white/[0.12] border-white/30 text-white shadow-[0_0_12px_rgba(255,255,255,0.12)]'
              : 'bg-white/[0.03] border-white/[0.08] text-[#888888] hover:text-white hover:bg-white/[0.08] hover:border-white/20'
          )}
          title={contextOpen ? 'Hide context intelligence' : 'Show context intelligence'}
          aria-label="Toggle context panel"
        >
          <PanelRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  )
}
