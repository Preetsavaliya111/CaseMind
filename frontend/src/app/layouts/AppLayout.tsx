import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ErrorBoundary } from '@/components/common'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tickets': 'Tickets',
  '/knowledge': 'Knowledge Base',
  '/analytics': 'Analytics',
  '/chat': 'AI Assistant',
  '/settings': 'Settings',
}

function resolveTitle(pathname: string): string {
  const match = Object.keys(pageTitles).find((key) => pathname.startsWith(key))
  return match ? pageTitles[match] : 'CaseMind'
}

export function AppLayout() {
  const location = useLocation()
  const title = resolveTitle(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
