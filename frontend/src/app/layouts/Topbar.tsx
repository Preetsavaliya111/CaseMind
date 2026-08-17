import { useState } from 'react'
import { Search, LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import {
  Button,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui'
import { initials } from '@/utils'
import { useKeyboardShortcut } from '@/hooks'
import { NotificationPopover } from '@/features/notifications/components/NotificationPopover'
import { GlobalSearchModal } from '@/features/search/components/GlobalSearchModal'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  // Keyboard shortcut handlers for search
  useKeyboardShortcut('ctrl+k', () => setSearchOpen(true))
  useKeyboardShortcut('meta+k', () => setSearchOpen(true))
  useKeyboardShortcut('/', () => setSearchOpen(true))

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border-subtle bg-bg-primary px-6 shrink-0 z-10 shadow-subtle">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-text-primary tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Universal Search trigger button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="flex gap-2 text-text-muted w-48 sm:w-72 justify-start bg-bg-secondary/70 hover:bg-bg-secondary hover:text-text-primary border-border-default transition-all rounded-xl shadow-subtle h-9"
            aria-label="Universal Search"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
            <span className="text-xs truncate">Search tickets, KB, memory...</span>
            <kbd className="ml-auto text-2xs bg-bg-primary text-text-muted px-1.5 py-0.5 rounded font-mono border border-border-default shadow-xs">
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </Button>

          {/* Interactive Notifications Popover */}
          <NotificationPopover />

          {/* User Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:ring-2 hover:ring-accent-primary/20 transition-all"
                aria-label="Profile menu"
              >
                <Avatar className="h-8 w-8 border border-border-default shadow-subtle">
                  <AvatarFallback className="text-xs font-semibold bg-amber-500/15 text-accent-primary">
                    {user ? initials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-medium border-border-default bg-bg-elevated rounded-xl p-1">
              <DropdownMenuLabel className="font-normal p-3">
                <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
                <span className="inline-block mt-1.5 text-[10px] uppercase font-mono px-1.5 py-0.5 bg-bg-secondary text-text-secondary rounded border border-border-subtle font-semibold">
                  {user?.role?.replace('_', ' ')}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border-subtle" />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer gap-2 text-text-secondary hover:text-text-primary rounded-lg text-xs py-2">
                <User className="h-4 w-4 text-text-muted" />
                Profile & Security Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border-subtle" />
              <DropdownMenuItem
                onClick={logout}
                className="text-error-text focus:text-error-text cursor-pointer gap-2 rounded-lg text-xs py-2 hover:bg-error-bg"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Command & Search Modal */}
      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
