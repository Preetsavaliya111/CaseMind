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
      <header className="flex h-14 items-center justify-between border-b bg-background px-6 shrink-0 z-10">
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>

        <div className="flex items-center gap-3">
          {/* Universal Search trigger button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="flex gap-2 text-muted-foreground w-48 sm:w-64 justify-start bg-card/60 hover:bg-accent/80 hover:text-foreground border-border/80 transition-all rounded-lg shadow-2xs"
            aria-label="Universal Search"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs truncate">Search tickets, KB, memory...</span>
            <kbd className="ml-auto text-2xs bg-muted/90 text-muted-foreground px-1.5 py-0.5 rounded font-mono border border-border/60">
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
                className="rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
                aria-label="Profile menu"
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {user ? initials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 shadow-xl border-border bg-card">
              <DropdownMenuLabel className="font-normal p-3">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] uppercase font-mono px-1.5 py-0.2 bg-muted text-muted-foreground rounded">
                  {user?.role?.replace('_', ' ')}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer gap-2">
                <User className="h-4 w-4" />
                Profile & Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive cursor-pointer gap-2"
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
