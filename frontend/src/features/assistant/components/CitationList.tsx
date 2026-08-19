import { useState } from 'react'
import {
  Ticket,
  BookOpen,
  Brain,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database
} from 'lucide-react'
import type { Citation, SourceType } from '../types'
import { cn } from '@/utils'

interface CitationListProps {
  citations: Citation[]
  className?: string
  onSelectCitation?: (citation: Citation) => void
}

const SOURCE_META: Record<
  SourceType,
  { label: string; icon: React.ElementType }
> = {
  ticket: { label: 'Ticket', icon: Ticket },
  knowledge: { label: 'Knowledge Base', icon: BookOpen },
  memory: { label: 'Organizational Memory', icon: Brain },
  document: { label: 'Document', icon: FileText },
  metric: { label: 'Live Telemetry', icon: Database },
}

export function CitationList({ citations, className, onSelectCitation }: CitationListProps) {
  const [expanded, setExpanded] = useState(false)

  if (!citations || citations.length === 0) return null

  const displayCount = expanded ? citations.length : Math.min(3, citations.length)
  const hasMore = citations.length > 3

  return (
    <div className={cn('mt-4 pt-3.5 border-t border-white/[0.08]', className)}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#aaaaaa]">
            Grounded Sources & Citations ({citations.length})
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] text-[#cccccc] hover:text-white font-medium transition-colors"
          >
            <span>{expanded ? 'Show less' : `Show all ${citations.length}`}</span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {citations.slice(0, displayCount).map((citation) => {
          const meta = SOURCE_META[citation.type] || SOURCE_META.document
          const Icon = meta.icon

          return (
            <div
              key={citation.id}
              onClick={() => onSelectCitation?.(citation)}
              className={cn(
                'group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer',
                'bg-[#0d0d0d] hover:bg-[#151515] border-white/[0.08] hover:border-white/30 shadow-xs hover:shadow-lg active:scale-[0.99]'
              )}
            >
              <div>
                {/* Header row: badge and relevance */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white/[0.06] border border-white/[0.12] text-white">
                    <Icon className="h-2.5 w-2.5 shrink-0" />
                    <span>{citation.identifier || meta.label}</span>
                  </span>

                  {citation.relevanceScore !== undefined && (
                    <span className="text-[10px] font-mono text-white bg-white/[0.08] px-1.5 py-0.2 rounded border border-white/[0.15]">
                      {Math.round(citation.relevanceScore * 100)}% match
                    </span>
                  )}
                </div>

                {/* Title */}
                <p className="text-xs font-semibold text-white leading-snug line-clamp-2 group-hover:text-white transition-colors">
                  {citation.title}
                </p>

                {/* Snippet */}
                {citation.snippet && (
                  <p className="text-2xs text-[#888888] group-hover:text-[#b0b0b0] mt-1.5 line-clamp-2 leading-relaxed transition-colors">
                    {citation.snippet}
                  </p>
                )}
              </div>

              {/* Action footer */}
              <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] text-[#666666] font-mono">
                  Verified precedent
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#cccccc] group-hover:text-white font-medium transition-colors">
                  <span>Inspect</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
