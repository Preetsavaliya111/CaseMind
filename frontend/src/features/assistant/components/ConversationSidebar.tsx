import { Plus, Search, MessageSquareDashed } from 'lucide-react'
import type { ConversationGroup } from '../types'
import { ConversationItem } from './ConversationItem'
import { cn } from '@/utils'

interface ConversationSidebarProps {
  groups: ConversationGroup[]
  activeId: string | null
  searchQuery: string
  onSearchChange: (q: string) => void
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  className?: string
}

export function ConversationSidebar({
  groups,
  activeId,
  searchQuery,
  onSearchChange,
  onSelect,
  onNew,
  onDelete,
  className,
}: ConversationSidebarProps) {
  const totalConversations = groups.reduce((acc, g) => acc + g.conversations.length, 0)

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[#050505] border-r border-white/[0.08] shrink-0 select-none',
        className
      )}
      aria-label="Conversation History"
    >
      {/* Header & New Conversation Button */}
      <div className="p-3.5 border-b border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Conversations
            </span>
            <span className="text-[10px] font-mono text-[#888888] bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.08]">
              {totalConversations}
            </span>
          </div>
        </div>

        {/* Fancy New Conversation Button (Glass effect with border glow) */}
        <button
          type="button"
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white text-white hover:text-black border border-white/[0.14] hover:border-white transition-all duration-200 shadow-xs hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] group active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-200" />
          <span>New conversation</span>
        </button>

        {/* Sleek Search Field */}
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#666666] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#0d0d0d] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#666666] rounded-xl border border-white/[0.08] focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grouped Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-none">
        {groups.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <MessageSquareDashed className="h-6 w-6 text-[#555555] mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-[#888888]">No conversations found</p>
            <p className="text-2xs text-[#555555] mt-1">Start a new query to begin</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#666666]">
                {group.label}
              </p>
              {group.conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
