import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, BookOpen, BarChart3, MessageSquare,
  Settings, Brain, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils'
import { useAuth } from '@/app/providers'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/chat', icon: MessageSquare, label: 'AI Assistant' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-14 border-b border-sidebar-border shrink-0', collapsed && 'justify-center px-0')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Brain className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        {!collapsed && (
          <span className="font-bold text-sidebar-foreground text-sm tracking-tight">CaseMind</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-none">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                collapsed && 'justify-center px-0 w-10 mx-auto',
              )}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      {!collapsed && user && (
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-2xs text-sidebar-foreground/50 truncate capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}
