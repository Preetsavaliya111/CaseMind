import { AssistantAvatar } from './AssistantAvatar'

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3.5 max-w-3xl animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
      <AssistantAvatar size="md" isThinking />

      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-tl-xs bg-[#0b0b0b] border border-white/[0.10] p-4 sm:p-5 shadow-xl">
          <div className="flex items-center gap-3">
            {/* Luminous Pulsing Dots */}
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_6px_#ffffff]" />
              <span className="h-2 w-2 rounded-full bg-[#cccccc] animate-pulse delay-150 shadow-[0_0_6px_#cccccc]" />
              <span className="h-2 w-2 rounded-full bg-[#888888] animate-pulse delay-300" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-white tracking-tight">
                Analyzing organizational knowledge...
              </p>
              <p className="text-[11px] font-mono text-[#777777] mt-0.5">
                Scanning historical support tickets, knowledge base runbooks & verified memory patterns
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
