import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { Skeleton } from '@/components/ui'
import { useAuth } from '@/app/providers'
import { hasPermission, type Permission } from '@/permissions'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
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

function RequireOnboardingComplete({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user && !user.onboardingCompleted) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

const DashboardPage     = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const TicketsPage       = lazy(() => import('@/pages/TicketsPage').then((m) => ({ default: m.TicketsPage })))
const TicketDetailPage  = lazy(() => import('@/pages/TicketDetailPage').then((m) => ({ default: m.TicketDetailPage })))
const CreateTicketPage  = lazy(() => import('@/pages/CreateTicketPage').then((m) => ({ default: m.CreateTicketPage })))
const MemoryPage        = lazy(() => import('@/pages/MemoryPage').then((m) => ({ default: m.MemoryPage })))
const KnowledgePage     = lazy(() => import('@/pages/KnowledgePage').then((m) => ({ default: m.KnowledgePage })))
const AnalyticsPage     = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const ChatPage          = lazy(() => import('@/pages/ChatPage').then((m) => ({ default: m.ChatPage })))
const SettingsPage      = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const LoginPage         = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const NotFoundPage      = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const ForbiddenPage     = lazy(() => import('@/pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })))
const AdminModelsPage   = lazy(() => import('@/pages/AdminModelsPage').then((m) => ({ default: m.AdminModelsPage })))
const AdminUsersPage    = lazy(() => import('@/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })))
const LandingPage       = lazy(() => import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })))
const RegisterPage      = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const DocumentsPage     = lazy(() => import('@/pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })))
const AcceptInvitationPage = lazy(() => import('@/pages/AcceptInvitationPage').then((m) => ({ default: m.AcceptInvitationPage })))
const TeamsPage = lazy(() => import('@/pages/TeamsPage').then((m) => ({ default: m.TeamsPage })))
const AuditLogPage = lazy(() => import('@/pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })))
const SLAPage = lazy(() => import('@/pages/SLAPage').then((m) => ({ default: m.SLAPage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })))
const HelpPage = lazy(() => import('@/pages/HelpPage').then((m) => ({ default: m.HelpPage })))

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
    path: '/onboarding',
    element: <RequireAuth>{withSuspense(OnboardingPage)}</RequireAuth>,
  },
  {
    path: '/',
    element: withSuspense(LandingPage),
  },
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/register',
    element: withSuspense(RegisterPage),
  },
  {
    path: '/forgot-password',
    element: withSuspense(ForgotPasswordPage),
  },
  {
    path: '/reset-password',
    element: withSuspense(ResetPasswordPage),
  },
  {
    path: '/invite/:token',
    element: withSuspense(AcceptInvitationPage),
  },
  {
    path: '/403',
    element: <RequireAuth><RequireOnboardingComplete><AppLayout /></RequireOnboardingComplete></RequireAuth>,
    children: [
      { index: true, element: withSuspense(ForbiddenPage) },
    ],
  },
  {
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { path: 'dashboard',    element: withSuspense(DashboardPage) },
      { path: 'tickets',      element: withSuspense(TicketsPage) },
      { path: 'tickets/new',  element: <RequirePermission permission="tickets.create">{withSuspense(CreateTicketPage)}</RequirePermission> },
      { path: 'tickets/:id',  element: withSuspense(TicketDetailPage) },
      { path: 'memory',       element: <RequirePermission permission="memory.view">{withSuspense(MemoryPage)}</RequirePermission> },
      { path: 'knowledge',    element: withSuspense(KnowledgePage) },
      { path: 'documents',    element: <RequirePermission permission="documents.view">{withSuspense(DocumentsPage)}</RequirePermission> },
      { path: 'analytics',    element: <RequirePermission permission="analytics.view">{withSuspense(AnalyticsPage)}</RequirePermission> },
      { path: 'teams',        element: <RequirePermission permission="teams.view">{withSuspense(TeamsPage)}</RequirePermission> },
      { path: 'sla',          element: <RequirePermission permission="sla.view">{withSuspense(SLAPage)}</RequirePermission> },
      { path: 'notifications', element: withSuspense(NotificationsPage) },
      { path: 'chat',         element: <RequirePermission permission="chat.use">{withSuspense(ChatPage)}</RequirePermission> },
      { path: 'settings',     element: withSuspense(SettingsPage) },
      { path: 'help',         element: withSuspense(HelpPage) },
      {
        path: 'admin/models',
        element: <RequirePermission permission="admin.models">{withSuspense(AdminModelsPage)}</RequirePermission>,
      },
      {
        path: 'admin/users',
        element: <RequirePermission permission="admin.users">{withSuspense(AdminUsersPage)}</RequirePermission>,
      },
      {
        path: 'admin/audit',
        element: <RequirePermission permission="admin.audit">{withSuspense(AuditLogPage)}</RequirePermission>,
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(NotFoundPage),
  },
])
