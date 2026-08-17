import { useState, useRef, useEffect } from 'react'
import {
  ArrowUp,
  Paperclip,
  Database,
  StopCircle
} from 'lucide-react'
import { cn } from '@/utils'

interface ComposerProps {
  onSend: (message: string) => void
  disabled?: boolean
  isThinking?: boolean
  placeholder?: string
  className?: string
}

export function Composer({
  onSend,
  disabled = false,
  isThinking = false,
  placeholder = 'Ask anything about your support organization, tickets, runbooks, or precedents...',
  className,
}: ComposerProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on scrollHeight
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 180)
      textareaRef.current.style.height = `${Math.max(48, nextHeight)}px`
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || disabled || isThinking) return

    onSend(trimmed)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px'
    }
  }

  const canSubmit = input.trim().length > 0 && !disabled && !isThinking

  return (
    <div className={cn('relative w-full max-w-4xl mx-auto px-4 pb-5 pt-2 shrink-0', className)}>
      {/* Fancy Composer Container */}
      <div
        className={cn(
          'relative rounded-2xl border transition-all duration-300 shadow-2xl overflow-hidden',
          'bg-[#0a0a0a]/90 backdrop-blur-xl border-white/[0.12]',
          'focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/10'
        )}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isThinking}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'w-full bg-transparent px-4 pt-3.5 pb-2 text-xs sm:text-sm text-white placeholder:text-[#666666]',
            'outline-none focus:outline-none border-none resize-none scrollbar-none leading-relaxed',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Ask CaseMind AI Assistant"
        />

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between px-3.5 pb-3 pt-1 border-t border-white/[0.06] text-2xs">
          {/* Left tools: Attach & Knowledge badge */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[#888888] hover:text-white hover:bg-white/[0.08] transition-colors border border-transparent hover:border-white/10"
              title="Attach ticket, document, or log excerpt"
              disabled={disabled}
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-medium">Attach Context</span>
            </button>

            <span className="h-3.5 w-[1px] bg-white/[0.08]" />

            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.12] text-[#d4d4d4] font-mono text-[10px]">
              <Database className="h-2.5 w-2.5 text-white" />
              <span>Knowledge Connected</span>
            </div>
          </div>

          {/* Right controls: Keyboard shortcut hint & Fancy Send button */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono text-[#666666] hidden sm:inline select-none">
              <kbd className="bg-white/[0.08] px-1 py-0.5 rounded border border-white/[0.10] text-[#aaaaaa]">↵</kbd> Send{' '}
              <kbd className="bg-white/[0.08] px-1 py-0.5 rounded border border-white/[0.10] text-[#aaaaaa]">Shift+↵</kbd> Newline
            </span>

            {/* Fancy Luminous Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 shadow-sm shrink-0',
                canSubmit
                  ? 'bg-white text-black hover:bg-[#ededed] active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.35)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]'
                  : 'bg-white/[0.06] text-[#666666] cursor-not-allowed border border-white/[0.04]'
              )}
              aria-label="Send message"
            >
              {isThinking ? (
                <StopCircle className="h-4 w-4 animate-spin text-[#888888]" />
              ) : (
                <ArrowUp className="h-4 w-4 font-bold" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
