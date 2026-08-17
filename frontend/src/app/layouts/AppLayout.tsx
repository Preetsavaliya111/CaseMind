import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ErrorBoundary } from '@/components/common'

const pageTitles: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/tickets/new':   'Create Ticket',
  '/tickets':       'Tickets Queue',
  '/memory':        'Organizational Memory',
  '/knowledge':     'Knowledge Base & SOPs',
  '/analytics':     'Support Analytics',
  '/assistant':     'AI Assistant Workspace',
  '/settings':      'Account & Security Settings',
  '/admin/models':  'Model Monitoring & Telemetry',
  '/admin/users':   'User & Role Management',
}

function resolveTitle(pathname: string): string {
  const match = Object.keys(pageTitles).find((key) => pathname.startsWith(key))
  return match ? pageTitles[match] : 'CaseMind'
}

export function AppLayout() {
  const location = useLocation()
  const title = resolveTitle(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-bg-page text-text-primary">
      {/* Accessibility: Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-lg focus:shadow-medium focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar title={title} />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto focus:outline-none bg-bg-page">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
