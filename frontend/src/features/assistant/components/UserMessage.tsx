import { User as UserIcon } from 'lucide-react'
import type { AssistantMessage } from '../types'
import { formatDateTime } from '@/utils'
import { useAuth } from '@/app/providers'

interface UserMessageProps {
  message: AssistantMessage
}

export function UserMessage({ message }: UserMessageProps) {
  const { user } = useAuth()

  return (
    <div className="flex gap-3.5 max-w-3xl ml-auto flex-row-reverse group animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
      {/* User Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] border border-white/[0.14] text-white shadow-xs text-xs font-semibold select-none">
        {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4 text-[#888888]" />}
      </div>

      {/* Message Box */}
      <div className="flex flex-col items-end gap-1.5 max-w-[85%] sm:max-w-[78%]">
        <div className="rounded-2xl rounded-tr-xs bg-[#141414] border border-white/[0.12] px-4 py-3.5 text-xs sm:text-sm text-white shadow-md leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] font-mono text-[#666666] px-1 opacity-80">
          {formatDateTime(message.createdAt)}
        </span>
      </div>
    </div>
  )
}
