import {
  Ticket,
  FileText,
  Brain,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import type { ContextIntelligence } from '../types'
import { cn } from '@/utils'
import { useNavigate } from 'react-router-dom'

interface ContextPanelProps {
  context?: ContextIntelligence
  onActionClick?: (action: string) => void
  onCollapse?: () => void
  className?: string
}

export function ContextPanel({
  context,
  onActionClick,
  onCollapse,
  className,
}: ContextPanelProps) {
  const navigate = useNavigate()

  if (!context) {
    return (
      <aside
        className={cn(
          'flex flex-col h-full bg-[#050505] border-l border-white/[0.08] p-4 text-center justify-center shrink-0 select-none',
          className
        )}
      >
        <Brain className="h-8 w-8 text-[#555555] mx-auto mb-2 opacity-50" />
        <p className="text-xs font-semibold text-[#888888]">No Active Context</p>
        <p className="text-2xs text-[#555555] mt-1 max-w-[200px] mx-auto">
          Start a conversation to see related tickets, documents, and memory precedents.
        </p>
      </aside>
    )
  }

  const confidenceScore = context.confidenceScore
    ? Math.round(context.confidenceScore * 100)
    : 94

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[#050505] border-l border-white/[0.08] shrink-0 select-none overflow-hidden',
        className
      )}
      aria-label="Context Intelligence Panel"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Context Intelligence
          </span>
        </div>

        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="p-1 rounded-md text-[#777777] hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Collapse context panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-none">
        {/* Confidence & Root Cause Summary */}
        <div className="p-3.5 rounded-2xl bg-[#0d0d0d] border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-2xs">
            <span className="text-[#888888] font-medium">Grounding Precision</span>
            <span className="font-mono text-white bg-white/[0.08] px-2 py-0.5 rounded-full border border-white/[0.14] font-semibold">
              {confidenceScore}%
            </span>
          </div>

          {context.activeRootCause && (
            <div className="pt-2 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white font-semibold">
                Detected Root Cause
              </span>
              <p className="text-xs text-[#cccccc] mt-1 leading-relaxed">
                {context.activeRootCause}
              </p>
            </div>
          )}
        </div>

        {/* 1. Related Tickets */}
        {context.relatedTickets && context.relatedTickets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                <Ticket className="h-3 w-3 text-white" />
                Related Tickets ({context.relatedTickets.length})
              </span>
            </div>

            <div className="space-y-1.5">
              {context.relatedTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  onClick={() => navigate(`/tickets`)}
                  className="group p-3 rounded-xl bg-[#0d0d0d] hover:bg-[#141414] border border-white/[0.06] hover:border-white/20 transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="font-mono text-2xs font-bold text-white">
                      {tkt.id}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/[0.08] text-white border border-white/[0.12]">
                      {tkt.priority}
                    </span>
                  </div>
                  <p className="text-xs text-white leading-snug truncate">
                    {tkt.title}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-[#666666]">
                    <span>{tkt.assignee || 'Unassigned'}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Related Documents & SOPs */}
        {context.relatedDocuments && context.relatedDocuments.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-white" />
              Related Documents ({context.relatedDocuments.length})
            </span>

            <div className="space-y-1.5">
              {context.relatedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate('/knowledge')}
                  className="group p-3 rounded-xl bg-[#0d0d0d] hover:bg-[#141414] border border-white/[0.06] hover:border-white/20 transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <span className="text-[10px] font-mono text-white bg-white/[0.06] px-1.5 py-0.2 rounded border border-white/[0.12]">
                      {doc.category}
                    </span>
                    {doc.version && (
                      <span className="text-[10px] font-mono text-[#666666]">
                        v{doc.version}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white leading-snug line-clamp-2 mt-1">
                    {doc.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Knowledge Used */}
        {context.knowledgeUsed && context.knowledgeUsed.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
              <Brain className="h-3 w-3 text-white" />
              Knowledge Grounding Sources
            </span>

            <div className="flex flex-wrap gap-1.5">
              {context.knowledgeUsed.map((k, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-[#cccccc] bg-[#0e0e0e] px-2 py-1 rounded-lg border border-white/[0.08]"
                >
                  <ShieldCheck className="h-2.5 w-2.5 text-white" />
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 4. Suggested Next Actions */}
        {context.suggestedActions && context.suggestedActions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-white" />
              Suggested Actions
            </span>

            <div className="space-y-1.5">
              {context.suggestedActions.map((action, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onActionClick?.(action)}
                  className="w-full text-left flex items-start gap-2 p-2.5 rounded-xl bg-[#0e0e0e] hover:bg-[#161616] border border-white/[0.06] hover:border-white/20 text-xs text-[#cccccc] hover:text-white transition-all group active:scale-[0.99]"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-white mt-0.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                  <span className="flex-1 leading-snug">{action}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
