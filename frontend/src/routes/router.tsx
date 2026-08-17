import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { Skeleton } from '@/components/ui'
import { useAuth } from '@/app/providers'
import { hasPermission, type Permission } from '@/permissions'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequirePermission({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user || !hasPermission(user, permission)) {
    return <Navigate to="/403" replace />
  }
  return <>{children}</>
}

const DashboardPage     = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const TicketsPage       = lazy(() => import('@/pages/TicketsPage').then((m) => ({ default: m.TicketsPage })))
const TicketDetailPage  = lazy(() => import('@/pages/TicketDetailPage').then((m) => ({ default: m.TicketDetailPage })))
const CreateTicketPage  = lazy(() => import('@/pages/CreateTicketPage').then((m) => ({ default: m.CreateTicketPage })))
const MemoryPage        = lazy(() => import('@/pages/MemoryPage').then((m) => ({ default: m.MemoryPage })))
const KnowledgePage     = lazy(() => import('@/pages/KnowledgePage').then((m) => ({ default: m.KnowledgePage })))
const AnalyticsPage     = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const AssistantPage   = lazy(() => import('@/pages/AssistantPage').then((m) => ({ default: m.AssistantPage })))
const SettingsPage      = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const LoginPage         = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const NotFoundPage      = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const ForbiddenPage     = lazy(() => import('@/pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })))
const AdminModelsPage   = lazy(() => import('@/pages/AdminModelsPage').then((m) => ({ default: m.AdminModelsPage })))
const AdminUsersPage    = lazy(() => import('@/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })))

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/assistant',
    element: (
      <RequireAuth>
        <RequirePermission permission="chat.use">
          {withSuspense(AssistantPage)}
        </RequirePermission>
      </RequireAuth>
    ),
  },
  {
    path: '/chat',
    element: <Navigate to="/assistant" replace />,
  },
  {
    path: '/403',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: withSuspense(ForbiddenPage) },
    ],
  },
  {
    path: '/',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',    element: withSuspense(DashboardPage) },
      { path: 'tickets',      element: withSuspense(TicketsPage) },
      { path: 'tickets/new',  element: <RequirePermission permission="tickets.create">{withSuspense(CreateTicketPage)}</RequirePermission> },
      { path: 'tickets/:id',  element: withSuspense(TicketDetailPage) },
      { path: 'memory',       element: <RequirePermission permission="memory.view">{withSuspense(MemoryPage)}</RequirePermission> },
      { path: 'knowledge',    element: withSuspense(KnowledgePage) },
      { path: 'analytics',    element: <RequirePermission permission="analytics.view">{withSuspense(AnalyticsPage)}</RequirePermission> },
      { path: 'settings',     element: withSuspense(SettingsPage) },
      {
        path: 'admin/models',
        element: <RequirePermission permission="admin.models">{withSuspense(AdminModelsPage)}</RequirePermission>,
      },
      {
        path: 'admin/users',
        element: <RequirePermission permission="admin.users">{withSuspense(AdminUsersPage)}</RequirePermission>,
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(NotFoundPage),
  },
])
