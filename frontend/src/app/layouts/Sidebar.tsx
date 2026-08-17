import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, Database, BookOpen, BarChart3, MessageSquare,
  Settings, Brain, ChevronLeft, ChevronRight, Cpu, Users,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/utils'
import { useAuth } from '@/app/providers'
import { hasPermission, type Permission } from '@/permissions'
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboard'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  permission?: Permission
}

const mainNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets', icon: Ticket, label: 'Tickets', permission: 'tickets.view' },
  { to: '/memory', icon: Database, label: 'Org Memory', permission: 'memory.view' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge', permission: 'knowledge.view' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', permission: 'analytics.view' },
  { to: '/chat', icon: MessageSquare, label: 'AI Assistant', permission: 'chat.use' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const adminNav: NavItem[] = [
  { to: '/admin/models', icon: Cpu, label: 'Model Monitoring', permission: 'admin.models' },
  { to: '/admin/users', icon: Users, label: 'User Management', permission: 'admin.users' },
]


/**
 * Maps resolvedToday count to a pulse duration in seconds.
 * More resolutions → faster pulse (more memory being built).
 * Range: 1.2s (very active, 50+ resolved) to 4s (quiet, 1 resolved).
 * Returns null when resolvedToday === 0 (dormant — no pulse).
 */
function getPulseDuration(resolvedToday: number): number | null {
  if (resolvedToday <= 0) return null
  // Clamp to [1, 50], map to [4s, 1.2s] linearly
  const clamped = Math.min(Math.max(resolvedToday, 1), 50)
  const duration = 4 - ((clamped - 1) / 49) * 2.8
  return Math.round(duration * 100) / 100
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const { data: metrics } = useDashboardMetrics()
  const logoRef = useRef<HTMLDivElement>(null)

  const pulseDuration = metrics ? getPulseDuration(metrics.resolvedToday) : null

  // Drive --pulse-duration on the logo element so CSS animation speed reflects real data
  useEffect(() => {
    if (!logoRef.current) return
    if (pulseDuration !== null) {
      logoRef.current.style.setProperty('--pulse-duration', `${pulseDuration}s`)
    }
  }, [pulseDuration])

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
      aria-label="Main navigation"
    >
      {/* Logo + Memory Pulse */}
      <div className={cn('flex items-center gap-3 px-4 h-14 border-b border-sidebar-border shrink-0', collapsed && 'justify-center px-0')}>
        <div ref={logoRef} className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          {/* Pulse ring — only rendered when memory is active */}
          {pulseDuration !== null && (
            <span
              className="memory-pulse absolute inset-0 rounded-lg bg-primary"
              aria-hidden="true"
            />
          )}
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary z-10">
            <Brain className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-sidebar-foreground text-sm tracking-display">CaseMind</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-none">
        {mainNav.map(({ to, icon: Icon, label, permission }) => {
          if (permission && !hasPermission(user, permission)) return null
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

        {/* Admin section */}
        {hasPermission(user, 'admin.viewSection') && (
          <>
            {!collapsed && (
              <p className="px-3 pt-4 pb-1 text-2xs font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                Admin
              </p>
            )}
            {adminNav.map(({ to, icon: Icon, label, permission }) => {
              if (permission && !hasPermission(user, permission)) return null
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
          </>
        )}
      </nav>

      {/* Memory activity indicator — collapsed state */}
      {collapsed && pulseDuration !== null && (
        <div className="px-3 pb-2 flex justify-center">
          <span
            className="h-1.5 w-1.5 rounded-full bg-primary opacity-70"
            title={`Memory active — ${metrics?.resolvedToday} resolved today`}
            aria-hidden="true"
          />
        </div>
      )}

      {/* User footer */}
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
          {pulseDuration !== null && (
            <p className="text-2xs text-primary/60 mt-1.5 truncate">
              ↑ {metrics?.resolvedToday} resolutions today
            </p>
          )}
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
