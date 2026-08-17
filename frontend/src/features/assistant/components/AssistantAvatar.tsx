import { cn } from '@/utils'

interface AssistantAvatarProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  isThinking?: boolean
}

export function AssistantAvatar({
  className,
  size = 'md',
  isThinking = false,
}: AssistantAvatarProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-11 w-11',
  }

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-xl transition-all duration-300 shrink-0 select-none',
        'bg-gradient-to-b from-[#181818] via-[#0d0d0d] to-[#000000] border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.08)]',
        sizeClasses[size],
        isThinking && 'ring-2 ring-white/60 shadow-[0_0_20px_rgba(255,255,255,0.25)]',
        className
      )}
      aria-label="CaseMind AI"
    >
      {/* Ambient Starlight Glow */}
      <span
        className={cn(
          'absolute inset-0 rounded-xl bg-gradient-to-tr from-white/10 via-white/5 to-transparent opacity-80',
          isThinking && 'animate-pulse opacity-100'
        )}
        aria-hidden="true"
      />

      {/* SVG Chrome Star / Neural Intelligence Symbol */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('relative z-10 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]', iconSizes[size])}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cm-chrome-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#d4d4d4" />
            <stop offset="100%" stopColor="#8a8a8a" />
          </linearGradient>
        </defs>
        <path
          d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
          fill="url(#cm-chrome-gradient)"
          stroke="#ffffff"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.2" fill="#ffffff" className="drop-shadow-[0_0_4px_#ffffff]" />
      </svg>
    </div>
  )
}
