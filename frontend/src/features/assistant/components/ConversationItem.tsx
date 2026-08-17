import { MessageSquare, Trash2, Pin } from 'lucide-react'
import type { Conversation } from '../types'
import { cn, formatRelative } from '@/utils'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  return (
    <div
      onClick={() => onSelect(conversation.id)}
      className={cn(
        'group relative flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer border select-none',
        isActive
          ? 'bg-white/[0.08] border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.06)]'
          : 'bg-transparent border-transparent hover:bg-white/[0.04] text-[#888888] hover:text-[#f0f0f0]'
      )}
    >
      {/* Fancy Icon Container */}
      <div
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200',
          isActive
            ? 'bg-white text-black border-white shadow-[0_0_8px_rgba(255,255,255,0.3)]'
            : 'bg-white/[0.03] border-white/[0.06] text-[#777777] group-hover:text-white group-hover:border-white/15'
        )}
      >
        <MessageSquare className="h-3 w-3" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pr-6">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className={cn('text-xs truncate font-medium', isActive ? 'text-white font-semibold' : 'text-[#d0d0d0]')}>
            {conversation.title}
          </p>
          {conversation.pinned && <Pin className="h-2.5 w-2.5 text-white/80 shrink-0 rotate-45" />}
        </div>
        <p className="text-[10px] text-[#666666] truncate leading-tight">
          {conversation.summary || formatRelative(conversation.updatedAt)}
        </p>
      </div>

      {/* Fancy Delete button on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(conversation.id)
        }}
        className="absolute right-2 top-3 p-1 rounded-md text-[#666666] hover:text-white hover:bg-white/[0.10] opacity-0 group-hover:opacity-100 transition-all duration-150"
        title="Delete conversation"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )
}
