import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Brain, Database, LayoutDashboard, MessageSquare, Ticket } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ErrorBoundary } from '@/components/common'
import { useAuth } from '@/app/providers'
import { hasPermission, type Permission } from '@/permissions'
import { ProductTour } from '@/features/onboarding/ProductTour'
import { productTours } from '@/features/onboarding/tours'
import { authService } from '@/features/auth/services/authService'

const pageTitles: Record<string, string> = {
  '/dashboard':     'Home',
  '/tickets/new':   'Create Case',
  '/tickets':       'Cases',
  '/memory':        'Organizational Memory',
  '/knowledge':     'Knowledge Base',
  '/documents':     'Documents',
  '/analytics':     'Analytics',
  '/teams':         'Teams & Departments',
  '/sla':           'SLA & Escalations',
  '/notifications': 'Notifications',
  '/chat':          'Ask CaseMind',
  '/settings':      'Settings',
  '/help':          'Help & Learning',
  '/admin/models':  'AI Governance',
  '/admin/users':   'User Management',
  '/admin/audit':   'Audit Log',
}

function resolveTitle(pathname: string): string {
  const match = Object.keys(pageTitles).find((key) => pathname.startsWith(key))
  return match ? pageTitles[match] : 'CaseMind'
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const title = resolveTitle(location.pathname)
  const { user, updateUser } = useAuth()
  const requestedTour = searchParams.get('tour')
  const routeTour = location.pathname === '/dashboard' ? 'main' : location.pathname === '/memory' ? 'memory' : location.pathname === '/knowledge' ? 'knowledge' : location.pathname === '/chat' ? 'assistant' : null
  const automaticTour = routeTour && user && !user.toursViewed.includes(routeTour) ? routeTour : null
  const tourName = requestedTour && productTours[requestedTour] ? requestedTour : automaticTour
  const finishTour = async () => {
    if (!tourName) return
    const next = await authService.updateOnboarding({ tourViewed: tourName })
    updateUser(next)
    if (requestedTour) navigate(location.pathname, { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Accessibility: Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto pb-20 focus:outline-none md:pb-0">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <MobileNavigation />
      </div>
      <ProductTour open={Boolean(tourName)} steps={tourName ? productTours[tourName] : []} onFinish={finishTour} onSkip={finishTour} />
    </div>
  )
}

const mobileItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/tickets', label: 'Cases', icon: Ticket },
  { to: '/chat', label: 'Ask', icon: MessageSquare, permission: 'chat.use' as Permission },
  { to: '/memory', label: 'Memory', icon: Database, permission: 'memory.view' as Permission },
]

function MobileNavigation() {
  const { user } = useAuth()
  return <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-sidebar-border bg-sidebar/95 px-2 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
    {mobileItems.filter((item) => !item.permission || hasPermission(user, item.permission)).map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-1 text-[10px] ${isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/45'}`}><Icon className="h-4 w-4" />{label}</NavLink>)}
    <NavLink to="/knowledge" className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-1 text-[10px] ${isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/45'}`}><Brain className="h-4 w-4" />Knowledge</NavLink>
  </nav>
}

