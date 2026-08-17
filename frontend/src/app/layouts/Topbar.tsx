import { Bell, Search, LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { Button, Avatar, AvatarFallback, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui'
import { initials } from '@/utils'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6 shrink-0">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <Button variant="outline" size="sm" className="hidden md:flex gap-2 text-muted-foreground w-48 justify-start" aria-label="Search">
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs">Search…</span>
          <kbd className="ml-auto text-2xs bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Profile menu">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{user ? initials(user.name) : 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
