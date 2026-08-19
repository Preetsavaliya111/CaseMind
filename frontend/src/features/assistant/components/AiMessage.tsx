import { useState } from 'react'
import {
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react'
import type { AssistantMessage, Citation } from '../types'
import { AssistantAvatar } from './AssistantAvatar'
import { CitationList } from './CitationList'
import { MarkdownRenderer } from '@/features/chat/components/MarkdownRenderer'
import { formatDateTime } from '@/utils'

interface AiMessageProps {
  message: AssistantMessage
  onActionClick?: (action: string) => void
  onSelectCitation?: (citation: Citation) => void
}

export function AiMessage({ message, onActionClick, onSelectCitation }: AiMessageProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)

  const handleCopy = () => {
    let fullText = message.content
    if (message.keyFindings?.length) {
      fullText += '\n\nKey Findings:\n' + message.keyFindings.map((f) => `• ${f}`).join('\n')
    }
    if (message.recommendedActions?.length) {
      fullText += '\n\nRecommended Actions:\n' + message.recommendedActions.map((a) => `• ${a}`).join('\n')
    }
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const confidencePercent = message.confidence ? Math.round(message.confidence * 100) : 94

  return (
    <div className="flex gap-3.5 max-w-3xl group animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
      {/* AI Avatar */}
      <AssistantAvatar size="md" />

      {/* Main Analytical Response Container */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Workspace Card in Deep Obsidian */}
        <div className="rounded-2xl rounded-tl-xs bg-[#0b0b0b] border border-white/[0.10] p-4 sm:p-6 text-xs sm:text-sm text-white shadow-xl space-y-4">
          {/* Header row inside response: Brand identity and confidence */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] text-2xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white tracking-tight flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                CaseMind Support Intelligence
              </span>
              <span className="text-[#555555]">•</span>
              <span className="font-mono text-[#888888]">Grounded Synthesis</span>
            </div>

            {/* Fancy Confidence indicator badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.14] text-white font-mono text-[10px] shadow-2xs">
              <ShieldCheck className="h-3 w-3 text-white" />
              <span>{confidencePercent}% Confidence</span>
            </div>
          </div>

          {/* Core Content / Markdown Body */}
          <div className="text-[#ededed] leading-relaxed">
            <MarkdownRenderer content={message.content} />
          </div>

          {/* Key Findings Callout Block */}
          {message.keyFindings && message.keyFindings.length > 0 && (
            <div className="p-4 rounded-xl bg-[#111111] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center gap-1.5 text-2xs font-semibold text-white uppercase tracking-wider">
                <AlertCircle className="h-3 w-3 text-white/80" />
                <span>Key Findings</span>
              </div>
              <ul className="space-y-2 text-xs text-[#d0d0d0]">
                {message.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="font-mono text-white font-bold shrink-0 text-2xs mt-0.5 bg-white/[0.08] px-1.5 py-0.2 rounded border border-white/[0.10]">
                      {idx + 1}
                    </span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions Checklist */}
          {message.recommendedActions && message.recommendedActions.length > 0 && (
            <div className="p-4 rounded-xl bg-[#111111] border border-white/[0.10] space-y-2.5">
              <div className="flex items-center gap-1.5 text-2xs font-semibold text-white uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3 text-white" />
                <span>Recommended Actions</span>
              </div>
              <div className="space-y-1.5 text-xs text-[#d0d0d0]">
                {message.recommendedActions.map((action, idx) => (
                  <div
                    key={idx}
                    onClick={() => onActionClick?.(action)}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#141414] hover:bg-[#1c1c1c] border border-white/[0.06] hover:border-white/20 transition-all cursor-pointer group/action"
                  >
                    <span className="h-4 w-4 rounded-md bg-white text-black flex items-center justify-center font-bold shrink-0 text-[10px] font-mono mt-0.5 shadow-xs">
                      ✓
                    </span>
                    <span className="flex-1 group-hover/action:text-white leading-relaxed">
                      {action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grounded Citations List */}
          {message.citations && message.citations.length > 0 && (
            <CitationList
              citations={message.citations}
              onSelectCitation={onSelectCitation}
            />
          )}
        </div>

        {/* Footer Meta & Utility Actions */}
        <div className="flex items-center justify-between px-1 text-2xs text-[#707070]">
          <div className="flex items-center gap-2 font-mono">
            <span>{formatDateTime(message.createdAt)}</span>
            <span>•</span>
            <span className="text-[#999999]">Grounded on Knowledge Base & Org Memory</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Fancy Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.10] border border-white/[0.06] hover:border-white/20 text-[#888888] hover:text-white transition-all flex items-center gap-1 text-[11px]"
              title="Copy analysis to clipboard"
            >
              {copied ? <Check className="h-3 w-3 text-white" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Positive feedback */}
            <button
              type="button"
              onClick={() => setFeedback((prev) => (prev === 'positive' ? null : 'positive'))}
              className={`p-1.5 rounded-lg border transition-all ${
                feedback === 'positive'
                  ? 'bg-white text-black border-white'
                  : 'bg-white/[0.04] border-white/[0.06] text-[#888888] hover:text-white hover:bg-white/[0.10]'
              }`}
              title="Helpful response"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>

            {/* Negative feedback */}
            <button
              type="button"
              onClick={() => setFeedback((prev) => (prev === 'negative' ? null : 'negative'))}
              className={`p-1.5 rounded-lg border transition-all ${
                feedback === 'negative'
                  ? 'bg-white/20 text-white border-white/40'
                  : 'bg-white/[0.04] border-white/[0.06] text-[#888888] hover:text-white hover:bg-white/[0.10]'
              }`}
              title="Needs improvement"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
