import { useState } from 'react'
import {
  X,
  BookOpen,
  Brain,
  Ticket as TicketIcon,
  FileText,
  Database,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  Tag,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui'
import type { Citation, RelatedDocument, RelatedTicket, SourceType } from '../types'
import { mockKnowledgeArticles, mockMemoryRecords, mockTickets } from '@/mocks'
import { MarkdownRenderer } from '@/features/chat/components/MarkdownRenderer'

export type InspectableItem = Citation | RelatedDocument | RelatedTicket

interface CitationInspectorModalProps {
  item: InspectableItem | null
  open: boolean
  onClose: () => void
  onAskAi?: (prompt: string) => void
}

export function CitationInspectorModal({
  item,
  open,
  onClose,
  onAskAi,
}: CitationInspectorModalProps) {
  const [copied, setCopied] = useState(false)

  if (!item) return null

  // Determine item type
  const isCitation = 'identifier' in item || 'relevanceScore' in item
  const isTicket = 'status' in item && 'priority' in item
  const isRelatedDoc = 'type' in item && ('category' in item || 'version' in item)

  let sourceType: SourceType = 'knowledge'
  let identifier = 'Document'
  const title = item.title || 'Knowledge Resource'
  let relevance = 94

  if (isCitation) {
    const c = item as Citation
    sourceType = c.type || 'knowledge'
    identifier = c.identifier || 'Grounded Source'
    relevance = c.relevanceScore ? Math.round(c.relevanceScore * 100) : 94
  } else if (isTicket) {
    sourceType = 'ticket'
    identifier = `Ticket #${item.id}`
  } else if (isRelatedDoc) {
    sourceType = 'document'
    identifier = `SOP / Runbook`
  }

  // Attempt matching with Knowledge Articles
  const kbArticle = mockKnowledgeArticles.find((k) =>
    k.id === item.id ||
    item.id?.toLowerCase().includes(k.id.toLowerCase()) ||
    k.title.toLowerCase().includes(title.toLowerCase()) ||
    title.toLowerCase().includes(k.title.toLowerCase()) ||
    ('identifier' in item && item.identifier?.toLowerCase().includes(k.id.toLowerCase()))
  )

  // Attempt matching with Memory Records
  const memRecord = mockMemoryRecords.find((m) =>
    m.id === item.id ||
    item.id?.toLowerCase().includes(m.id.toLowerCase()) ||
    m.patternTitle.toLowerCase().includes(title.toLowerCase()) ||
    title.toLowerCase().includes(m.patternTitle.toLowerCase()) ||
    ('identifier' in item && item.identifier?.toLowerCase().includes(m.id.toLowerCase())) ||
    ('identifier' in item && item.identifier?.toLowerCase().includes('mem'))
  )

  // Attempt matching with Tickets
  const ticketRecord = mockTickets.find((t) =>
    t.id === item.id ||
    item.id?.toLowerCase().includes(t.id.toLowerCase()) ||
    t.title.toLowerCase().includes(title.toLowerCase()) ||
    ('identifier' in item && item.identifier?.toLowerCase().includes(t.id.toLowerCase()))
  )

  const handleCopyContent = () => {
    let textToCopy = `${title}\n\n`
    if (memRecord) {
      textToCopy += `Problem:\n${memRecord.problemDescription}\n\nRoot Cause:\n${memRecord.rootCause}\n\nResolution Steps:\n` +
        memRecord.resolutionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    } else if (kbArticle) {
      textToCopy += kbArticle.content
    } else if (ticketRecord) {
      textToCopy += `Ticket ID: ${ticketRecord.id}\nStatus: ${ticketRecord.status}\n\nDescription:\n${ticketRecord.description}`
    } else if ('snippet' in item && item.snippet) {
      textToCopy += item.snippet
    }

    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAskAbout = () => {
    if (onAskAi) {
      onAskAi(`Explain how "${title}" applies to our current incident and summarize the exact steps to implement the fix.`)
      onClose()
    }
  }

  const getSourceIcon = () => {
    switch (sourceType) {
      case 'memory':
        return Brain
      case 'ticket':
        return TicketIcon
      case 'document':
        return FileText
      case 'metric':
        return Database
      default:
        return BookOpen
    }
  }

  const Icon = getSourceIcon()

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        hideCloseButton
        className="max-w-3xl max-h-[88vh] overflow-hidden flex flex-col p-0 bg-[#0a0a0a] border border-white/[0.12] text-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0d0d0d]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] border border-white/[0.12] text-white">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.14] text-white font-semibold">
                  {identifier}
                </span>
                <span className="text-[#666666] text-xs">•</span>
                <span className="font-mono text-2xs text-[#999999]">
                  {relevance}% Precedent Match
                </span>
              </div>
              <DialogTitle className="text-base font-semibold text-white tracking-tight mt-1">
                {title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Inspection view for {title}
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#777777] hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/[0.10] transition-colors"
            title="Close document viewer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-none text-xs sm:text-sm">
          {/* Metadata badges row */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#111111] border border-white/[0.06] text-2xs text-[#999999] font-mono">
            {kbArticle && (
              <>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-white/60" />
                  <span>Author: <strong className="text-white">{kbArticle.authorName}</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3 text-white/60" />
                  <span>Category: <strong className="text-white">{kbArticle.category}</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>Version: <strong className="text-white">v{kbArticle.version}.0 (Verified)</strong></span>
                </div>
              </>
            )}

            {memRecord && (
              <>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>Validated Success Rate: <strong className="text-emerald-400 font-bold">{memRecord.successRate}%</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-white/60" />
                  <span>Avg MTTR: <strong className="text-white">{memRecord.avgResolutionHours}h</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-white/60" />
                  <span>Team: <strong className="text-white">{memRecord.resolvedByTeam}</strong></span>
                </div>
              </>
            )}

            {ticketRecord && (
              <>
                <div className="flex items-center gap-1">
                  <TicketIcon className="h-3 w-3 text-amber-400" />
                  <span>Priority: <strong className="text-amber-400 uppercase font-bold">{ticketRecord.priority}</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <span>Status: <strong className="text-white uppercase">{ticketRecord.status}</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-white/60" />
                  <span>Assignee: <strong className="text-white">{ticketRecord.assigneeName}</strong></span>
                </div>
              </>
            )}
          </div>

          {/* Snippet / Quick Excerpt */}
          {'snippet' in item && item.snippet && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
              <span className="text-2xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-400" />
                Grounded Knowledge Synthesis Excerpt
              </span>
              <p className="text-xs text-[#ededed] leading-relaxed">
                {item.snippet}
              </p>
            </div>
          )}

          {/* If Organizational Memory Match */}
          {memRecord && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Problem Description
                </h4>
                <p className="text-xs sm:text-sm text-[#d4d4d4] leading-relaxed p-3.5 rounded-xl bg-[#111111] border border-white/[0.06]">
                  {memRecord.problemDescription}
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Verified Root Cause ({Math.round(memRecord.rootCauseConfidence * 100)}% Confidence)
                </h4>
                <p className="text-xs sm:text-sm text-[#d4d4d4] leading-relaxed p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                  {memRecord.rootCause}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Validated Resolution Workflow
                </h4>
                <div className="space-y-2">
                  {memRecord.resolutionSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-[#111111] border border-white/[0.06] text-xs leading-relaxed text-[#ededed]"
                    >
                      <span className="h-5 w-5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-2xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historical Precedent Tickets */}
              {memRecord.historicalTickets && memRecord.historicalTickets.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-2xs font-mono font-bold uppercase tracking-wider text-[#888888]">
                    Historical Incident Precedents
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {memRecord.historicalTickets.map((tId) => (
                      <span
                        key={tId}
                        className="px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.10] font-mono text-2xs text-white"
                      >
                        {tId} (Resolved)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If Knowledge Article Match */}
          {kbArticle && !memRecord && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#111111] border border-white/[0.06] space-y-2">
                <span className="text-2xs font-mono font-bold uppercase tracking-wider text-[#888888]">
                  Article Overview
                </span>
                <p className="text-xs text-[#ededed] leading-relaxed">
                  {kbArticle.summary}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-2xs font-mono font-bold uppercase tracking-wider text-white">
                  Document Instructions & Configuration
                </span>
                <div className="p-4 rounded-xl bg-[#0e0e0e] border border-white/[0.08] text-[#ededed]">
                  <MarkdownRenderer content={kbArticle.content} />
                </div>
              </div>
            </div>
          )}

          {/* If Ticket Match */}
          {ticketRecord && !kbArticle && !memRecord && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-2xs font-mono font-bold uppercase tracking-wider text-white">
                  Issue Description
                </span>
                <p className="text-xs text-[#ededed] leading-relaxed p-3.5 rounded-xl bg-[#111111] border border-white/[0.06]">
                  {ticketRecord.description}
                </p>
              </div>

              {ticketRecord.aiAnalysis?.suggestedResolutions && (
                <div className="space-y-2">
                  <span className="text-2xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    AI Suggested Resolutions
                  </span>
                  <div className="space-y-1.5">
                    {ticketRecord.aiAnalysis.suggestedResolutions.map((res, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#111111] border border-white/[0.06] text-xs text-[#ededed]"
                      >
                        <span className="font-mono text-white text-2xs font-bold shrink-0 mt-0.5">•</span>
                        <span>{res}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback structured content if no exact mock record matched */}
          {!kbArticle && !memRecord && !ticketRecord && (
            <div className="p-4 rounded-xl bg-[#111111] border border-white/[0.08] space-y-3 text-xs leading-relaxed text-[#d4d4d4]">
              <p className="text-white font-medium">
                This document is indexed within CaseMind&apos;s retrieval pipeline and synchronized with the AI Assistant.
              </p>
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <p className="text-2xs font-mono uppercase tracking-wider text-[#888888]">
                  Verified Guidance & Instructions
                </p>
                <p>
                  1. Follow standard operational protocol for {title}.<br />
                  2. Validate environment configurations against production staging clusters.<br />
                  3. Escalate any persistent deviations to Identity & Infrastructure SMEs.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-white/[0.08] bg-[#0d0d0d]">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyContent}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10] hover:border-white/25 text-xs text-[#cccccc] hover:text-white transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Content'}</span>
            </button>

            {onAskAi && (
              <button
                type="button"
                onClick={handleAskAbout}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#ededed] transition-all shadow-md active:scale-98"
              >
                <Sparkles className="h-3.5 w-3.5 text-black" />
                <span>Ask AI About This</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-transparent hover:bg-white/[0.06] text-xs text-[#888888] hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
