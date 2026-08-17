import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, Database, BookOpen, BarChart3,
  Settings, Brain, ChevronLeft, ChevronRight, Cpu, Users, Sparkles
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
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base', permission: 'knowledge.view' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', permission: 'analytics.view' },
  { to: '/assistant', icon: Sparkles, label: 'AI Assistant', permission: 'chat.use' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const adminNav: NavItem[] = [
  { to: '/admin/models', icon: Cpu, label: 'Model Monitoring', permission: 'admin.models' },
  { to: '/admin/users', icon: Users, label: 'User Management', permission: 'admin.users' },
]

function getPulseDuration(resolvedToday: number): number | null {
  if (resolvedToday <= 0) return null
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

  useEffect(() => {
    if (!logoRef.current) return
    if (pulseDuration !== null) {
      logoRef.current.style.setProperty('--pulse-duration', `${pulseDuration}s`)
    }
  }, [pulseDuration])

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-bg-secondary border-r border-border-subtle transition-all duration-300 select-none shrink-0 z-20',
        collapsed ? 'w-16' : 'w-64',
      )}
      aria-label="Main navigation"
    >
      {/* Logo + Memory Pulse */}
      <div className={cn('flex items-center gap-3 px-5 h-16 border-b border-border-subtle shrink-0 bg-bg-primary/50', collapsed && 'justify-center px-0')}>
        <div ref={logoRef} className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          {pulseDuration !== null && (
            <span
              className="memory-pulse absolute inset-0 rounded-xl bg-accent-primary opacity-30"
              aria-hidden="true"
            />
          )}
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-accent-primary shadow-default z-10">
            <Brain className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-display font-bold text-text-primary text-sm tracking-tight leading-none">CaseMind</span>
            <span className="text-[10px] text-text-muted font-medium mt-1 uppercase tracking-wider">Intelligence Platform</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-none">
        {mainNav.map(({ to, icon: Icon, label, permission }) => {
          if (permission && !hasPermission(user, permission)) return null
          const isActive = location.pathname.startsWith(to)
          const isAiAssistant = to === '/assistant'
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-selected text-text-primary shadow-subtle border-l-2 border-accent-primary font-semibold'
                  : 'text-text-secondary hover:bg-hover hover:text-text-primary',
                isAiAssistant && !isActive && 'text-accent-tertiary font-semibold',
                collapsed && 'justify-center px-0 w-10 mx-auto border-l-0',
              )}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-105', isAiAssistant && !isActive && 'text-accent-tertiary')} aria-hidden="true" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && isAiAssistant && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-accent-tertiary font-semibold border border-purple-500/20">
                  AI
                </span>
              )}
            </NavLink>
          )
        })}

        {/* Admin section */}
        {hasPermission(user, 'admin.viewSection') && (
          <>
            {!collapsed && (
              <p className="px-3 pt-5 pb-1 text-2xs font-semibold uppercase tracking-widest text-text-muted">
                Platform Admin
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
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-selected text-text-primary shadow-subtle border-l-2 border-accent-primary font-semibold'
                      : 'text-text-secondary hover:bg-hover hover:text-text-primary',
                    collapsed && 'justify-center px-0 w-10 mx-auto border-l-0',
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

      {/* User footer */}
      {!collapsed && user && (
        <div className="p-3 border-t border-border-subtle bg-bg-primary/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-bg-primary border border-border-subtle shadow-subtle">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-xs font-bold text-accent-primary shrink-0 border border-amber-500/30">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-primary truncate leading-tight">{user.name}</p>
              <p className="text-2xs text-text-muted truncate capitalize mt-0.5">{user.role}</p>
            </div>
          </div>
          {pulseDuration !== null && (
            <p className="text-2xs text-accent-primary font-medium mt-2 px-1 truncate flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-primary animate-pulse" />
              {metrics?.resolvedToday} memories synthesized today
            </p>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-border-default bg-bg-primary shadow-default hover:bg-bg-secondary transition-colors text-text-secondary hover:text-text-primary"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}
